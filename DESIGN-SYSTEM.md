# Spirit Terminal: After Hours — Design System v0.4

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
- Adaptive Canvas signal glyphs

All decorative layers are fixed, contained, noninteractive, and hidden from assistive technology.

## Typography

- Main interface: native system sans-serif
- Technical labels: native monospace stack
- Large titles: tight tracking and short line height
- Retro character comes from composition, texture, and broadcast language rather than an unreadable novelty font

## Motion and performance

- Boot sequence runs once per tab session
- Title scramble is brief and reduced-motion aware
- Project changes use a short fade and vertical settle
- Mobile Canvas uses fewer particles, a lower pixel ratio, and approximately 20 FPS
- Desktop Canvas targets approximately 30 FPS
- Canvas and audio pause while the document is hidden
- Rain, fog, scan, particles, and meters stop under reduced-motion preferences
- No imported animation library is required

## Audio

“Midnight Radio” is original procedural Web Audio:

- 82 BPM with subtle swing
- Seventh-chord pad progression
- Low sine bass
- Dusty kick, snare, and hats
- Soft detuned keys
- Vinyl-style noise bed
- Short reverb and restrained delay
- Low maximum gain
- Look-ahead scheduling to reduce timer jitter

Audio is opt-in and never surprises visitors.

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
