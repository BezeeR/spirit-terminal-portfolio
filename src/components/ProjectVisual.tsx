import type { Project } from "../data/projects";
import type { ShowcaseScene } from "../data/showcase";
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
        <div className="website-content">
          <div className="site-copy"><small>TCG OPERATIONS, REBUILT</small><p className="mock-title">Run the collection.<br />Own the event.</p><p>Inventory, pricing, and convention sales in one focused system.</p><span className="mock-button">Download private beta</span></div>
          <div className="site-product-preview"><DesktopVisual /></div>
        </div>
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

function WorkflowVisual({ project, scene }: { project: Project; scene: ShowcaseScene }) {
  if (project.visual === "afterhours") return <div className="showcase-sample-workflow afterhours-walkthrough">
    <div className="sample-workflow-head"><b>AFTERHOURS</b><span>FICTIONAL CR · WALKTHROUGH</span></div>
    <div className="sample-workflow-body">
      <h4>{scene === "charts" ? "Read the price action" : scene === "pnl" ? "Your position at a glance" : scene === "orders" ? "One holding. Two exit conditions." : "The room shares the same news"}</h4>
      {scene === "charts" ? <>
        <div className="walkthrough-ranges"><span>1H</span><span>1D</span><span>1W</span><span>1M</span><span>1Y</span><span>ALL</span></div>
        <svg className="walkthrough-candles" viewBox="0 0 480 150" aria-hidden="true"><path d="M0 30H480M0 75H480M0 120H480" fill="none" stroke="#294251"/>{[80,65,72,52,60,42,56,38,48,25,40,32].map((y,i)=><g key={i} stroke={i%3===2?'#f3a1b1':'#78d9b8'} fill={i%3===2?'#6f3440':'#254d46'}><path d={`M${20+i*39} ${y-14}V${y+39}`}/><rect x={11+i*39} y={y} width="18" height="24"/></g>)}<path d="M8 108C100 112 150 70 220 82S350 47 475 56" fill="none" stroke="#d6b47a" strokeWidth="2" strokeDasharray="5 4"/></svg>
        <div className="sample-workflow-total">CANDLES · INDICATORS · DRAWING TOOLS</div>
      </> : scene === "pnl" ? <>
        <p>Example: 10 coins, average cost 10 CR, current price 12 CR.</p>
        <div className="walkthrough-metrics"><div><small>UNREALIZED P/L</small><b>+20.00 CR</b><span>+20.00%</span></div><div><small>REMAINING COST</small><b>100.00 CR</b><span>Entry fees included</span></div></div>
        <div className="sample-workflow-row"><span>Realized P/L</span><span>Completed sales</span></div><div className="sample-workflow-row"><span>Estimated exit P/L</span><span>After current sell costs</span></div>
      </> : scene === "orders" ? <>
        <div className="sample-workflow-row"><span>Take profit<small>Limit condition</small></span><b>14.00 CR</b></div><div className="sample-workflow-row"><span>Stop loss<small>Market condition</small></span><b>9.00 CR</b></div><div className="sample-workflow-total"><span>RESERVED ONCE</span><b>5 COINS</b></div><p className="walkthrough-note">Illustrative triggers. Exit prices are not guaranteed.</p>
      </> : <>
        {[['WORLD','Shared market context'],['SECTOR','Industry-wide developments'],['PROJECT','News about individual coins']].map(([tag,label])=><div className="sample-workflow-row" key={tag}><span className="walkthrough-news-tag">{tag}</span><b>{label}</b></div>)}<div className="sample-workflow-total">PUBLIC UPDATES · UNPREDICTABLE NEXT MOVE</div>
      </>}
    </div>
  </div>;
  const tcg = project.visual === "pack-night";
  return <div className="showcase-sample-workflow">
    <div className="sample-workflow-head"><b>{tcg ? "TCG BUDS" : "CARDSLATE"}</b><span>{tcg ? "GAMEPLAY ONLY" : "WORKFLOW OVERVIEW"}</span></div>
    <div className="sample-workflow-body">
      <h4>{scene === "packs" ? "Pack Night" : scene === "decks" ? "Choose your practice deck" : scene === "insights" ? "Portfolio insights" : "Convention checkout"}</h4>
      <p>{scene === "packs" ? "Open together. Build the collection. Come back for the next battle." : scene === "decks" ? "Curated starting points for Practice CPU and the tabletop." : scene === "insights" ? "Keep holdings, cost, and market context in one workspace." : "Bring the booth inventory and the sale together."}</p>
      {(scene === "decks" || scene === "packs") ? <div className="sample-decks">{[1,2,3].map(n => <div className="sample-deck" key={n}><span>{scene === "packs" ? "VIRTUAL PACK" : "SIM DECK"} 0{n}</span><small>{scene === "packs" ? "PACK NIGHT" : "PRACTICE CPU"}</small></div>)}</div> : scene === "insights" ? <>
        <div className="sample-workflow-row"><span>Collection value<small>Illustrative inventory</small></span><b>$24,862.40</b></div>
        <svg className="sample-workflow-chart" viewBox="0 0 500 90" preserveAspectRatio="none"><path d="M0 80H500M0 45H500M0 10H500" fill="none" stroke="#294251"/><path d="M0 74L40 68L80 72L120 50L160 57L200 38L240 45L280 31L320 39L360 17L400 26L450 12L500 19" fill="none" stroke="#70d2b4" strokeWidth="3"/></svg>
        <div className="sample-workflow-row"><span>Purchase cost</span><b>$21,980.00</b></div>
      </> : <>{["Card 01 · Near Mint", "Card 02 · English printing", "Card 03 · Binder inventory"].map((label,i) => <div className="sample-workflow-row" key={label}><span>{label}<small>From convention inventory</small></span><b>${[84,47,72][i]}.00</b></div>)}</>}
      <div className="sample-workflow-total"><span>{scene === "packs" ? "PACKS · COLLECTION · BATTLES" : scene === "decks" ? "CASUAL · COMPETITIVE · ELITE" : scene === "insights" ? "LOCAL-FIRST · OPTIONAL CLOUD" : "3 ITEMS · SALE TOTAL"}</span>{scene === "checkout" && <b>$203.00</b>}</div>
    </div>
  </div>;
}

export function ProjectVisual({ project, scene = "overview" }: { project: Project; scene?: ShowcaseScene }) {
  if (scene !== "overview") return <WorkflowVisual project={project} scene={scene} />;
  if (project.visual === "desktop") return <DesktopVisual />;
  if (project.visual === "website") return <WebsiteVisual />;
  if (project.visual === "mobile") return <MobileVisual />;
  if (project.visual === "tcg-buds") return <TCGBudsVisual />;
  if (project.visual === "stratboard") return <StratBoardVisual />;
  if (project.visual === "pack-night") return <PackNightVisual />;
  if (project.visual === "afterhours") return <AfterhoursVisual />;
  return <PortfolioVisual />;
}
