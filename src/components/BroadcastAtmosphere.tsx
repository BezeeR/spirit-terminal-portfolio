export function BroadcastAtmosphere() {
  return (
    <div className="broadcast-atmosphere" aria-hidden="true">
      <div className="night-sky" />
      <div className="moon-haze" />
      <div className="arena-beam beam-one" />
      <div className="arena-beam beam-two" />
      <div className="arena-beam beam-three" />
      <div className="arena-architecture">
        <div className="arena-crown">
          {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
        </div>
        <div className="arena-bowl bowl-back" />
        <div className="arena-bowl bowl-front" />
        <div className="arena-gate">
          <span />
          <b>03</b>
          <span />
        </div>
      </div>
      <div className="city-silhouette">
        {Array.from({ length: 22 }, (_, index) => <i key={index} />)}
      </div>
      <div className="spirit-particles">
        {Array.from({ length: 16 }, (_, index) => <i key={index} />)}
      </div>
      <div className="window-rain" />
      <div className="spirit-mist mist-one" />
      <div className="spirit-mist mist-two" />
      <div className="broadcast-scan" />
      <div className="screen-vignette" />
    </div>
  );
}
