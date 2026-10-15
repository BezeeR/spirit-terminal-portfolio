export type Project = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  descriptor: string;
  challenge: string;
  summary: string;
  role: string;
  status: string;
  href?: string;
  linkLabel?: string;
  features: string[];
  stack: string[];
  telemetry: Array<{ label: string; value: string }>;
  visual: "desktop" | "website" | "mobile" | "portfolio" | "tcg-buds" | "stratboard" | "pack-night" | "afterhours";
};

function projectUrl(value: string | undefined, fallback: string): string {
  try {
    const url = new URL(value?.trim() || fallback);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export const projects: Project[] = [
  {
    id: "cardslate-desktop",
    number: "01",
    eyebrow: "FLAGSHIP SYSTEM",
    title: "CardSlate Desktop",
    descriptor: "Local-first TCG operations software",
    challenge: "REAL-WORLD VENDOR OPERATIONS",
    summary:
      "A premium inventory, pricing, and convention-sales desktop application built for collectors and working card vendors. CardSlate combines resilient local storage with optional Cloud synchronization and fast booth workflows.",
    role: "Product design · Full-stack development · QA",
    status: "RC.36 / private beta",
    href: "https://cardslate.app/",
    features: [
      "Catalog-first card intake with art and market data",
      "SQLite inventory, sales, backups, and exports",
      "Convention checkout, cost basis, and cash flow",
      "Optional Supabase workspace synchronization",
      "Price history and watch-list intelligence",
      "Windows installer and release verification"
    ],
    stack: ["Electron", "React", "TypeScript", "Vite", "Tailwind", "shadcn/ui", "SQLite", "Supabase", "Recharts"],
    telemetry: [
      { label: "MODE", value: "LOCAL-FIRST" },
      { label: "SURFACE", value: "WINDOWS" },
      { label: "STATE", value: "BETA" }
    ],
    visual: "desktop"
  },
  {
    id: "cardslate-web",
    number: "02",
    eyebrow: "PUBLIC SURFACE",
    title: "CardSlate Website",
    descriptor: "Product story and release gateway",
    challenge: "TURNING COMPLEX SOFTWARE INTO A CLEAR STORY",
    summary:
      "The public-facing CardSlate site explains the desktop and mobile workflow, guides private-beta users, hosts product documentation, and routes downloads through permanent release assets.",
    role: "Visual design · Front-end development · Deployment",
    status: "v0.1.3 / live",
    href: "https://cardslate.app/",
    features: [
      "Animated product storytelling",
      "Responsive desktop and mobile layouts",
      "Product mockups and feature walkthroughs",
      "Download, support, privacy, terms, and changelog",
      "Reduced-motion accessibility",
      "Namecheap cPanel deployment"
    ],
    stack: ["HTML", "CSS", "JavaScript", "Responsive UI", "GitHub Releases", "Namecheap"],
    telemetry: [
      { label: "MODE", value: "MARKETING" },
      { label: "SURFACE", value: "WEB" },
      { label: "STATE", value: "LIVE" }
    ],
    visual: "website"
  },
  {
    id: "cardslate-companion",
    number: "03",
    eyebrow: "MOBILE FIELD TOOL",
    title: "Event Companion",
    descriptor: "Phone-ready convention control",
    challenge: "FAST, RELIABLE SALES AWAY FROM THE DESKTOP",
    summary:
      "A hosted mobile companion that gives vendors booth inventory, checkout, card intake, pricing history, offline sales, and event controls without requiring a second desktop installation.",
    role: "Mobile UX · Sync architecture · Reliability testing",
    status: "RC.36 / private beta",
    href: "https://cardslate.app/event/",
    features: [
      "Mobile portfolio and event checkout",
      "Offline transaction queue with safe replay",
      "Card search, artwork, and metadata intake",
      "Starting cash and vendor-purchase tracking",
      "Cross-device event start/end synchronization",
      "Installable PWA behavior"
    ],
    stack: ["React", "TypeScript", "Vite", "PWA", "Supabase Auth", "Postgres", "Realtime", "Edge Functions"],
    telemetry: [
      { label: "MODE", value: "FIELD" },
      { label: "SURFACE", value: "MOBILE" },
      { label: "STATE", value: "SYNCED" }
    ],
    visual: "mobile"
  },
  {
    id: "portfolio-system",
    number: "04",
    eyebrow: "CURRENT BUILD",
    title: "Systems Portfolio",
    descriptor: "A portfolio that behaves like software",
    challenge: "THE GENERIC ENDLESS-SCROLL PORTFOLIO",
    summary:
      "A focused portfolio workspace for full-stack products and multiplayer games. Visitors can switch projects instantly, share a direct project link, explore real previews, and connect through Discord or GitHub inside a late-night broadcast interface.",
    role: "Creative direction · Interaction design · Engineering",
    status: "v0.5 / live portfolio",
    href: "https://github.com/BezeeR",
    features: [
      "Single-workspace project navigation",
      "Immediate project content without a blocking boot sequence",
      "Keyboard, touch, and swipe project switching",
      "Responsive layouts from 320px phones to ultrawide displays",
      "Shareable project links and bundled case-study content",
      "On-demand music and direct Discord / GitHub contact"
    ],
    stack: ["React", "TypeScript", "Vite", "Node.js", "Express", "YouTube IFrame API", "Playwright", "Railway"],
    telemetry: [
      { label: "MODE", value: "SHOWCASE" },
      { label: "SURFACE", value: "FULL-STACK" },
      { label: "STATE", value: "LIVE" }
    ],
    visual: "portfolio"
  },
  {
    id: "tcg-buds-storefront",
    number: "05",
    eyebrow: "AUTHORIZED CLIENT CONCEPT",
    title: "TCG Buds Storefront",
    descriptor: "Content-first community storefront",
    challenge: "CONNECTING CONTENT, COMMUNITY, AND COMMERCE",
    summary:
      "An authorized storefront concept for TCG Buds, a competitive One Piece TCG creator brand. The experience connects official main-channel, gameplay, and Shorts content with a responsive catalog, owner-curated Deck Lab, persistent cart behavior, accessible customer-help routes, and a production-ready Shopify provider boundary.",
    role: "Product strategy · UI engineering · Commerce architecture",
    status: "v1.0 / live authorized demo",
    href: projectUrl(import.meta.env.VITE_TCG_BUDS_URL, "https://tcgbuds.bezeer.app/"),
    linkLabel: "OPEN LIVE PREVIEW",
    features: [
      "Bright-first responsive storefront with persistent theme choice",
      "Official main-channel, gameplay, and Shorts video experiences",
      "Owner-curated Deck Lab with searchable 50-card profiles",
      "Persistent stock-aware cart and Shopify Storefront provider",
      "Accessible customer-help, policy, and community routes",
      "Automated route, accessibility, and viewport regression coverage"
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Shopify Storefront API", "YouTube Embed", "Playwright", "Vercel"],
    telemetry: [
      { label: "MODE", value: "AUTHORIZED DEMO" },
      { label: "SURFACE", value: "STOREFRONT" },
      { label: "STATE", value: "READY" }
    ],
    visual: "tcg-buds"
  },
  {
    id: "stratboard",
    number: "06",
    eyebrow: "TACTICAL PLANNING TOOL",
    title: "StratBoard",
    descriptor: "Interactive CS2 strategy planner",
    challenge: "TURNING STATIC MAP SCREENSHOTS INTO A REAL PLAYBOOK",
    summary:
      "A local-first Counter-Strike 2 planning app for building executes, defaults, retakes, and defensive setups directly on real tactical radar maps. StratBoard combines precise canvas interaction, step-by-step presentation, and a browser-saved playbook without requiring an account.",
    role: "Product design · Front-end engineering · Interaction systems",
    status: "v1.0 / portfolio release",
    href: projectUrl(import.meta.env.VITE_STRATBOARD_URL, "https://stratboard-six.vercel.app/"),
    features: [
      "Real CS2 tactical radars with responsive zoom, pan, and Nuke floor support",
      "Players, roles, utility, movement routes, and editable tactical callouts",
      "Step-based execute building with read-only presentation mode",
      "Local strategy library with autosave, favorites, filters, and recovery",
      "Versioned JSON backup export and safe non-destructive import",
      "Touch-ready responsive layouts with light, dark, and system themes"
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "React Konva", "Zustand", "Zod", "Vercel"],
    telemetry: [
      { label: "MODE", value: "LOCAL-FIRST" },
      { label: "SURFACE", value: "WEB APP" },
      { label: "STATE", value: "RELEASE" }
    ],
    visual: "stratboard"
  },
  {
    id: "tcg-buds-pack-night",
    number: "07",
    eyebrow: "OPTCG / DISCORD ACTIVITY",
    title: "TCG Buds Sim",
    descriptor: "One Piece TCG tabletop + Pack Night",
    challenge: "FROM OPENING PACKS TO PLAYING THE TABLE",
    summary:
      "A One Piece TCG fan simulator that brings deck practice and social Pack Night into one Discord Activity. Play cards directly on a virtual tabletop, train against Practice CPU, build decks, open virtual packs, and keep a cloud-synced collection with friends. All Berries and cards are for gameplay only.",
    role: "Product design · Full-stack development · Game systems · Discord integration",
    status: "Live test build / simulator in development",
    href: projectUrl(import.meta.env.VITE_PACK_NIGHT_URL, "https://grand-lineserver-production.up.railway.app/"),
    linkLabel: "OPEN TCG BUDS SIM",
    features: [
      "Interactive OPTCG tabletop with direct card play, DON!!, attacks, and battle responses",
      "Practice CPU with Casual, Competitive, and Elite profiles and five curated Sim Decks",
      "Deck building and server-validated rules, payments, and private card choices",
      "Virtual pack opening, searchable collection, card inspection, and DON!! Gallery",
      "Discord-linked progression, daily challenges, and a gameplay-currency marketplace",
      "Synchronized Discord Pack Battles, reconnect recovery, and browser regression coverage"
    ],
    stack: ["React 19", "TypeScript", "Vite", "Discord Embedded App SDK", "Node.js", "Express 5", "Supabase", "PostgreSQL", "OPTCG API", "Playwright", "Railway"],
    telemetry: [
      { label: "MODE", value: "CPU + SOCIAL" },
      { label: "SURFACE", value: "DISCORD + WEB" },
      { label: "STATE", value: "LIVE TEST" }
    ],
    visual: "pack-night"
  },
  {
    id: "afterhours",
    number: "08",
    eyebrow: "ORIGINAL GAME / DISCORD ACTIVITY",
    title: "Afterhours",
    descriptor: "Fictional markets. Shared stakes. One more day.",
    challenge: "SURVIVING A MARKET THAT MOVES WITH THE ROOM",
    summary:
      "An original multiplayer market-survival game designed for Discord. Start with 1,000 fictional CR, trade against shared liquidity, and keep your run alive until bankruptcy. Persistent XP and cosmetics make every return to the night shift count. CR has no real-money value or cash-out.",
    role: "Game design · Full-stack engineering · Economy systems · Discord integration",
    status: "Private alpha / Discord playtest pending",
    features: [
      "Server-authoritative shared markets with fees, price impact, and protected fills",
      "Market, limit, stop, and linked take-profit / stop-loss orders with reserved funds",
      "Portfolio allocation, concentration checks, and estimated exit value",
      "Private watchlists, trade history, and persistent account progression",
      "Fictional coin companies, market sizes, and shared-network events in development",
      "Cosmetic progression, accessible controls, and responsive desktop / mobile layouts"
    ],
    stack: ["React 19", "TypeScript", "Vite", "Node.js", "Express 5", "WebSocket", "Supabase", "PostgreSQL", "Discord Embedded App SDK", "Playwright"],
    telemetry: [
      { label: "MODE", value: "MARKET SURVIVAL" },
      { label: "SURFACE", value: "DISCORD ACTIVITY" },
      { label: "STATE", value: "PRIVATE ALPHA" }
    ],
    visual: "afterhours"
  }
];
