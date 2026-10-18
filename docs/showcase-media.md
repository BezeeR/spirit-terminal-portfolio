# Spirit Terminal project showcases

Each project can be explored inside the portfolio. **View Project** opens a native dialog, while the inline gallery supports horizontal touch swipes, previous/next controls, scene selection, and left/right/Home/End keys. Galleries use native scrolling and snap points; reduced-motion navigation is immediate. There is no automatic slideshow or video playback.

The viewer contains its focus, closes with Escape, restores the invoking control, and leaves the selected project and radio intact. **Inspect Image** displays a screenshot at the available width with vertical scrolling; **Fit Image** restores the whole frame. Small and landscape screens can scroll the viewer body while its close control remains available. Missing images retain their caption and allow navigation to another scene.

## Media provenance

| Project | Included media | Representation |
| --- | --- | --- |
| Afterhours | Trading capture plus chart, P/L, linked-exit, and market-news walkthroughs | The trading capture was already published in this portfolio. The other scenes are clearly labeled, newly authored illustrations with example data; they are not screenshots of the private alpha. Alpha representation does not imply a public Discord launch. |
| TCG Buds Sim / Pack Night | Tabletop, practice decks, and virtual packs | Clearly labeled interface illustrations. These are visual walkthroughs of documented features, not captured live gameplay. |
| CardSlate Desktop / Companion / website | Inventory, checkout, insights, desktop/mobile product presentation | Clearly labeled interface illustrations with sample data. They do not represent the current installed product's exact UI. |
| TCG Buds Storefront / StratBoard | Existing portfolio images | Existing authorized-demo / interface captures, retained with descriptive captions. |
| Systems Portfolio | Code/workspace illustration | A labeled illustration of the portfolio's structure. |

Existing screenshots are retained without altering their content. Bundled images receive Vite fingerprints and immutable delivery. Only the active project's gallery is mounted; images load lazily. No new image host, external iframe, analytics, account, or database connection is introduced.

Four additional private Afterhours QA captures were prepared for review but excluded from this release because automatic approval review blocked publishing those images to the public portfolio repository without explicit image-and-destination approval. They are not referenced or bundled in the published site.

## Add or replace a scene

Edit `src/data/showcase.ts`. An image scene needs a unique ID, title, caption, accurate representation label, source, and descriptive alt text. Prefer a bundled asset import for new screenshots so updates receive a new fingerprint. Replace the illustration's entry with an image entry when a current, approved capture is available. Do not relabel an illustration as a screenshot.

Local video scenes are supported with a poster and English WebVTT captions. They render native controls only in the expanded, active scene, use `preload="none"`, start muted, and never autoplay. Leaving the scene or closing the viewer unmounts the video. No gameplay recording is bundled in this release, and there is no empty video placeholder in the interface.

## Project destinations

CardSlate Desktop uses **View Product**, linking to its product website instead of automatically starting a download. Browser products retain their real destinations. TCG Buds Sim and Afterhours stay in their showcases and identify Discord as their platform; no raw test-server link or unverified Discord launch URL is exposed as a public play action. Afterhours retains its private-alpha/playtest-pending status.

## Verification

The existing browser suite covers all eight projects, fourteen layouts, contact focus, deep links, keyboard navigation, blocked storage, and the first-visit/returning radio flows. `scripts/showcase-check.mjs` adds three populated galleries at seven layouts (320×568 through 2580×1440), 125% text, automated WCAG A/AA checks, real emulated touch swipes, reduced-motion and smooth navigation, scene keyboard isolation, native modal focus/Escape/return, image inspection, and missing-image recovery. It asserts no third-party media requests from browsing.

GitHub CI saves the gallery captures and JSON results as `project-showcase-captures`, and retains the existing failure artifact. Build, six HTTP/security/cache tests, and dependency audit also run. This is automated Chromium verification; physical phones, Safari, human screen-reader behavior, and native YouTube playback remain manual checks.
