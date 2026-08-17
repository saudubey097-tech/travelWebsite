import clsx from "clsx";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "paper" | "pine" | "gold" | "ink";
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  paper: "bg-paper/95 text-ink border border-line",
  pine: "bg-pine/10 text-pine border border-pine/20",
  gold: "bg-gold/15 text-goldDeep border border-gold/30",
  ink: "bg-ink/85 text-paper border border-ink/10",
};

export function Badge({ className, tone = "paper", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
