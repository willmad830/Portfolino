"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  BookOpenCheck,
  Database,
  ShieldCheck,
  Landmark,
  GraduationCap,
  Globe2,
  BadgeDollarSign,
} from "lucide-react";

function TiltStat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width - 0.5;
    const py = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (py * 4).toFixed(2) + "deg");
    el.style.setProperty("--ry", (-px * 4).toFixed(2) + "deg");
    el.style.setProperty("--tx", (px * 5).toFixed(1) + "px");
    el.style.setProperty("--ty", (py * 5).toFixed(1) + "px");
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((k) => el.style.setProperty(k, "0px"));
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-white">{value}</p>
        <p className="text-sm text-white/55">{label}</p>
      </div>
    </div>
  );
}

const sources = [
  { icon: <Database className="h-4 w-4" />, title: "Common Data Set", text: "Официальные данные приёмной статистики вузов." },
  { icon: <Landmark className="h-4 w-4" />, title: "База Full-Ride стипендий", text: "Официальные 100% need-based программы." },
  { icon: <BookOpenCheck className="h-4 w-4" />, title: "CDS прошлых лет", text: "Исторические данные для корректного Gap-анализа." },
];

function SourceCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width - 0.5;
    const py = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (py * 4).toFixed(2) + "deg");
    el.style.setProperty("--ry", (-px * 4).toFixed(2) + "deg");
    el.style.setProperty("--tx", (px * 4).toFixed(1) + "px");
    el.style.setProperty("--ty", (py * 4).toFixed(1) + "px");
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((k) => el.style.setProperty(k, "0px"));
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
        {icon}
      </span>
      <h4 className="text-sm font-medium text-white">{title}</h4>
      <p className="mt-1 text-sm text-white/55">{text}</p>
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/45">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Источники данных
            </span>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-white">
              Оценка опирается на реальные данные, а не на догадки
            </h3>
            <p className="mt-3 text-white/55">
              Каждый PTS-балл считается через официальные статистики и проверенные
              стипендиальные программы.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TiltStat value="500+" label="ВУЗов в базе" icon={<GraduationCap className="h-5 w-5" />} />
            <TiltStat value="40+" label="Стран" icon={<Globe2 className="h-5 w-5" />} />
            <TiltStat value="120+" label="Грантовых программ" icon={<BadgeDollarSign className="h-5 w-5" />} />
          </div>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {sources.map((src) => (
            <SourceCard key={src.title} {...src} />
          ))}
        </div>
      </div>
    </section>
  );
}