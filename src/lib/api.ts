const configuredBase = import.meta.env.VITE_API_URL || "";
const base = configuredBase.replace(/\/$/, "");

export type ApiError = { message: string };
export type ApiResult<T = any> = { data: T; error: ApiError | null };
export type ApiUser = {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  user_metadata: { full_name: string; user_type: string };
};

export async function request(path: string, init: RequestInit = {}) {
  if (!base)
    throw new Error(
      "The API is not configured. Set VITE_API_URL to your hosted server address.",
    );
  const token = localStorage.getItem("skillspace_token");
  const response = await fetch(base + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}
export const apiBase = base;

type Filter = { field: string; op: "eq" | "neq" | "in"; value: unknown };
class Query {
  private table: string;
  private method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT" = "GET";
  private body: any;
  private filters: Filter[] = [];
  private sort = "created_at";
  private ascending = false;
  private max = 100;
  constructor(table: string) {
    this.table = table;
  }
  select(_fields = "*") {
    return this;
  }
  eq(field: string, value: unknown) {
    this.filters.push({ field, op: "eq", value });
    return this;
  }
  neq(field: string, value: unknown) {
    this.filters.push({ field, op: "neq", value });
    return this;
  }
  in(field: string, value: unknown[]) {
    this.filters.push({ field, op: "in", value });
    return this;
  }
  or(_expression: string) {
    return this;
  }
  order(field: string, options?: { ascending?: boolean }) {
    this.sort = field;
    this.ascending = !!options?.ascending;
    return this;
  }
  limit(value: number) {
    this.max = value;
    return this;
  }
  insert(value: any) {
    this.method = "POST";
    this.body = value;
    return this;
  }
  update(value: any) {
    this.method = "PATCH";
    this.body = value;
    return this;
  }
  upsert(value: any) {
    this.method = "PUT";
    this.body = value;
    return this;
  }
  delete() {
    this.method = "DELETE";
    return this;
  }
  private async execute(): Promise<ApiResult> {
    try {
      let path = `/api/${this.table}`;
      if (this.method === "GET") {
        const query = new URLSearchParams({
          filters: JSON.stringify(this.filters),
          order: this.sort,
          ascending: String(this.ascending),
          limit: String(this.max),
        });
        path += "?" + query;
      } else if (this.method === "PUT") path = "/api/profiles/me";
      else if (this.method === "PATCH" || this.method === "DELETE") {
        const id = this.filters.find(
          (f) => f.field === "id" && f.op === "eq",
        )?.value;
        if (!id) throw new Error("Record ID is required.");
        path += "/" + encodeURIComponent(String(id));
      }
      const response = await request(path, {
        method: this.method,
        ...(this.body ? { body: JSON.stringify(this.body) } : {}),
      });
      return { data: response.data ?? null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Request failed.",
        },
      };
    }
  }
  async single() {
    const result = await this.execute();
    return {
      ...result,
      data: Array.isArray(result.data) ? result.data[0] || null : result.data,
    };
  }
  async maybeSingle() {
    return this.single();
  }
  then<TResult1 = ApiResult, TResult2 = never>(
    onFulfilled?:
      ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onFulfilled, onRejected);
  }
}
export const api = {
  from(table: string) {
    return new Query(table);
  },
};
