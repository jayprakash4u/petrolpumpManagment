import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CreateStaffForm } from "@/components/employees/CreateStaffForm";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

export default async function CreateStaffPage() {
  const user = await requireUser();

  // Only an owner reaches this screen. Re-checked here rather than trusted
  // from the menu — the sidebar hides the link, but hiding a link is never
  // the control.
  if (!can(user.role, "manageUsers")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Adding staff is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Only an owner can create staff accounts.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <StaticDataNotice />

      <Link href="/employees" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text">
        <ArrowLeft size={14} />
        Back to staff
      </Link>

      <Card>
        <SectionTitle
          icon={UserPlus}
          title="Create Staff Account"
          subtitle="Role sets the starting access — adjust it for this person"
        />
        <CreateStaffForm />
      </Card>
    </div>
  );
}
