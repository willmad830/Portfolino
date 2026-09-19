import type {
  RadarRoadmapScore,
  RoadmapPhase,
  RoadmapRequestPayload,
  RoadmapResult,
  RoadmapSummary,
  RoadmapTask,
  RoadmapTaskCategory,
} from "@/lib/roadmap/types";
import { extractJsonObject, stripMarkdownFences, toNumber } from "@/lib/diagnose/sanitize";

export { extractJsonObject, stripMarkdownFences };

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

type FallbackTask = Omit<RoadmapTask, "id"> & { phase: number };

const TASK_TEMPLATES: Array<{
  match: RegExp;
  task: FallbackTask;
}> = [
  {
    match: /sat|тест|test/i,
    task: {
      phase: 0,
      title: "Пересдача SAT (Буст 1480 → 1530+)",
      description:
        "Сфокусироваться на слабой секции (Math или Reading & Writing), решать Hard-модули и пройти 2-3 полных мок-теста в режиме реального времени.",
      category: "standardized_tests",
      deadline: "20 ноября",
      pts_gain: 30,
      skill_unlocked: "Advanced SAT Math & Speed Reading",
      action_link_text: "Зарегистрироваться на Digital SAT",
    },
  },
  {
    match: /достиж|honors|олимпиад|academic achievement/i,
    task: {
      phase: 0,
      title: "Участие в международном хакатоне / олимпиаде",
      description:
        "Подать заявку на международный онлайн-хакатон (MLH / Google AI Hackathon) или профильную олимпиаду в роли Team Lead / капитана команды.",
      category: "extracurriculars",
      deadline: "15 декабря",
      pts_gain: 50,
      skill_unlocked: "Project Management & AI System Architecture",
      action_link_text: "Календарь хакатонов MLH",
    },
  },
  {
    match: /эссе|лидер|essay|lead/i,
    task: {
      phase: 1,
      title: "Подготовка каркаса Personal Statement (Эссе)",
      description:
        "Написать первые 3 черновика главного эссе Common App с акцентом на личную трансформацию, лидерские инициативы и техническую страсть.",
      category: "applications",
      deadline: "28 февраля",
      pts_gain: 20,
      skill_unlocked: "Storytelling & Authentic Writing",
      action_link_text: "Примеры эссе в MIT / Stanford",
    },
  },
  {
    match: /academics|академик|gpa/i,
    task: {
      phase: 1,
      title: "Усиление академической нагрузки (AP / продвинутые курсы)",
      description:
        "Добавить в расписание продвинутые курсы по направлению major, поднять балл до A в слабых дисциплинах и зафиксировать рост GPA.",
      category: "academics",
      deadline: "15 января",
      pts_gain: 25,
      skill_unlocked: "Advanced Curriculum & GPA Boost",
      action_link_text: "Список доступных AP-курсов",
    },
  },
  {
    match: /финанс|financial/i,
    task: {
      phase: 2,
      title: "Оформление CSS Profile и финансовой документации",
      description:
        "Собрать справки о доходах и подготовить документы для 100% Need-Based стипендии целевого вуза.",
      category: "applications",
      deadline: "15 мая",
      pts_gain: 20,
      skill_unlocked: "Financial Aid Strategy",
      action_link_text: "Чек-лист документов CSS Profile",
    },
  },
  {
    match: /.*/,
    task: {
      phase: 2,
      title: "Запуск Open-Source инструмента или стартап-прототипа",
      description:
        "Вывести пет-продукт на 500+ активных пользователей или опубликовать релиз на GitHub / ProductHunt, задокументировав инженерный трейл.",
      category: "extracurriculars",
      deadline: "10 февраля",
      pts_gain: 60,
      skill_unlocked: "Product Growth & Open Source Leadership",
      action_link_text: "Гайд по запуску на ProductHunt",
    },
  },
];

const PHASE_META: Array<Pick<RoadmapPhase, "phase_name" | "period">> = [
  { phase_name: "Фаза 1: Ближайшие 1-2 месяца", period: "Октябрь - Ноябрь" },
  { phase_name: "Фаза 2: Зимний интенсив", period: "Декабрь - Февраль" },
  { phase_name: "Фаза 3: Финальная упаковка и подача", period: "Весна - Лето" },
];

export function buildLocalPhases(payload: RoadmapRequestPayload): RoadmapPhase[] {
  const sorted = [...payload.radar_scores].sort((a, b) => a.score - b.score);
  const weakestSubjects = sorted.slice(0, 2).map((r) => r.subject);

  const selected = new Map<string, FallbackTask>();
  const fallbackPool = [...TASK_TEMPLATES];

  for (const subject of weakestSubjects) {
    const idx = fallbackPool.findIndex((t) => t.match.test(subject));
    if (idx >= 0) {
      const [template] = fallbackPool.splice(idx, 1);
      selected.set(template.task.title, template.task);
    }
  }

  if (selected.size === 0) {
    const [template] = fallbackPool.splice(0, 1);
    selected.set(template.task.title, template.task);
  }

  if (![...selected.values()].some((t) => /эссе|essay/i.test(t.title))) {
    const essayIdx = fallbackPool.findIndex((t) => /эссе|essay/i.test(t.task.title));
    const essay = essayIdx >= 0 ? fallbackPool.splice(essayIdx, 1)[0].task : undefined;
    if (essay) selected.set(essay.title, essay);
  }

  for (let phaseIndex = 0; phaseIndex < PHASE_META.length; phaseIndex++) {
    const hasTask = [...selected.values()].some((t) => t.phase === phaseIndex);
    if (hasTask || fallbackPool.length === 0) continue;
    const [template] = fallbackPool.splice(0, 1);
    selected.set(template.task.title, { ...template.task, phase: phaseIndex });
  }

  let seed = 1;
  const phases = PHASE_META.map((meta, phaseIndex) => {
    const tasks = [...selected.values()]
      .filter((t) => t.phase === phaseIndex)
      .map((t) => ({ ...t, id: `task_${seed++}` }));

    return {
      phase_name: meta.phase_name,
      period: meta.period,
      tasks,
    };
  });

  return phases.filter((p) => p.tasks.length > 0);
}

