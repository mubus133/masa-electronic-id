import { HostelPortal } from "@/components/shell/portals";

// Portal pages render after the browser has confirmed who is signed in, so
// there is no server-rendered content here to validate for instant navigation.
export const instant = false;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <HostelPortal>{children}</HostelPortal>;
}
