import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DiagnosePayload, DiagnoseResult } from "@/lib/diagnose/types";
import type { CompareResult } from "@/lib/compare/types";
import type { TargetGoal } from "@/lib/roadmap/payload";
import type { RoadmapResult } from "@/lib/roadmap/types";

export type DiagnoseHistoryState = {
  result: DiagnoseResult | null;
  lastAnalyzedPayload: DiagnosePayload | null;
  analyzedAt: string | null;
  comparisonResult: CompareResult | null;
  comparisonKey: string | null;
  targetGoal: TargetGoal | null;
  roadmapResult: RoadmapResult | null;
  roadmapGoalKey: string | null;
};

export type DiagnoseHistoryActions = {
  setDiagnoseResult: (result: DiagnoseResult, payload: DiagnosePayload) => void;
  setComparisonResult: (result: CompareResult, key: string) => void;
  clearComparison: () => void;
  setTargetGoal: (goal: TargetGoal) => void;
  setRoadmapResult: (result: RoadmapResult, goalKey: string) => void;
  clearRoadmap: () => void;
  resetAll: () => void;
};

export type DiagnoseHistoryStore = DiagnoseHistoryState & DiagnoseHistoryActions;

const INITIAL_STATE: DiagnoseHistoryState = {
  result: null,
  lastAnalyzedPayload: null,
  analyzedAt: null,
  comparisonResult: null,
  comparisonKey: null,
  targetGoal: null,
  roadmapResult: null,
  roadmapGoalKey: null,
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
      setTargetGoal: (targetGoal) =>
        set((state) => ({
          targetGoal,
          // Roadmap is tied to the goal it was generated for; keep map of stale state
          roadmapResult: state.roadmapGoalKey === goalKeyOf(targetGoal) ? state.roadmapResult : null,
        })),
      setRoadmapResult: (roadmapResult, roadmapGoalKey) =>
        set({
          roadmapResult,
          roadmapGoalKey,
        }),
      clearRoadmap: () =>
        set({
          roadmapResult: null,
          roadmapGoalKey: null,
        }),
      resetAll: () => set(INITIAL_STATE),
    }),
    {
      name: "portfolino-diagnose-history",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const p = persisted as Partial<DiagnoseHistoryState>;
        if (!p || typeof p !== "object") return INITIAL_STATE;
        return { ...INITIAL_STATE, ...p };
      },
    },
  ),
);

function goalKeyOf(goal: TargetGoal): string {
  return `${goal.target_university.trim()}|${Math.max(0, Math.round(goal.pts_needed_gap))}`;
}

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
