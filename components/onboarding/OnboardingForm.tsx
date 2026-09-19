"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Plus, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { useUiStore } from "@/lib/store/useUiStore";
import { MAJORS, COUNTRIES, GRADES, BUDGETS } from "@/lib/onboarding";

const STEP_LABELS = ["Приветствие", "Академика", "Достижения", "Предпочтения", "Статус"];

function useTilt(intensity = 3, shift = 4) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    ["--rx", "--ry", "--tx", "--ty"].forEach((k) => el.style.setProperty(k, "0px"));
  };
  return { ref, onMove, onLeave };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-2 flex items-baseline gap-2 text-sm text-white/65">
        {label}
        {hint && <span className="text-xs text-white/30">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-accent/60",
        className,
      )}
    />
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
        on ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.03] text-white/50",
      )}
    >
      <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded", on ? "bg-emerald-400 text-black" : "border border-white/25")}>
        {on && <Check className="h-2.5 w-2.5" />}
      </span>
      {on ? "Сдал" : "Не сдавал"}
    </button>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition-colors",
        active ? "border-accent/60 bg-accent/15 text-white" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export default function OnboardingForm() {
  const isClient = useIsClient();
const open = useUiStore((s) => s.formOpen);
  const closeForm = useUiStore((s) => s.closeForm);
  const store = useOnboardingStore();
  const router = useRouter();
  const { ref: cardRef, onMove, onLeave } = useTilt(3, 4);

  const [step, setStep] = useState(0);
  const [gpaScale, setGpaScale] = useState(4);

  

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeForm]);

  if (!isClient) return null;

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const isLast = step === STEP_LABELS.length - 1;
  const progress = Math.round((step / (STEP_LABELS.length - 1)) * 100);
  const hasHonor = store.honors.some((h) => h.trim());
  const hasPref = store.preferences.major.trim().length > 0 || store.preferences.countries.length > 0;
  const canContinue = step === 2 ? hasHonor : step === 3 ? hasPref : true;

  const handleSat = (v: boolean) => store.setAcademic({ satTaken: v, sat: v ? store.academic.sat : "0" });
  const handleIelts = (v: boolean) => store.setAcademic({ ieltsTaken: v, ielts: v ? store.academic.ielts : "0" });
  
