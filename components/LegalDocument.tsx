import { Fragment } from "react";
import type { LegalDoc } from "@/content/legal";

// Turns emails and the privacy agency's site into links inside plain text.
const LINK_RE = /([\w.+-]+@[\w-]+\.[\w.]+|aip\.rks-gov\.net)/g;

function withLinks(text: string) {
  return text.split(LINK_RE).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const href = part.includes("@") ? `mailto:${part}` : `https://${part}`;
    return (
      <a key={i} href={href} className="break-words font-semibold text-pine underline underline-offset-2 hover:opacity-80 dark:text-apricot">
        {part}
      </a>
    );
  });
}

export function LegalDocument({ title, updatedLabel, doc }: { title: string; updatedLabel: string; doc: LegalDoc }) {
  return (
    <article className="mx-auto max-w-2xl px-page pb-6 pt-12 sm:pt-20">
      <p className="mb-4 inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-clay dark:text-apricot">
        <span className="h-2 w-2 rounded-full bg-apricot" aria-hidden="true" />
        {updatedLabel}
      </p>
      <h1 className="mb-6 text-display-lg font-semibold">{title}</h1>
      <p className="mb-12 text-lg leading-relaxed text-ink/80 dark:text-mist/85">{withLinks(doc.intro)}</p>

      <div className="space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]">{section.heading}</h2>
            <div className="space-y-3 text-[1.02rem] leading-relaxed text-ink/80 dark:text-mist/80">
              {section.body.map((block, i) =>
                typeof block === "string" ? (
                  <p key={i}>{withLinks(block)}</p>
                ) : (
                  <ul key={i} className="list-disc space-y-2 pl-5 marker:text-apricot">
                    {block.list.map((item) => (
                      <li key={item}>{withLinks(item)}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
