interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "light",
  align = "left",
  className,
}: SectionHeadingProps) {
  const headingColor = tone === "dark" ? "text-paper" : "text-ink";
  const bodyColor = tone === "dark" ? "text-paper/70" : "text-ink/65";
  const eyebrowColor = tone === "dark" ? "text-goldMuted" : "text-gold";

  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className ?? ""}`}>
      <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${eyebrowColor}`}>{eyebrow}</span>
      <h2 className={`mt-3 font-display text-3xl leading-[1.12] sm:text-4xl ${headingColor}`}>{title}</h2>
      {description && <p className={`mt-4 font-body text-base leading-relaxed ${bodyColor}`}>{description}</p>}
    </div>
  );
}
