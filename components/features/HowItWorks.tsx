"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Flag, Gauge, Target } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

function useTilt<T extends HTMLElement = HTMLDivElement>(intensity = 6, shift = 6) {
  const ref = useRef<T>(null);
  const onMove = (event: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width - 0.5;
    const py = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (py * intensity).toFixed(2) + "deg");
    el.style.setProperty("--ry", (-px * intensity).toFixed(2) + "deg");
    el.style.setProperty("--tx", (px * shift).toFixed(1) + "px");
    el.style.setProperty("--ty", (py * shift).toFixed(1) + "px");
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((key) => el.style.setProperty(key, "0px"));
  };
  return { ref, onMove, onLeave };
}

function WorkflowItem({
  n,
  title,
  text,
  icon,
}: {
  n: string;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  const { ref, onMove, onLeave } = useTilt<HTMLDivElement>(6, 6);
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">
          Шаг {n}
        </span>
      </div>
      <h4 className="text-base font-medium text-white">{title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{text}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-white/45">Процесс</span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Как это работает
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <WorkflowItem
              n="01"
              icon={<Flag className="h-4 w-4" />}
              title="Быстрый ввод профиля"
              text="GPA, SAT/IELTS, достижения и цели - 5-7 полей, 2 минуты."
            />
            <WorkflowItem
              n="02"
              icon={<Gauge className="h-4 w-4" />}
              title="AI-анализ PTS и Gap"
              text="Достижения переводятся в баллы, находятся разрывы до Full-Ride."
            />
            <WorkflowItem
              n="03"
              icon={<Target className="h-4 w-4" />}
              title="Персональный Roadmap"
              text="Шаги с дедлайнами CSS Profile и эквивалентом в деньгах."
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
