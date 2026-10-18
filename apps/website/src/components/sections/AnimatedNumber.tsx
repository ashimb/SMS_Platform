"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format.ts";

interface AnimatedNumberProps {
  value: number;
  suffix?: string | undefined;
}

/**
 * Counts up when scrolled into view. The server renders the final value, so crawlers, no-JS
 * visitors and screen readers get the real number; an invisible copy of the final value reserves
 * the width, so the animation never shifts layout (CLS). Honours prefers-reduced-motion.
 */
export function AnimatedNumber({ value, suffix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const final = `${formatNumber(value)}${suffix}`;

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className="relative inline-block tabular-nums">
      <span className="sr-only">{final}</span>
      <span aria-hidden="true" className="invisible">
        {final}
      </span>
      <span aria-hidden="true" className="absolute inset-0">
        {formatNumber(shown)}
        {suffix}
      </span>
    </span>
  );
}
