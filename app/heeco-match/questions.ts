export const heecoMatchQuestions = [
  {
    id: "emirate",
    type: "single-choice",
    step: 1,
    title: "Where are you looking for a school?",
    options: [
      { id: "dubai", label: "Dubai" },
      { id: "sharjah", label: "Sharjah" },
      { id: "abu-dhabi", label: "Abu Dhabi" },
      { id: "ajman", label: "Ajman" },
    ],
  },
  {
    id: "grade",
    type: "single-choice",
    step: 2,
    title: "Which grade are you applying for?",
    options: [
      { id: "kg1", label: "KG1" },
      { id: "kg2", label: "KG2" },
      { id: "grade-1-5", label: "Grade 1 - 5" },
      { id: "grade-6-12", label: "Grade 6 - 12" },
    ],
  },
  {
    id: "budget",
    type: "single-choice",
    step: 3,
    title: "What is your annual tuition budget?",
    options: [
      { id: "below-20k", label: "Below AED 20,000" },
      { id: "20k-40k", label: "AED 20,000 - 40,000" },
      { id: "40k-60k", label: "AED 40,000 - 60,000" },
      { id: "above-60k", label: "Above AED 60,000" },
    ],
  },
  {
    id: "curriculum",
    type: "single-choice",
    step: 4,
    title: "Which curriculum do you prefer?",
    options: [
      { id: "british", label: "British" },
      { id: "cbse", label: "CBSE" },
      { id: "american", label: "American" },
      { id: "ib", label: "IB" },
      { id: "no-preference", label: "No Preference" },
    ],
  },
  {
    id: "priority",
    type: "single-choice",
    step: 5,
    title: "What matters most to you?",
    options: [
      { id: "academics", label: "Academic Excellence" },
      { id: "affordable-fees", label: "Affordable Fees" },
      { id: "sports", label: "Sports & Activities" },
      { id: "near-home", label: "Near Home" },
    ],
  },
];