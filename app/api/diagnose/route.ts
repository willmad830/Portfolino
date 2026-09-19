import { NextResponse } from "next/server";
import { DIAGNOSE_SYSTEM_PROMPT } from "@/lib/diagnose/prompt";
import type { DiagnosePayload, DiagnoseResult } from "@/lib/diagnose/types";
import {
  computeLocalScores,
  extractJsonObject,
  extractMessageContent,
  normalizeDiagnoseResult,
} from "@/lib/diagnose/sanitize";

export const runtime = "nodejs";

function isPayload(value: unknown): value is DiagnosePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.academic === "object" &&
    v.academic != null &&
    Array.isArray(v.honors) &&
    typeof v.preferences === "object" &&
    v.preferences != null &&
    typeof v.context === "object" &&
    v.context != null
  );
}

function localFallbackResult(payload: DiagnosePayload): DiagnoseResult {
  return normalizeDiagnoseResult({}, payload);
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

  if (!isPayload(body)) {
    return NextResponse.json({ error: "Invalid diagnose payload" }, { status: 400 });
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
            { role: "system", content: DIAGNOSE_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Проанализируй профиль абитуриента и верни JSON строго по эталонной структуре (calculated_scores, breakdown, radar_scores, diagnostic_text, universities_fit, universities_missed).\n\n${JSON.stringify(body)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[diagnose] Gemini HTTP error:", geminiRes.status, errText.slice(0, 2000));

      // Soft-fail: still return a usable dashboard payload instead of 502
      const fallback = localFallbackResult(body);
      return NextResponse.json({
        ...fallback,
        _meta: {
          degraded: true,
          reason: "gemini_http_error",
          status: geminiRes.status,
          local_total: computeLocalScores(body).total_pts,
        },
      });
    }

    const data: unknown = await geminiRes.json();
    rawContent = extractMessageContent(data);

    if (!rawContent.trim()) {
      console.error("[diagnose] Empty Gemini content. Full response:", JSON.stringify(data).slice(0, 3000));
      return NextResponse.json({
        ...localFallbackResult(body),
        _meta: { degraded: true, reason: "empty_content" },
      });
    }

    let parsed: unknown;
    try {
      parsed = extractJsonObject(rawContent);
    } catch (parseError) {
      console.error("[diagnose] JSON parse failed. Raw content:", rawContent.slice(0, 4000));
      console.error(parseError);
      return NextResponse.json({
        ...localFallbackResult(body),
        _meta: { degraded: true, reason: "json_parse_failed" },
      });
    }

    const normalized = normalizeDiagnoseResult(parsed, body);
    console.info("[diagnose] OK total_pts=", normalized.calculated_scores.total_pts);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("[diagnose] Unexpected error. Raw content:", rawContent.slice(0, 4000));
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
