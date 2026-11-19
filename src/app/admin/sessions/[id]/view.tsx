"use client";

import { useParams } from "next/navigation";
import { SessionConsole } from "@/components/teacher/session-console";

export default function AdminSessionPage() {
  const { id } = useParams<{ id: string }>();
  return <SessionConsole sessionId={id} backHref="/admin/sessions" backLabel="Sessions" />;
}
