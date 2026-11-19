"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input, Notice, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/client";

const CATEGORIES = [
  { value: "dispute", label: "My attendance or pass is wrong" },
  { value: "account", label: "I can't sign in / account problem" },
  { value: "technical", label: "Something isn't working" },
  { value: "other", label: "Something else" },
];

export const SupportForm = ({ defaultCategory = "technical", askForContact }: { defaultCategory?: string; askForContact?: boolean }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = askForContact && contact.trim() ? `${message.trim()}\n\nReply to: ${contact.trim()}` : message.trim();
      await api("/api/support", { body: { category, subject, message: body } });
      setSent(true);
      setSubject("");
      setMessage("");
      setContact("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Notice
        tone="ok"
        title="Sent"
        action={<Button variant="secondary" size="sm" onClick={() => setSent(false)}>Send another</Button>}
      >
        The IMASA administration will look at it and get back to you.
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <Notice tone="bad">{error}</Notice>}
      <Field label="What is it about?">
        {(props) => (
          <Select {...props} value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        )}
      </Field>
      {askForContact && (
        <Field label="Your email or registration number" hint="So we know who to reply to.">
          {(props) => <Input {...props} value={contact} onChange={(event) => setContact(event.target.value)} autoComplete="email" required />}
        </Field>
      )}
      <Field label="Subject">
        {(props) => <Input {...props} value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} required />}
      </Field>
      <Field label="Details" hint="Include the session date and name if it's about attendance.">
        {(props) => <Textarea {...props} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} required />}
      </Field>
      <Button type="submit" busy={busy} disabled={!subject.trim() || !message.trim()} className="w-full sm:w-auto">Send</Button>
    </form>
  );
};
