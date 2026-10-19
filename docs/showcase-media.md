# Spirit Terminal project showcases

Each project can be explored inside the portfolio. **View Project** opens a native dialog, while the inline gallery supports horizontal touch swipes, previous/next controls, scene selection, and left/right/Home/End keys. Touch swipes use native scrolling and snap points. Buttons, thumbnails, and keys go directly to the requested scene with a 140 ms opacity transition, avoiding a long scroll through intervening screenshots. Reduced-motion navigation skips the transition. There is no automatic slideshow or video playback.

The viewer contains its focus, closes with Escape, restores the invoking control, and leaves the selected project and radio intact. **Inspect Image** displays a screenshot at the available width with vertical scrolling; **Fit Image** restores the whole frame. Small and landscape screens can scroll the viewer body while its close control remains available. Missing images retain their caption and allow navigation to another scene.

Representation labels appear above the artwork; Expand and navigation controls sit below it. Single-scene previews omit scene numbers and disabled arrows. The CardSlate Website illustration places its headline and product window in separate grid columns on a fitted canvas, so the copy never covers the product preview.

## Media provenance

| Project | Included media | Representation |
| --- | --- | --- |
| Afterhours | Trading desk, Advanced chart, P/L, limit-order editor, and market wire | Five real alpha captures using fictional CR. The trading image was already public; the owner explicitly approved the four additional captures for the public portfolio repository and website on October 18, 2026. Alpha representation does not imply a public Discord launch. |
| TCG Buds Sim / Pack Night | Tabletop, practice decks, and virtual packs | Clearly labeled interface illustrations. These are visual walkthroughs of documented features, not captured live gameplay. |
| CardSlate Desktop / Companion / website | Inventory, checkout, insights, desktop/mobile product presentation | Clearly labeled interface illustrations with sample data. They do not represent the current installed product's exact UI. |
| TCG Buds Storefront / StratBoard | Existing portfolio images | Existing authorized-demo / interface captures, retained with descriptive captions. |
| Systems Portfolio | Code/workspace illustration | A labeled illustration of the portfolio's structure. |

Existing screenshots are retained without altering their content. Bundled images receive Vite fingerprints and immutable delivery. Only the active project's gallery is mounted; its selected image loads eagerly and other images load lazily. Static media and illustrations are memoized, slide layout/paint is contained, and decorative background animation pauses while a dialog covers the page. Superseded screenshot wrappers and the old Afterhours illustration walkthrough have been removed. No new dependency, image host, external iframe, analytics, account, or database connection is introduced.

The four approved Afterhours additions are `afterhours-advanced.webp`, `afterhours-portfolio.webp`, `afterhours-orders.webp`, and `afterhours-news.webp`. They are published unchanged from the exact files reviewed and approved by the owner. Captions describe the captured screens; in particular, the orders capture shows a limit-order editor rather than a linked-exit editor.

## Add or replace a scene

Edit `src/data/showcase.ts`. An image scene needs a unique ID, title, caption, accurate representation label, source, and descriptive alt text. Prefer a bundled asset import for new screenshots so updates receive a new fingerprint. Replace the illustration's entry with an image entry when a current, approved capture is available. Do not relabel an illustration as a screenshot.

Local video scenes are supported with a poster and English WebVTT captions. They render native controls only in the expanded, active scene, use `preload="none"`, start muted, and never autoplay. Leaving the scene or closing the viewer unmounts the video. No gameplay recording is bundled in this release, and there is no empty video placeholder in the interface.

## Project destinations

CardSlate Desktop uses **View Product**, linking to its product website instead of automatically starting a download. Browser products retain their real destinations. TCG Buds Sim and Afterhours stay in their showcases and identify Discord as their platform; no raw test-server link or unverified Discord launch URL is exposed as a public play action. Afterhours retains its private-alpha/playtest-pending status.

## Verification

The existing browser suite covers all eight projects, fourteen layouts, contact focus, deep links, keyboard navigation, blocked storage, and the first-visit/returning radio flows. `scripts/showcase-check.mjs` adds four populated galleries at seven layouts (320×568 through 2580×1440), 125% text, automated WCAG A/AA checks, real emulated touch swipes, reduced-motion navigation, scene keyboard isolation, native modal focus/Escape/return, image inspection, and missing-image recovery. Motion-enabled desktop and mobile cases run with a 4× CPU slowdown, checking prompt thumbnail jumps, rapid repeated input, retained inspection, and background pause/resume. It also checks that labels and controls do not cover the artwork, that CardSlate Website copy and product panels do not overlap or clip in inline and expanded views, and that browsing makes no third-party media requests.

GitHub CI saves the gallery captures and JSON results as `project-showcase-captures`, and retains the existing failure artifact. Build, six HTTP/security/cache tests, and dependency audit also run. This is automated Chromium verification; physical phones, Safari, human screen-reader behavior, and native YouTube playback remain manual checks.
