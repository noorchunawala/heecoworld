export type NormalizedSpeaListing = {
  dataSource: "SPEA";
  dataSourceId: string;
  name: string;
  category: "school";
  emirate: "Sharjah";
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  email?: string | null;
  phone?: string | null;
  curricula: string[];
  grades: string[];
  rating?: string | null;
  establishedOn?: string | null;
};

function text(value: unknown) {
  if (value === undefined || value === null) return null;
  const result = String(value).trim();
  return result || null;
}

function numberValue(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function parseCurriculum(value: unknown) {
  const raw = text(value);
  return raw ? [raw] : [];
}

function parseGrades(value: unknown) {
  const raw = text(value);
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((grade) => {
      if (/^kg1$/i.test(grade)) return "KG1";
      if (/^kg2$/i.test(grade)) return "KG2";
      if (/^\d+$/.test(grade)) return `Grade ${grade}`;
      return grade;
    });
}

function parseDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toISOString().split("T")[0];
}

export function normalizeSpeaRow(row: Record<string, any>): NormalizedSpeaListing | null {
  const schoolNumber = text(row["School Number"]);
  const name = text(row["School Name"]);

  if (!schoolNumber || !name) return null;

  return {
    dataSource: "SPEA",
    dataSourceId: schoolNumber,
    name,
    category: "school",
    emirate: "Sharjah",
    area: text(row["Region"]),
    latitude: numberValue(row["Latitude"]),
    longitude: numberValue(row["Longitude"]),
    email: text(row["Email"]),
    phone: text(row["PhoneNumber"]),
    curricula: parseCurriculum(row["Curriculum"]),
    grades: parseGrades(row["Age Category"]),
    rating: text(row["Evaluation"]),
    establishedOn: parseDate(row["Date of Establishment"]),
  };
}