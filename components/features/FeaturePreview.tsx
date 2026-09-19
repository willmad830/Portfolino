"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ShieldCheck,
  Wand2,
  CalendarDays,
  GraduationCap,
  Trophy,
  BookOpen,
  Loader2,
  Check,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "@/components/ui/Reveal";
import BreakdownList from "@/components/diagnose/BreakdownList";
import PtsCard from "@/components/diagnose/PtsCard";
import RadarChart from "@/components/diagnose/RadarChart";
import { TiltPanel } from "@/components/diagnose/TiltPanel";
import { UniFitCard, UniMissedCard } from "@/components/diagnose/UniCards";
import type { BreakdownItem, RadarScore, UniversityFit, UniversityMissed } from "@/lib/diagnose/types";

const ACADEMIC = [
  { icon: <GraduationCap className="h-4 w-4" />, label: "GPA", value: "3.95 / 4.0" },
  { icon: <BookOpen className="h-4 w-4" />, label: "SAT", value: "1480" },
  { icon: <Award className="h-4 w-4" />, label: "IELTS", value: "8.0" },
];

const HONORS = [
  "Победа на республиканской олимпиаде по математике",
  "Победа на MLH Hackathon (международный)",
];

const BREAKDOWN: BreakdownItem[] = [
  { label: "GPA 3.95", pts: 247 },
  { label: "SAT 1480", pts: 231 },
  { label: "IELTS 8.0", pts: 133 },
  { label: "Республиканская олимпиада по математике", pts: 110 },
  { label: "MLH Hackathon (международный)", pts: 130 },
];

const PTS_TOTAL = 851;

const RADAR: RadarScore[] = [
  { subject: "GPA", score: 98 },
  { subject: "Академика", score: 92 },
  { subject: "SAT / тесты", score: 92 },
  { subject: "Достижения", score: 88 },
  { subject: "Эссе, лидерство", score: 65 },
  { subject: "Финансовый fit", score: 85 },
];

const UNIS_FIT: UniversityFit[] = [
  { name: "University of Toronto", country: "Канада", req_pts: 740, badge: "подходит для Full-Ride" },
  { name: "University of British Columbia", country: "Канада", req_pts: 700, badge: "подходит для Full-Ride" },
  { name: "Technical University of Munich", country: "Германия", req_pts: 760, badge: "подходит для Full-Ride" },
  { name: "Arizona State University", country: "США", req_pts: 690, badge: "подходит для Full-Ride" },
];

const UNIS_GAP: UniversityMissed[] = [
  { name: "MIT", country: "США", req_pts: 960, pts_needed: 109 },
  { name: "Stanford", country: "США", req_pts: 940, pts_needed: 89 },
  { name: "ETH Zurich", country: "Швейцария", req_pts: 920, pts_needed: 69 },
];

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-1 py-3 last:border-0">
      <div className="flex items-center gap-2.5 text-white/65">
        <span className="text-white/40">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function RoadmapItem({
  icon,
  title,
  date,
  pts,
  money,
  done,
}: {
  icon: ReactNode;
  title: string;
  date: string;
  pts: string;
  money: string;
  done?: boolean;
}) {
  return (
    <li className="tilt flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          done
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-accent/40 bg-accent/10 text-accent",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">{title}</p>
          {done && <Check className="h-3.5 w-3.5 text-emerald-300" />}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-white/45">
          <CalendarDays className="h-3 w-3" /> {date}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-accent">{pts}</p>
        <p className="text-[11px] tabular-nums text-emerald-300/80">{money}</p>
      </div>
    </li>
  );
}

