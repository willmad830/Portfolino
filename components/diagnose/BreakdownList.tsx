import type { BreakdownItem } from "@/lib/diagnose/types";

export default function BreakdownList({
  items,
  total,
}: {
  items: BreakdownItem[];
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-white/40">
        Разбивка по достижениям
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-white/65">{row.label}</span>
            <span className="font-medium tabular-nums text-accent">+{row.pts} PTS</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-sm">
          <span className="text-white/80">Итого</span>
          <span className="font-semibold tabular-nums text-white">{total} PTS</span>
        </li>
      </ul>
    </div>
  );
}
