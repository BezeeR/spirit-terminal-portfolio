import trading from "../assets/afterhours.webp";
import type { Project } from "./projects";

export type ShowcaseScene = "overview" | "checkout" | "insights" | "packs" | "decks" | "charts" | "pnl" | "orders" | "news";
export type ProjectMedia = {
  id: string;
  title: string;
  caption: string;
  label: string;
} & (
  | { kind: "image"; src: string; alt: string }
  | { kind: "illustration"; scene: ShowcaseScene }
  | { kind: "video"; src: string; poster: string; captions: string }
);

const image = (id: string, title: string, caption: string, src: string, alt: string, label = "INTERFACE CAPTURE"): ProjectMedia => ({ id, title, caption, src, alt, label, kind: "image" });
const illustration = (id: string, title: string, caption: string, scene: ShowcaseScene = "overview"): ProjectMedia => ({ id, title, caption, scene, kind: "illustration", label: "INTERFACE ILLUSTRATION · SAMPLE DATA" });

const media: Record<string, readonly ProjectMedia[]> = {
  "cardslate-desktop": [
    illustration("inventory", "A home for the collection", "Track exact printings, quantities, condition, and cost basis in a local-first desktop workspace."),
    illustration("checkout", "From inventory to convention checkout", "Build a booth sale, review its total and cost basis, and keep the sales workflow connected to inventory.", "checkout"),
    illustration("insights", "Keep market context close", "Portfolio value, price history, and watch-list workflows give vendors context alongside the collection.", "insights")
  ],
  "cardslate-web": [illustration("website", "The product, explained", "The public site introduces the workflow and leads visitors to the Windows beta, Companion, and support.")],
  "cardslate-companion": [
    illustration("companion", "A booth workflow that travels", "The phone-ready Companion connects inventory and event checkout to the desktop workspace."),
    illustration("sync", "Keep moving at the convention", "Offline sale queues and optional Cloud synchronization support the same event across devices.", "checkout")
  ],
  "portfolio-system": [illustration("terminal", "One workspace. Different builds.", "A broadcast-inspired portfolio with project deep links, keyboard navigation, an accessible intro, and optional radio.")],
  "tcg-buds-storefront": [image("storefront", "Content, community, and commerce", "An authorized storefront concept with creator content, a catalog, Deck Lab, and persistent cart workflows.", "./assets/tcg-buds-storefront.webp", "TCG Buds storefront homepage with product and creator-content sections", "AUTHORIZED DEMO CAPTURE")],
  stratboard: [image("playbook", "Turn a map into a playbook", "Arrange players, utility, movement routes, and tactical callouts on real CS2 radar maps.", "./assets/stratboard.webp", "StratBoard tactical radar workspace with player positions and strategy controls")],
  "tcg-buds-pack-night": [
    illustration("tabletop", "The table is the interface", "Play cards, attach DON!!, attack, and respond in battle directly on a virtual tabletop. Practice CPU includes Casual, Competitive, and Elite profiles."),
    illustration("sim-decks", "Pick a deck. Learn the matchup.", "Curated Sim Decks provide a starting point for practice alongside the deck-building workflow.", "decks"),
    illustration("pack-night", "Make it a Pack Night", "Open virtual packs, grow a cloud-synced collection, and play social Pack Battles with friends in Discord. Cards and Berries are gameplay only.", "packs")
  ],
  afterhours: [
    image("trading", "Take the night shift", "Trade fictional coins against shared liquidity. Review fees, price impact, and protected fills before committing CR.", trading, "Afterhours alpha trading desk with fictional coin markets, a price chart, and a trade ticket", "ALPHA CAPTURE · FICTIONAL CR"),
    illustration("advanced", "Read the market your way", "An illustrated introduction to recorded candles, technical indicators, chart tools, and private position context.", "charts"),
    illustration("portfolio", "Know where you stand", "This example explains unrealized P/L against average cost, with realized results and exit estimates kept separate.", "pnl"),
    illustration("orders", "Keep orders under control", "A linked-exit example: take-profit and stop-loss conditions share one reservation. Actual fills still depend on liquidity.", "orders"),
    illustration("news", "A market with a shared story", "An illustrated overview of fictional world, sector, and project updates. Headlines never promise the next move.", "news")
  ]
};

export function projectMedia(project: Project): readonly ProjectMedia[] {
  return media[project.id] ?? [];
}

export function projectPlatform(project: Project) {
  if (project.visual === "afterhours") return "DISCORD ACTIVITY · PRIVATE ALPHA";
  if (project.visual === "pack-night") return "DISCORD ACTIVITY · TEST BUILD";
  if (project.visual === "desktop") return "WINDOWS DESKTOP · PRIVATE BETA";
  if (project.visual === "mobile") return "MOBILE COMPANION · PRIVATE BETA";
  return "BROWSER PROJECT";
}

export function projectDestination(project: Project) {
  if (!project.href) return null;
  return { href: project.href, label: project.linkLabel ?? (project.visual === "desktop" ? "VIEW PRODUCT" : project.visual === "mobile" ? "OPEN COMPANION" : project.visual === "website" ? "VISIT WEBSITE" : project.visual === "portfolio" ? "VIEW GITHUB" : "OPEN LIVE APP") };
}
