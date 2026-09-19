import type {
  BreakdownItem,
  DiagnosePayload,
  DiagnoseResult,
  RadarScore,
  UniversityFit,
  UniversityMissed,
} from "@/lib/diagnose/types";

const DEFAULT_RADAR: RadarScore[] = [
  { subject: "GPA", score: 0 },
  { subject: "Академика", score: 0 },
  { subject: "SAT / тесты", score: 0 },
  { subject: "Достижения", score: 0 },
  { subject: "Эссе, лидерство", score: 0 },
  { subject: "Финансовый fit", score: 0 },
];

export function stripMarkdownFences(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json|JSON)?\s*/g, "")
    .replace(/```/g, "")
    .trim();
}

export function extractJsonObject(text: string): unknown {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("No JSON object found in model response");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function normalizeBreakdown(raw: unknown): BreakdownItem[] {
  return asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      const label = String(pick(row, ["label", "name", "title", "item"]) ?? "").trim();
      const pts = Math.round(toNumber(pick(row, ["pts", "points", "score", "value"])));
      if (!label) return null;
      return { label, pts };
    })
    .filter((x): x is BreakdownItem => x != null);
}

function normalizeRadar(raw: unknown): RadarScore[] {
  const items = asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      const subject = String(
        pick(row, ["subject", "label", "name", "axis", "category"]) ?? "",
      ).trim();
      let score = toNumber(pick(row, ["score", "value", "pts", "rating"]));
      // Accept 0–1 ratios from some models
      if (score > 0 && score <= 1) score = score * 100;
      score = Math.min(100, Math.max(0, Math.round(score)));
      if (!subject) return null;
      return { subject, score };
    })
    .filter((x): x is RadarScore => x != null);

  return items.length ? items : DEFAULT_RADAR;
}

function normalizeFit(raw: unknown): UniversityFit[] {
  return asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      const name = String(pick(row, ["name", "university", "title"]) ?? "").trim();
      if (!name) return null;
      return {
        name,
        country: String(pick(row, ["country", "location"]) ?? "").trim() || "—",
        req_pts: Math.round(toNumber(pick(row, ["req_pts", "pts", "required_pts", "threshold"]))),
        badge: String(pick(row, ["badge", "tag", "note"]) ?? "подходит для Full-Ride").trim(),
      };
    })
    .filter((x): x is UniversityFit => x != null);
}

function normalizeMissed(raw: unknown, totalPts: number): UniversityMissed[] {
  return asArray(raw)
    .map((item) => {
      const row = asRecord(item);
      const name = String(pick(row, ["name", "university", "title"]) ?? "").trim();
      if (!name) return null;
      const req = Math.round(toNumber(pick(row, ["req_pts", "pts", "required_pts", "threshold"])));
      const needed = Math.round(
        toNumber(pick(row, ["pts_needed", "gap", "missing", "deficit"]), Math.max(0, req - totalPts)),
      );
      return {
        name,
        country: String(pick(row, ["country", "location"]) ?? "").trim() || "—",
        req_pts: req,
        pts_needed: needed,
      };
    })
    .filter((x): x is UniversityMissed => x != null);
}

/** Deterministic local PTS when Gemini omits calculated_scores. */
export function computeLocalScores(payload: DiagnosePayload) {
  let gpa = payload.academic.gpa;
  if (gpa > 4.5) gpa = (gpa / 5) * 4;
  gpa = Math.min(4, Math.max(0, gpa));

  const gpa_pts = Math.round((gpa / 4) * 250);
  const sat_pts = payload.academic.sat > 0 ? Math.round((payload.academic.sat / 1600) * 250) : 0;
  const ielts_pts =
    payload.academic.ielts > 0 ? Math.round((payload.academic.ielts / 9) * 150) : 0;

  let honors_pts = 0;
  for (const h of payload.honors) {
    const t = h.toLowerCase();
    if (/международ|mlh|ioi|international|world/.test(t)) honors_pts += 120;
    else if (/республик|национал|national|olympiad|олимпиад/.test(t)) honors_pts += 90;
    else honors_pts += 45;
  }
  honors_pts = Math.min(350, honors_pts);

  const total_pts = Math.min(1000, gpa_pts + sat_pts + ielts_pts + honors_pts);
  return { gpa_pts, sat_pts, ielts_pts, honors_pts, total_pts };
}

function buildLocalBreakdown(payload: DiagnosePayload, scores: ReturnType<typeof computeLocalScores>): BreakdownItem[] {
  const items: BreakdownItem[] = [];
  if (payload.academic.gpa > 0) {
    items.push({ label: `GPA ${payload.academic.gpa}`, pts: scores.gpa_pts });
  }
  if (payload.academic.sat > 0) {
    items.push({ label: `SAT ${payload.academic.sat}`, pts: scores.sat_pts });
  }
  if (payload.academic.ielts > 0) {
    items.push({ label: `IELTS ${payload.academic.ielts}`, pts: scores.ielts_pts });
  }
  for (const h of payload.honors) {
    const t = h.toLowerCase();
    let pts = 45;
    if (/международ|mlh|ioi|international|world/.test(t)) pts = 120;
    else if (/республик|национал|national|olympiad|олимпиад/.test(t)) pts = 90;
    items.push({ label: h, pts });
  }
  return items;
}

function buildLocalRadar(scores: ReturnType<typeof computeLocalScores>): RadarScore[] {
  return [
    { subject: "GPA", score: Math.min(100, Math.round((scores.gpa_pts / 250) * 100)) },
    { subject: "Академика", score: Math.min(100, Math.round(((scores.gpa_pts + scores.sat_pts) / 500) * 100)) },
    { subject: "SAT / тесты", score: Math.min(100, Math.round((scores.sat_pts / 250) * 100)) },
    { subject: "Достижения", score: Math.min(100, Math.round((scores.honors_pts / 350) * 100)) },
    { subject: "Эссе, лидерство", score: 55 },
    { subject: "Финансовый fit", score: 70 },
  ];
}

/**
 * Coerce any Gemini-shaped object into the Dashboard DiagnoseResult contract.
 * Never throws for missing/alternate fields — fills local fallbacks instead.
 */
export function normalizeDiagnoseResult(
  raw: unknown,
  payload: DiagnosePayload,
): DiagnoseResult {
  const root = asRecord(raw);
  const local = computeLocalScores(payload);

  const scoresRaw = asRecord(
    pick(root, ["calculated_scores", "scores", "calculatedScores", "pts"]),
  );

  const calculated_scores = {
    gpa_pts: Math.round(toNumber(pick(scoresRaw, ["gpa_pts", "gpa", "gpaPts"]), local.gpa_pts)),
    sat_pts: Math.round(toNumber(pick(scoresRaw, ["sat_pts", "sat", "satPts"]), local.sat_pts)),
    ielts_pts: Math.round(
      toNumber(pick(scoresRaw, ["ielts_pts", "ielts", "ieltsPts"]), local.ielts_pts),
    ),
    honors_pts: Math.round(
      toNumber(pick(scoresRaw, ["honors_pts", "honors", "honorsPts"]), local.honors_pts),
    ),
    total_pts: Math.round(
      toNumber(pick(scoresRaw, ["total_pts", "total", "totalPts"]), local.total_pts),
    ),
  };

  if (!calculated_scores.total_pts) {
    calculated_scores.total_pts = Math.min(
      1000,
      calculated_scores.gpa_pts +
        calculated_scores.sat_pts +
        calculated_scores.ielts_pts +
        calculated_scores.honors_pts,
    );
  }

  let breakdown = normalizeBreakdown(pick(root, ["breakdown", "score_breakdown", "items"]));
  if (!breakdown.length) {
    breakdown = buildLocalBreakdown(payload, calculated_scores);
  }

  let radar_scores = normalizeRadar(
    pick(root, ["radar_scores", "radar", "radarScores", "axes"]),
  );
  if (!radar_scores.length || radar_scores.every((r) => r.score === 0)) {
    radar_scores = buildLocalRadar(calculated_scores);
  }

  const diagRaw = asRecord(
    pick(root, ["diagnostic_text", "diagnostic", "diagnostics", "summary"]),
  );
  const main_reason = String(
    pick(diagRaw, ["main_reason", "reason", "summary", "text", "mainReason"]) ??
      "Профиль проанализирован. Ниже — разбивка PTS и подбор вузов по вашим предпочтениям.",
  ).trim();

  const bulletsRaw = pick(diagRaw, ["bullets", "points", "highlights"]);
  let bullets = asArray(bulletsRaw)
    .map((b) => (typeof b === "string" ? b.trim() : String(asRecord(b).text ?? "").trim()))
    .filter(Boolean);
  if (!bullets.length) {
    bullets = [
      "Академические показатели учтены в PTS",
      "Подбор вузов учитывает страны, major и бюджет",
    ];
  }

  let universities_fit = normalizeFit(
    pick(root, ["universities_fit", "fit", "universitiesFit", "matches"]),
  );
  let universities_missed = normalizeMissed(
    pick(root, ["universities_missed", "missed", "universitiesMissed", "gaps"]),
    calculated_scores.total_pts,
  );

  if (!universities_fit.length && !universities_missed.length) {
    universities_fit = [
      {
        name: "University of Toronto",
        country: "Канада",
        req_pts: Math.min(calculated_scores.total_pts, 740),
        badge: "подходит для Full-Ride",
      },
    ];
    universities_missed = [
      {
        name: "MIT",
        country: "США",
        req_pts: 960,
        pts_needed: Math.max(0, 960 - calculated_scores.total_pts),
      },
    ];
  }

  return {
    calculated_scores,
    breakdown,
    radar_scores,
    diagnostic_text: { main_reason, bullets },
    universities_fit,
    universities_missed,
  };
}

/** Pull text content from OpenAI-compatible or native Gemini shapes. */
export function extractMessageContent(data: unknown): string {
  const root = asRecord(data);
  const choice = asArray(root.choices)[0];
  const message = asRecord(asRecord(choice).message);
  const content = message.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        const p = asRecord(part);
        return String(p.text ?? p.content ?? "");
      })
      .join("\n");
  }

  // Native generateContent shape
  const candidates = asArray(root.candidates);
  const parts = asArray(asRecord(asRecord(candidates[0]).content).parts);
  if (parts.length) {
    return parts.map((p) => String(asRecord(p).text ?? "")).join("\n");
  }

  return "";
}