const goToDashboard = () => {
    closeForm();
    window.setTimeout(() => {
      router.push("/dashboard");
    }, 340);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          onAnimationStart={() => setStep(0)}
          onClick={closeForm}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div
              ref={cardRef}
              onPointerMove={onMove}
              onPointerLeave={onLeave}
              className="tilt overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  <GraduationCap className="h-4 w-4 text-accent" /> Анкета Portfolino
                </span>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-white/40">
                    {STEP_LABELS[step]} · {progress}%
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="px-6 py-6"
                >
                  {step === 0 && (
                    <div className="text-left">
                      <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                        <Sparkles className="h-3.5 w-3.5" /> 01 · Приветствие
                      </span>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-white">Как к вам обращаться?</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">Подстроим Roadmap под ваш профиль. Начнём с имени — алгоритм будет обращаться к вам по нему.</p>
                      <div className="mt-6">
                        <Field label="Имя">
                          <Input value={store.name} onChange={(e) => store.setName(e.target.value)} placeholder="Мадлен" autoFocus />
                        </Field>
                      </div>
                    </div>
                  )}                  {step === 1 && (
                    <div className="space-y-5 text-left">
                      <div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                          <GraduationCap className="h-3.5 w-3.5" /> 02 · Академика
                        </span>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">Укажите результаты тестов. Если чего-то нет — отметьте «Не сдавал».</p>
                      </div>

                      <Field label="GPA" hint={`шкала до ${gpaScale}.0`}>
                        <div className="flex items-center gap-2">
                          <Input value={store.academic.gpa} onChange={(e) => store.setAcademic({ gpa: e.target.value })} inputMode="decimal" placeholder={gpaScale === 4 ? "3.95" : "4.6"} />
                          <div className="flex shrink-0 overflow-hidden rounded-lg border border-white/10">
                            {[4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setGpaScale(s)}
                                className={cn("px-3 py-2 text-xs transition-colors", gpaScale === s ? "bg-accent/20 text-accent" : "bg-white/[0.03] text-white/45")}
                              >
                                {s}.0
                              </button>
                            ))}
                          </div>
                        </div>
                      </Field>

                      <Field label="SAT / ACT">
                        <div className="space-y-2">
                          <Toggle on={store.academic.satTaken} onChange={handleSat} />
                          {store.academic.satTaken && (
                            <Input value={store.academic.sat} onChange={(e) => store.setAcademic({ sat: e.target.value })} inputMode="numeric" placeholder="1480" />
                          )}
                        </div>
                      </Field>

                      <Field label="IELTS / TOEFL / Duolingo">
                        <div className="space-y-2">
                          <Toggle on={store.academic.ieltsTaken} onChange={handleIelts} />
                          {store.academic.ieltsTaken && (
                            <Input value={store.academic.ielts} onChange={(e) => store.setAcademic({ ielts: e.target.value })} inputMode="decimal" placeholder="8.0" />
                          )}
                        </div>
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                          <Sparkles className="h-3.5 w-3.5" /> 03 · Достижения
                        </span>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">Награды, олимпиады, хакатоны, стартапы, волонтёрство — любые сигналы, которые усилят ваш профиль.</p>
                      </div>

                      {store.honors.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input value={h} onChange={(e) => store.updateHonor(i, e.target.value)} placeholder="Напр. Победа на олимпиаде по математике" />
                          <button
                            type="button"
                            onClick={() => store.removeHonor(i)}
                            disabled={store.honors.length === 1}
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                              store.honors.length === 1 ? "border-white/10 text-white/20" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={store.addHonor}
                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/15 px-4 py-2 text-sm text-white/60 transition-colors hover:border-accent/50 hover:text-white"
                      >
                        <Plus className="h-4 w-4" /> Добавить достижение
                      </button>
                      {!hasHonor && <p className="text-xs text-white/35">Добавьте хотя бы одно достижение, чтобы продолжить.</p>}
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-6 text-left">
                      <div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                          <GraduationCap className="h-3.5 w-3.5" /> 04 · Предпочтения
                        </span>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">Выберите направление, страны и формат финансирования.</p>
                      </div>

                      <Field label="Направление (Major)">
                        <Input value={store.preferences.major} onChange={(e) => store.setMajor(e.target.value)} placeholder="Computer Science" />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {MAJORS.map((m) => (
                            <Chip key={m} active={store.preferences.major === m} onClick={() => store.setMajor(store.preferences.major === m ? "" : m)}>
                              {m}
                            </Chip>
                          ))}
                        </div>
                      </Field>

                      <Field label="Приоритетные страны">
                        <div className="flex flex-wrap gap-2">
                          {COUNTRIES.map((c) => (
                            <Chip key={c} active={store.preferences.countries.includes(c)} onClick={() => store.toggleCountry(c)}>
                              {c}
                            </Chip>
                          ))}
                        </div>
                      </Field>

                      <Field label="Бюджет и финансирование">
                        <div className="grid gap-2">
                          {BUDGETS.map((b) => (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => store.setBudget(b.value)}
                              className={cn(
                                "rounded-xl border px-4 py-3 text-left transition-colors",
                                store.preferences.budget === b.value ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.03] hover:border-white/20",
                              )}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 text-sm font-medium text-white">
                                  <Check className={cn("h-4 w-4", store.preferences.budget === b.value ? "text-accent" : "text-white/20")} />
                                  {b.label}
                                </span>
                                {store.preferences.budget === b.value && <span className="text-[11px] text-accent/80">выбран</span>}
                              </span>
                              <span className="mt-1 block pl-6 text-xs text-white/45">{b.hint}</span>
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-5 text-left">
                      <div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
                          <Sparkles className="h-3.5 w-3.5" /> 05 · Статус
                        </span>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-white">Ваш текущий статус</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/55">Это поможет выстроить Roadmap с реалистичными сроками до подачи.</p>
                      </div>
                      <Field label="Класс / Курс">
                        <div className="flex flex-wrap gap-2">
                          {GRADES.map((g) => (
                            <Chip key={g} active={store.context.grade === g} onClick={() => store.setGrade(g)}>
                              {g}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white/55 transition-colors hover:text-white",
                    step === 0 && "pointer-events-none opacity-25",
                  )}
                >
                  <ArrowLeft className="h-4 w-4" /> Назад
                </button>
                {isLast ? (
<button
                    type="button"
                    onClick={goToDashboard}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/95"
                  >
                    Перейти к дашборду <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canContinue}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white/95",
                      !canContinue && "pointer-events-none opacity-40",
                    )}
                  >
                    Далее <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}