import type { ReactNode } from "react";

export const ProsePage = ({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) => (
  <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
    <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
    {intro && <p className="mt-4 text-lg text-ink-2">{intro}</p>}
    <div className="mt-10 space-y-10">{children}</div>
  </article>
);

export const ProseSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h2 className="text-xl font-semibold text-ink">{title}</h2>
    <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-ink-2 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      {children}
    </div>
  </section>
);
