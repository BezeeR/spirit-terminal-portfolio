# StratBoard Portfolio Integration

## Added

- StratBoard as project 06 in the project arena
- A dedicated project tab with product summary, role, stack, release status, and feature details
- A real StratBoard tactical-planner preview image
- A custom purple project accent and preview treatment
- `VITE_STRATBOARD_URL` support for switching the project CTA from the GitHub fallback to a live deployment
- Responsive project-rail behavior through the existing data-driven navigation system

## Release flow

1. Deploy StratBoard.
2. Copy its production URL.
3. Set `VITE_STRATBOARD_URL` in the portfolio environment.
4. Rebuild and redeploy the portfolio.

## Preview refresh

- Replaced the earlier StratBoard mockup with the current release interface screenshot
- Updated the preview aspect ratio so the full application shell and strategy inspector remain visible
- Reduced the dark image treatment so the light-theme UI stays readable inside the portfolio frame
