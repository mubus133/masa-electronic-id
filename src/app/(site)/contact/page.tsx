import type { Metadata } from "next";
import { SupportForm } from "@/components/support-form";
import { Panel, PanelBody } from "@/components/ui";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Contact the administration</h1>
      <p className="mt-3 text-[17px] text-ink-2">
        For sign-in trouble, a wrong attendance record or anything else. If you can sign in, use{" "}
        <strong className="font-semibold text-ink">Report a problem</strong> in your account instead, so we know it&apos;s you.
      </p>
      <Panel className="mt-8">
        <PanelBody className="sm:p-6">
          <SupportForm askForContact defaultCategory="account" />
        </PanelBody>
      </Panel>
    </div>
  );
}
