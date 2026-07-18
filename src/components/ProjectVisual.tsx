import type { Project } from "../data/projects";

function DesktopVisual() {
  return (
    <div className="device desktop-device">
      <div className="window-bar"><span /><span /><span /><b>CardSlate // INVENTORY</b></div>
      <div className="desktop-grid">
        <aside>
          <img src="./assets/cardslate-icon.svg" alt="" />
          {["Dashboard", "Inventory", "Price Watch", "Convention", "Cloud"].map((item, index) => (
            <div className={index === 1 ? "active" : ""} key={item}>{item}</div>
          ))}
        </aside>
        <main>
          <header><div><small>PORTFOLIO VALUE</small><strong>$24,862.40</strong></div><button>+ Add Cards</button></header>
          <div className="mini-stats"><span><small>CARDS</small><b>1,284</b></span><span><small>7D CHANGE</small><b>+4.8%</b></span><span><small>TO SYNC</small><b>0</b></span></div>
          <div className="mock-table">
            {["Umbreon ex", "Charizard VMAX", "Luffy SEC", "Mewtwo GX"].map((name, index) => (
              <div key={name}><i className={`art art-${index}`} /><span><b>{name}</b><small>Near Mint · English</small></span><em>${[248, 134, 96, 81][index]}.00</em></div>
            ))}
          </div>
        </main>
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
        <div className="site-copy"><small>TCG OPERATIONS, REBUILT</small><h3>Run the collection.<br />Own the event.</h3><p>Inventory, pricing, and convention sales in one focused system.</p><button>Download private beta</button></div>
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
        <button className="checkout-button">Open checkout · 2 items</button>
      </div>
      <div className="sync-orbit"><span>DESKTOP</span><b>↔</b><span>CLOUD</span></div>
    </div>
  );
}

function PortfolioVisual() {
  return (
    <div className="code-window">
      <div className="code-head"><span>spirit-terminal.tsx</span><i>● ON AIR</i></div>
      <pre><code>{`const builder = {
  name: "Brandon Obeso",
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
  return <PortfolioVisual />;
}
