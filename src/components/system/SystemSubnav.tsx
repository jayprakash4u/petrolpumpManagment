"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cog,
  Wrench,
  FilePenLine,
  UserCog,
  ScrollText,
  Archive,
  LifeBuoy,
} from "lucide-react";
import { clsx } from "clsx";

const SYSTEM_TABS = [
  { href: "/settings", label: "Site Settings", icon: Cog },
  { href: "/settings/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/settings/corrections", label: "Corrections", icon: FilePenLine },
  { href: "/profile", label: "User Profile", icon: UserCog },
  { href: "/activity", label: "Activity Log", icon: ScrollText },
  { href: "/archive", label: "Log Archive", icon: Archive },
  { href: "/help", label: "Help & Support", icon: LifeBuoy },
];

export function SystemSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-2xs">
      {SYSTEM_TABS.map((tab) => {
        const isActive =
          tab.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-all",
              isActive
                ? "bg-accent/15 text-accent shadow-xs"
                : "text-text-muted hover:bg-surface-hi hover:text-text"
            )}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
