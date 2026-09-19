import type { DiagnosePayload, DiagnoseResult } from "@/lib/diagnose/types";
import type { RoadmapRequestPayload } from "@/lib/roadmap/types";

export type TargetGoal = {
  target_university: string;
  pts_needed_gap: number;
};

export function buildRoadmapPayload(
  result: DiagnoseResult,
  payload: DiagnosePayload,
  targetGoal: TargetGoal,
): RoadmapRequestPayload {
  return {
    context: {
      grade: payload.context.grade,
      target_major: payload.preferences.major || "Computer Science",
    },
    current_scores: {
      total_pts: result.calculated_scores.total_pts,
      gpa: payload.academic.gpa,
      sat: payload.academic.sat,
      ielts: payload.academic.ielts,
      honors_count: payload.honors.length,
    },
    radar_scores: result.radar_scores.map((r) => ({ subject: r.subject, score: r.score })),
    target_goal: {
      target_university: targetGoal.target_university.trim(),
      pts_needed_gap: Math.max(0, Math.round(targetGoal.pts_needed_gap)),
    },
  };
}