import type { ReactNode } from "react";
import { SystemSubnav } from "@/components/system/SystemSubnav";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SystemSubnav />
      {children}
    </div>
  );
}
