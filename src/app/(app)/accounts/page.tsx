import { redirect } from "next/navigation";

export default function AccountsRootPage() {
  redirect("/accounts/ledgers");
}
