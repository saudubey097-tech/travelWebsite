"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** "up" slides in from below; "none" is a plain fade. */
  direction?: "up" | "none";
}

/**
 * Fades (and optionally slides) content in once it scrolls into view.
 * Falls back to a plain, instant render when the user has requested
 * reduced motion — this is the one place JS-driven motion needs an
 * explicit check, since the reduced-motion CSS override only catches
 * CSS transitions/animations, not Framer Motion's own timers.
 */
export function Reveal({ children, className, delay = 0, direction = "up" }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: direction === "up" ? 18 : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
