import type { Project } from "../data/projects";
import afterhoursPreview from "../assets/afterhours.webp";

function DesktopVisual() {
  return (
    <div className="device desktop-device">
      <div className="window-bar"><span /><span /><span /><b>CardSlate // INVENTORY</b></div>
      <div className="desktop-grid">
        <div className="desktop-sidebar">
          <img src="./assets/cardslate-icon.svg" alt="" />
          {["Dashboard", "Inventory", "Price Watch", "Convention", "Cloud"].map((item, index) => (
            <div className={index === 1 ? "active" : ""} key={item}>{item}</div>
          ))}
        </div>
        <div className="desktop-content">
          <header><div><small>PORTFOLIO VALUE</small><strong>$24,862.40</strong></div><span className="mock-button">+ Add Cards</span></header>
          <div className="mini-stats"><span><small>CARDS</small><b>1,284</b></span><span><small>7D CHANGE</small><b>+4.8%</b></span><span><small>TO SYNC</small><b>0</b></span></div>
          <div className="mock-table">
            {["Umbreon ex", "Charizard VMAX", "Luffy SEC", "Mewtwo GX"].map((name, index) => (
              <div key={name}><i className={`art art-${index}`} /><span><b>{name}</b><small>Near Mint · English</small></span><em>${[248, 134, 96, 81][index]}.00</em></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsiteVisual() {
  return (
    <div className="device browser-device">
      <div className="browser-bar"><span /><span /><span /><div>cardslate.app</div></div>
      <div className="website-hero">
        <div className="site-nav"><img src="./assets/cardslate-icon.svg" alt="" /><b>CardSlate</b><span>Features&nbsp;&nbsp; Companion&nbsp;&nbsp; Download</span></div>
        <div className="site-copy"><small>TCG OPERATIONS, REBUILT</small><p className="mock-title">Run the collection.<br />Own the event.</p><p>Inventory, pricing, and convention sales in one focused system.</p><span className="mock-button">Download private beta</span></div>
        <DesktopVisual />
      </div>
    </div>
  );
}

function MobileVisual() {
  return (
    <div className="mobile-scene">
      <div className="phone-device">
        <div className="phone-notch" />
        <div className="phone-head"><img src="./assets/cardslate-icon.svg" alt="" /><span><small>LIVE EVENT</small><b>San Diego Card Show</b></span><i>SYNCED</i></div>
        <div className="phone-stats"><span><small>SALES</small><b>$1,248</b></span><span><small>CASH</small><b>$684</b></span></div>
        <div className="phone-search">Search booth inventory...</div>
        {["Umbreon ex", "Luffy SEC", "Pikachu V"].map((name, index) => <div className="phone-row" key={name}><i className={`art art-${index}`} /><span><b>{name}</b><small>{index + 1} available</small></span><em>${[248, 96, 72][index]}</em></div>)}
        <span className="checkout-button">Open checkout · 2 items</span>
      </div>
      <div className="sync-orbit"><span>DESKTOP</span><b>↔</b><span>CLOUD</span></div>
    </div>
  );
}

function TCGBudsVisual() {
  return (
    <div className="device browser-device tcg-buds-device">
      <div className="browser-bar"><span /><span /><span /><div>tcg-buds // authorized storefront preview</div></div>
      <div className="tcg-buds-preview">
        <img
          src="./assets/tcg-buds-storefront.webp"
          alt="TCG Buds content-first storefront homepage preview"
          loading="lazy"
          decoding="async"
          width={1600}
          height={900}
        />
        <div className="tcg-buds-preview-status" aria-hidden="true">
          <span>CONTENT FIRST</span>
          <span>COMMUNITY POWERED</span>
          <span>COMMERCE READY</span>
        </div>
      </div>
    </div>
  );
}

function StratBoardVisual() {
  return (
    <div className="device browser-device stratboard-device">
      <div className="browser-bar"><span /><span /><span /><div>stratboard // tactical planning workspace</div></div>
      <div className="stratboard-preview">
        <img
          src="./assets/stratboard.webp"
          alt="StratBoard Counter-Strike 2 tactical strategy planner preview"
          loading="lazy"
          decoding="async"
          width={1902}
          height={906}
        />
        <div className="stratboard-preview-status" aria-hidden="true">
          <span>LOCAL-FIRST</span>
          <span>STEP PLAYBACK</span>
          <span>CS2 RADARS</span>
        </div>
      </div>
    </div>
  );
}

function PackNightVisual() {
  return (
    <div className="device browser-device pack-night-device">
      <div className="browser-bar"><span /><span /><span /><div>tcg buds // OPTCG simulator</div></div>
      <div className="pack-night-preview">
        <div className="pack-night-head"><b>TCG BUDS</b><span>SIM</span><i>OPTCG</i></div>
        <div className="sim-table" aria-hidden="true">
          <div className="sim-opponent"><span>PRACTICE CPU</span><b>ELITE</b></div>
          <div className="sim-cards"><i /><i /><i /></div>
          <div className="sim-center"><span>DON!! × 6</span><b>YOUR TURN</b><span>LIFE × 5</span></div>
          <div className="sim-cards player-cards"><i /><i /><i /><i /></div>
          <div className="sim-caption">PLAY · ATTACK · COUNTER</div>
        </div>
        <div className="pack-night-actions"><span>SIM DECKS</span><span>PACK NIGHT</span><span>COLLECTION</span></div>
        <p className="preview-note">Illustrated interface preview · Live test build</p>
      </div>
    </div>
  );
}

function AfterhoursVisual() {
  return (
    <div className="device browser-device afterhours-device">
      <div className="browser-bar"><span /><span /><span /><div>afterhours // the night shift</div></div>
      <div className="afterhours-preview">
        <img src={afterhoursPreview} alt="Afterhours alpha trading screen with fictional coin markets, a candlestick chart, and a protected order ticket" width={1200} height={1692} loading="lazy" decoding="async" />
        <span className="alpha-badge">ALPHA PREVIEW</span>
      </div>
      <div className="afterhours-preview-footer"><b>AFTERHOURS</b><span>FICTIONAL CR · NO CASH-OUT</span></div>
    </div>
  );
}

function PortfolioVisual() {
  return (
    <div className="code-window">
      <div className="code-head"><span>spirit-terminal.tsx</span><i>● ON AIR</i></div>
      <pre><code>{`const builder = {
  name: "BezeeR",
  focus: [
    "product systems",
    "reliable workflows",
    "polished interfaces"
  ],
  stack: {
    client: "React + TypeScript",
    server: "Node + Express",
    data: "SQLite + Postgres"
  }
};

export default broadcast(builder);`}</code></pre>
      <div className="code-status"><span>BUILD PASSED</span><span>0 ERRORS</span><span>READY</span></div>
    </div>
  );
}

export function ProjectVisual({ project }: { project: Project }) {
  if (project.visual === "desktop") return <DesktopVisual />;
  if (project.visual === "website") return <WebsiteVisual />;
  if (project.visual === "mobile") return <MobileVisual />;
  if (project.visual === "tcg-buds") return <TCGBudsVisual />;
  if (project.visual === "stratboard") return <StratBoardVisual />;
  if (project.visual === "pack-night") return <PackNightVisual />;
  if (project.visual === "afterhours") return <AfterhoursVisual />;
  return <PortfolioVisual />;
}
