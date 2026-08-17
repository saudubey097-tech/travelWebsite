import { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-md border border-line bg-paper shadow-card",
        hover &&
          "transition-all duration-300 ease-signature hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
      {...props}
    />
  );
}
