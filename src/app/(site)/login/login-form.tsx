"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, Input, Notice, Panel, PanelBody } from "@/components/ui";
import { homeForRole, type Role } from "@/lib/permissions";

const DEMO_PASSWORD = "Imasa-Demo-2026";
const DEMO_ACCOUNTS = [
  { label: "President", email: "president@imasa.demo" },
  { label: "Administrator", email: "admin@imasa.demo" },
  { label: "Teacher", email: "teacher@imasa.demo" },
  { label: "Hostel staff", email: "hostel@imasa.demo" },
  { label: "Student", email: "khadijah@imasa.demo" },
  { label: "Suspended student", email: "aisha@imasa.demo" },
];

const safeNext = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : null);

export const LoginForm = () => {
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Sign-in failed. Try again.");
      const home = homeForRole(data.user.role as Role);
      const next = safeNext(params.get("next"));
      window.location.href = next && next.startsWith(home) ? next : home;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <Panel className="mt-8">
        <PanelBody className="sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            {error && <Notice tone="bad">{error}</Notice>}
            <Field label="Email or username">
              {(props) => (
                <Input
                  {...props}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              )}
            </Field>
            <Field label="Password">
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-3 hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" busy={busy} className="w-full" size="lg">Sign in</Button>
          </form>
        </PanelBody>
      </Panel>

      <p className="mt-5 text-[15px] text-ink-2">
        Forgotten your password?{" "}
        <Link href="/forgot-password" className="font-medium text-brand underline underline-offset-2">Get it reset</Link>
      </p>

      {process.env.NODE_ENV !== "production" && (
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-sm font-medium text-ink">Demo accounts</p>
          <p className="mt-0.5 text-sm text-ink-3">Development only. Password for all: {DEMO_PASSWORD}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setIdentifier(account.email);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
                className="rounded-control border border-line bg-panel px-3 py-2.5 text-left hover:border-line-strong hover:bg-sunken"
              >
                <span className="block text-sm font-medium text-ink">{account.label}</span>
                <span className="block truncate text-xs text-ink-3">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
