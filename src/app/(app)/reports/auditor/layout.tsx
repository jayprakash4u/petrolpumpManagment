import type { ReactNode } from "react";
import { AuditorSubnav } from "@/components/auditor/AuditorSubnav";

export default function AuditorReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AuditorSubnav />
      {children}
    </div>
  );
}
