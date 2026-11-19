"use client";

import { useState } from "react";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { PhotoInput } from "./photo-input";
import type { Hostel, Student } from "@/lib/types";

export type StudentFormValues = {
  fullName: string;
  email: string;
  hostelId: string;
  classGroup: string;
  phone: string;
  emergencyContact: string;
  photographUrl: string | null;
};

export const emptyStudent = (): StudentFormValues => ({ fullName: "", email: "", hostelId: "", classGroup: "", phone: "", emergencyContact: "", photographUrl: null });

export const fromStudent = (student: Student): StudentFormValues => ({
  fullName: student.full_name,
  email: "",
  hostelId: student.hostel_id ?? "",
  classGroup: student.class_group ?? "",
  phone: student.phone ?? "",
  emergencyContact: student.emergency_contact ?? "",
  photographUrl: student.photograph_url,
});

type Props = { initial: StudentFormValues; hostels: Hostel[]; withEmail: boolean; submitLabel: string; onSubmit: (values: StudentFormValues) => Promise<void>; onCancel: () => void };

export const StudentForm = ({ initial, hostels, withEmail, submitLabel, onSubmit, onCancel }: Props) => {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onSubmit(values);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Notice tone="bad">{error}</Notice>}
      <PhotoInput value={values.photographUrl} name={values.fullName} onChange={(value) => set("photographUrl", value)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          {(props) => <Input {...props} value={values.fullName} onChange={(event) => set("fullName", event.target.value)} required autoComplete="off" />}
        </Field>
        {withEmail && (
          <Field label="Email" hint="She signs in with this." className="sm:col-span-2">
            {(props) => <Input {...props} type="email" value={values.email} onChange={(event) => set("email", event.target.value)} required autoComplete="off" />}
          </Field>
        )}
        <Field label="Hostel">
          {(props) => (
            <Select {...props} value={values.hostelId} onChange={(event) => set("hostelId", event.target.value)}>
              <option value="">Not assigned</option>
              {hostels.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.hostel_name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Class group" optional>
          {(props) => <Input {...props} value={values.classGroup} onChange={(event) => set("classGroup", event.target.value)} placeholder="e.g. Group A" />}
        </Field>
        <Field label="Phone" optional>
          {(props) => <Input {...props} type="tel" value={values.phone} onChange={(event) => set("phone", event.target.value)} />}
        </Field>
        <Field label="Emergency contact" optional>
          {(props) => <Input {...props} value={values.emergencyContact} onChange={(event) => set("emergencyContact", event.target.value)} />}
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" busy={busy}>{submitLabel}</Button>
      </div>
    </form>
  );
};
