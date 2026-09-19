import {
  extractJsonObject,
  normalizeDiagnoseResult,
} from "../lib/diagnose/sanitize";
import type { DiagnosePayload } from "../lib/diagnose/types";

const payload: DiagnosePayload = {
  name: "Madlen",
  academic: { gpa: 3.95, sat: 1480, ielts: 8 },
  honors: ["MLH Hackathon", "Republic olympiad"],
  preferences: { major: "CS", countries: ["USA"], budget: "need_based" },
  context: { grade: "10" },
};

const markdown = `\`\`\`json
{
  "scores": { "gpa": "247", "satPts": "231", "ielts_pts": 133, "honors": 240, "total": "851" },
  "items": [{ "name": "GPA 3.95", "points": "247" }],
  "radar": [{ "label": "GPA", "value": 0.98 }],
  "summary": { "text": "Good profile", "points": ["Strong GPA"] },
  "matches": [{ "university": "UofT", "location": "Canada", "threshold": "740" }],
  "gaps": [{ "name": "MIT", "country": "USA", "req_pts": 960, "gap": 109 }]
}
\`\`\``;

const raw = extractJsonObject(markdown);
const out = normalizeDiagnoseResult(raw, payload);

if (out.calculated_scores.total_pts !== 851) throw new Error("total_pts");
if (out.radar_scores[0].score !== 98) throw new Error("radar score");
if (out.universities_fit[0].name !== "UofT") throw new Error("fit name");
if (out.universities_missed[0].pts_needed !== 109) throw new Error("pts_needed");

const empty = normalizeDiagnoseResult({}, payload);
if (!empty.calculated_scores.total_pts) throw new Error("local fallback total");
if (!empty.breakdown.length) throw new Error("local breakdown");

console.log("OK sanitize tests passed");
console.log("local total", empty.calculated_scores.total_pts);
