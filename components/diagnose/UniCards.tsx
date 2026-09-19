import { Check, Gauge, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UniversityFit, UniversityMissed } from "@/lib/diagnose/types";

export function UniFitCard({ uni }: { uni: UniversityFit }) {
  return (
    <li className="tilt flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{uni.name}</p>
          <p className="flex items-center gap-1 text-xs text-white/45">
            <Globe className="h-3 w-3" /> {uni.country}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-white">нужно {uni.req_pts} PTS</p>
        <p className="text-[11px] tabular-nums text-emerald-300/80">{uni.badge}</p>
      </div>
    </li>
  );
}

export function UniMissedCard({ uni }: { uni: UniversityMissed }) {
  return (
    <li className="tilt flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-300">
          <Gauge className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{uni.name}</p>
          <p className="flex items-center gap-1 text-xs text-white/45">
            <Globe className="h-3 w-3" /> {uni.country}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-white">нужно {uni.req_pts} PTS</p>
        <p className={cn("text-[11px] tabular-nums text-amber-300/80")}>
          не хватает {uni.pts_needed} PTS
        </p>
      </div>
    </li>
  );
}
