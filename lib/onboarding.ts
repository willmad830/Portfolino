export const MAJORS = [
  "Computer Science",
  "Business",
  "Engineering",
  "Medicine",
  "Data Science",
  "Economics",
  "Law",
  "Design",
];

export const COUNTRIES = [
  "США",
  "Канада",
  "Германия",
  "Великобритания",
  "Нидерланды",
  "Австралия",
  "Франция",
  "Швейцария",
];

export const GRADES = ["9 класс", "10 класс", "11 класс", "Gap Year", "Выпускник"];

export const BUDGETS = [
  { value: "need_based", label: "Full-Ride / 100%", hint: "Полное покрытие всех расходов" },
  { value: "partial", label: "До $10-15k в год", hint: "Частичная помощь" },
  { value: "full_budget", label: "Полный бюджет", hint: "Оплачиваю обучение сам" },
];

type OnboardingFields = {
  name: string;
  academic: { gpa: string; sat: string; ielts: string; satTaken: boolean; ieltsTaken: boolean };
  honors: string[];
  preferences: { major: string; countries: string[]; budget: string };
  context: { grade: string };
};

export function getOnboardingCompletion(s: OnboardingFields): number {
  let done = 0;
  if (s.name.trim()) done += 1;
  const ac = s.academic;
  if (ac.gpa.trim()) done += 1;
  if (!ac.satTaken || ac.sat.trim()) done += 1;
  if (!ac.ieltsTaken || ac.ielts.trim()) done += 1;
  if (s.honors.some((h) => h.trim())) done += 1;
  if (s.preferences.major.trim()) done += 1;
  if (s.preferences.countries.length) done += 1;
  if (s.preferences.budget) done += 1;
  if (s.context.grade) done += 1;
  return Math.round((done / 9) * 100);
}

export function isOnboardingComplete(s: OnboardingFields): boolean {
  const ac = s.academic;
  const hasName = s.name.trim().length > 0;
  const hasGpa = ac.gpa.trim().length > 0;
  const hasHonors = s.honors.some((h) => h.trim());
  const hasPrefs = s.preferences.major.trim().length > 0 || s.preferences.countries.length > 0;
  return hasName && hasGpa && hasHonors && hasPrefs;
}