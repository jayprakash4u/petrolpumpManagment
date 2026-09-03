import type { ReactNode } from "react";
import { PumpsSubnav } from "@/components/pumps/PumpsSubnav";

export default function PumpsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <PumpsSubnav />
      {children}
    </div>
  );
}
