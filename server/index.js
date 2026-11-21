import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";

const app = express();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=skillspace,public",
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: true }
      : undefined,
});
const port = Number(process.env.PORT || 4000);
const origins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:8080,http://127.0.0.1:8080,https://sivabhadra2911.github.io"
)
  .split(",")
  .map((x) => x.trim());
if (
  !process.env.DATABASE_URL ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  console.error(
    "DATABASE_URL and a JWT_SECRET of at least 32 characters are required.",
  );
  process.exit(1);
}
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || origins.includes(origin));
    },
  }),
);
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

const tables = {
  jobs: {
    read: "status = 'active' OR recruiter_id = $AUTH",
    fields: [
      "id",
      "recruiter_id",
      "title",
      "company",
      "location",
      "job_type",
      "category",
      "salary",
      "description",
      "skills",
      "status",
      "created_at",
    ],
    write: [
      "title",
      "company",
      "location",
      "job_type",
      "category",
      "salary",
      "description",
      "skills",
    ],
  },
  profiles: {
    read: "true",
    fields: [
      "id",
      "full_name",
      "user_type",
      "title",
      "location",
      "bio",
      "skills",
      "avatar_url",
      "company_name",
      "hourly_rate",
      "website",
      "created_at",
    ],
    write: [
      "full_name",
      "title",
      "location",
      "bio",
      "skills",
      "avatar_url",
      "company_name",
      "hourly_rate",
      "website",
    ],
  },
  tasks: {
    read: "user_id = $AUTH",
    fields: [
      "id",
      "user_id",
      "title",
      "description",
      "due_date",
      "priority",
      "status",
      "project",
      "created_at",
    ],
    write: [
      "title",
      "description",
      "due_date",
      "priority",
      "status",
      "project",
    ],
  },
  calendar_events: {
    read: "user_id = $AUTH",
    fields: [
      "id",
      "user_id",
      "title",
      "description",
      "start_time",
      "end_time",
      "event_type",
      "is_all_day",
      "location",
      "created_at",
    ],
    write: [
      "title",
      "description",
      "start_time",
      "end_time",
      "event_type",
      "is_all_day",
      "location",
    ],
  },
  job_applications: {
    read: "user_id = $AUTH OR exists (select 1 from jobs j where j.id = job_applications.job_id and j.recruiter_id = $AUTH)",
    fields: [
      "id",
      "job_id",
      "user_id",
      "cover_letter",
      "status",
      "created_at",
      "updated_at",
    ],
    write: ["job_id", "cover_letter"],
  },
  chat_messages: {
    read: "sender_id = $AUTH OR receiver_id = $AUTH",
    fields: ["id", "sender_id", "receiver_id", "content", "read", "created_at"],
    write: ["receiver_id", "content"],
  },
  community_posts: {
    read: "true",
    fields: ["id", "author_id", "title", "body", "topic", "created_at"],
    write: ["title", "body", "topic"],
  },
};
const privateTables = new Set([
  "tasks",
  "calendar_events",
  "job_applications",
  "chat_messages",
]);
function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}
async function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /i, "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await pool.query(
        "select id,email,full_name,user_type from users where id=$1",
        [decoded.sub],
      );
      req.user = rows[0] || null;
    } catch {
      req.user = null;
    }
  }
  next();
}
app.use(auth);
function fail(res, code, message) {
  return res.status(code).json({ error: message });
}
function guard(req, res) {
  if (!req.user) {
    fail(res, 401, "Sign in to continue.");
    return false;
  }
  return true;
}
function selectedFields(body, allowed) {
  return Object.fromEntries(
    Object.entries(body || {}).filter(([key]) => allowed.includes(key)),
  );
}
function goodText(value, min = 1, max = 5000) {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.length <= max
  );
}
function handleError(res, error) {
  console.error(error);
  if (error.code === "23505")
    return fail(res, 409, "That record already exists.");
  if (error.code === "23503")
    return fail(res, 400, "A related record does not exist.");
  if (
    error.code === "23514" ||
    error.code === "22P02" ||
    error.code === "22007"
  )
    return fail(res, 400, "Please check the submitted values.");
  return fail(res, 500, "The server could not complete this request.");
}
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ok" });
  } catch {
    fail(res, 503, "Database unavailable.");
  }
});
app.post("/api/auth/signup", async (req, res) => {
  const email = String(req.body.email || "")
      .trim()
      .toLowerCase(),
    password = req.body.password,
    name = String(req.body.name || "").trim(),
    role = req.body.role === "recruiter" ? "recruiter" : "freelancer";
  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    !goodText(name, 2, 100) ||
    !goodText(password, 8, 200)
  )
    return fail(
      res,
      400,
      "Use a valid email, name, and password of at least 8 characters.",
    );
  const client = await pool.connect();
  try {
    await client.query("begin");
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      "insert into users(email,password_hash,full_name,user_type) values($1,$2,$3,$4) returning id,email,full_name,user_type",
      [email, hash, name, role],
    );
    await client.query(
      "insert into profiles(id,full_name,user_type) values($1,$2,$3)",
      [rows[0].id, name, role],
    );
    await client.query("commit");
    res.status(201).json({ user: rows[0], token: tokenFor(rows[0]) });
  } catch (error) {
    await client.query("rollback");
    handleError(res, error);
  } finally {
    client.release();
  }
});
app.post("/api/auth/signin", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { rows } = await pool.query(
      "select id,email,full_name,user_type,password_hash from users where email=$1",
      [email],
    );
    const person = rows[0];
    if (
      !person ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        person.password_hash,
      ))
    )
      return fail(res, 401, "Incorrect email or password.");
    const { password_hash: _hash, ...user } = person;
    res.json({ user, token: tokenFor(user) });
  } catch (error) {
    handleError(res, error);
  }
});
app.get("/api/auth/me", (req, res) =>
  req.user
    ? res.json({ user: req.user })
    : fail(res, 401, "Session expired. Please sign in."),
);
app.get("/api/:table", async (req, res) => {
  const table = req.params.table,
    config = tables[table];
  if (!config) return fail(res, 404, "Unknown resource.");
  if (privateTables.has(table) && !guard(req, res)) return;
  try {
    const values = [];
    const authValue = () => {
      values.push(req.user?.id || "00000000-0000-0000-0000-000000000000");
      return "$" + values.length;
    };
    const where = [`(${config.read.replaceAll("$AUTH", () => authValue())})`];
    const filters = JSON.parse(String(req.query.filters || "[]"));
    if (!Array.isArray(filters) || filters.length > 10)
      return fail(res, 400, "Invalid filters.");
    for (const filter of filters) {
      if (
        !config.fields.includes(filter.field) ||
        !["eq", "neq", "in"].includes(filter.op)
      )
        return fail(res, 400, "Invalid filter.");
      if (filter.op === "in") {
        if (!Array.isArray(filter.value) || filter.value.length > 100)
          return fail(res, 400, "Invalid filter values.");
        values.push(filter.value);
        where.push(`${filter.field} = any($${values.length})`);
      } else {
        values.push(filter.value);
        where.push(
          `${filter.field} ${filter.op === "eq" ? "=" : "<>"} $${values.length}`,
        );
      }
    }
    const order = config.fields.includes(req.query.order)
      ? req.query.order
      : "created_at";
    const direction = req.query.ascending === "true" ? "asc" : "desc";
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));
    values.push(limit);
    const { rows } = await pool.query(
      `select * from ${table} where ${where.join(" and ")} order by ${order} ${direction} limit $${values.length}`,
      values,
    );
    res.json({ data: rows });
  } catch (error) {
    handleError(res, error);
  }
});
app.post("/api/:table", async (req, res) => {
  const table = req.params.table,
    config = tables[table];
  if (!config) return fail(res, 404, "Unknown resource.");
  if (!guard(req, res)) return;
  if (table === "profiles") return fail(res, 400, "Use profile update.");
  const input = selectedFields(req.body, config.write);
  if (table === "jobs") {
    input.recruiter_id = req.user.id;
    input.status = "active";
    if (
      !goodText(input.title, 3, 140) ||
      !goodText(input.description, 20, 5000) ||
      !goodText(input.company, 2, 120)
    )
      return fail(res, 400, "Add a company, title, and description.");
  }
  if (table === "tasks") {
    input.user_id = req.user.id;
    if (!goodText(input.title, 1, 200))
      return fail(res, 400, "Add a task title.");
  }
  if (table === "calendar_events") {
    input.user_id = req.user.id;
    if (!goodText(input.title, 1, 200))
      return fail(res, 400, "Add an event title.");
  }
  if (table === "job_applications") {
    input.user_id = req.user.id;
    input.status = "applied";
    if (!goodText(input.cover_letter, 20, 5000))
      return fail(res, 400, "Write at least 20 characters about your fit.");
    const found = await pool.query(
      "select 1 from jobs where id=$1 and status='active'",
      [input.job_id],
    );
    if (!found.rowCount) return fail(res, 404, "This job is no longer open.");
  }
  if (table === "chat_messages") {
    input.sender_id = req.user.id;
    if (!goodText(input.content, 1, 5000) || input.receiver_id === req.user.id)
      return fail(res, 400, "Choose another member and write a message.");
  }
  if (table === "community_posts") {
    input.author_id = req.user.id;
    if (!goodText(input.title, 3, 140) || !goodText(input.body, 3, 5000))
      return fail(res, 400, "Add a title and post.");
  }
  try {
    const keys = Object.keys(input),
      values = Object.values(input);
    const { rows } = await pool.query(
      `insert into ${table} (${keys.join(",")}) values (${keys.map((_, i) => "$" + (i + 1)).join(",")}) returning *`,
      values,
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
});
app.put("/api/profiles/me", async (req, res) => {
  if (!guard(req, res)) return;
  const input = selectedFields(req.body, tables.profiles.write);
  if (input.full_name && !goodText(input.full_name, 2, 100))
    return fail(res, 400, "Enter a valid name.");
  try {
    const keys = Object.keys(input),
      values = Object.values(input);
    if (!keys.length) return fail(res, 400, "Nothing to update.");
    const assignments = keys.map((k, i) => `${k}=$${i + 2}`).join(",");
    const { rows } = await pool.query(
      `update profiles set ${assignments},updated_at=now() where id=$1 returning *`,
      [req.user.id, ...values],
    );
    res.json({ data: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
});
app.patch("/api/:table/:id", async (req, res) => {
  const table = req.params.table,
    config = tables[table];
  if (!config) return fail(res, 404, "Unknown resource.");
  if (!guard(req, res)) return;
  let allowed = config.write;
  let owner;
  if (table === "tasks" || table === "calendar_events")
    owner = "user_id=$OWNER";
  else if (table === "jobs") owner = "recruiter_id=$OWNER";
  else if (table === "profiles") owner = "id=$OWNER";
  else if (table === "job_applications") {
    owner =
      "exists (select 1 from jobs j where j.id=job_applications.job_id and j.recruiter_id=$OWNER)";
    allowed = ["status"];
  } else if (table === "chat_messages") {
    owner = "receiver_id=$OWNER";
    allowed = ["read"];
  } else if (table === "community_posts") owner = "author_id=$OWNER";
  const input = selectedFields(req.body, allowed),
    keys = Object.keys(input);
  if (!keys.length) return fail(res, 400, "Nothing to update.");
  try {
    const values = [req.params.id, req.user.id, ...Object.values(input)];
    const { rows } = await pool.query(
      `update ${table} set ${keys.map((k, i) => `${k}=$${i + 3}`).join(",")}${["jobs", "tasks", "calendar_events", "job_applications", "profiles"].includes(table) ? ",updated_at=now()" : ""} where id=$1 and ${owner.replace("$OWNER", "$2")} returning *`,
      values,
    );
    if (!rows.length) return fail(res, 404, "Record not found.");
    res.json({ data: rows[0] });
  } catch (error) {
    handleError(res, error);
  }
});
app.delete("/api/:table/:id", async (req, res) => {
  const table = req.params.table;
  if (!["tasks", "calendar_events", "jobs", "community_posts"].includes(table))
    return fail(res, 404, "Unknown resource.");
  if (!guard(req, res)) return;
  const owner =
    table === "jobs"
      ? "recruiter_id"
      : table === "community_posts"
        ? "author_id"
        : "user_id";
  try {
    const result = await pool.query(
      `delete from ${table} where id=$1 and ${owner}=$2`,
      [req.params.id, req.user.id],
    );
    if (!result.rowCount) return fail(res, 404, "Record not found.");
    res.json({ data: null });
  } catch (error) {
    handleError(res, error);
  }
});
app.listen(port, "0.0.0.0", () =>
  console.log(`Skill Space API running on port ${port}`),
);
