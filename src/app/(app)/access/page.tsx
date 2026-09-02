import { redirect } from "next/navigation";

export default function AccessRootPage() {
  redirect("/access/roles");
}
