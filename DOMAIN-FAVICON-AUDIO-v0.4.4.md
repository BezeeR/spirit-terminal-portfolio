# Spirit Terminal v0.4.4 — Domain, Favicon, and Audio

## Included changes

- Adds an original BezeeR `B` favicon in SVG, ICO, PNG, Apple Touch Icon, and web-manifest formats.
- Shortens the browser-tab title to `BezeeR // Spirit Terminal`.
- Raises Midnight Radio's usable volume while preserving a conservative maximum.
- Adds Safari/WebKit AudioContext fallback.
- Uses interactive audio latency and an immediate soft confirmation note after Play is clicked.
- Restores a sensible volume if the stored slider value is effectively zero.
- Displays an `AUDIO BLOCKED // CLICK TO RETRY` state if the browser refuses playback.

## Apply to the existing GitHub repository

Copy everything from this folder into the existing repository root that contains `.git`, then replace files when Windows asks.

Commit message:

`Add BezeeR favicon and fix background audio`

Push to GitHub. Railway should deploy automatically.

## Custom domain

Purchase `bezeer.app` from a registrar. In Railway, open the portfolio service and go to:

`Settings -> Networking -> Public Networking -> + Custom Domain`

Add `bezeer.app` and/or `www.bezeer.app`. Railway will show the exact CNAME and TXT records. Add both records in the registrar's DNS panel. Keep the Railway-generated domain until the custom domain is verified.
