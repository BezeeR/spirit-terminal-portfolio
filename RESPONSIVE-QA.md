# Spirit Terminal v0.4 — QA and Optimization Report

## Completed production checks

- TypeScript project compilation: passed
- Vite production build: passed
- Production assets generated: passed
- Express health endpoint: passed
- Project API endpoint: passed
- Valid contact message insertion into SQLite: passed
- Invalid email rejection: passed with HTTP 400
- Test contact row cleanup: passed
- GitHub Actions build workflow retained
- Final repository exclusion rules reviewed

## Build output

- HTML: approximately 1 KB
- CSS: approximately 39 KB before gzip / 9.4 KB gzip
- JavaScript: approximately 225 KB before gzip / 71 KB gzip
- No external animation, audio, or UI runtime was added

## Responsive layout coverage built into CSS

- 320–390 px compact phones
- 391–620 px standard phones
- 621–900 px tablets and mobile landscape
- 901–1180 px small laptops
- 1181–1450 px standard desktop
- 1451–1799 px large desktop
- 1800 px+ wide and ultrawide displays
- Dedicated short-height desktop behavior below 760 px
- Dedicated mobile landscape behavior below 540 px height

## Mobile behavior

1. Sticky project selector
2. Project introduction
3. Project visual and telemetry
4. Techniques or Loadout
5. Previous/next project controls

Swipe navigation requires a deliberate horizontal movement and ignores predominantly vertical gestures.

## Performance changes

- Canvas pixel ratio capped lower than native high-DPI resolution
- Lower Canvas particle count and frame rate on touch/coarse-pointer devices
- Canvas redraw paused while the tab is hidden
- Audio nodes created only after the visitor presses play
- Audio uses a look-ahead scheduler rather than relying on a single long interval for note timing
- Audio scheduler pauses when hidden and audio context suspends after mute
- Background artwork is CSS/Canvas rather than large video or image downloads
- API project request aborts after 1.8 seconds and immediately falls back to bundled data
- Boot sequence runs once per tab session

## Accessibility checks implemented

- Skip link
- Visible keyboard focus
- Semantic tab state
- Escape-to-close contact modal
- Modal focus containment
- Reduced-motion support
- Increased-contrast support
- Safe-area insets
- Audio starts off

## Environment limitation

The workspace Chromium installation is managed with a global URL block policy, so a fresh automated visual browser screenshot pass could not be executed in this final turn. The production build, API behavior, SQLite write path, responsive breakpoints, overflow containment rules, and accessibility fallbacks were reviewed and tested at code/build level.

## Recommended final real-device checks before publishing

- iPhone Safari at 390 px width
- Android Chrome around 360–412 px width
- A 1366 × 768 Windows laptop
- A 1920 × 1080 desktop
- Phone speakers and headphones at multiple volume settings
- Contact delivery on the selected production host
