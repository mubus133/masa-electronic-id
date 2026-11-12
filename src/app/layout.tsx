import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "IMASA — Electronic Student ID & Attendance Verification Platform",
  description: "Official Electronic Student Identification, Madrasa Attendance, and Daily Hostel Entry Authorization System for IMASA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#142B4A] antialiased">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