export default function FeaturePreview() {
  const [active, setActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  const run = () => {
    if (running) return;
    setActive(false);
    setRunning(true);
    setRunId((n) => n + 1);
    timer.current = window.setTimeout(() => {
      setRunning(false);
      setActive(true);
    }, 1100);
  };

  return (
    <section
      id="preview"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96"
        style={{
          background:
            "radial-gradient(720px circle at 50% 0%, rgba(122,162,227,0.1), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Оцените профиль как при подаче в вуз
            </h2>
            <p className="mt-3 text-pretty text-base text-white/55">
              Пример профиля, Radar-диаграмма и PTS-диагностика - так Portfolino
              считает ваш финансовый вес.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <TiltPanel>
              <h3 className="text-xs font-medium uppercase tracking-widest text-white/45">
                Академические показатели
              </h3>
              <div className="mt-2">
                {ACADEMIC.map((row) => (
                  <Row key={row.label} {...row} />
                ))}
              </div>

              <h3 className="mt-4 text-xs font-medium uppercase tracking-widest text-white/45">
                Honors
              </h3>
              <div className="mt-2">
                {HONORS.map((honor) => (
                  <div
                    key={honor}
                    className="flex items-center gap-2.5 border-b border-white/[0.06] px-1 py-3 last:border-0"
                  >
                    <Award className="h-4 w-4 shrink-0 text-accent" />
                    <span className="text-sm text-white/80">{honor}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="mt-6 group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/15 bg-white px-6 py-3.5 text-sm font-medium text-zinc-900 transition-colors duration-300 hover:bg-white/95 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {running ? "AI анализирует профиль..." : "Запустить AI-диагностику"}
              </button>

              {active && (
                <div className="mt-5">
                  <BreakdownList items={BREAKDOWN} total={PTS_TOTAL} />
                </div>
              )}
            </TiltPanel>

            <TiltPanel className="flex flex-col items-center justify-center">
              <RadarChart key={runId} scores={RADAR} active={active} />
              <div className="mt-4 min-h-[90px]">
                {active ? (
                  <PtsCard total={PTS_TOTAL} active />
                ) : (
                  <p className="max-w-xs text-center text-sm text-white/45">
                    {running
                      ? "Считаем взвешенные оси и сравниваем с порогом Full-Ride..."
                      : "Нажмите «Запустить AI-диагностику», чтобы раскрыть диаграмму и PTS."}
                  </p>
                )}
              </div>
            </TiltPanel>
          </div>

          {active && (
            <div className="mt-12">
              <h3 className="text-center text-2xl font-semibold tracking-[-0.01em] text-white">
                Куда можно поступить с {PTS_TOTAL} PTS
              </h3>
              <div className="mt-7 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                    Подходят
                  </p>
                  <ul className="mt-3 space-y-3">
                    {UNIS_FIT.map((u) => (
                      <UniFitCard key={u.name} uni={u} />
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                    Не хватает PTS
                  </p>
                  <ul className="mt-3 space-y-3">
                    {UNIS_GAP.map((u) => (
                      <UniMissedCard key={u.name} uni={u} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Reveal>

        <Reveal className="mt-16">
          <div className="grid gap-6 lg:grid-cols-3">
            <TiltPanel className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-widest text-white/45">
                  Превью Roadmap
                </h3>
                <span className="text-xs text-white/40">сроки до подачи</span>
              </div>
              <ul className="mt-4 space-y-3">
                <RoadmapItem
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="CSS Profile на 1 вуз (need-based)"
                  date="до 1 ноября"
                  pts={`+до ${1000 - PTS_TOTAL} PTS`}
                  money="основа 100% покрытия"
                  done
                />
                <RoadmapItem
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Пересборка SAT 1480 - 1520"
                  date="октябрь, 2 недели"
                  pts="+40 PTS"
                  money="+$8 400/год"
                />
                <RoadmapItem
                  icon={<Trophy className="h-5 w-5" />}
                  title="Заявка на 2 регион. олимпиады"
                  date="ноябрь-декабрь"
                  pts="+35 PTS"
                  money="+$6 300/год"
                />
                <RoadmapItem
                  icon={<GraduationCap className="h-5 w-5" />}
                  title="Повысить IELTS 8.0 - 8.5"
                  date="январь"
                  pts="+15 PTS"
                  money="+$2 900/год"
                />
              </ul>
            </TiltPanel>

            <TiltPanel className="flex h-full flex-col">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-medium text-white">
                Почему подходит выбранный вариант
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Решающим стал need-based бюджет, который вуз закрывает через CSS
                Profile. Академический порог профиль закрывает с запасом.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  Сильные академические показатели и honors
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  ВУЗ закрывает need-based спрос через CSS Profile
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  Фокус на Merit вместо «угадывания» стипендии
                </li>
              </ul>
              <button
                type="button"
                className="group mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-accent"
              >
                Посмотреть полный анализ
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </TiltPanel>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
