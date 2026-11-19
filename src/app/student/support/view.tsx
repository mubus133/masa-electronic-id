"use client";

import { SupportForm } from "@/components/support-form";
import { PageHeader, Panel, PanelBody } from "@/components/ui";

export default function StudentSupportPage() {
  return (
    <>
      <PageHeader
        title="Report a problem"
        description="Missing attendance, a pass that should have been issued, or anything else. A teacher or administrator will review it."
      />
      <Panel className="max-w-2xl">
        <PanelBody className="sm:p-6">
          <SupportForm defaultCategory="dispute" />
        </PanelBody>
      </Panel>
    </>
  );
}
