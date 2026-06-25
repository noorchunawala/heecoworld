import { khdaMapping } from "@/lib/imports/khdamapping";

export type NormalizedKhdaListing = {
  dataSource: "KHDA";
  dataSourceId: string;
  name: string;
  nameAr?: string | null;
  category: "school";
  emirate: "Dubai";
  area?: string | null;
  areaAr?: string | null;
  address?: string | null;
  addressAr?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  curricula: string[];
  inspectionRating?: string | null;
  inspectionRatingAr?: string | null;
  inspectionYear?: string | null;
  inspectionReportUrl?: string | null;
  heroImageUrl?: string | null;
  establishedOn?: string | null;
  studentCount?: number | null;
  poBox?: string | null;
  sourceLastUpdated?: string | null;
};

function value(row: Record<string, any>, key: string) {
  const raw = row[key];

  if (raw === undefined || raw === null) return null;

  const text = String(raw).trim();

  return text.length > 0 ? text : null;
}

function numberValue(row: Record<string, any>, key: string) {
  const raw = value(row, key);
  if (!raw) return null;

  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function dateValue(row: Record<string, any>, key: string) {
  const raw = row[key];

  if (!raw) return null;

  if (raw instanceof Date) {
    return raw.toISOString().split("T")[0];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().split("T")[0];
}

function splitCurriculum(curriculum?: string | null) {
  if (!curriculum) return [];

  return curriculum
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeKhdaRow(
  row: Record<string, any>
): NormalizedKhdaListing | null {
  const dataSourceId = value(row, khdaMapping.dataSourceId);
  const name = value(row, khdaMapping.name);

  if (!dataSourceId || !name) {
    return null;
  }

  return {
    dataSource: "KHDA",
    dataSourceId,
    name,
    nameAr: value(row, khdaMapping.nameAr),
    category: "school",
    emirate: "Dubai",
    area: value(row, khdaMapping.area),
    areaAr: value(row, khdaMapping.areaAr),
    address: value(row, khdaMapping.address),
    addressAr: value(row, khdaMapping.addressAr),
    latitude: numberValue(row, khdaMapping.latitude),
    longitude: numberValue(row, khdaMapping.longitude),
    email: value(row, khdaMapping.email),
    phone: value(row, khdaMapping.phone),
    mobile: value(row, khdaMapping.mobile),
    website: value(row, khdaMapping.website),
    curricula: splitCurriculum(value(row, khdaMapping.curriculum)),
    inspectionRating: value(row, khdaMapping.inspectionRating),
    inspectionRatingAr: value(row, khdaMapping.inspectionRatingAr),
    inspectionYear: value(row, khdaMapping.inspectionYear),
    inspectionReportUrl: value(row, khdaMapping.inspectionReportUrl),
    heroImageUrl: value(row, khdaMapping.heroImageUrl),
    establishedOn: dateValue(row, khdaMapping.establishedOn),
    studentCount: numberValue(row, khdaMapping.studentCount),
    poBox: value(row, khdaMapping.poBox),
    sourceLastUpdated: value(row, khdaMapping.loadTimestamp),
  };
}