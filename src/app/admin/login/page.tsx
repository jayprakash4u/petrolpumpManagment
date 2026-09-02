import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/platform-dal";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminBrandPanel } from "./AdminBrandPanel";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AdminBrandPanel />

      <div className="flex items-center justify-center bg-bg px-4 py-12 lg:px-12">
        <AdminLoginForm />
      </div>
    </main>
  );
}
