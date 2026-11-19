import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "IMASA Electronic ID", template: "%s · IMASA" },
  description: "Electronic student IDs, Madrasa attendance and hostel passes for IMASA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f5f1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        {children}
        <Toaster position="top-center" toastOptions={{ className: "!font-sans !text-[15px]" }} />
      </body>
    </html>
  );
}
