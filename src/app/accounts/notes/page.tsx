import { ScrollText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AccountSubnav } from "@/components/accounts/AccountSubnav";
import { NotesView } from "@/components/accounts/NotesView";

export default async function NotesPage() {
  const user = await requireUser();

  return (
    <div>
      <AccountSubnav />

      <Card>
        <SectionTitle
          icon={ScrollText}
          title="Credit & Debit Notes Register"
          subtitle="Record and issue debit notes against supplier returns and credit notes for customer adjustments"
        />
        <NotesView userName={user.name} />
      </Card>
    </div>
  );
}
