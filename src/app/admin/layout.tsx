import { getCurrentAdmin } from "@/lib/platform-dal";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // If not signed in (e.g. visiting /admin/login), render children directly without dashboard chrome
  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* 1. Super Admin Sidebar */}
      <AdminSidebar
        adminName={admin.name}
        adminUsername={admin.username}
      />

      {/* 2. Main Executive Content Area */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Executive Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-surface/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[16px] font-bold text-text">
              Platform Headquarters & Multi-Station Console
            </h1>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              Nepal Petroleum SaaS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-1.5 text-[11.5px] text-text-muted">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>Multi-Tenant DB Active</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
