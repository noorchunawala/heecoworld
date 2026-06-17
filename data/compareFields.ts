import type { SchoolListing } from "@/lib/schoolListings";

export type SchoolData = SchoolListing;

export const compareFields = [
  {
    key: "emirate",
    label: "Emirate",
    getValue: (school: SchoolData) => school.emirate,
  },
  {
    key: "curricula",
    label: "Curriculum",
    getValue: (school: SchoolData) => school.curricula.join(", "),
  },
  {
    key: "fees",
    label: "Fee range",
    getValue: (school: SchoolData) =>
      school.feeRange.min && school.feeRange.max
        ? `AED ${school.feeRange.min.toLocaleString()} - AED ${school.feeRange.max.toLocaleString()}`
        : "Not available",
  },
  {
    key: "grades",
    label: "Grades",
    getValue: (school: SchoolData) => school.grades.join(", "),
  },
  {
    key: "priorities",
    label: "Key priorities",
    type: "list",
    getValue: (school: SchoolData) => school.priorities,
  },
  {
    key: "facilities",
    label: "Facilities",
    type: "list",
    getValue: (school: SchoolData) => school.facilities,
  },
];