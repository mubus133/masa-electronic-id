"use client";

import { useParams } from "next/navigation";
import { SessionConsole } from "@/components/teacher/session-console";

export default function TeacherSessionPage() {
  const { id } = useParams<{ id: string }>();
  return <SessionConsole sessionId={id} backHref="/teacher/sessions" backLabel="My sessions" />;
}
