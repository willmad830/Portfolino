export type DiagnosePayload = {
  name: string;
  academic: {
    gpa: number;
    sat: number;
    ielts: number;
  };
  honors: string[];
  preferences: {
    major: string;
    countries: string[];
    budget: string;
  };
  context: {
    grade: string;
  };
};

export type BreakdownItem = {
  label: string;
  pts: number;
};

export type RadarScore = {
  subject: string;
  score: number;
};

export type UniversityFit = {
  name: string;
  country: string;
  req_pts: number;
  badge: string;
};

export type UniversityMissed = {
  name: string;
  country: string;
  req_pts: number;
  pts_needed: number;
};

export type DiagnoseResult = {
  calculated_scores: {
    gpa_pts: number;
    sat_pts: number;
    ielts_pts: number;
    honors_pts: number;
    total_pts: number;
  };
  breakdown: BreakdownItem[];
  radar_scores: RadarScore[];
  diagnostic_text: {
    main_reason: string;
    bullets: string[];
  };
  universities_fit: UniversityFit[];
  universities_missed: UniversityMissed[];
};

/** Soft check — prefers normalizeDiagnoseResult over rejecting responses. */
export function isDiagnoseResult(value: unknown): value is DiagnoseResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const scores = v.calculated_scores;
  return (
    typeof scores === "object" &&
    scores != null &&
    typeof (scores as { total_pts?: unknown }).total_pts === "number" &&
    Array.isArray(v.breakdown) &&
    Array.isArray(v.radar_scores) &&
    typeof v.diagnostic_text === "object" &&
    v.diagnostic_text != null &&
    Array.isArray(v.universities_fit) &&
    Array.isArray(v.universities_missed)
  );
}
