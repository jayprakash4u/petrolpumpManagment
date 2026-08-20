import type { ComponentType } from "react";

export function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon size={19} />
        </div>
      )}
      <div>
        <h2 className="font-display text-[19px] font-semibold tracking-tight text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
