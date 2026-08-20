import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

const TONE_TEXT = {
  accent: "text-accent",
  success: "text-success",
  text: "text-text",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  small,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: keyof typeof TONE_TEXT;
  small?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-text-muted">{label}</span>
        <Icon size={15} className="text-text-muted" />
      </div>
      <div className={clsx("font-data font-bold", TONE_TEXT[tone], small ? "text-[17px]" : "text-[21px]")}>{value}</div>
    </Card>
  );
}
