"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useIsClient } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { isOnboardingComplete } from "@/lib/onboarding";
import { buildDiagnosePayload } from "@/lib/diagnose/payload";
import { isDiagnoseResult, type DiagnoseResult } from "@/lib/diagnose/types";
import AnketaWidget from "@/components/dashboard/AnketaWidget";
import DiagnoseResults from "@/components/diagnose/DiagnoseResults";
import RadarChart from "@/components/diagnose/RadarChart";
import { TiltPanel } from "@/components/diagnose/TiltPanel";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function useCursorPhysics() {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    const onMove = (event: globalThis.PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      target.current.x = (event.clientX - rect.left) / rect.width - 0.5;
      target.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    };

    const tick = () => {
      if (!alive) return;
      const c = current.current;
      const t = target.current;
      c.x = lerp(c.x, t.x, 0.12);
      c.y = lerp(c.y, t.y, 0.12);

      const px = (c.x + 0.5) * 100;
      const py = (c.y + 0.5) * 100;

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(720px circle at ${px.toFixed(2)}% ${py.toFixed(2)}%, rgba(122,162,227,0.13), transparent 62%)`;
      }
      if (ambientRef.current) {
        ambientRef.current.style.background = `radial-gradient(980px circle at ${px.toFixed(2)}% ${py.toFixed(2)}%, rgba(255,255,255,0.045), transparent 56%)`;
      }
      if (contentRef.current) {
        const rx = (c.y * 1.2).toFixed(3);
        const ry = (c.x * 1.2).toFixed(3);
        const tx = (c.x * 8).toFixed(2);
        const ty = (c.y * 6).toFixed(2);
        contentRef.current.style.transform = `perspective(1200px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    rafId.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      window.removeEventListener("pointermove", onMove);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { rootRef, glowRef, ambientRef, contentRef };
}

function IdleSkeleton({
  running,
  onAnalyze,
  canAnalyze,
}: {
  running: boolean;
  onAnalyze: () => void;
  canAnalyze: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TiltPanel className="flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">Диагностика</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
            Запустите AI-анализ профиля
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Gemini посчитает PTS, соберёт Radar Chart, разбивку баллов и подбор вузов. Запрос
            уходит только после нажатия «Анализ».
          </p>
          {!canAnalyze && (
            <p className="mt-3 text-sm text-amber-300/80">
              Сначала заполните анкету: имя, GPA, хотя бы одно достижение и предпочтения.
            </p>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-3 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-3 w-[80%] animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-3 w-[60%] animate-pulse rounded-full bg-white/[0.06]" />
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={running || !canAnalyze}
          className="mt-8 group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white px-6 py-3.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {running ? "AI анализирует профиль..." : "Анализ"}
        </button>
      </TiltPanel>

      <TiltPanel className="flex flex-col items-center justify-center">
        <RadarChart active={false} />
        <p className="mt-4 max-w-xs text-center text-sm text-white/45">
          {running
            ? "Считаем взвешенные оси и сравниваем с порогом Full-Ride..."
            : "Radar и PTS появятся после анализа"}
        </p>
      </TiltPanel>
    </div>
  );
}

export default function DashboardPage() {
  const isClient = useIsClient();
  const store = useOnboardingStore();
  const { rootRef, glowRef, ambientRef, contentRef } = useCursorPhysics();

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!isClient) return null;

  const canAnalyze = isOnboardingComplete(store);

  const runAnalyze = async () => {
    if (running || !canAnalyze) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setRunKey((n) => n + 1);

    try {
      const payload = buildDiagnosePayload(store);
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok && !isDiagnoseResult(data)) {
        throw new Error(typeof data.error === "string" ? data.error : "Ошибка анализа");
      }
      if (!isDiagnoseResult(data)) {
        throw new Error("Некорректный ответ анализа");
      }
      const { _meta: _ignored, ...result } = data as DiagnoseResult & { _meta?: unknown };
      setResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить анализ");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div ref={rootRef} className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(720px circle at 50% 30%, rgba(122,162,227,0.13), transparent 62%)",
        }}
      />
      <div
        ref={ambientRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(980px circle at 50% 30%, rgba(255,255,255,0.045), transparent 56%)",
        }}
      />

      <header className="sticky inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-sm font-semibold text-accent">
              P
            </span>
            <span className="text-lg font-semibold tracking-tight">Portfolino</span>
          </Link>
          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={runAnalyze}
                disabled={running || !canAnalyze}
                className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/95 disabled:opacity-60 sm:inline-flex"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Анализ
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> На главную
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12">
        <div
          ref={contentRef}
          className="will-change-transform"
          style={{
            transform: "perspective(1200px) translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg)",
          }}
        >
          <motion.div
            className="flex max-w-2xl flex-col items-start text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Dashboard
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              {store.name.trim()
                ? `Здравствуйте, ${store.name.trim()}`
                : "Заполните анкету, чтобы построить маршрут"}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-white/55">
              Анкета хранится локально. AI-диагностика запускается только по кнопке «Анализ».
            </p>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnketaWidget />
          </motion.div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key={`result-${runKey}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45 }}
                >
                  <DiagnoseResults result={result} runKey={runKey} />
                  <div className="mt-8 flex justify-center sm:hidden">
                    <button
                      type="button"
                      onClick={runAnalyze}
                      disabled={running || !canAnalyze}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-900 disabled:opacity-60"
                    >
                      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Повторить анализ
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45 }}
                >
                  <IdleSkeleton running={running} onAnalyze={runAnalyze} canAnalyze={canAnalyze} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <OnboardingForm />
    </div>
  );
}
