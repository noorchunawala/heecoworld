import { NextResponse } from "next/server";
import {
  importKhdaSchoolFees,
  importKhdaSchoolProfile,
} from "@/lib/imports/khdaProfileImporter";

export async function POST() {
  try {
    const listingId = await importKhdaSchoolProfile({
      schoolName: "GEMS Jumeira Primary School - Dubai Branch",
      curriculum: "UK",
      grades: "FS1-Y6",
      rating: "Very Good",
      principalName: "Test Principal",
      yearEstablished: "1996",
      feeMin: 43941,
      feeMax: 55518,
    });

    await importKhdaSchoolFees({
      listingId,
      academicYear: "2024/25",
      fees: [
        { gradeName: "FS1", fee: 43941, sortOrder: 1 },
        { gradeName: "FS2", fee: 43941, sortOrder: 2 },
        { gradeName: "Year 1", fee: 55518, sortOrder: 3 },
        { gradeName: "Year 2", fee: 55518, sortOrder: 4 },
        { gradeName: "Year 3", fee: 55518, sortOrder: 5 },
        { gradeName: "Year 4", fee: 55518, sortOrder: 6 },
        { gradeName: "Year 5", fee: 55518, sortOrder: 7 },
        { gradeName: "Year 6", fee: 55518, sortOrder: 8 },
      ],
    });

    return NextResponse.json({
      success: true,
      listingId,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Import failed",
      },
      { status: 500 }
    );
  }
}