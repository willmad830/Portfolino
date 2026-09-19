import { Check, ShieldCheck } from "lucide-react";
import { TiltPanel } from "@/components/diagnose/TiltPanel";

export default function DiagnosticPanel({
  mainReason,
  bullets,
}: {
  mainReason: string;
  bullets: string[];
}) {
  return (
    <TiltPanel className="flex h-full flex-col">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h3 className="text-base font-medium text-white">Диагностика профиля</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{mainReason}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-white/60">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            {b}
          </li>
        ))}
      </ul>
    </TiltPanel>
  );
}
