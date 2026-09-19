"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ChevronDown, Pencil, Plus, Minus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UniversityFit, UniversityMissed } from "@/lib/diagnose/types";
import type { TargetGoal } from "@/lib/roadmap/payload";

type TargetUniversitySelectorProps = {
  universitiesMissed: UniversityMissed[];
  universitiesFit: UniversityFit[];
  totalPts: number;
  goal: TargetGoal | null;
  onChange: (goal: TargetGoal) => void;
};

const CUSTOM_VALUE = "__custom__";

export default function TargetUniversitySelector({
  universitiesMissed,
  universitiesFit,
  totalPts,
  goal,
  onChange,
}: TargetUniversitySelectorProps) {
  const selectId = useId();
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [gapInput, setGapInput] = useState<number | "">("");

  const missedMap = useMemo(
    () => new Map(universitiesMissed.map((u) => [u.name, u.pts_needed])),
    [universitiesMissed],
  );

  const isCustom =
    !!goal &&
    !missedMap.has(goal.target_university) &&
    !universitiesFit.some((u) => u.name === goal.target_university);

  const showCustomPanel = open || isCustom;

  const currentGap = goal?.pts_needed_gap ?? 0;
  const gapFromList = goal ? (missedMap.get(goal.target_university) ?? 0) : 0;
  const effectiveGap = isCustom ? currentGap : gapFromList;

  const selectValue = goal
    ? isCustom
      ? CUSTOM_VALUE
      : goal.target_university
    : "";

  const handleSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setCustomInput(goal?.target_university ?? "");
      setGapInput(goal?.pts_needed_gap ?? "");
      setOpen(true);
      const name = customInput.trim() || goal?.target_university || "";
      if (name) {
        onChange({
          target_university: name,
          pts_needed_gap: Math.max(0, gapInput === "" ? 0 : Math.round(gapInput)),
        });
      }
      return;
    }
    setOpen(false);
    const gap = missedMap.get(value) ?? 0;
    onChange({
      target_university: value,
      pts_needed_gap: Math.max(0, gap),
    });
  };

  const handleCustomText = (text: string) => {
    setCustomInput(text);
    if (text.trim()) {
      const gap = gapInput === "" ? 0 : gapInput;
      onChange({ target_university: text.trim(), pts_needed_gap: Math.max(0, Math.round(gap)) });
    }
  };

  const handleCustomGap = (gap: number) => {
    setGapInput(gap);
    const name = customInput.trim() || goal?.target_university || "";
    if (name) {
      onChange({ target_university: name, pts_needed_gap: Math.max(0, Math.round(gap)) });
    }
  };

  const hasMissed = universitiesMissed.length > 0;
  const hasFit = universitiesFit.length > 0;
  const selectedLabel = goal
    ? isCustom
      ? `${goal.target_university} (свой вуз)`
      : goal.target_university
    : "Выберите целевой вуз";

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-4 top-1/2 z-20 -translate-y-1/2"
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <Target className="h-3 w-3" />
              <span className="max-w-[260px] truncate">{selectedLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-white/40" />
          </div>
        </div>

        <select
          id={selectId}
          value={selectValue}
          onChange={(e) => handleSelect(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="w-full cursor-pointer appearance-none rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-transparent outline-none transition-colors focus:border-accent/60"
        >
          <option value="" disabled />
          {hasMissed && (
            <optgroup label="Не хватает баллов — цепляемся выше">
              {universitiesMissed.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name} — не хватает {u.pts_needed} PTS (нужно {u.req_pts})
                </option>
              ))}
            </optgroup>
          )}
          {hasFit && (
            <optgroup label="Проходите по баллам — как подушка безопасности">
              {universitiesFit.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name} ({u.country})
                </option>
              ))}
            </optgroup>
          )}
          <option value={CUSTOM_VALUE}>Ввести свой вуз</option>
        </select>
      </div>

      {/* Custom university input + gap stepper */}
      <AnimatePresence initial={false}>
        {showCustomPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="relative">
                <Pencil className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => handleCustomText(e.target.value)}
                  placeholder="Например: ETH Zurich, Tokyo University..."
                  className="w-full rounded-xl border border-white/15 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent/60"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={gapInput === "" ? "" : gapInput}
                    onChange={(e) => handleCustomGap(e.target.value === "" ? 0 : Number(e.target.value))}
                    placeholder="разрыв в PTS"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] py-2.5 px-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-accent/60"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => handleCustomGap(Math.max(0, effectiveGap - 10))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Уменьшить разрыв на 10"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCustomGap(effectiveGap + 10)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Увеличить разрыв на 10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live target summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="text-white/70">Текущие баллы</span>
            <span className="font-semibold tabular-nums text-white">{totalPts} PTS</span>
          </span>
          {goal && (
            <span>
              → нужно{" "}
              <span className="font-semibold tabular-nums text-white">
                {totalPts + effectiveGap} PTS
              </span>
            </span>
          )}
        </div>

        {goal && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
              effectiveGap <= 0
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300",
            )}
          >
            {effectiveGap <= 0 ? (
              <>
                <Check className="h-3.5 w-3.5" /> Вы проходите в {goal.target_university}
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                Не хватает {effectiveGap} PTS до {goal.target_university}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}