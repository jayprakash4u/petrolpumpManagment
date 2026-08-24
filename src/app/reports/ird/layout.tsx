import type { ReactNode } from "react";
import { IrdSubnav } from "@/components/ird/IrdSubnav";

export default function IrdReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <IrdSubnav />
      {children}
    </div>
  );
}
