import type { ReactNode } from "react";
import { ComplianceSubnav } from "@/components/compliance/ComplianceSubnav";

export default function VctsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <ComplianceSubnav />
      {children}
    </div>
  );
}
