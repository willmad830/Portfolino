import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Academic {
  gpa: string;
  sat: string;
  ielts: string;
  satTaken: boolean;
  ieltsTaken: boolean;
}

interface Preferences {
  major: string;
  countries: string[];
  budget: string;
}

interface ContextInfo {
  grade: string;
}

type OnboardingState = {
  name: string;
  academic: Academic;
  honors: string[];
  preferences: Preferences;
  context: ContextInfo;
};

type OnboardingActions = {
  setName: (value: string) => void;
  setAcademic: (patch: Partial<Academic>) => void;
  setMajor: (value: string) => void;
  toggleCountry: (value: string) => void;
  setBudget: (value: string) => void;
  setGrade: (value: string) => void;
  addHonor: () => void;
  updateHonor: (index: number, value: string) => void;
  removeHonor: (index: number) => void;
  reset: () => void;
};

export const EMPTY_ONBOARDING: OnboardingState = {
  name: "",
  academic: { gpa: "", sat: "", ielts: "", satTaken: true, ieltsTaken: true },
  honors: [""],
  preferences: { major: "", countries: [], budget: "" },
  context: { grade: "" },
};

export type OnboardingStore = OnboardingState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...EMPTY_ONBOARDING,
      setName: (value) => set({ name: value }),
      setAcademic: (patch) =>
        set((s) => ({ academic: { ...s.academic, ...patch } })),
      setMajor: (value) =>
        set((s) => ({ preferences: { ...s.preferences, major: value } })),
      toggleCountry: (value) =>
        set((s) => {
          const has = s.preferences.countries.includes(value);
          return {
            preferences: {
              ...s.preferences,
              countries: has
                ? s.preferences.countries.filter((c) => c !== value)
                : [...s.preferences.countries, value],
            },
          };
        }),
      setBudget: (value) =>
        set((s) => ({ preferences: { ...s.preferences, budget: value } })),
      setGrade: (value) => set(() => ({ context: { grade: value } })),
      addHonor: () => set((s) => ({ honors: [...s.honors, ""] })),
      updateHonor: (index, value) =>
        set((s) => ({
          honors: s.honors.map((h, i) => (i === index ? value : h)),
        })),
      removeHonor: (index) =>
        set((s) => ({
          honors: s.honors.filter((_, i) => i !== index),
        })),
      reset: () => set(EMPTY_ONBOARDING),
    }),
    {
      name: "portfolino-onboarding-form",
      version: 2,
      migrate: (persisted) => {
        const s = persisted as Partial<OnboardingState>;
        return {
          ...s,
          preferences: {
            major: s.preferences?.major ?? "",
            countries: s.preferences?.countries ?? [],
            budget: s.preferences?.budget ?? "",
          },
          context: { grade: s.context?.grade ?? "" },
        } as OnboardingState;
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type OnboardingLogRecord = {
  name: string;
  academic: Academic;
  honors: string[];
  preferences: Preferences;
  context: ContextInfo;
};

export function toOnboardingLog(s: OnboardingState): OnboardingLogRecord {
  return {
    name: s.name,
    academic: { ...s.academic },
    honors: [...s.honors].filter(Boolean),
    preferences: { ...s.preferences, countries: [...s.preferences.countries] },
    context: { ...s.context },
  };
}