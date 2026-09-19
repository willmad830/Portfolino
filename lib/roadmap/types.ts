export type RoadmapTaskCategory =
  | "academics"
  | "standardized_tests"
  | "extracurriculars"
  | "applications";

export type RoadmapTask = {
  id: string;
  title: string;
  description: string;
  category: RoadmapTaskCategory;
  deadline: string;
  pts_gain: number;
  skill_unlocked: string;
  action_link_text: string;
  action_link_url?: string;
};

export type RoadmapPhase = {
  phase_name: string;
  period: string;
  tasks: RoadmapTask[];
};

export type RoadmapSummary = {
  total_potential_gain: number;
  projected_pts: number;
  primary_focus: string;
};

export type RoadmapResult = {
  roadmap_summary: RoadmapSummary;
  phases: RoadmapPhase[];
};

export type RadarRoadmapScore = {
  subject: string;
  score: number;
};

export type RoadmapRequestPayload = {
  context: {
    grade: string;
    target_major: string;
  };
  current_scores: {
    total_pts: number;
    gpa: number;
    sat: number;
    ielts: number;
    honors_count: number;
  };
  radar_scores: RadarRoadmapScore[];
  target_goal: {
    target_university: string;
    pts_needed_gap: number;
  };
};

export function isRoadmapResult(value: unknown): value is RoadmapResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const summary = v.roadmap_summary;
  return (
    typeof summary === "object" &&
    summary != null &&
    Array.isArray(v.phases)
  );
}