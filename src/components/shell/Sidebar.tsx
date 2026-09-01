import Link from "next/link";
import { Fuel, ChevronRight } from "lucide-react";
import { NAV, type NavItem } from "./nav";
import type { Role } from "@/lib/permissions";

/** True when this item, or any of its children, is the page being viewed. */
function containsActive(item: NavItem, activeHref: string): boolean {
  if (item.children) return item.children.some((child) => child.href === activeHref);
  return item.href === activeHref;
}

const rowBase = "font-display flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] transition-colors";
const rowIdle = "font-medium text-text-muted hover:bg-white/5 hover:text-text";
const rowActive = "bg-accent/10 font-semibold text-accent";
const rowDisabled = "font-medium text-text-muted/40 cursor-not-allowed";

function DisabledRow({ item, inset }: { item: NavItem; inset?: boolean }) {
  const tooltipText = item.soonNote ? `${item.label} — ${item.soonNote}` : `${item.label} (Coming soon)`;
  return (
    <span
      aria-disabled="true"
      className={`${rowBase} ${rowDisabled} ${inset ? "py-1.5 text-[12.5px]" : ""}`}
      title={tooltipText}
    >
      <item.icon size={inset ? 14 : 16} className="shrink-0" />
      <span className="truncate">{item.label}</span>
      <span className="font-data ml-auto shrink-0 text-[9px] tracking-wide text-text-muted/40">SOON</span>
    </span>
  );
}

function LinkRow({ item, activeHref, inset }: { item: NavItem; activeHref: string; inset?: boolean }) {
  const isActive = item.href === activeHref;
  const tooltipText = item.soonNote ? `${item.label} — ${item.soonNote}` : item.label;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={tooltipText}
      className={`${rowBase} ${isActive ? rowActive : rowIdle} ${inset ? "py-1.5 text-[12.5px]" : ""}`}
    >
      <item.icon size={inset ? 14 : 16} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * A module with sub-pages.
 */
function ExpandableRow({ item, activeHref }: { item: NavItem; activeHref: string }) {
  const open = containsActive(item, activeHref);
  const allUnbuilt = item.children!.every((child) => !child.enabled);

  return (
    <details open={open} className="group">
      <summary
        title={item.label}
        className={`${rowBase} cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden ${
          allUnbuilt ? "font-medium text-text-muted/40" : open ? "font-semibold text-text" : rowIdle
        }`}
      >
        <item.icon size={16} className="shrink-0" />
        <span className="truncate">{item.label}</span>
        {allUnbuilt && (
          <span className="font-data ml-auto shrink-0 text-[9px] tracking-wide text-text-muted/40">SOON</span>
        )}
        <ChevronRight
          size={14}
          className={`${allUnbuilt ? "ml-1.5" : "ml-auto"} shrink-0 transition-transform duration-150 group-open:rotate-90`}
        />
      </summary>

      <div className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-border/80 pl-2">
        {item.children!.map((child) => {
          const childKey = `${item.href}-${child.href}-${child.label}`;
          return child.enabled ? (
            <LinkRow key={childKey} item={child} activeHref={activeHref} inset />
          ) : (
            <DisabledRow key={childKey} item={child} inset />
          );
        })}
      </div>
    </details>
  );
}

export function SidebarContent({
  activeHref,
  role,
  stationName,
  logoUrl,
}: {
  activeHref: string;
  role?: Role | string;
  stationName: string;
  logoUrl?: string | null;
}) {
  return (
    <>
      <div className="mb-7 flex items-center gap-2.5 px-2">
        {logoUrl ? (
          <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-hi p-1 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={stationName} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-accent shadow-2xs">
            <Fuel size={18} color="#1A1306" />
          </div>
        )}
        <div className="min-w-0 font-display text-[15.5px] leading-tight font-bold text-text">
          <div className="truncate" title={stationName}>
            {stationName}
          </div>
          <div className="font-data text-[11px] font-normal text-text-muted">STATION CONTROL</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto pb-4">
        {NAV.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <div className="font-data mb-1 px-2.5 text-[10px] tracking-[0.12em] text-text-muted/50">
              {section.label.toUpperCase()}
            </div>

            {section.items.map((item) => {
              const itemKey = `${section.label}-${item.href}-${item.label}`;
              if (item.children) return <ExpandableRow key={itemKey} item={item} activeHref={activeHref} />;
              if (!item.enabled) return <DisabledRow key={itemKey} item={item} />;
              return <LinkRow key={itemKey} item={item} activeHref={activeHref} />;
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({
  activeHref,
  role,
  stationName,
  logoUrl,
}: {
  activeHref: string;
  role?: Role | string;
  stationName: string;
  logoUrl?: string | null;
}) {
  return (
    <aside className="hidden h-screen w-[268px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface p-[22px_14px] md:sticky md:top-0 md:flex">
      <SidebarContent activeHref={activeHref} role={role} stationName={stationName} logoUrl={logoUrl} />
    </aside>
  );
}
