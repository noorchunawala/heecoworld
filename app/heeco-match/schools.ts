import type { MatchableSchool } from "@/lib/matching";

export const sampleMatchedSchools: MatchableSchool[] = [
  {
    id: "gems-modern-academy",
    name: "GEMS Modern Academy",
    emirate: "dubai",
    curricula: ["cbse", "ib"],
    feeRange: {
      min: 30000,
      max: 70000,
    },
    grades: ["kg1", "kg2", "grade-1-5", "grade-6-12"],
    priorities: ["academics", "sports"],
  },
  {
    id: "delhi-private-school-sharjah",
    name: "Delhi Private School Sharjah",
    emirate: "sharjah",
    curricula: ["cbse"],
    feeRange: {
      min: 10000,
      max: 18000,
    },
    grades: ["kg1", "kg2", "grade-1-5", "grade-6-12"],
    priorities: ["academics", "affordable-fees"],
  },
  {
    id: "sample-british-school-dubai",
    name: "Sample British School Dubai",
    emirate: "dubai",
    curricula: ["british"],
    feeRange: {
      min: 25000,
      max: 55000,
    },
    grades: ["kg1", "kg2", "grade-1-5"],
    priorities: ["academics", "near-home"],
  },
];