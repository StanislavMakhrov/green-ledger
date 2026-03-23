"use client";

import { useState, useEffect } from "react";

/**
 * Clock component — renders the current local time, updated every second.
 */
export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  const formatted = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <span
      aria-label={`Current time: ${formatted}`}
      className="text-sm text-gray-400 font-mono tabular-nums"
    >
      🕐 {formatted}
    </span>
  );
}
