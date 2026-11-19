"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Verdict } from "@/components/hostel/verdict";
import { useSession } from "@/components/shell/session";
import { EmptyState, Input, Notice, PageHeader, Panel, Person, Skeleton, StatusBadge } from "@/components/ui";
import { api } from "@/lib/client";
import type { VerificationResult } from "@/lib/types";

type Match = { id: string; full_name: string; registration_number: string; photograph_url: string | null; student_status: string; class_group: string | null };

export default function HostelVerifyPage() {
  const { timezone } = useSession();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const term = query.trim();
  const shown = term.length < 2 ? null : matches;

  useEffect(() => {
    if (term.length < 2) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ results: Match[] }>(`/api/hostel/search?q=${encodeURIComponent(term)}`);
        setMatches(data.results);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [term]);

  const verify = useCallback(async (studentId: string) => {
    setSelected(studentId);
    setChecking(true);
    setError(null);
    try {
      setResult(await api<VerificationResult>(`/api/authorizations/verify?studentId=${studentId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check this student.");
      setResult(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const reset = () => {
    setSelected(null);
    setResult(null);
    setQuery("");
    setMatches(null);
    window.setTimeout(() => input.current?.focus(), 0);
  };

  return (
    <>
      <PageHeader title="Verify a student" description="Search by name or registration number. The pass is checked live every time." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}

      {selected ? (
        checking || !result ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Verdict key={selected} result={result} timezone={timezone} onRecorded={() => void verify(selected)} onNext={reset} />
        )
      ) : (
        <Panel>
          <div className="border-b border-line p-4 sm:p-5">
            <label htmlFor="hostel-search" className="sr-only">Name or registration number</label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-3" />
              <Input
                id="hostel-search"
                ref={input}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && shown?.length === 1) void verify(shown[0].id);
                }}
                placeholder="Name or registration number"
                className="h-13 pl-11 text-lg sm:h-12"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
          {searching && !shown ? (
            <div className="space-y-3 p-5"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : shown === null ? (
            <EmptyState title="Start typing to search" className="py-10">Only students assigned to your hostel are shown.</EmptyState>
          ) : shown.length === 0 ? (
            <EmptyState title="No student found" className="py-10">Check the spelling or try the registration number. Students from other hostels don&apos;t appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((match) => (
                <li key={match.id}>
                  <button onClick={() => void verify(match.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-canvas/70 sm:px-5">
                    <Person name={match.full_name} detail={`${match.registration_number}${match.class_group ? ` · ${match.class_group}` : ""}`} photo={match.photograph_url} size="md" />
                    <StatusBadge status={match.student_status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  );
}
