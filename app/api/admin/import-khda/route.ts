import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { normalizeKhdaRow } from "@/lib/imports/khdaNormalizer";
import { importKhdaListing } from "@/lib/imports/khdaimporter";

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

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: null,
    });
console.log("FIRST ROW");
console.log(rows[0]);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const normalized = normalizeKhdaRow(row);

      if (!normalized) {
        skipped += 1;
        continue;
      }

      try {
        await importKhdaListing(normalized);
        imported += 1;
      } catch (error: any) {
        errors.push(`${normalized.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      imported,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Import failed." },
      { status: 500 }
    );
  }
}