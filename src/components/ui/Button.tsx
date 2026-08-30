import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        "font-display inline-flex items-center justify-center gap-1.5 rounded-[9px] px-[18px] py-2.5 text-[13.5px] font-semibold transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.97]",
        disabled
          ? "cursor-not-allowed bg-border text-text-muted"
          : "cursor-pointer bg-accent text-[#1A1306] hover:bg-accent-hover",
        className
      )}
      {...props}
    />
  );
}

type Tone = "muted" | "error" | "success";
const TONE_TEXT: Record<Tone, string> = {
  muted: "text-text",
  error: "text-error",
  success: "text-success",
};

export function GhostButton({ className, tone = "muted", ...props }: ButtonProps & { tone?: Tone }) {
  return (
    <button
      type="button"
      className={clsx(
        "font-display inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3.5 py-2 text-[13px] font-medium transition-[background-color,transform] duration-150 active:scale-[0.97]",
        TONE_TEXT[tone],
        className
      )}
      {...props}
    />
  );
}

export const Button = PrimaryButton;
