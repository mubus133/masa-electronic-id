import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6 md:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-[17px] text-ink-2">Use the email or username IMASA gave you.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
