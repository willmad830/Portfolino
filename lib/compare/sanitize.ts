import type {
  CompareRequestPayload,
  CompareResult,
  ComparisonMatrix,
  DetailedInsight,
  TopRecommendation,
} from "@/lib/compare/types";
import { stripMarkdownFences, extractJsonObject } from "@/lib/diagnose/sanitize";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseCompareJson(text: string): unknown {
  return extractJsonObject(text);
}

export function isCompareResult(value: unknown): value is CompareResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const top = asRecord(v.top_recommendation);
  const matrix = asRecord(v.comparison_matrix);
  return (
    typeof top.university_name === "string" &&
    Array.isArray(matrix.columns) &&
    Array.isArray(matrix.rows) &&
    Array.isArray(v.detailed_insights)
  );
}

export function localFallbackCompareResult(payload: CompareRequestPayload): CompareResult {
  const unis = payload.selected_universities.length > 0
    ? payload.selected_universities
    : [{ name: "University of Toronto", country: "Канада" }];

  const topUni = unis[0];
  const columns = ["Критерий", ...unis.map((u) => `${u.name} (${u.country})`)];

  const rows = [
    {
      criterion: "Стоимость обучения",
      values: unis.map((u) => {
        if (/германи|germany|tum/i.test(u.country + u.name)) return "0 € (бесплатное обучение)";
        if (/сша|usa|states/i.test(u.country + u.name)) return "~$28,000–$45,000/год (покрывается Merit/Need-Based)";
        if (/канад|canada/i.test(u.country + u.name)) return "~$35,000–$45,000 CAD (доступны гранты)";
        return "Умеренная стоимость с опцией стипендии";
      }),
    },
    {
      criterion: "Финансовая выгода (ROI)",
      values: unis.map((u) => {
        if (/германи|germany|tum/i.test(u.country + u.name)) return "Максимальная (платите только за проживание)";
        return "Высокая при получении институциональной стипендии";
      }),
    },
    {
      criterion: "Карьерный старт и визы",
      values: unis.map((u) => {
        if (/германи|germany|tum/i.test(u.country + u.name)) return "Виза поиска работы 18 мес, сильный технологический хаб";
        if (/канад|canada/i.test(u.country + u.name)) return "PGWP виза выпускника до 3 лет, высокий спрос на STEM";
        return "OPT виза на 3 года для STEM направлений";
      }),
    },
    {
      criterion: "Мэтч по бэкграунду",
      values: unis.map(() => `Отличный мэтч для ${payload.student_profile.major || "выбранного направления"}`),
    },
    {
      criterion: "Проживание и быт",
      values: unis.map((u) => {
        if (/германи|germany/i.test(u.country)) return "Разумные расходы (~950–1100€/мес), студенческие льготы";
        return "Комфортные студенческие кампусы и развитая инфраструктура";
      }),
    },
  ];

  const top_recommendation: TopRecommendation = {
    university_name: topUni.name,
    badge: "Лучший выбор",
    verdict: `${topUni.name} является наиболее сбалансированным выбором по соотношению академического потенциала и финансовой отдачи. Ваши баллы (${payload.student_profile.total_pts} PTS) обеспечивают уверенное прохождение.`,
  };

  const detailed_insights: DetailedInsight[] = unis.map((u) => ({
    university_name: u.name,
    pros: [
      `Высокий международный рейтинг по направлению ${payload.student_profile.major || "CS"}`,
      "Широкие возможности для стажировок и карьерного роста",
    ],
    financial_note: "Рекомендуется заблаговременно подавать заявку на внутренние гранты и стипендии.",
  }));

  return {
    top_recommendation,
    comparison_matrix: { columns, rows },
    detailed_insights,
  };
}

export function normalizeCompareResult(raw: unknown, payload: CompareRequestPayload): CompareResult {
  const root = asRecord(raw);
  const fallback = localFallbackCompareResult(payload);

  const topRaw = asRecord(root.top_recommendation ?? root.topRecommendation ?? root.top_pick);
  const top_recommendation: TopRecommendation = {
    university_name: String(topRaw.university_name ?? topRaw.universityName ?? topRaw.name ?? fallback.top_recommendation.university_name).trim(),
    badge: String(topRaw.badge ?? topRaw.tag ?? fallback.top_recommendation.badge).trim(),
    verdict: String(topRaw.verdict ?? topRaw.reason ?? topRaw.description ?? fallback.top_recommendation.verdict).trim(),
  };

  const matrixRaw = asRecord(root.comparison_matrix ?? root.comparisonMatrix ?? root.matrix);
  let columns = asArray(matrixRaw.columns).map((c) => String(c).trim()).filter(Boolean);
  if (columns.length < 2) {
    columns = fallback.comparison_matrix.columns;
  }

  const expectedValuesCount = columns.length - 1;

  let rows = asArray(matrixRaw.rows)
    .map((rowItem) => {
      const row = asRecord(rowItem);
      const criterion = String(row.criterion ?? row.criteria ?? row.name ?? row.title ?? "").trim();
      if (!criterion) return null;
      let values = asArray(row.values).map((v) => String(v).trim());
      while (values.length < expectedValuesCount) {
        values.push("—");
      }
      if (values.length > expectedValuesCount) {
        values = values.slice(0, expectedValuesCount);
      }
      return { criterion, values };
    })
    .filter((r): r is { criterion: string; values: string[] } => r != null);

  if (rows.length === 0) {
    rows = fallback.comparison_matrix.rows;
  }

  const comparison_matrix: ComparisonMatrix = {
    columns,
    rows,
  };

  let detailed_insights = asArray(root.detailed_insights ?? root.detailedInsights ?? root.insights)
    .map((item) => {
      const rec = asRecord(item);
      const name = String(rec.university_name ?? rec.universityName ?? rec.name ?? "").trim();
      if (!name) return null;
      const pros = asArray(rec.pros).map((p) => String(p).trim()).filter(Boolean);
      const financial_note = String(rec.financial_note ?? rec.financialNote ?? rec.note ?? "").trim();
      return {
        university_name: name,
        pros: pros.length > 0 ? pros : ["Высокие академические стандарты", "Доступ к сильной сети выпускников"],
        financial_note: financial_note || "Уточняйте актуальные дедлайны подачи на стипендиальные программы.",
      };
    })
    .filter((i): i is DetailedInsight => i != null);

  if (detailed_insights.length === 0) {
    detailed_insights = fallback.detailed_insights;
  }

  return {
    top_recommendation,
    comparison_matrix,
    detailed_insights,
  };
}
