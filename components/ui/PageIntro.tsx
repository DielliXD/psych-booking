// Shared page opening: eyebrow, big title, short lead. Keeps every content
// page starting the same way as the home page.
export function PageIntro({
  eyebrow,
  title,
  lead,
  center = false,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className={`animate-fadeUp ${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      <p
        className={`mb-4 inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot`}
      >
        <span className="h-2 w-2 rounded-full bg-apricot" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 className="text-display-xl font-semibold">{title}</h1>
      {lead && (
        <p className={`mt-5 max-w-2xl text-lg leading-relaxed text-stone sm:text-xl dark:text-haze ${center ? "mx-auto" : ""}`}>
          {lead}
        </p>
      )}
      {children}
    </header>
  );
}
