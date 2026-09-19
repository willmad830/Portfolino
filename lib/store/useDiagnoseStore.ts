import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DiagnosePayload, DiagnoseResult } from "@/lib/diagnose/types";
import type { CompareResult } from "@/lib/compare/types";

export type DiagnoseHistoryState = {
  result: DiagnoseResult | null;
  lastAnalyzedPayload: DiagnosePayload | null;
  analyzedAt: string | null;
  comparisonResult: CompareResult | null;
  comparisonKey: string | null;
};

export type DiagnoseHistoryActions = {
  setDiagnoseResult: (result: DiagnoseResult, payload: DiagnosePayload) => void;
  setComparisonResult: (result: CompareResult, key: string) => void;
  clearComparison: () => void;
  resetAll: () => void;
};

export type DiagnoseHistoryStore = DiagnoseHistoryState & DiagnoseHistoryActions;

const INITIAL_STATE: DiagnoseHistoryState = {
  result: null,
  lastAnalyzedPayload: null,
  analyzedAt: null,
  comparisonResult: null,
  comparisonKey: null,
};

export const useDiagnoseStore = create<DiagnoseHistoryStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setDiagnoseResult: (result, payload) =>
        set({
          result,
          lastAnalyzedPayload: payload,
          analyzedAt: new Date().toISOString(),
          // Clear previous comparison when a new diagnosis is run with potentially new universities
          comparisonResult: null,
          comparisonKey: null,
        }),
      setComparisonResult: (comparisonResult, comparisonKey) =>
        set({
          comparisonResult,
          comparisonKey,
        }),
      clearComparison: () =>
        set({
          comparisonResult: null,
          comparisonKey: null,
        }),
      resetAll: () => set(INITIAL_STATE),
    }),
    {
      name: "portfolino-diagnose-history",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Utility to compare if the user's current questionnaire payload differs from
 * the payload that was last analyzed.
 */
export function isPayloadOutdated(
  current: DiagnosePayload | null,
  lastAnalyzed: DiagnosePayload | null,
): boolean {
  if (!lastAnalyzed) return false;
  if (!current) return false;
  return JSON.stringify(current) !== JSON.stringify(lastAnalyzed);
}
