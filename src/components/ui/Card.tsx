import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-md border border-line bg-paper/60 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
