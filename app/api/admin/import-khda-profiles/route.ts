import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { importKhdaProfileAndFees } from "@/lib/imports/khdaProfileImporter";

const MAIN_SHEET = "Main information 2024-2025";
const FEES_SHEET = "Fees 2024-2025";
const ACADEMIC_YEAR = "2024/25";

const feeColumns = [
  "Pre primary",
  "KG 1",
  "KG 2",
  "GRADE 1",
  "GRADE 2",
  "GRADE 3",
  "GRADE 4",
  "GRADE 5",
  "GRADE 6",
  "GRADE 7",
  "GRADE 8",
  "GRADE 9",
  "GRADE 10",
  "GRADE 11",
  "GRADE 12",
  "GRADE 13",
  "FS 1",
  "FS 2",
  "YEAR 1",
  "YEAR 2",
  "YEAR 3",
  "YEAR 4",
  "YEAR 5",
  "YEAR 6",
  "YEAR 7",
  "YEAR 8",
  "YEAR 9",
  "YEAR 10",
  "YEAR 11",
  "YEAR 12",
  "YEAR 13",
];

function cleanText(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/l\.l\.c/g, "")
    .replace(/llc/g, "")
    .replace(/branch/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeFeeGradeName(raw: string) {
  return raw
    .replace(/^GRADE /i, "Grade ")
    .replace(/^KG /i, "KG")
    .replace(/^YEAR /i, "Year ")
    .replace(/^FS /i, "FS");
}

function numberValue(value: unknown) {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function extractFees(row: Record<string, any>) {
  const fees: { gradeName: string; fee: number; sortOrder: number }[] = [];

  feeColumns.forEach((column, index) => {
    const fee = numberValue(row[column]);

    if (fee && fee > 0) {
      fees.push({
        gradeName: normalizeFeeGradeName(column),
        fee,
        sortOrder: index + 1,
      });
    }
  });

  return fees;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Excel file is required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const mainSheet = workbook.Sheets[MAIN_SHEET];
    const feesSheet = workbook.Sheets[FEES_SHEET];

    if (!mainSheet || !feesSheet) {
      return NextResponse.json(
        {
          success: false,
          error: "Required sheets not found.",
          availableSheets: workbook.SheetNames,
        },
        { status: 400 }
      );
    }

    const mainRows = XLSX.utils.sheet_to_json<Record<string, any>>(mainSheet, {
      range: 1,
      defval: null,
    });

    const feeRows = XLSX.utils.sheet_to_json<Record<string, any>>(feesSheet, {
      range: 1,
      defval: null,
    });

    const feesBySchoolName = new Map<string, Record<string, any>>();

    for (const row of feeRows) {
      const schoolName = cleanText(row["School Name"]);
      if (!schoolName) continue;

      feesBySchoolName.set(normalizeName(schoolName), row);
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of mainRows) {
      const schoolName = cleanText(row["School Name"]);

      if (!schoolName) {
        skipped += 1;
        continue;
      }

      const feeRow = feesBySchoolName.get(normalizeName(schoolName));
      const fees = feeRow ? extractFees(feeRow) : [];

      try {
        await importKhdaProfileAndFees({
          schoolName,
          curriculum: cleanText(row["Curriculum"]),
          grades: cleanText(row["Grades"]),
          rating: cleanText(row["2024/25\nDSIB Rating"]),
          principalName: cleanText(row["Name of Principal"]),
          yearEstablished: cleanText(row["Year Established in Dubai"]),
          academicYear: ACADEMIC_YEAR,
          fees,
        });

        imported += 1;
      } catch (error: any) {
        errors.push(`${schoolName}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: mainRows.length,
      imported,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 30),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Import failed." },
      { status: 500 }
    );
  }
}