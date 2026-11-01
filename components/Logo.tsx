// Brand mark: two concentric rings — a breath, seen from above.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-apricot"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke="#0E2629" strokeWidth="2" />
        <circle cx="12" cy="12" r="9" stroke="#0E2629" strokeWidth="1.4" opacity="0.5" />
      </svg>
    </span>
  );
}
