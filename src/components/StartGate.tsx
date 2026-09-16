type StartGateProps = {
  onEnter: () => void
}

export function StartGate({ onEnter }: StartGateProps) {
  return (
    <main className="start-gate">
      <div className="start-gate__glow" aria-hidden="true" />
      <div className="start-gate__content">
        <p className="start-gate__eyebrow">MailDuck playground</p>
        <h1 className="start-gate__brand">
          Baby<span className="start-gate__brand-accent">World</span>
        </h1>
        <p className="start-gate__tagline">
          Fullscreen keyboard smash for tiny fingers. Funny sounds on every
          key. Grown-ups type <strong>leave</strong> to get out.
        </p>
        <button type="button" className="start-gate__cta" onClick={onEnter}>
          Enter smash
        </button>
      </div>
    </main>
  )
}
