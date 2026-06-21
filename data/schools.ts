import type { MatchableSchool } from "@/lib/matching";

export const sampleMatchedSchools: MatchableSchool[] = [
  {
    heroVideoUrl:"/video/heecoworld-school-hero-sample.mp4",
    id: "gems-modern-academy",
    name: "GEMS Modern Academy",
    slug:"",
    emirate: "dubai",
    curricula: ["cbse", "ib"],
    feeRange: {
      min: 30000,
      max: 70000,
    },
    grades: ["kg1", "kg2", "grade-1-5", "grade-6-12"],
    priorities: ["academics", "sports"],
    location: {
  address: "Dubai, United Arab Emirates",
  lat: 25.2048,
  lng: 55.2708,
},
reasons: [
  "Matches your preferred curriculum",
  "Fits your selected budget range",
  "Located in your preferred emirate",
],
  },
  {
    id: "delhi-private-school-sharjah",
    name: "Delhi Private School Sharjah",
    emirate: "sharjah",
    slug:"",
    curricula: ["cbse"],
    feeRange: {
      min: 10000,
      max: 18000,
    },
    grades: ["kg1", "kg2", "grade-1-5", "grade-6-12"],
    priorities: ["academics", "affordable-fees"],
     location: {
  address: "Dubai, United Arab Emirates",
  lat: 25.2048,
  lng: 55.2708,
},
reasons: [
  "Matches your preferred curriculum",
  "Fits your selected budget range",
  "Located in your preferred emirate",
],
  },
  {
    id: "sample-british-school-dubai",
    name: "Sample British School Dubai",
    emirate: "dubai",
    slug:"",
    curricula: ["british"],
    feeRange: {
      min: 25000,
      max: 55000,
    },
    grades: ["kg1", "kg2", "grade-1-5"],
    priorities: ["academics", "near-home"],
     location: {
  address: "Dubai, United Arab Emirates",
  lat: 25.2048,
  lng: 55.2708,
},
reasons: [
  "Matches your preferred curriculum",
  "Fits your selected budget range",
  "Located in your preferred emirate",
],
  },
];