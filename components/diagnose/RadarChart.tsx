"use client";

import { useEffect, useState } from "react";
import type { RadarScore } from "@/lib/diagnose/types";

const ACCENT = "#7aa2e3";

const EMPTY_AXES: RadarScore[] = [
  { subject: "GPA", score: 0 },
  { subject: "Академика", score: 0 },
  { subject: "SAT / тесты", score: 0 },
  { subject: "Достижения", score: 0 },
  { subject: "Эссе, лидерство", score: 0 },
  { subject: "Финансовый fit", score: 0 },
];

type RadarChartProps = {
  scores?: RadarScore[];
  active?: boolean;
};

export default function RadarChart({ scores, active = true }: RadarChartProps) {
  const axes = scores?.length ? scores : EMPTY_AXES;
  const [p, setP] = useState(0);
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const R = 118;

  useEffect(() => {
    if (!active) {
      setP(0);
      return;
    }
    let cur = 0;
    let raf = 0;
    const step = () => {
      cur += (1 - cur) * 0.14;
      setP(cur);
      if (1 - cur > 0.002) {
        raf = requestAnimationFrame(step);
      } else {
        setP(1);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, scores]);

  const n = axes.length;
  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pointAt = (i: number, r: number) => {
    const a = angleOf(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const polygon = (scale: number) =>
    axes
      .map((ax, i) => {
        const ratio = Math.min(Math.max(ax.score, 0), 100) / 100;
        const pt = pointAt(i, R * ratio * scale);
        return `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
      })
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full max-w-[340px] will-change-transform"
      role="img"
      aria-label="Radar-диаграмма вашего профиля"
    >
      {[0.33, 0.66, 1].map((s) => (
        <polygon
          key={s}
          points={axes
            .map((_, i) => {
              const pt = pointAt(i, R * s * Math.max(p, 0.15));
              return `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          style={{ opacity: Math.max(p, 0.35) }}
        />
      ))}
      {axes.map((_, i) => {
        const pt = pointAt(i, R * Math.max(p, 0.15));
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            style={{ opacity: Math.max(p, 0.35) * 0.6 }}
          />
        );
      })}
      {active && (
        <polygon
          points={polygon(p)}
          fill={ACCENT}
          fillOpacity="0.16"
          stroke={ACCENT}
          strokeWidth="2"
          style={{ opacity: p }}
        />
      )}
      {axes.map((ax, i) => {
        const pt = pointAt(i, R * 1.16 * Math.max(p, 0.15));
        return (
          <text
            key={ax.subject}
            x={pt.x}
            y={pt.y + 4}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.55)"
            style={{ opacity: Math.max(p, 0.45) }}
          >
            {ax.subject}
          </text>
        );
      })}
    </svg>
  );
}
