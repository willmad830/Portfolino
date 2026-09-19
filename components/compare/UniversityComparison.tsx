"use client";

import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  Coins,
  Compass,
  GraduationCap,
  Info,
  Loader2,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UniversityFit, DiagnosePayload } from "@/lib/diagnose/types";
import type {
  CompareRequestPayload,
  CompareResult,
  SelectedUniversity,
} from "@/lib/compare/types";
import { useDiagnoseStore } from "@/lib/store/useDiagnoseStore";

interface UniversityComparisonProps {
  universitiesFit: UniversityFit[];
  studentPayload: DiagnosePayload;
  totalPts: number;
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top recommendation skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="h-6 w-36 animate-pulse rounded-full bg-white/10" />
          <div className="h-8 w-64 animate-pulse rounded-xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-5/6 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-white/10" />
          <div className="flex gap-2">
            <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-32 shrink-0 animate-pulse rounded bg-white/10" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-white/[0.04]" />
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UniversityComparison({
  universitiesFit,
  studentPayload,
  totalPts,
}: UniversityComparisonProps) {
  const store = useDiagnoseStore();
  const comparisonResult = store.comparisonResult;

  // Selected universities for comparison
  const [selectedUnis, setSelectedUnis] = useState<SelectedUniversity[]>(() => {
    return universitiesFit.slice(0, 4).map((u) => ({
      name: u.name,
      country: u.country,
    }));
  });

  // Update selection if universitiesFit updates and no selection exists
  useEffect(() => {
    if (selectedUnis.length === 0 && universitiesFit.length > 0) {
      setSelectedUnis(
        universitiesFit.slice(0, 4).map((u) => ({
          name: u.name,
          country: u.country,
        })),
      );
    }
  }, [universitiesFit, selectedUnis.length]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  // Mouse tilt / spotlight for top pick card
  const topCardRef = useRef<HTMLDivElement>(null);
  const [cardGlow, setCardGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = topCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCardGlow({ x, y, opacity: 1 });
  };

  const handleCardMouseLeave = () => {
    setCardGlow((g) => ({ ...g, opacity: 0 }));
  };

  const toggleUniSelection = (uni: UniversityFit) => {
    const exists = selectedUnis.some((u) => u.name === uni.name);
    if (exists) {
      if (selectedUnis.length <= 1) return; // Keep at least one
      setSelectedUnis(selectedUnis.filter((u) => u.name !== uni.name));
    } else {
      setSelectedUnis([...selectedUnis, { name: uni.name, country: uni.country }]);
    }
  };

  const runCompare = async () => {
    if (loading || selectedUnis.length === 0) return;
    setLoading(true);
    setError(null);

    const payload: CompareRequestPayload = {
      student_profile: {
        total_pts: totalPts,
        gpa: studentPayload.academic.gpa,
        sat: studentPayload.academic.sat,
        ielts: studentPayload.academic.ielts,
        major: studentPayload.preferences.major || "Computer Science",
        budget_preference: studentPayload.preferences.budget || "need_based",
        honors: studentPayload.honors,
      },
      selected_universities: selectedUnis,
    };

    const unisKey = selectedUnis.map((u) => u.name).sort().join("|");

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok && !data.top_recommendation) {
        throw new Error(typeof data.error === "string" ? data.error : "Ошибка сравнения");
      }

      const { _meta: _ignored, ...result } = data as CompareResult & { _meta?: unknown };
      store.setComparisonResult(result, unisKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сравнить университеты");
    } finally {
      setLoading(false);
    }
  };

  if (universitiesFit.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
            Сравнение доступных ВУЗов
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Детальное сопоставление университетов, куда вы проходите по баллам ({totalPts} PTS).
            Анализ финансирования, визовых опций (OPT / PGWP) и карьерного старта.
          </p>
        </div>

        {/* Action button */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={runCompare}
            disabled={loading || selectedUnis.length === 0}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/20 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_0_24px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-white/95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span>AI сопоставляет условия...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-accent transition-transform duration-300 group-hover:rotate-12" />
                <span>{comparisonResult ? "Обновить сравнение" : "Сравнить условия"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* University Selection Chips */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
          <span className="font-medium uppercase tracking-wider text-white/60">
            Вузы для анализа ({selectedUnis.length} из {universitiesFit.length}):
          </span>
          <span>Нажмите на вуз, чтобы включить/исключить из сравнения</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {universitiesFit.map((uni) => {
            const isSelected = selectedUnis.some((u) => u.name === uni.name);
            return (
              <button
                key={uni.name}
                type="button"
                onClick={() => toggleUniSelection(uni)}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  isSelected
                    ? "border-accent/50 bg-accent/15 text-white shadow-[0_0_12px_rgba(122,162,227,0.18)]"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[10px] transition-colors",
                    isSelected ? "bg-accent text-zinc-950 font-bold" : "border border-white/20",
                  )}
                >
                  {isSelected ? "✓" : "+"}
                </span>
                <span>{uni.name}</span>
                <span className="text-[10px] opacity-60">({uni.country})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <ComparisonSkeleton />
          </motion.div>
        )}

        {/* Render Result */}
        {!loading && comparisonResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* Top Recommendation (Apple Minimalist Bento Card) */}
            <div
              ref={topCardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="group relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-accent/40 sm:p-8"
            >
              {/* Radial Cursor Glow */}
              <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300"
                style={{
                  opacity: cardGlow.opacity,
                  background: `radial-gradient(480px circle at ${cardGlow.x}% ${cardGlow.y}%, rgba(122,162,227,0.18), transparent 70%)`,
                }}
              />

              <div className="relative z-10 flex flex-col items-start gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {(comparisonResult.top_recommendation.badge || "Лучший выбор")
                      .replace(/\s*\(Best ROI\)/gi, "")}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {comparisonResult.top_recommendation.university_name}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/80 font-normal">
                    {comparisonResult.top_recommendation.verdict}
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl">
              <div className="border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold tracking-tight text-white">
                    Сравнительная матрица условий
                  </h4>
                  <p className="text-xs text-white/45">
                    Интерактивная таблица: наведите на столбец или строку для подсветки
                  </p>
                </div>
                <span className="text-xs rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/50">
                  {comparisonResult.comparison_matrix.rows.length} критериев
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      {comparisonResult.comparison_matrix.columns.map((colName, colIdx) => (
                        <th
                          key={colIdx}
                          onMouseEnter={() => colIdx > 0 && setHoveredCol(colIdx)}
                          onMouseLeave={() => setHoveredCol(null)}
                          className={cn(
                            "px-5 py-4 text-xs uppercase tracking-wider font-semibold transition-colors duration-200",
                            colIdx === 0
                              ? "text-white/40 w-1/4 sticky left-0 bg-[#0b0b11] z-20"
                              : "text-white/90",
                            hoveredCol === colIdx && "bg-white/[0.06] text-accent",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {colIdx > 0 && <Building2 className="h-3.5 w-3.5 opacity-60" />}
                            <span>{colName}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-sm">
                    {comparisonResult.comparison_matrix.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="group transition-colors duration-200 hover:bg-white/[0.04]"
                      >
                        {/* Criterion column */}
                        <td className="px-5 py-4 font-medium text-white/85 text-xs sm:text-sm sticky left-0 bg-[#08080c] group-hover:bg-[#0f0f15] z-10 border-r border-white/[0.06]">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                            {row.criterion}
                          </span>
                        </td>

                        {/* Values for each university */}
                        {row.values.map((val, valIdx) => {
                          const colNum = valIdx + 1;
                          const isHighlighted = hoveredCol === colNum;
                          const isZeroCost = /0\s*€|бесплатн/i.test(val);
                          const isHighRoi = /максимальн|высок/i.test(val);

                          return (
                            <td
                              key={valIdx}
                              onMouseEnter={() => setHoveredCol(colNum)}
                              onMouseLeave={() => setHoveredCol(null)}
                              className={cn(
                                "px-5 py-4 text-xs sm:text-sm text-white/70 leading-relaxed transition-colors duration-200",
                                isHighlighted && "bg-white/[0.05] text-white",
                              )}
                            >
                              <div className="flex items-start gap-1.5">
                                {isZeroCost && (
                                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                    0 €
                                  </span>
                                )}
                                <span>{val}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Insights Cards */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">
                Ключевые инсайты по каждому ВУЗу
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparisonResult.detailed_insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-accent">
                          {idx + 1}
                        </span>
                        <h5 className="font-semibold text-white text-sm">
                          {insight.university_name}
                        </h5>
                      </div>

                      <ul className="mt-4 space-y-2.5">
                        {insight.pros.map((pro, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2 text-xs text-white/75 leading-relaxed">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {insight.financial_note && (
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
                          <Coins className="h-3 w-3" />
                          <span>Финансовая справка:</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                          {insight.financial_note}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty / Prompt to compare state */}
        {!loading && !comparisonResult && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] p-10 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">
              Готовы сравнить {selectedUnis.length} выбранных ВУЗов?
            </h3>
            <p className="mt-1 max-w-md text-xs text-white/50 leading-relaxed">
              Gemini построит матрицу финансовой выгоды, сопоставит среднюю стоимость жилья и определит
              оптимальный выбор с максимальным ROI под ваш профиль.
            </p>
            <button
              type="button"
              onClick={runCompare}
              disabled={loading || selectedUnis.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/90 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Сравнить условия
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
