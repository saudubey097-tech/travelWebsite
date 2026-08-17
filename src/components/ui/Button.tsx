import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "outlineLight";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-body font-medium transition-all duration-200 ease-signature focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-pine text-paper hover:bg-pineLight shadow-sm",
  secondary: "bg-transparent text-pine border border-pine hover:bg-pine hover:text-paper",
  ghost: "bg-transparent text-pine hover:bg-sand",
  gold: "bg-gold text-ink hover:bg-goldMuted shadow-sm",
  outlineLight: "bg-white/0 text-paper border border-paper/40 hover:bg-paper hover:text-ink backdrop-blur-sm",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

interface LinkButtonProps extends BaseProps {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  "aria-label"?: string;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link href={href} className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}
