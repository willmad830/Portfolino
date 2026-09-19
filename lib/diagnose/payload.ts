import type { OnboardingStore } from "@/lib/store/useOnboardingStore";
import type { DiagnosePayload } from "@/lib/diagnose/types";

function num(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function buildDiagnosePayload(
  store: Pick<OnboardingStore, "name" | "academic" | "honors" | "preferences" | "context">,
): DiagnosePayload {
  return {
    name: store.name.trim(),
    academic: {
      gpa: num(store.academic.gpa),
      sat: store.academic.satTaken ? num(store.academic.sat) : 0,
      ielts: store.academic.ieltsTaken ? num(store.academic.ielts) : 0,
    },
    honors: store.honors.map((h) => h.trim()).filter(Boolean),
    preferences: {
      major: store.preferences.major.trim(),
      countries: [...store.preferences.countries],
      budget: store.preferences.budget,
    },
    context: {
      grade: store.context.grade,
    },
  };
}
