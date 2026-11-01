import { Fragment } from "react";
import type { LegalDoc } from "@/content/legal";

// Turns emails and the privacy agency's site into links inside plain text.
const LINK_RE = /([\w.+-]+@[\w-]+\.[\w.]+|aip\.rks-gov\.net)/g;

function withLinks(text: string) {
  return text.split(LINK_RE).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const href = part.includes("@") ? `mailto:${part}` : `https://${part}`;
    return (
      <a key={i} href={href} className="text-pine dark:text-sage underline underline-offset-2 hover:opacity-80">
        {part}
      </a>
    );
  });
}

export function LegalDocument({ title, updatedLabel, doc }: { title: string; updatedLabel: string; doc: LegalDoc }) {
  return (
    <article className="max-w-2xl mx-auto px-page py-14 sm:py-24">
      <h1 className="text-3xl md:text-4xl mb-3 text-ink dark:text-mist tracking-tightest">{title}</h1>
      <p className="text-xs uppercase tracking-widest text-clay mb-10">{updatedLabel}</p>
      <p className="text-[0.95rem] leading-relaxed text-ink/75 dark:text-mist/75 mb-12">{withLinks(doc.intro)}</p>

      <div className="space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl mb-4 text-ink dark:text-mist">{section.heading}</h2>
            <div className="space-y-3 text-[0.95rem] leading-relaxed text-ink/70 dark:text-mist/70">
              {section.body.map((block, i) =>
                typeof block === "string" ? (
                  <p key={i}>{withLinks(block)}</p>
                ) : (
                  <ul key={i} className="list-disc pl-5 space-y-2 marker:text-clay">
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
