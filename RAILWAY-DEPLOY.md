# Railway deployment

Production: **https://www.bezeer.app/**

- Repository: `BezeeR/spirit-terminal-portfolio`, branch `main`
- Project: `creative-charisma`
- Environment: `production`
- Service: `spirit-terminal-portfolio`
- Build: multi-stage `Dockerfile`, selected by `railway.json`
- Runtime: Node 22.23.3; `npm start` (`node --import tsx server/index.ts`)
- Listen: Railway’s injected `PORT`, bound to `0.0.0.0`
- Health check: `/api/health`, expected `{ "ok": true, "service": "portfolio", "version": "0.5.1" }`

Run the build, HTTP tests, browser checks, and dependency audit before pushing. The GitHub-linked service deploys new `main` commits automatically. Confirm the matching commit, terminal **SUCCESS**, health response, compressed asset headers, and live page after deployment. A queued or building deployment is not a completed release.

The second portfolio service in `daring-tranquility` also tracks this repository but has no public domain. Do not delete or reconfigure it as part of a normal portfolio update.

No Supabase credentials, database, or volume are needed. Contact uses direct Discord/GitHub links. Project URL overrides are Vite build-time variables; rebuild after changing them. Keep those destinations HTTPS and free of credentials.

Production JavaScript and CSS have prebuilt `.br` and `.gz` representations. Requests negotiate encoding with `Vary: Accept-Encoding`; fingerprinted assets cache immutably for one year. HTML and unversioned files revalidate. Missing assets return real 404 responses.

The `tsx` runtime is intentionally a production dependency because the server entry point is TypeScript.
