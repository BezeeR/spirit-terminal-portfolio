# Portfolio verification — 2026-10-16

## v0.5.2 mobile radio update

The first-visit broadcast remains on mobile. Coarse-pointer, no-hover devices get “Enter & Open Radio”: the app reveals and focuses the visible YouTube player, with native tap-to-play instead of delayed autoplay. Music-enabled touch returns prepare the player without autoplay or scrolling; quiet entry, pause, and collapse still persist. A ready player's explicit Play stays in the original click handler. Desktop autoplay keeps its native-control fallback.

All 19 intro/music checks pass. The suite covers touch entry at 320×568, 390×844, 667×375, and 820×1180, in addition to the existing four intro layouts. Checks exercise a button inside a cross-origin test iframe, the revealed 200×200px-or-larger video viewport, focus, horizontal overflow, accessibility, quiet returns, return playback, failed API retry, and the synchronous ready-player click. The native-control prompt and test Play button stay below sticky navigation, including landscape. The YouTube service and blocked programmatic playback are mocked in Chromium touch emulation. This does not verify audio on physical iOS/Android devices or replace browser autoplay policy; a device check should tap Play in the visible video. The 112 project/viewport regressions and six HTTP checks also pass, with zero dependency advisories.

## v0.5.1 intro and music update

The first-visit broadcast intro is restored with immediate music/quiet entry; returning visitors skip it. Browser regressions cover four intro viewports (320×568, 390×844, 667×375, and 1440×900), entry control visibility, native dialog keyboard/Escape behavior, reduced motion, persisted quiet choices, returning autoplay, blocked playback and manual recovery, native player controls, cancellation while loading, storage restrictions, and retry after a failed YouTube API request. Playback is mocked to make browser-policy outcomes deterministic; real audible autoplay is still controlled by the visitor’s browser. The 112 project/viewport regressions and six HTTP checks remain in the release gate.

The measurements below describe v0.5 before this requested intro restoration. They still characterize the compiled portfolio and compressed asset approach; first visitors now intentionally see the entry screen until they choose how to enter.

## v0.5 checks completed

- TypeScript client/server checks and Vite production build pass.
- Six HTTP tests pass: health/version, HTML and asset caching, Brotli/gzip/identity negotiation, security headers, retired personal-data endpoints, and missing/hidden/source-file 404s.
- All eight project entries pass layout and technology-panel checks at 14 viewports: **112 project/viewport combinations**.
- Viewports: 320×568, 360×740, 390×844, 620×850, 667×375, 760×360, 820×1180, 900×600, 901×700, 1024×768, 1180×740, 1280×720, 1440×900, and 1920×1080.
- No document or project-stage horizontal overflow at the checked sizes.
- Axe WCAG A/AA checks on the Afterhours view at all 14 sizes report zero violations. This covers the common navigation and controls as well as the new entry; it is not a WCAG certification.
- Contact opens as a native modal, keeps background controls inert, closes with Escape, and restores trigger focus.
- Project rail arrow/Home/End controls, information tabs, direct project links, reload, and skip navigation pass.
- Blocked localStorage does not crash the app; the radio retains its intended default volume.
- Mocked YouTube integration verifies opt-in loading/playback, a stable player host when switching projects, and pause on collapse. Actual YouTube playback and availability depend on the browser and external service.
- In v0.5, initial navigation made no third-party request. In v0.5.1 this remains true for first visitors before entry and for quiet return visits; music-enabled return visits request YouTube. There is no duplicate `/api/projects` request.
- Full `npm audit` reports **zero advisories** after dependency updates.
- Reviewed screenshots at 320px, 667px landscape, 1024px, 1440px, and 1920px, including the Afterhours preview and TCG Buds Sim entry.

## Measured changes

The baseline is commit `fa9d5e2` and the comparison uses production builds in the same headless Chromium 153 environment over loopback. Each row is an observed run, not a claim about every visitor’s network or device. “Project ready” means the first project is available without the boot overlay; it is distinct from LCP, which previously measured the boot screen itself.

| Viewport | Baseline project ready | Updated project ready | Baseline main-thread task time in 2 idle seconds | Updated idle task time |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 1,913 ms | 280 ms | 70 ms | 12 ms |
| 390×844 | 1,913 ms | 115 ms | 71 ms | 1 ms |
| 667×375 | 1,905 ms | 121 ms | 70 ms | 10 ms |
| 1024×768 | 1,895 ms | 184 ms | 64 ms | 8 ms |

The baseline landscape page overflowed horizontally by 50px at 667×375; the update has zero overflow. Updated observations report zero cumulative layout shift.

The old live JavaScript response was **233,753 uncompressed bytes**, even when the request accepted compression. The updated bundle is about **231 KB decoded / 67.7 KB Brotli / 72.5 KB gzip**. Fingerprinted JS/CSS now cache immutably; HTML and unversioned previews revalidate. The 123 KB Afterhours WebP loads when that project is selected.

## Reproduce

```bash
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm audit
```

On Linux CI use `npx playwright install --with-deps chromium`. Set `PORTFOLIO_BROWSER_EXECUTABLE_PATH` to reuse an existing Chromium executable. Browser artifacts are written under ignored `test-results/portfolio/` and GitHub CI uploads them if a check fails.

No Supabase configuration, migration, or player-data change is involved in this portfolio release. Afterhours remains labeled private alpha; the portfolio does not imply a completed Discord launch.
