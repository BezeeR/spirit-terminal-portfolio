# Spirit Terminal: After Hours — Design System v0.5

## Creative direction

A modern full-stack portfolio presented as an original late-night 1990s supernatural-tournament broadcast. The visual language uses brutalist arena structures, restrained VHS texture, cyan energy, red broadcast tension, and a quiet lo-fi coding atmosphere.

The influence is translated into original artwork and behavior. No network branding, show logos, named characters, screenshots, copied arena designs, voice clips, or commercial music are included.

Recommended balance:

- 60% clean, readable software portfolio
- 25% late-night tournament atmosphere
- 15% broadcast, VHS, and terminal effects

## Palette

### Primary

- Tournament Stone: `#1A1A1A` — global backgrounds
- Demon Steel: `#333339` — panels, structures, and framing
- Spirit Cyan: `#00A8FF` — links, primary actions, focus, active state, and energy
- Tournament Crimson: `#FF2A2A` — matchup language, hover energy, and urgent state

### Supporting accents

- Deep Violet: `#5E1174` — supernatural depth and structural shadow
- Rose: `#FF66B2` — rare social/detail accent
- Lightning Gold: `#FFCC00` — timecodes, broadcast status, and secondary emphasis

### Type

- Main text: `#E0E0E0`
- Secondary text: `#8E8E8E`

Dark structure occupies most of the screen. Cyan is the dominant interactive accent. Red, violet, rose, and gold are intentionally limited so they retain impact.

## Interface model

Desktop uses a focused application-like workspace rather than a long landing page:

- Project Arena navigation rail
- Project introduction and actions
- Arena Feed product mockup
- Techniques and Loadout detail panel
- Keyboard numbers and arrow navigation

Tablet and mobile switch to:

1. Sticky horizontal project selector
2. Project introduction
3. Arena Feed
4. Techniques or Loadout
5. Previous/next project controls

## Original atmosphere layers

- Charcoal night sky
- Abstract brutalist stadium crown
- Tournament bowl and numbered gate
- Distant city silhouette
- Cyan and red light beams
- Sparse energy particles
- Rain, fog, and broadcast scan
- Film grain and faint scanlines

All decorative layers are fixed, contained, noninteractive, and hidden from assistive technology.

## Typography

- Main interface: native system sans-serif
- Technical labels: native monospace stack
- Large titles: tight tracking and short line height
- Retro character comes from composition, texture, and broadcast language rather than an unreadable novelty font

## Motion and performance

- First visitors see a short broadcast log with immediate music/quiet entry controls. Returning visitors skip the intro; project content is already rendered behind it. Title scrambling remains removed.
- Project changes use a short CSS fade and vertical settle.
- Compact screens use static atmospheric artwork without animated fog, rain, or Canvas.
- Background motion and audio pause while the document is hidden.
- Reduced-motion preferences stop decorative animation and smooth scrolling.
- Bundled case-study data needs no content API request.
- Production JavaScript/CSS use prebuilt Brotli/gzip and fingerprinted cache keys.

## Audio

Midnight Radio contains one Nujabes YouTube set with a visible docked player, play/pause, volume, and collapse controls. Music entry requests playback; returning visitors with music enabled get an automatic attempt. A blocked attempt shows Play instead of claiming audio is playing. Quiet entry, pause, and collapse persist; temporary hidden-tab pauses do not disable the preference. The embedded viewport stays at least 200×200px. Browser storage is optional and failures do not prevent entry.

## Accessibility

- Skip-to-content link
- Semantic navigation and tabs
- Keyboard project controls
- Focus-visible outlines
- Modal focus trap and Escape close
- Reduced-motion handling
- More-contrast media-query support
- Audio is disabled until user interaction
- Text panels remain visually separated from background effects

## Copyright boundary

The final portfolio may be described as an original 1990s supernatural tournament anime-inspired late-night broadcast aesthetic. Avoid using protected show or network names in public marketing copy, metadata, repository artwork, music titles, or generated assets.
