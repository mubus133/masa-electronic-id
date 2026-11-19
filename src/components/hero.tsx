import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SiteContent } from "@/lib/services/site-content";

// Eight-point star tiling, used behind the hero until a class photo is uploaded.
const Pattern = () => (
  <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.14]">
    <defs>
      <pattern id="imasa-star" width="56" height="56" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="white" strokeWidth="1">
          <rect x="16" y="16" width="24" height="24" />
          <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
          <path d="M0 28h8M48 28h8M28 0v8M28 48v8" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#imasa-star)" />
  </svg>
);

const PassPreview = () => (
  <div aria-hidden className="w-full max-w-sm rounded-2xl border border-white/15 bg-panel/95 p-5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.45)] backdrop-blur">
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-ink">IMASA</span>
      <span className="text-ink-3">Student ID</span>
    </div>
    <div className="mt-5 flex items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-lg bg-brand-soft text-xl font-semibold text-brand-ink">KA</div>
      <div>
        <p className="font-semibold text-ink">Khadijah Abdullahi</p>
        <p className="text-sm text-ink-3 tabular-nums">IMASA-1001 · Amina House</p>
      </div>
    </div>
    <div className="mt-5 rounded-xl border border-ok/20 bg-ok-soft p-4">
      <p className="text-sm font-semibold text-ok">Pass valid tonight</p>
      <p className="mt-1 text-sm text-ink-2">Friday Maghrib class · confirmed by Ustazah Aisha</p>
      <p className="mt-1 text-sm text-ink-3 tabular-nums">Expires 23:59</p>
    </div>
  </div>
);

export const Hero = ({ content }: { content: SiteContent }) => {
  const hasPhoto = Boolean(content.hero_image);
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink">
      {hasPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded photo stored as a data URL
        <img src={content.hero_image} alt={content.hero_image_alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_20%,#2c7a60_0%,#123b2d_55%,#0c2a20_100%)]">
          <Pattern />
        </div>
      )}
      {/* Blend: darken toward the text side, and fade the bottom edge into the page. */}
      <div aria-hidden className={cn("absolute inset-0 -z-10", hasPhoto ? "bg-gradient-to-r from-[#0c2a20]/90 via-[#0c2a20]/70 to-[#0c2a20]/30" : "")} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-[#0c2a20]/60" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-24 md:pb-28">
        <div>
          <h1 className="text-[2.1rem] leading-[1.15] font-semibold tracking-tight text-white sm:text-5xl">{content.hero_title}</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">{content.hero_text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/login" size="lg" className="bg-white text-brand-ink hover:bg-white/90">Sign in</ButtonLink>
            <ButtonLink href="/about" size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10 hover:text-white">
              How it works
            </ButtonLink>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <PassPreview />
        </div>
      </div>
    </section>
  );
};