export function localFallbackRoadmap(payload: RoadmapRequestPayload): RoadmapResult {
  const phases = buildLocalPhases(payload);
  const total_gain = phases.reduce(
    (sum, phase) => sum + phase.tasks.reduce((s, t) => s + t.pts_gain, 0),
    0,
  );
  const projected_pts = payload.current_scores.total_pts + total_gain;

  const weakest = [...payload.radar_scores].sort((a, b) => a.score - b.score)[0]?.subject;
  const primary_focus = weakest
    ? `Усиление оси «${weakest}» и целенаправленный выхлоп PTS до ${payload.target_goal.target_university || "целевого вуза"}`
    : `Целенаправленный набор PTS до ${payload.target_goal.target_university || "целевого вуза"}`;

  return {
    roadmap_summary: {
      total_potential_gain: total_gain,
      projected_pts,
      primary_focus,
    },
    phases,
  };
}

function normalizeTasks(raw: unknown, seedOffset = 0): RoadmapTask[] {
  return asArray(raw)
    .map((item, index) => {
      const row = asRecord(item);
      const title = String(pick(row, ["title", "name", "task"]) ?? "").trim();
      if (!title) return null;

      const categoryRaw = String(pick(row, ["category", "type"]) ?? "applications").trim();
      const category: RoadmapTaskCategory = (
        ["academics", "standardized_tests", "extracurriculars", "applications"].includes(categoryRaw)
          ? categoryRaw
          : "applications"
      ) as RoadmapTaskCategory;

      const actionLinkUrl = String(
        pick(row, ["action_link_url", "link", "url", "href"]) ?? "",
      ).trim();

      const task: RoadmapTask = {
        id:
          String(pick(row, ["id", "task_id", "taskId"]) ?? `task_${seedOffset + index + 1}`).trim() ||
          `task_${seedOffset + index + 1}`,
        title,
        description: String(pick(row, ["description", "details", "how"]) ?? "").trim(),
        category,
        deadline: String(pick(row, ["deadline", "due", "due_date", "date"]) ?? "").trim(),
        pts_gain: Math.min(
          150,
          Math.max(10, Math.round(toNumber(pick(row, ["pts_gain", "pts", "points", "gain"]), 20))),
        ),
        skill_unlocked: String(pick(row, ["skill_unlocked", "skill", "unlocks", "boost"]) ?? "").trim(),
        action_link_text: String(
          pick(row, ["action_link_text", "action_text", "cta", "link_text"]) ?? "Подробнее о шаге",
        ).trim(),
      };
      if (actionLinkUrl) task.action_link_url = actionLinkUrl;
      return task;
    })
    .filter((x): x is RoadmapTask => x != null);
}

export function normalizeRoadmapResult(raw: unknown, payload: RoadmapRequestPayload): RoadmapResult {
  const root = asRecord(raw);
  const fallback = localFallbackRoadmap(payload);

  const summaryRaw = asRecord(root.roadmap_summary ?? root.summary ?? root.roadmapSummary);
  let tasksCount = 0;
  let phases = asArray(root.phases ?? root.roadmap_phases ?? root.roadmapPhases)
    .map((phaseItem) => {
      const row = asRecord(phaseItem);
      const phase_name = String(row.phase_name ?? row.phaseName ?? row.name ?? "").trim();
      if (!phase_name) return null;
      const tasks = normalizeTasks(row.tasks ?? row.items, tasksCount);
      tasksCount += tasks.length;
      return {
        phase_name,
        period: String(row.period ?? row.window ?? row.when ?? "").trim(),
        tasks,
      };
    })
    .filter((p): p is RoadmapPhase => p != null);

  if (!phases.length) {
    phases = fallback.phases;
    tasksCount = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  }

  const total_gain = Math.round(
    toNumber(
      pick(summaryRaw, ["total_potential_gain", "total_gain", "potential_gain", "gain"]),
      phases.reduce((sum, p) => sum + p.tasks.reduce((s, t) => s + t.pts_gain, 0), 0),
    ),
  );
  const projected_pts = Math.round(
    toNumber(
      pick(summaryRaw, ["projected_pts", "projectedPts", "target_pts", "projected"]),
      payload.current_scores.total_pts + total_gain,
    ),
  );
  const primary_focus = String(
    pick(summaryRaw, ["primary_focus", "focus", "main_focus", "priority"]) ??
      fallback.roadmap_summary.primary_focus,
  ).trim();

  return {
    roadmap_summary: {
      total_potential_gain: total_gain,
      projected_pts,
      primary_focus,
    },
    phases,
  };
}

/** Weak axis ranking helper used by UI to pre-focus sections. */
export function weakestRadarAxes(scores: RadarRoadmapScore[], count = 3): RadarRoadmapScore[] {
  return [...scores].sort((a, b) => a.score - b.score).slice(0, count);
}

export type { RoadmapResult, RoadmapSummary };