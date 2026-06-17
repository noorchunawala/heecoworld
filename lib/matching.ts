export type MatchAnswers = Record<string, unknown>;

export type MatchableSchool = {
  id: string;
  name: string;
  emirate: string;
  curricula: string[];
  feeRange: {
    min: number;
    max: number;
  };
  grades: string[];
  reasons: string[];
  priorities: string[];
  location: {
  address: string;
  lat: number;
  lng: number;
};
heroVideoUrl?: string | null;
heroVideoPosterUrl?: string | null;
heroImageUrl?: string | null;
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

export function calculateMatch(
  school: MatchableSchool,
  answers: MatchAnswers
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (answers.emirate === school.emirate) {
    score += 30;
    reasons.push("Matches your preferred emirate");
  }

  if (
    typeof answers.curriculum === "string" &&
    school.curricula.includes(answers.curriculum)
  ) {
    score += 30;
    reasons.push("Matches your preferred curriculum");
  }

  if (
    typeof answers.grade === "string" &&
    school.grades.includes(answers.grade)
  ) {
    score += 15;
    reasons.push("Offers your selected grade level");
  }

  if (
    typeof answers.priority === "string" &&
    school.priorities.includes(answers.priority)
  ) {
    score += 15;
    reasons.push("Matches what matters most to you");
  }

  return {
    score,
    reasons,
  };
}
export function rankSchools(
  schools: MatchableSchool[],
  answers: MatchAnswers
) {
  return schools
    .map((school) => {
      const match = calculateMatch(school, answers);

      return {
        ...school,
        matchScore: match.score,
        matchLabel:
          match.score >= 80
            ? "Excellent Match"
            : match.score >= 60
              ? "Great Match"
              : "Good Match",
        badge: match.score >= 80 ? "Best Match" : null,
        reasons: match.reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}