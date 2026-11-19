import { Mark } from "@/components/shell/brand";
import { Photo, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/time";
import type { Student } from "@/lib/types";

export const IdCard = ({ student, timezone }: { student: Student; timezone: string }) => (
  <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_12px_32px_-16px_rgba(22,33,46,0.25)]">
    <div className="flex items-center justify-between bg-brand-ink px-5 py-3.5 text-white">
      <span className="flex items-center gap-2 font-semibold tracking-tight">
        <Mark className="size-6 text-white/15" /> IMASA
      </span>
      <span className="text-sm text-white/75">Student ID</span>
    </div>
    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <Photo src={student.photograph_url} name={student.full_name} size="xl" className="self-center sm:self-auto" />
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-xl font-semibold text-ink">{student.full_name}</p>
        <p className="mt-0.5 font-mono text-[15px] tracking-wide text-ink-2">{student.registration_number}</p>
        <div className="mt-3"><StatusBadge status={student.student_status} /></div>
      </div>
    </div>
    <dl className="grid grid-cols-2 border-t border-line text-sm">
      <div className="border-r border-line px-5 py-3"><dt className="text-ink-3">Hostel</dt><dd className="mt-0.5 font-medium text-ink">{student.hostel_name || "Not assigned"}</dd></div>
      <div className="px-5 py-3"><dt className="text-ink-3">Class</dt><dd className="mt-0.5 font-medium text-ink">{student.class_group || "—"}</dd></div>
      <div className="col-span-2 border-t border-line px-5 py-3"><dt className="text-ink-3">Registered</dt><dd className="mt-0.5 font-medium text-ink">{formatDate(student.date_registered, timezone)}</dd></div>
    </dl>
    <p className="border-t border-line bg-sunken/60 px-5 py-3 text-sm text-ink-2">
      This ID shows who you are. It does not let you into the hostel. That needs a pass for the session.
    </p>
  </div>
);
