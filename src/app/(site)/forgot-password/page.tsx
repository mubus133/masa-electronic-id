import type { Metadata } from "next";
import { SupportForm } from "@/components/support-form";
import { Panel, PanelBody } from "@/components/ui";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        Passwords are reset by the IMASA administration after they&apos;ve confirmed it&apos;s you. Send a request
        below, or ask in person at the next session. You&apos;ll be given a new temporary password.
      </p>
      <Panel className="mt-8">
        <PanelBody className="sm:p-6">
          <SupportForm askForContact defaultCategory="account" />
        </PanelBody>
      </Panel>
    </div>
  );
}
