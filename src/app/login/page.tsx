import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { normalizeSlug } from "@/lib/tenant";
import { LoginForm } from "./LoginForm";
import { BrandPanel } from "./BrandPanel";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  // A tenant can hand its staff a bookmark like /login?station=shree-petroleum
  // so nobody has to remember the code. It only prefills the field — the
  // login still verifies (station, email, password) as one unit.
  const params = await searchParams;
  const raw = Array.isArray(params.station) ? params.station[0] : params.station;

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="flex items-center justify-center bg-bg px-4 py-12 lg:px-12">
        <LoginForm defaultStation={raw ? normalizeSlug(raw) : ""} />
      </div>
    </main>
  );
}
