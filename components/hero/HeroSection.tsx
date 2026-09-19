"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function useHeroPhysics() {
  const heroRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    const onMove = (event: globalThis.PointerEvent) => {
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      target.current.x = (event.clientX - rect.left) / rect.width - 0.5;
      target.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    };

    const tick = () => {
      if (!alive) return;
      const c = current.current;
      const t = target.current;
      const k = 0.14;
      c.x = lerp(c.x, t.x, k);
      c.y = lerp(c.y, t.y, k);

      const px = (c.x + 0.5) * 100;
      const py = (c.y + 0.5) * 100;

      const glow = glowRef.current;
      if (glow) {
        glow.style.background = `radial-gradient(760px circle at ${px.toFixed(2)}% ${py.toFixed(2)}%, rgba(122,162,227,0.14), transparent 62%)`;
      }
      const ambient = ambientRef.current;
      if (ambient) {
        ambient.style.background = `radial-gradient(1000px circle at ${px.toFixed(2)}% ${py.toFixed(2)}%, rgba(255,255,255,0.05), transparent 56%)`;
      }

      const text = textRef.current;
      if (text) {
        const rx = (c.y * 2.2).toFixed(3);
        const ry = (c.x * 2.2).toFixed(3);
        const tx = (c.x * 16).toFixed(2);
        const ty = (c.y * 12).toFixed(2);
        text.style.transform = `perspective(1200px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
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

  return { heroRef, glowRef, ambientRef, textRef };
}

type CtaButtonProps = {
  onClick: () => void;
  className?: string;
};

function CtaButton({ onClick, className }: CtaButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty("--mx", `${x.toFixed(1)}px`);
    el.style.setProperty("--my", `${y.toFixed(1)}px`);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      className={cn(
        "group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[0_0_34px_rgba(255,255,255,0.12)]",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(200px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22), transparent 62%)",
          mixBlendMode: "screen",
        }}
      />
      <span className="relative z-10 text-sm font-medium text-white">Создать маршрут</span>
      <ArrowRight
        className="relative z-10 h-4 w-4 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </button>
  );
}

type HeroSectionProps = {
  onStart?: () => void;
};

export default function HeroSection({ onStart }: HeroSectionProps) {
  const { heroRef, glowRef, ambientRef, textRef } = useHeroPhysics();

  const handleStart = () => {
    onStart?.();
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-background px-6 py-24"
    >
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(760px circle at 50% 40%, rgba(122,162,227,0.14), transparent 62%)",
        }}
      />
      <div
        ref={ambientRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1000px circle at 50% 40%, rgba(255,255,255,0.05), transparent 56%)",
        }}
      />

      <div className="hero-enter relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div
          ref={textRef}
          className="will-change-transform flex w-full flex-col items-center"
          style={{
            transform:
              "perspective(1200px) translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg)",
          }}
        >
          <h1 className="text-5xl font-semibold leading-none tracking-[-0.04em] text-white sm:text-7xl lg:text-[7rem]">
            Portfolino
          </h1>

          <p className="mt-6 max-w-3xl text-balance text-xl font-medium tracking-[-0.01em] text-white/80 sm:text-2xl">
            Конвертируйте портфолио в 100% Full-Ride грант.
          </p>

          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/55 sm:text-lg">
            Автоматический разбор достижений, Gap-анализ и&nbsp;пошаговый Roadmap
            с&nbsp;дедлайнами CSS Profile.
          </p>

          <div className="mt-10">
            <CtaButton onClick={handleStart} />
          </div>
        </div>
      </div>
    </section>
  );
}