import { NextResponse } from "next/server";
import { COMPARE_SYSTEM_PROMPT } from "@/lib/compare/prompt";
import type { CompareRequestPayload } from "@/lib/compare/types";
import { extractJsonObject, extractMessageContent } from "@/lib/diagnose/sanitize";
import {
  isCompareResult,
  localFallbackCompareResult,
  normalizeCompareResult,
} from "@/lib/compare/sanitize";

export const runtime = "nodejs";

function isComparePayload(value: unknown): value is CompareRequestPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.student_profile === "object" &&
    v.student_profile != null &&
    Array.isArray(v.selected_universities)
  );
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

  if (!isComparePayload(body)) {
    return NextResponse.json({ error: "Invalid compare payload structure" }, { status: 400 });
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
            { role: "system", content: COMPARE_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Сравни переданные университеты для профиля студента и верни JSON строго по заданной спецификации (top_recommendation, comparison_matrix, detailed_insights).\n\n${JSON.stringify(body)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[compare] Gemini HTTP error:", geminiRes.status, errText.slice(0, 2000));
      const fallback = localFallbackCompareResult(body);
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
      console.error("[compare] Empty Gemini content:", JSON.stringify(data).slice(0, 2000));
      return NextResponse.json({
        ...localFallbackCompareResult(body),
        _meta: { degraded: true, reason: "empty_content" },
      });
    }

    let parsed: unknown;
    try {
      parsed = extractJsonObject(rawContent);
    } catch (parseError) {
      console.error("[compare] JSON parse failed. Raw:", rawContent.slice(0, 3000));
      console.error(parseError);
      return NextResponse.json({
        ...localFallbackCompareResult(body),
        _meta: { degraded: true, reason: "json_parse_failed" },
      });
    }

    const normalized = normalizeCompareResult(parsed, body);
    console.info("[compare] OK top_pick=", normalized.top_recommendation.university_name);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("[compare] Unexpected error. Raw:", rawContent.slice(0, 3000));
    console.error(error);
    return NextResponse.json({
      ...localFallbackCompareResult(body),
      _meta: {
        degraded: true,
        reason: "unexpected_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
