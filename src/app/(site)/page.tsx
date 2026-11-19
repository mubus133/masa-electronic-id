import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { ensureReady } from "@/lib/db";
import { getSiteContent, SITE_CONTENT_DEFAULTS } from "@/lib/services/site-content";

const STEPS = [
  {
    title: "Check in",
    body: "The teacher shows a code on screen that changes every couple of minutes. Students scan it from their phone.",
  },
  {
    title: "Teacher confirms",
    body: "A scan only puts the student on a waiting list. The teacher ticks off each student who is actually in the room.",
  },
  {
    title: "Session completed",
    body: "When the teacher closes the session, everyone confirmed present gets a pass for that night. No one else does.",
  },
  {
    title: "Hostel check",
    body: "At the hostel, staff look the student up on a computer and see, live, whether the pass is valid right now.",
  },
];

const ROLES = [
  { name: "Students", body: "Your ID, the check-in scanner, your attendance and tonight's pass." },
  { name: "Teachers", body: "Show the check-in code, confirm who is present and complete the session." },
  { name: "Hostel staff", body: "Search by name or registration number, check the photo, record entry." },
  { name: "Administration", body: "Students, sessions, hostels, ID suspensions, reports and the audit log." },
];

// Hero text and photo are edited from Administration → Website.
async function LiveHero() {
  await connection();
  await ensureReady();
  const content = await getSiteContent();
  return (
    <>
      {content.announcement && (
        <div className="border-b border-warn/20 bg-warn-soft">
          <p className="mx-auto max-w-6xl px-4 py-2.5 text-[15px] text-warn sm:px-6">{content.announcement}</p>
        </div>
      )}
      <Hero content={content} />
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Hero content={SITE_CONTENT_DEFAULTS} />}>
        <LiveHero />
      </Suspense>

      <section className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your ID is not a pass.</h2>
            <p className="mt-3 text-[17px] text-ink-2">
              The ID shows who a student is. It never lets her into the hostel on its own. Each night&apos;s pass is
              issued only after a teacher has confirmed she attended that session.
            </p>
          </div>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t-2 border-brand pt-4">
                <p className="text-sm font-medium text-brand tabular-nums">Step {index + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[15px] text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Who uses it</h2>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2">
          {ROLES.map((role) => (
            <div key={role.name} className="bg-panel p-5 sm:p-6">
              <dt className="font-semibold text-ink">{role.name}</dt>
              <dd className="mt-1.5 text-[15px] text-ink-2">{role.body}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-panel border border-line bg-sunken/60 p-5 sm:p-6">
          <h3 className="font-semibold text-ink">No phone, or a flat battery?</h3>
          <p className="mt-1.5 max-w-3xl text-[15px] text-ink-2">
            Go to your teacher. She can find you by name or registration number, check your photo, and record your
            attendance by hand. The same rules apply: you still need her confirmation and a completed session to get a
            pass. <Link href="/about" className="font-medium text-brand underline underline-offset-2">Read more</Link>
          </p>
        </div>
      </section>
    </>
  );
}
