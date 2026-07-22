# StratBoard literal live-link and cache fix

This patch is based on `spirit-terminal-portfolio(9).zip`.

## Changed files

- `src/App.tsx`
- `server/index.ts`

## What changed

- Renders a dedicated StratBoard anchor with the literal destination `https://stratboard-six.vercel.app/`.
- The StratBoard button no longer reads its destination from API project data, environment variables, or a generic project `href`.
- Marks the link with `data-project-destination="stratboard-live-app"` for easy inspection.
- Disables caching for `/api/projects`, the portfolio HTML shell, and SPA fallback responses so an older GitHub destination is not retained after deployment.

## Apply

Extract into the root of `spirit-terminal-portfolio` and replace the two files.

GitHub Desktop should show exactly:

- Modified: `src/App.tsx`
- Modified: `server/index.ts`

Run:

```powershell
npm run build
```

## Commit

Summary:

`Force StratBoard button to open live app`

Description:

- Render the StratBoard Enter Project link with the literal Vercel destination
- Remove API and project-data control over the StratBoard button URL
- Disable stale caching for the project API and portfolio HTML shell
- Keep other project destinations and portfolio behavior unchanged
