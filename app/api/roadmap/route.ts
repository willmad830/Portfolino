import { NextResponse } from "next/server";
import { ROADMAP_SYSTEM_PROMPT } from "@/lib/roadmap/prompt";
import type { RoadmapRequestPayload, RoadmapResult } from "@/lib/roadmap/types";
import { extractMessageContent } from "@/lib/diagnose/sanitize";
import {
  extractJsonObject,
  normalizeRoadmapResult,
} from "@/lib/roadmap/sanitize";

export const runtime = "nodejs";

function isRoadmapPayload(value: unknown): value is RoadmapRequestPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.context === "object" &&
    v.context != null &&
    typeof v.current_scores === "object" &&
    v.current_scores != null &&
    Array.isArray(v.radar_scores) &&
    typeof v.target_goal === "object" &&
    v.target_goal != null
  );
}

function localFallbackResult(payload: RoadmapRequestPayload): RoadmapResult {
  return normalizeRoadmapResult(null, payload);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRoadmapPayload(body)) {
    return NextResponse.json({ error: "Invalid roadmap payload" }, { status: 400 });
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  let rawContent = "";

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: ROADMAP_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Составь персональный Roadmap поступиления для этого профиля и верни JSON строго по эталонной структуре (roadmap_summary, phases).\n\n${JSON.stringify(body)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[roadmap] Gemini HTTP error:", geminiRes.status, errText.slice(0, 2000));

      const fallback = localFallbackResult(body);
      return NextResponse.json({
        ...fallback,
        _meta: {
          degraded: true,
          reason: "gemini_http_error",
          status: geminiRes.status,
        },
      });
    }

    const data: unknown = await geminiRes.json();
    rawContent = extractMessageContent(data);

    if (!rawContent.trim()) {
      console.error("[roadmap] Empty Gemini content. Full response:", JSON.stringify(data).slice(0, 3000));
      return NextResponse.json({
        ...localFallbackResult(body),
        _meta: { degraded: true, reason: "empty_content" },
      });
    }

    let parsed: unknown;
    try {
      parsed = extractJsonObject(rawContent);
    } catch (parseError) {
      console.error("[roadmap] JSON parse failed. Raw content:", rawContent.slice(0, 4000));
      console.error(parseError);
      return NextResponse.json({
        ...localFallbackResult(body),
        _meta: { degraded: true, reason: "json_parse_failed" },
      });
    }

    const normalized = normalizeRoadmapResult(parsed, body);
    console.info(
      "[roadmap] OK target=",
      body.target_goal.target_university,
      "gain=",
      normalized.roadmap_summary.total_potential_gain,
    );
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("[roadmap] Unexpected error. Raw content:", rawContent.slice(0, 4000));
    console.error(error);
    return NextResponse.json({
      ...localFallbackResult(body),
      _meta: {
        degraded: true,
        reason: "unexpected_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}