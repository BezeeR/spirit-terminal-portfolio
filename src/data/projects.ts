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
  features: string[];
  stack: string[];
  telemetry: Array<{ label: string; value: string }>;
  visual: "desktop" | "website" | "mobile" | "portfolio" | "tcg-buds";
};

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
      "This portfolio avoids the usual endless landing page. Projects load into a focused workspace with keyboard navigation, late-night broadcast effects, readable case studies, and a Node/SQLite foundation for future contact and content tools.",
    role: "Creative direction · Interaction design · Engineering",
    status: "v0.4 / after hours",
    href: "https://github.com/BezeeR",
    features: [
      "Single-workspace project navigation",
      "After-hours boot sequence and restrained text scrambling",
      "Keyboard, touch, and swipe project switching",
      "Responsive layouts from 320px phones to ultrawide displays",
      "API-backed project content",
      "SQLite-ready contact message storage"
    ],
    stack: ["React", "TypeScript", "Vite", "Node.js", "Express", "SQLite", "Web Audio API", "CSS Motion"],
    telemetry: [
      { label: "MODE", value: "SHOWCASE" },
      { label: "SURFACE", value: "FULL-STACK" },
      { label: "STATE", value: "PROTOTYPE" }
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
    href: "https://tcgbuds.bezeer.app/",
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
  }
];
