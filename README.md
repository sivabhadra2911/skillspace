# Skill Space

Skill Space is a freelancer and recruiter workspace for jobs, applications, planning, community, and messages. The frontend is React; the API is Node.js; live data is stored in PostgreSQL on Neon.

## Database already connected

Neon now has a dedicated **skillspace** database with eight application tables in its `public` schema. The existing **neondb** database and its three unrelated tables were left in place. To browse Skill Space in DBeaver, duplicate the existing Neon connection, change its database name from `neondb` to `skillspace`, and expand **Schemas → public → Tables**.

This workspace has an ignored local `.env` for the Neon connection. The database password and session secret are not committed. The API uses verified TLS when connecting to Neon.

Run `npm run api` and `npm run dev` in separate terminals, then open `http://localhost:8080`. The API health check is `http://localhost:4000/api/health`. Run `npm run typecheck` and `npm run build` before publishing. The schema definition is in [schema.sql](server/schema.sql); `npm run db:init` is safe to rerun if the schema needs to be recreated.

## Features

- Visitors can explore a labeled demo, search and filter jobs, save roles locally, add demo tasks, and draft posts.
- Members can publish jobs, apply, track applications, manage tasks and events, edit profiles, post to the community, and message members.
- Recruiters can review received applications and change their status.
- Light and dark themes follow the device setting by default, with a top-bar toggle that remembers the chosen theme.
- The API checks record ownership, hashes passwords, signs sessions, and limits authentication attempts.

Demo tasks, posts, and saved roles are stored in the browser. Signed-in records use Neon through the Node API.

## Hosting

GitHub Pages can host the **React frontend**. The [deployment workflow](.github/workflows/deploy.yml) builds it from `main`. In GitHub Settings → Pages, choose **GitHub Actions** as the source.

The Node API still needs a public host such as Render. Set its private environment variables to the Neon connection URL, a strong `JWT_SECRET`, `DATABASE_SSL=true`, and `CORS_ORIGIN=https://sivabhadra2911.github.io`. Start it with `npm run api`. In GitHub Actions variables, set `VITE_API_URL` to that API's public HTTPS URL. The site will then call the hosted API while the API connects to Neon. Do not put the database password or session secret in any `VITE_` variable.

The connection template is in [.env.example](.env.example). The actual `.env` is local and ignored by Git.

## Project layout

- [App.tsx](src/App.tsx): responsive workspace
- [api.ts](src/lib/api.ts): frontend API client
- [index.js](server/index.js): authenticated Node API
- [schema.sql](server/schema.sql): tables in the dedicated Neon database
- [deploy.yml](.github/workflows/deploy.yml): GitHub Pages build
