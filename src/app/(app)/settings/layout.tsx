import type { ReactNode } from "react";
import { SystemSubnav } from "@/components/system/SystemSubnav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SystemSubnav />
      {children}
    </div>
  );
}
