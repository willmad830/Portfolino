"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Flag,
  Loader2,
  Map,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagnosePayload, DiagnoseResult } from "@/lib/diagnose/types";
import { buildRoadmapPayload, type TargetGoal } from "@/lib/roadmap/payload";
import { weakestRadarAxes } from "@/lib/roadmap/sanitize";
import {
  isRoadmapResult,
  type RoadmapResult,
  type RoadmapTask,
  type RoadmapTaskCategory,
} from "@/lib/roadmap/types";
import { useDiagnoseStore } from "@/lib/store/useDiagnoseStore";
import TargetUniversitySelector from "@/components/roadmap/TargetUniversitySelector";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CATEGORY_META: Record<
  RoadmapTaskCategory,
  { label: string; icon: typeof BookOpen; className: string }
> = {
  academics: {
    label: "Учёба",
    icon: BookOpen,
    className: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  standardized_tests: {
    label: "Тесты",
    icon: FileCheck2,
    className: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  },
  extracurriculars: {
    label: "Внеучебное",
    icon: Trophy,
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  applications: {
    label: "Заявки",
    icon: FileText,
    className: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
};

function RoadmapTaskCard({ task, index }: { task: RoadmapTask; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (py * 4).toFixed(2) + "deg");
    el.style.setProperty("--ry", (-px * 4).toFixed(2) + "deg");
    el.style.setProperty("--tx", (px * 5).toFixed(1) + "px");
    el.style.setProperty("--ty", (py * 5).toFixed(1) + "px");
    setGlow({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      opacity: 1,
    });
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((k) => el.style.setProperty(k, "0px"));
    setGlow((g) => ({ ...g, opacity: 0 }));
  };

  const cat = CATEGORY_META[task.category] ?? CATEGORY_META.applications;
  const CatIcon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: Math.min(0.25, index * 0.08), ease: EASE }}
    >
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className="tilt group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/20"
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: glow.opacity,
            background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, rgba(122,162,227,0.14), transparent 70%)`,
          }}
        />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                cat.className,
              )}
            >
              <CatIcon className="h-3 w-3" />
              {cat.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/60">
              <Calendar className="h-3 w-3" />
              {task.deadline || "срок уточняется"}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-tight text-white sm:text-base">
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{task.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent">
              <TrendingUp className="h-3.5 w-3.5" />
              +{task.pts_gain} PTS
            </span>
            {task.skill_unlocked && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-white/65">
                <Zap className="h-3 w-3 text-amber-300" />
                {task.skill_unlocked}
              </span>
            )}
          </div>

          {task.action_link_text && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white/45 transition-colors group-hover:text-accent">
              {task.action_link_text}
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
              <div className="h-8 w-28 animate-pulse rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
        <div className="mt-5 h-4 w-3/4 animate-pulse rounded-lg bg-white/[0.06]" />
      </div>
      {[1, 2, 3].map((phase) => (
        <div key={phase} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-52 animate-pulse rounded-lg bg-white/10" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RoadmapSection({
  result,
  studentPayload,
}: {
  result: DiagnoseResult;
  studentPayload: DiagnosePayload;
}) {
  const store = useDiagnoseStore();
  const goal = store.targetGoal;
  const roadmap = store.roadmapResult;
  const roadmapGoalKey = store.roadmapGoalKey;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  const totalPts = result.calculated_scores.total_pts;
  const weakest = weakestRadarAxes(result.radar_scores, 3);

  const currentGoalKey = goal ? `${goal.target_university}|${Math.max(0, goal.pts_needed_gap)}` : null;
  const isStale = !currentGoalKey || !roadmapGoalKey || roadmapGoalKey !== currentGoalKey;

  useEffect(() => {
    if (goal) return;
    if (result.universities_missed.length > 0) {
      const topGap = [...result.universities_missed].sort((a, b) => b.pts_needed - a.pts_needed)[0];
      store.setTargetGoal({ target_university: topGap.name, pts_needed_gap: topGap.pts_needed });
    } else if (result.universities_fit.length > 0) {
      store.setTargetGoal({ target_university: result.universities_fit[0].name, pts_needed_gap: 0 });
    }
  }, [goal, result, store]);

  const handleGoalChange = (nextGoal: TargetGoal) => {
    if (!nextGoal.target_university.trim()) return;
    store.setTargetGoal(nextGoal);
  };

  const generateRoadmap = async () => {
    if (loading || !goal || !goal.target_university.trim()) {
      if (!goal?.target_university.trim()) setError("Сначала выберите целевой вуз");
      return;
    }
    setLoading(true);
    setError(null);
    setDegraded(false);

    const payload = buildRoadmapPayload(result, studentPayload, goal);
    const goalKey = `${goal.target_university}|${Math.max(0, goal.pts_needed_gap)}`;

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok && !isRoadmapResult(data)) {
        throw new Error(typeof data.error === "string" ? data.error : "Ошибка генерации Roadmap");
      }
      if (!isRoadmapResult(data)) {
        throw new Error("Некорректный ответ Roadmap");
      }
      const meta = (data as RoadmapResult & { _meta?: { degraded?: boolean } })._meta;
      setDegraded(Boolean(meta?.degraded));
      const { _meta: _ignored, ...clean } = data as RoadmapResult & { _meta?: unknown };
      store.setRoadmapResult(clean, goalKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сгенерировать Roadmap");
    } finally {
      setLoading(false);
    }
  };

  const projected = roadmap?.roadmap_summary.projected_pts ?? totalPts;
  const gain = roadmap?.roadmap_summary.total_potential_gain ?? 0;

  return (
    <section className="mt-16 space-y-6" id="roadmap">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            <Map className="h-3.5 w-3.5" /> Roadmap Generator
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
            Персональный план до целевого вуза
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Выберите вуз-цель из подборки или введите собственный. AI спроектирует пошаговый план,
            бьющий ровно в слабые оси Radar и закрывающий разрыв в PTS.
          </p>
        </div>
        {roadmap && !isStale && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Roadmap для {roadmapGoalKey?.split("|")[0]}
          </span>
        )}
      </motion.div>

      {/* Target selector panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
        className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-5 backdrop-blur-xl sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <Target className="h-4 w-4 text-accent" />
            Целевой университет
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {weakest.map((axis) => (
              <span
                key={axis.subject}
                className="inline-flex items-center gap-1 rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-rose-300"
              >
                <AlertTriangle className="h-3 w-3" />
                {axis.subject} · {axis.score}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <TargetUniversitySelector
            universitiesMissed={result.universities_missed}
            universitiesFit={result.universities_fit}
            totalPts={totalPts}
            goal={goal}
            onChange={handleGoalChange}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
          <p className="max-w-md text-xs leading-relaxed text-white/40">
            План формируется на основе <span className="text-white/65">{totalPts} PTS</span>, слабых
            осей Radar и разрыва до цели. В среднем roadmap закрывает разрыв за 3 фазы.
          </p>
          <button
            type="button"
            onClick={generateRoadmap}
            disabled={loading || !goal?.target_university.trim()}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/20 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-[0_0_24px_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.02] hover:bg-white/95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span>AI проектирует план...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-accent transition-transform duration-300 group-hover:rotate-12" />
                <span>{roadmap && !isStale ? "Обновить Roadmap" : "Сгенерировать Roadmap"}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="roadmap-skeleton"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <RoadmapSkeleton />
          </motion.div>
        )}

        {!loading && roadmap && (
          <motion.div
            key="roadmap-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="space-y-8"
          >
            {degraded && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                Модель временно недоступна — показан локальный план по слабым осям профиля.
              </div>
            )}

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
              className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-accent/[0.12] via-white/[0.03] to-transparent p-6 backdrop-blur-2xl sm:p-7"
            >
              <div className="relative z-10 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">
                      Сейчас
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-white">{totalPts}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-accent" />
                  <div className="text-center">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-300/70">
                      Прогноз
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-300">
                      {projected}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Потенциальный прирост: +{gain} PTS
                  </p>
                  <p className="text-sm leading-relaxed text-white/70">
                    {roadmap.roadmap_summary.primary_focus}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Phases */}
            <div className="relative space-y-8 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-gradient-to-b before:from-accent/40 before:via-white/10 before:to-transparent">
              {roadmap.phases.map((phase, phaseIndex) => (
                <motion.div
                  key={phase.phase_name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 + phaseIndex * 0.12, ease: EASE }}
                  className="relative pl-10"
                >
                  <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-background text-[11px] font-bold text-accent shadow-[0_0_16px_rgba(122,162,227,0.3)]">
                    {phaseIndex + 1}
                  </span>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      {phase.phase_name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
                      {phase.period}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {phase.tasks.map((task, taskIndex) => (
                      <RoadmapTaskCard key={task.id} task={task} index={taskIndex} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {isStale && (
              <p className="flex items-center gap-2 text-xs text-white/40">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                Вы сменили цель — сгенерируйте план заново, чтобы он соответствовал новому вузу.
              </p>
            )}
          </motion.div>
        )}

        {!loading && !roadmap && (
          <motion.div
            key="roadmap-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] p-10 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <Flag className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">Готовы спланировать поступление?</h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-white/50">
              Gemini составит пошаговый план с дедлайнами, категориями задач и приростом PTS до{" "}
              {goal?.target_university || "выбранного вуза"}.
            </p>
            <button
              type="button"
              onClick={generateRoadmap}
              disabled={loading || !goal?.target_university.trim()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-zinc-900 shadow-md transition-all hover:bg-white/90 active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Сгенерировать Roadmap
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}