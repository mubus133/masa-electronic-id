"use client";

import Link from "next/link";
import { ChevronRight, IdCard, QrCode } from "lucide-react";
import { PassCard } from "@/components/student/pass-card";
import { useAttendance, usePasses, useStudentRecord } from "@/components/student/use-student";
import { ButtonLink, EmptyState, LoadingBlock, Notice, PageHeader, Panel, PanelHeader, Skeleton, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/time";

const firstName = (name: string) => name.split(" ")[0];

export default function StudentHome() {
  const { actor, timezone, student, error } = useStudentRecord();
  const passes = usePasses();
  const attendance = useAttendance();
  const latest = passes.data?.authorizations[0] ?? null;
  const recent = attendance.data?.attendance.slice(0, 5) ?? [];

  return (
    <>
      <PageHeader title={`Salaam, ${firstName(actor.fullName)}`} description={actor.registrationNumber ?? undefined} />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section aria-label="Latest pass">
            <h2 className="mb-3 text-sm font-medium text-ink-3">Your latest pass</h2>
            {passes.loading ? <Skeleton className="h-40 w-full" /> : <PassCard pass={latest} timezone={timezone} studentStatus={student?.student_status ?? actor.studentStatus} />}
          </section>

          <Panel>
            <PanelHeader title="Recent attendance" actions={<Link href="/student/attendance" className="text-sm font-medium text-brand hover:underline">See all</Link>} />
            {attendance.loading ? (
              <LoadingBlock rows={3} />
            ) : recent.length === 0 ? (
              <EmptyState title="No attendance yet">Your check-ins will appear here.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{record.session_name}</p>
                      <p className="text-sm text-ink-3">{formatDate((record as { session_date?: string }).session_date, timezone)}</p>
                    </div>
                    <StatusBadge status={record.attendance_status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-ink-3">Quick links</h2>
          <ButtonLink href="/student/scan" size="lg" className="w-full justify-start"><QrCode className="size-5" /> Check in to a session</ButtonLink>
          {[
            { href: "/student/id", label: "Show my ID", icon: IdCard },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex h-12 items-center gap-3 rounded-control border border-line bg-panel px-4 font-medium text-ink hover:bg-sunken">
              <item.icon className="size-5 text-ink-3" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="size-4 text-ink-3" />
            </Link>
          ))}
          <p className="pt-2 text-sm text-ink-3">
            No phone at class? Ask your teacher to check you in by hand.
          </p>
        </div>
      </div>
    </>
  );
}
