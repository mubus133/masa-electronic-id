import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/prose-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy notice"
      intro="What this system stores about you, who can see it, and why."
    >
      <ProseSection title="What we store">
        <ul>
          <li>Your name, registration number, photo, class group and hostel.</li>
          <li>An optional phone number and emergency contact, if you or IMASA add them.</li>
          <li>Each check-in: which session, when, how (scan or manual), and who confirmed it.</li>
          <li>Each pass, and each time hostel staff recorded an entry or denial for you.</li>
        </ul>
        <p>Passwords are stored only as a one-way hash. Nobody at IMASA can read them.</p>
      </ProseSection>

      <ProseSection title="Who can see it">
        <ul>
          <li><strong>You</strong> see your own ID, attendance and passes, and nobody else&apos;s.</li>
          <li><strong>Teachers</strong> see the students in the sessions they run.</li>
          <li><strong>Hostel staff</strong> see only students assigned to their hostel, and only what they need at the door: photo, name, registration number and pass status.</li>
          <li><strong>Administrators</strong> see what the President has given them permission to see.</li>
        </ul>
        <p>There is no public list of students, and profile addresses can&apos;t be guessed.</p>
      </ProseSection>

      <ProseSection title="Check-in codes">
        <p>
          The code your teacher shows contains no personal information. It only identifies the session, and it stops
          working after a couple of minutes.
        </p>
      </ProseSection>

      <ProseSection title="The audit log">
        <p>
          Important actions are recorded: who did what, when, and why. That includes confirming attendance, issuing
          and using passes, and suspending or reinstating IDs. Ordinary users can&apos;t change or delete these records.
        </p>
      </ProseSection>

      <ProseSection title="How long we keep it">
        <p>
          IMASA management sets the retention period for profiles, photos, attendance, entry records and the audit
          log. Ask the administration for the current periods.
        </p>
      </ProseSection>

      <ProseSection title="Questions or corrections">
        <p>
          To see, correct or ask about your data, <Link href="/contact" className="font-medium text-brand underline underline-offset-2">contact the IMASA administration</Link>.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
