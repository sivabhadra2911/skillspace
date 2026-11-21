# Skill Space

Skill Space is a freelancer and recruiter workspace for finding jobs, tracking applications, planning tasks and events, sharing community posts, and messaging other members. The interface has been rebuilt in React. The live data layer is a Node API backed by PostgreSQL; Supabase is no longer used.

## What works

- Visitors can explore a clearly labeled demo, search and filter roles, save roles in their browser, add demo tasks, and draft community posts.
- Registered members can publish jobs, apply, track applications, manage tasks and events, edit profiles, post to the community, and message members.
- Recruiters can view applications received for their jobs and update application status.
- The API checks ownership on private records, hashes passwords, signs sessions, and limits authentication attempts.

Saved roles are stored in each browser. Demo tasks and posts also remain in that browser only.

## Run locally with PostgreSQL and DBeaver

DBeaver is the desktop client used to create, browse, and query a PostgreSQL database. PostgreSQL itself must be running. This computer already has a running PostgreSQL 18 service, but its password is needed to create the Skill Space database.

1. In DBeaver, connect to local PostgreSQL using your database username and password. Create a database named `skillspace`.
2. Copy `.env.example` to `.env`. Put your real PostgreSQL password in `DATABASE_URL` and replace `JWT_SECRET` with a long random value. Keep `.env` private.
3. Run `npm ci`, then `npm run db:init` to create the tables and indexes. You can also open [schema.sql](server/schema.sql) in DBeaver and execute it against the `skillspace` database.
4. In separate terminals, run `npm run api` and `npm run dev`. The frontend runs at `http://localhost:8080`; the API runs at `http://localhost:4000`.
5. Check `http://localhost:4000/api/health` for `{"status":"ok"}`. Run `npm run typecheck` and `npm run build` before publishing.

The API uses `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `DATABASE_SSL`, and `PORT`. The React frontend uses only `VITE_API_URL`. Never put a database password or JWT secret in a `VITE_` variable.

## Hosting

GitHub Pages can host the **React frontend**, but it cannot run the Node API or PostgreSQL. The repository includes a [GitHub Pages workflow](.github/workflows/deploy.yml) that builds the frontend from `main`. In repository Settings → Pages, choose **GitHub Actions** as the publishing source. Set the repository Actions variable `VITE_API_URL` to the public HTTPS URL of the deployed API before publishing the live app. Hash navigation keeps deep links working on Pages.

Host the Node API as a web service (for example, Render) and PostgreSQL as a managed database. DBeaver can connect to that hosted PostgreSQL database using the provider's host, port, username, password, and SSL settings. Configure the API host with `DATABASE_URL`, a strong `JWT_SECRET`, `CORS_ORIGIN=https://sivabhadra2911.github.io`, and `DATABASE_SSL=true` when the database requires SSL. Run `npm run db:init` once against that database, and start the API with `npm run api`.

A PostgreSQL server running only on your laptop is suitable for local development. A public GitHub Pages site needs a publicly reachable API and database that remain online when your laptop is off.

## Project layout

- [App.tsx](src/App.tsx): responsive workspace interface and interactions
- [api.ts](src/lib/api.ts): frontend API client
- [index.js](server/index.js): authenticated Node API
- [schema.sql](server/schema.sql): PostgreSQL schema
- [deploy.yml](.github/workflows/deploy.yml): GitHub Pages build and deployment
