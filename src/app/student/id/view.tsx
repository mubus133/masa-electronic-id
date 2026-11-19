"use client";

import { IdCard } from "@/components/student/id-card";
import { PassCard } from "@/components/student/pass-card";
import { usePasses, useStudentRecord } from "@/components/student/use-student";
import { Notice, PageHeader, Skeleton } from "@/components/ui";

export default function StudentIdPage() {
  const { timezone, student, loading, error } = useStudentRecord();
  const passes = usePasses();

  return (
    <>
      <PageHeader title="My ID" description="Show this if a teacher or hostel staff ask who you are." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <div className="grid gap-6 lg:grid-cols-2">
        {loading || !student ? <Skeleton className="h-96 w-full" /> : <IdCard student={student} timezone={timezone} />}
        <section aria-label="Latest pass" className="space-y-3">
          <h2 className="text-sm font-medium text-ink-3">Latest pass</h2>
          {passes.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <PassCard pass={passes.data?.authorizations[0] ?? null} timezone={timezone} studentStatus={student?.student_status} />
          )}
        </section>
      </div>
    </>
  );
}
