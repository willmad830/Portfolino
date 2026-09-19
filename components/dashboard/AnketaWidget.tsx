"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  GraduationCap,
  ListTodo,
  PencilLine,
  Plus,
  RefreshCcw,
  Trash2,
  Trophy,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";
import { MAJORS, COUNTRIES, GRADES, BUDGETS } from "@/lib/onboarding";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-2 flex items-baseline gap-2 text-sm text-white/65">{label}</span>
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

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2.5 text-sm font-medium text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AnketaWidget() {
  const store = useOnboardingStore();
  const [open, setOpen] = useState(false);
  const [gpaScale, setGpaScale] = useState(4);

  const handleSat = (v: boolean) => store.setAcademic({ satTaken: v, sat: v ? store.academic.sat : "0" });
  const handleIelts = (v: boolean) => store.setAcademic({ ieltsTaken: v, ielts: v ? store.academic.ielts : "0" });

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/35 bg-accent/10 text-accent">
            <PencilLine className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Редактировать анкету</span>
            <span className="mt-0.5 block text-xs text-white/45">
              {open ? "Свернуть форму" : "Нажмите, чтобы изменить данные"}
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.28 }} className="inline-flex">
          <ChevronDown className="h-5 w-5 shrink-0 text-white/45" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="anketa"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-white/10 px-5 py-5 sm:px-6">
              <SectionCard title="Профиль" icon={<GraduationCap className="h-4 w-4" />}>
                <Field label="Как к вам обращаться?">
                  <Input value={store.name} onChange={(e) => store.setName(e.target.value)} placeholder="Мадлен" />
                </Field>
              </SectionCard>

              <SectionCard title="Академические показатели" icon={<ListTodo className="h-4 w-4" />}>
                <div className="space-y-4">
                  <Field label={`GPA (шкала до ${gpaScale}.0)`}>
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
              </SectionCard>

              <SectionCard title="Достижения и бэкграунд" icon={<Trophy className="h-4 w-4" />}>
                <div className="space-y-4">
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
                </div>
              </SectionCard>

              <SectionCard title="Образовательные цели" icon={<WalletCards className="h-4 w-4" />}>
                <div className="space-y-5">
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
              </SectionCard>

              <SectionCard title="Текущий статус" icon={<RefreshCcw className="h-4 w-4" />}>
                <Field label="Класс / Курс">
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                      <Chip key={g} active={store.context.grade === g} onClick={() => store.setGrade(g)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </SectionCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
