import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/platform-dal";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  // Authoritative, DB-backed check — the proxy deliberately never redirects
  // away from this page, so the decision belongs here.
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <AdminLoginForm />
    </main>
  );
}
