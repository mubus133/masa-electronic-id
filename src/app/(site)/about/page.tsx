import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/prose-page";

export const metadata: Metadata = { title: "How it works" };

export default function AboutPage() {
  return (
    <ProsePage
      title="How it works"
      intro="IMASA holds Madrasa classes on Friday, Saturday and Sunday evenings, usually from around Maghrib. This system records who attended and tells hostel staff who may come in afterwards."
    >
      <ProseSection title="Two separate things: your ID and your pass">
        <p>
          <strong>Your electronic ID</strong> is permanent. It shows your name, photo and registration number, and
          proves who you are. It does not let you into the hostel.
        </p>
        <p>
          <strong>A pass</strong> is issued for one session only, after your teacher has confirmed you were there and
          the session has been completed. It expires the same night.
        </p>
      </ProseSection>

      <ProseSection title="At each session">
        <ol>
          <li>Your teacher opens check-in and shows a code on her screen. The code changes every couple of minutes, so a photo of it is no use later.</li>
          <li>You sign in and scan the code from the <strong>Check in</strong> page. You are now on the waiting list.</li>
          <li>Your teacher confirms everyone she can see in the room, and rejects anyone who isn&apos;t there.</li>
          <li>When class ends, she completes the session. Passes are issued to the students she confirmed.</li>
        </ol>
      </ProseSection>

      <ProseSection title="At the hostel">
        <p>
          Hostel staff search for you by name or registration number. They see your photo and whether your pass is
          valid at that moment. They compare the photo with you and record your entry. A screenshot of an old pass
          won&apos;t work, because the check is always made live.
        </p>
        <p>Under the one-time entry rule, a pass can be used once. After that it shows as used.</p>
      </ProseSection>

      <ProseSection title="No phone, or a flat battery">
        <p>
          Go to your teacher in person. She finds you by name or registration number, checks your photo, and records
          your attendance by hand with the reason. It is marked as a manual check-in. You still need a completed
          session to receive a pass.
        </p>
      </ProseSection>

      <ProseSection title="If the internet is down">
        <p>
          Nobody can see a live pass without a connection, so the system will never show a pass as valid while
          offline. Hostel staff follow IMASA&apos;s emergency procedure instead. Emergency entries are recorded
          separately and are never treated as a normal pass.
        </p>
      </ProseSection>

      <ProseSection title="Suspended and revoked IDs">
        <p>
          The President can suspend an ID for a time, or revoke it permanently. Either way, any pass you hold stops
          working immediately. A revoked ID only becomes active again if the President deliberately reinstates it.
        </p>
      </ProseSection>

      <ProseSection title="If your attendance is wrong">
        <p>
          Use <strong>Report a problem</strong> in your student account, or the <Link href="/contact" className="font-medium text-brand underline underline-offset-2">contact form</Link>. A teacher or
          administrator will review it. Every correction is recorded, and the original record is kept.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
