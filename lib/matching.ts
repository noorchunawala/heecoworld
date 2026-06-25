export type MatchAnswers = Record<string, unknown>;

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    
}
export type MatchableSchool = {
  id: string;
  name: string;
  slug: string,
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

const priorityMessages: Record<string, string> = {
  "Academic Focus": "Known for strong academic performance",
  "Affordable Fees": "Offers excellent value for money",
  "Sports": "Strong sports and extracurricular programmes",
  "STEM": "Strong STEM and innovation programmes",
  "Career Exposure": "Provides excellent career exposure opportunities",
  "Industrial Visits": "Supports experiential learning through industrial visits",
};

  
  let score = 0;
  const reasons: string[] = [];

  if (normalize(answers.emirate) === normalize(school.emirate)) {
    score += 40;
    reasons.push(`Located in ${school.emirate}`);
  }

  if (normalize(answers.curriculum) === "no preference") {
    score += 30;
    reasons.push("No curriculum preference selected");
}
else if (
    typeof answers.curriculum === "string" &&
    school.curricula.some(
        c => normalize(c) === normalize(answers.curriculum)
    )
) {
    score += 30;
   reasons.push(`Offers ${answers.curriculum} curriculum`);
}
const budgetRanges: Record<string, { min: number; max: number }> = {
  "below-20k": { min: 0, max: 20000 },
  "20k-40k": { min: 20000, max: 40000 },
  "40k-60k": { min: 40000, max: 60000 },
  "above-60k": { min: 60000, max: Infinity },
};

if (typeof answers.budget === "string") {
  const selectedBudget = budgetRanges[answers.budget];

  if (selectedBudget) {
    const schoolMin = school.feeRange.min;
    const schoolMax = school.feeRange.max;

    const overlaps =
      schoolMin <= selectedBudget.max && schoolMax >= selectedBudget.min;

    if (overlaps) {
      score += 20;
      reasons.push("Within your selected budget");
    }
  }
}
  if (
    typeof answers.grade === "string" &&
    school.grades.map(normalize).includes(normalize(answers.grade))
  ) {
    score += 15;
  reasons.push(`Offers ${answers.grade}`);
  }

  if (
    typeof answers.priority === "string" &&
   school.priorities.map(normalize).includes(normalize(answers.priority))
  ) {
    score += 0;
   reasons.push(
  priorityMessages[String(answers.priority)] ??
    `Strong focus on ${answers.priority}`
);
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
 const percentageScore = Math.min(
        Math.round((match.score / 105) * 100),
        100
      );
      return {
        ...school,
       matchScore: percentageScore,
        matchLabel:
         percentageScore >= 80
            ? "Excellent Match"
            : percentageScore >= 60
              ? "Great Match"
              : "Good Match",
        badge: percentageScore >= 80 ? "Best Match" : null,
        reasons: match.reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}