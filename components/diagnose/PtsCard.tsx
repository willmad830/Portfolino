"use client";

import { useEffect, useState } from "react";

function useCountUp(target: number, active: boolean, duration = 950) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export default function PtsCard({
  total,
  active = true,
  caption = "Money Value вашего портфолио",
}: {
  total: number;
  active?: boolean;
  caption?: string;
}) {
  const pts = useCountUp(total, active);
  return (
    <div className="text-center">
      <div className="flex items-end justify-center gap-2">
        <span className="text-5xl font-semibold tabular-nums text-white sm:text-6xl">{pts}</span>
        <span className="mb-1.5 text-lg text-white/45">/ 1000 PTS</span>
      </div>
      <p className="mt-1 text-sm text-white/55">{caption}</p>
    </div>
  );
}
