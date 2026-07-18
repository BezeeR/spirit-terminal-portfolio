# Railway deployment

This repository includes explicit Railway configuration in `railway.json`.

Railway will use:

- Build: `npm run build`
- Start: `npm start`
- Health check: `/api/health`
- Node: 22.14 or newer (below Node 25)

## Deploy

1. Commit and push all files, including `railway.json`.
2. In Railway, redeploy the latest commit.
3. If old dashboard overrides exist, clear them or set:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. Generate a domain after the deployment reports Success.

The production `tsx` runtime is intentionally listed under `dependencies` because the server entry point is TypeScript.
