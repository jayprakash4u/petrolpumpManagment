import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { safeInternalPath } from "@/lib/auth-redirect";
import { normalizeSlug } from "@/lib/tenant";
import { LoginForm } from "./LoginForm";
import { BrandPanel } from "./BrandPanel";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawStation = Array.isArray(params.station) ? params.station[0] : params.station;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const redirectTo = safeInternalPath(rawNext, "/dashboard");
  const defaultStation = rawStation ? normalizeSlug(rawStation) : "";

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="flex items-center justify-center bg-bg px-4 py-12 lg:px-12">
        <LoginForm defaultStation={defaultStation} redirectTo={redirectTo} />
      </div>
    </main>
  );
}
