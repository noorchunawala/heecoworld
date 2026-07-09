export type GlobalCurriculumCode =
  | "CBSE"
  | "BRITISH"
  | "AMERICAN"
  | "CAMBRIDGE"
  | "IB_PYP"
  | "IB_MYP"
  | "IB_DP";

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllowedCurriculumCodes(
  schoolCurricula: unknown
): Set<GlobalCurriculumCode> {
  const allowed = new Set<GlobalCurriculumCode>();

  if (!Array.isArray(schoolCurricula)) {
    return allowed;
  }

  for (const rawValue of schoolCurricula) {
    if (typeof rawValue !== "string") {
      continue;
    }

    const value = normalise(rawValue);

    if (!value) {
      continue;
    }

    /*
      Check IB first.

      Example:
      "UK - International Baccalaureate"
      must become IB, not British merely because it contains UK.
    */
    if (
      value.includes("international baccalaureate") ||
      /\bib\b/.test(value)
    ) {
      allowed.add("IB_PYP");
      allowed.add("IB_MYP");
      allowed.add("IB_DP");
      continue;
    }

    if (
      value.includes("cbse") ||
      value.includes("indian curriculum") ||
      value === "indian"
    ) {
      allowed.add("CBSE");
      continue;
    }

    if (value.includes("cambridge")) {
      allowed.add("CAMBRIDGE");
      continue;
    }

    if (
      value.includes("british") ||
      value === "uk" ||
      value.includes("uk curriculum") ||
      value.includes("english national curriculum")
    ) {
      allowed.add("BRITISH");
      continue;
    }

    if (
      value.includes("american") ||
      value.includes("us curriculum") ||
      value.includes("usa curriculum")
    ) {
      allowed.add("AMERICAN");
    }
  }

  return allowed;
}