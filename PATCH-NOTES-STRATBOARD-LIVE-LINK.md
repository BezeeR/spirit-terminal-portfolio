# Spirit Terminal — StratBoard live-link fix

## What changed

- Changes the canonical StratBoard project URL from the GitHub repository to the live Vercel deployment.
- Makes **Enter Project** open `https://stratboard-six.vercel.app/`.
- Keeps `VITE_STRATBOARD_URL` as an optional future deployment override.
- Rejects an old GitHub URL in that environment variable and falls back to the live app.
- Updates the integration documentation and example environment file.

## Files

- `.env.example`
- `README.md`
- `STRATBOARD-INTEGRATION-NOTES.md`
- `src/App.tsx`
- `src/data/projects.ts`

## Validate

```powershell
npm run build
```

Then run the portfolio and confirm project 06 opens the live StratBoard app.
