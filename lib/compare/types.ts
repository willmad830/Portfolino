export type CompareStudentProfile = {
  total_pts: number;
  gpa: number;
  sat: number;
  ielts: number;
  major: string;
  budget_preference: string;
  honors: string[];
};

export type SelectedUniversity = {
  name: string;
  country: string;
};

export type CompareRequestPayload = {
  student_profile: CompareStudentProfile;
  selected_universities: SelectedUniversity[];
};

export type TopRecommendation = {
  university_name: string;
  badge: string;
  verdict: string;
};

export type ComparisonMatrixRow = {
  criterion: string;
  values: string[];
};

export type ComparisonMatrix = {
  columns: string[];
  rows: ComparisonMatrixRow[];
};

export type DetailedInsight = {
  university_name: string;
  pros: string[];
  financial_note: string;
};

export type CompareResult = {
  top_recommendation: TopRecommendation;
  comparison_matrix: ComparisonMatrix;
  detailed_insights: DetailedInsight[];
};
