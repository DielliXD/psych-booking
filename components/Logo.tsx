// Brand mark: a speech bubble with sound waves coming out of it —
// "Shprehu" / "Tell Me": a place to say what you carry.
// Same drawing as app/icon.svg (favicon); keep the two in sync.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M18 2a16 16 0 1 1-8.9 29.3L3 34l2.2-6.3A16 16 0 0 1 18 2z" fill="#F0A27B" />
      <g stroke="#0E2629" strokeLinecap="round">
        <path d="M13.5 13.5a6.4 6.4 0 0 1 0 9" strokeWidth="1.9" />
        <path d="M17.8 10.2a11 11 0 0 1 0 15.6" strokeWidth="1.6" opacity="0.7" />
        <path d="M22.1 7a15.4 15.4 0 0 1 0 22" strokeWidth="1.3" opacity="0.45" />
      </g>
    </svg>
  );
}
