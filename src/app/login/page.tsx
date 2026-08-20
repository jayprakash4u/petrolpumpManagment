import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { normalizeSlug } from "@/lib/tenant";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  // A tenant can hand its staff a bookmark like /login?station=shree-petroleum
  // so nobody has to remember the code. It only prefills the field — the
  // login still verifies (station, email, password) as one unit.
  const params = await searchParams;
  const raw = Array.isArray(params.station) ? params.station[0] : params.station;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <LoginForm defaultStation={raw ? normalizeSlug(raw) : ""} />
    </main>
  );
}
