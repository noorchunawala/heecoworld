"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";

type FormState = {
  name: string;
  emirate: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  shortDescription: string;

  curriculaText: string;
  gradesText: string;
  feeMin: string;
  feeMax: string;
  rating: string;
  gender: string;
  prioritiesText: string;
  facilitiesText: string;

  description: string;
  schoolType: string;
  schoolPhase: string;
  foundedYear: string;
  authority: string;
  inspectionRating: string;
  wellbeingRating: string;
  inclusionRating: string;
  lastInspectionYear: string;
  openingYear: string;
  teacherTurnover: string;
  principalName: string;
  ownerName: string;
  community: string;
  mainTeacherNationality: string;

  applicationFee: string;
  registrationFee: string;
  transportFeeNote: string;
  admissionNotes: string;

  academicsHighlightsText: string;
  admissionsRequirementsText: string;
  admissionsProcessText: string;
  visitChecklistText: string;
  reasonsText: string;
};

type FeeRow = {
  clientId: string;
  gradeName: string;
  currentYear: string;
  currentFee: string;
  nextYear: string;
  nextFee: string;
  notes: string;
  sortOrder: string;
};

type AvailabilityRow = {
  clientId: string;
  gradeName: string;
  academicYear: string;
  status: string;
  notes: string;
  sortOrder: string;
};

type ContactRow = {
  clientId: string;
  type: string;
  label: string;
  value: string;
  href: string;
  sortOrder: string;
};

type FacilityRow = {
  clientId: string;
  facilityName: string;
  facilityType: string;
  isAvailable: boolean;
  notes: string;
  sortOrder: string;
};

type QaRow = {
  clientId: string;
  question: string;
  answer: string;
  sortOrder: string;
};

type InspectionRow = {
  clientId: string;
  academicYear: string;
  overallRating: string;
  inspectionAuthority: string;
  reportFileName: string;
  reportPdfPath: string;
  pdfFile: File | null;
  notes: string;
  sortOrder: string;
};

type ParentGuideRow = {
  clientId: string;
  title: string;
  itemsText: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  emirate: "",
  area: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  shortDescription: "",

  curriculaText: "",
  gradesText: "",
  feeMin: "",
  feeMax: "",
  rating: "",
  gender: "",
  prioritiesText: "",
  facilitiesText: "",

  description: "",
  schoolType: "",
  schoolPhase: "",
  foundedYear: "",
  authority: "",
  inspectionRating: "",
  wellbeingRating: "",
  inclusionRating: "",
  lastInspectionYear: "",
  openingYear: "",
  teacherTurnover: "",
  principalName: "",
  ownerName: "",
  community: "",
  mainTeacherNationality: "",

  applicationFee: "",
  registrationFee: "",
  transportFeeNote: "",
  admissionNotes: "",

  academicsHighlightsText: "",
  admissionsRequirementsText: "",
  admissionsProcessText: "",
  visitChecklistText: "",
  reasonsText: "",
};

function newClientId() {
  return globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function stringValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function arrayToText(value: unknown) {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : "";
}

function textToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export default function SchoolProfileEditPage() {
  const params = useParams();
  const router = useRouter();

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const [form, setForm] = useState<FormState>(emptyForm);

  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [availabilityRows, setAvailabilityRows] = useState<AvailabilityRow[]>(
    []
  );
  const [contactRows, setContactRows] = useState<ContactRow[]>([]);
  const [facilityRows, setFacilityRows] = useState<FacilityRow[]>([]);
  const [qaRows, setQaRows] = useState<QaRow[]>([]);
  const [inspectionRows, setInspectionRows] = useState<InspectionRow[]>([]);
  const [parentGuideRows, setParentGuideRows] = useState<ParentGuideRow[]>([]);

  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchool() {
      if (!schoolId) {
        setError("School ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          router.replace("/school-access");
          return;
        }

        const response = await fetch(
          `/api/school-portal/schools/${schoolId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setError(result?.error || "Could not load school profile.");
          return;
        }

        const listing = toObject(result.listing);
        const profile = toObject(result.profile);
        const details = toObject(result.details);

        setSchoolName(stringValue(listing.name));
        setSchoolSlug(stringValue(listing.slug));

        setForm({
          name: stringValue(listing.name),
          emirate: stringValue(listing.emirate),
          area: stringValue(listing.area),
          address: stringValue(listing.address),
          phone: stringValue(listing.phone),
          email: stringValue(listing.email),
          website: stringValue(listing.website),
          shortDescription: stringValue(listing.short_description),

          curriculaText: arrayToText(profile.curricula),
          gradesText: arrayToText(profile.grades),
          feeMin: stringValue(profile.fee_min),
          feeMax: stringValue(profile.fee_max),
          rating: stringValue(profile.rating),
          gender: stringValue(profile.gender),
          prioritiesText: arrayToText(profile.priorities),
          facilitiesText: arrayToText(profile.facilities),

          description: stringValue(details.description),
          schoolType: stringValue(details.school_type),
          schoolPhase: stringValue(details.school_phase),
          foundedYear: stringValue(details.founded_year),
          authority: stringValue(details.authority),
          inspectionRating: stringValue(details.inspection_rating),
          wellbeingRating: stringValue(details.wellbeing_rating),
          inclusionRating: stringValue(details.inclusion_rating),
          lastInspectionYear: stringValue(details.last_inspection_year),
          openingYear: stringValue(details.opening_year),
          teacherTurnover: stringValue(details.teacher_turnover),
          principalName: stringValue(details.principal_name),
          ownerName: stringValue(details.owner_name),
          community: stringValue(details.community),
          mainTeacherNationality: stringValue(
            details.main_teacher_nationality
          ),

          applicationFee: stringValue(details.application_fee),
          registrationFee: stringValue(details.registration_fee),
          transportFeeNote: stringValue(details.transport_fee_note),
          admissionNotes: stringValue(details.admission_notes),

          academicsHighlightsText: arrayToText(details.academics_highlights),
          admissionsRequirementsText: arrayToText(
            details.admissions_requirements
          ),
          admissionsProcessText: arrayToText(details.admissions_process),
          visitChecklistText: arrayToText(details.visit_checklist),
          reasonsText: arrayToText(details.reasons),
        });

        const fees = Array.isArray(result.fees) ? result.fees : [];
        setFeeRows(
          fees.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              gradeName: stringValue(row.grade_name),
              currentYear: stringValue(row.current_year),
              currentFee: stringValue(row.current_fee),
              nextYear: stringValue(row.next_year),
              nextFee: stringValue(row.next_fee),
              notes: stringValue(row.notes),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const availability = Array.isArray(result.availability)
          ? result.availability
          : [];

        setAvailabilityRows(
          availability.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              gradeName: stringValue(row.grade_name),
              academicYear: stringValue(row.academic_year),
              status: stringValue(row.status) || "Not updated",
              notes: stringValue(row.notes),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const contacts = Array.isArray(result.contacts) ? result.contacts : [];
        setContactRows(
          contacts.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              type: stringValue(row.type) || "other",
              label: stringValue(row.label),
              value: stringValue(row.value),
              href: stringValue(row.href),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const facilities = Array.isArray(result.facilities)
          ? result.facilities
          : [];

        setFacilityRows(
          facilities.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              facilityName: stringValue(row.facility_name),
              facilityType: stringValue(row.facility_type),
              isAvailable: row.is_available !== false,
              notes: stringValue(row.notes),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const qa = Array.isArray(result.qa) ? result.qa : [];
        setQaRows(
          qa.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              question: stringValue(row.question),
              answer: stringValue(row.answer),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const inspectionReports = Array.isArray(result.inspectionReports)
          ? result.inspectionReports
          : [];

        setInspectionRows(
          inspectionReports.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              academicYear: stringValue(row.academic_year),
              overallRating: stringValue(row.overall_rating),
              inspectionAuthority: stringValue(row.inspection_authority),
              reportFileName: stringValue(row.report_file_name),
              reportPdfPath: stringValue(row.report_pdf_path),
              pdfFile: null,
              notes: stringValue(row.notes),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );

        const parentGuides = Array.isArray(result.parentGuides)
          ? result.parentGuides
          : [];

        setParentGuideRows(
          parentGuides.map((item: unknown, index: number) => {
            const row = toObject(item);

            return {
              clientId: newClientId(),
              title: stringValue(row.title),
              itemsText: arrayToText(row.items),
              sortOrder: stringValue(row.sort_order || index + 1),
            };
          })
        );
     } catch (caughtError) {
  const message =
    caughtError instanceof Error
      ? caughtError.message
      : "Could not save school profile.";

  setError(message);
  alert(message);
} finally {
        setLoading(false);
      }
    }

    loadSchool();
  }, [router, schoolId]);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function addFeeRow() {
    setFeeRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        gradeName: "",
        currentYear: "",
        currentFee: "",
        nextYear: "",
        nextFee: "",
        notes: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateFeeRow(
    clientId: string,
    key: keyof FeeRow,
    value: string
  ) {
    setFeeRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeFeeRow(clientId: string) {
    setFeeRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  function addAvailabilityRow() {
    setAvailabilityRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        gradeName: "",
        academicYear: "",
        status: "Not updated",
        notes: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateAvailabilityRow(
    clientId: string,
    key: keyof AvailabilityRow,
    value: string
  ) {
    setAvailabilityRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeAvailabilityRow(clientId: string) {
    setAvailabilityRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  function addContactRow() {
    setContactRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        type: "email",
        label: "",
        value: "",
        href: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateContactRow(
    clientId: string,
    key: keyof ContactRow,
    value: string
  ) {
    setContactRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeContactRow(clientId: string) {
    setContactRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  function addFacilityRow() {
    setFacilityRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        facilityName: "",
        facilityType: "",
        isAvailable: true,
        notes: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateFacilityRow(
    clientId: string,
    key: keyof FacilityRow,
    value: string | boolean
  ) {
    setFacilityRows((current) =>
      current.map((row) =>
        row.clientId === clientId
          ? ({ ...row, [key]: value } as FacilityRow)
          : row
      )
    );
  }

  function removeFacilityRow(clientId: string) {
    setFacilityRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  function addQaRow() {
    setQaRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        question: "",
        answer: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateQaRow(clientId: string, key: keyof QaRow, value: string) {
    setQaRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeQaRow(clientId: string) {
    setQaRows((current) => current.filter((row) => row.clientId !== clientId));
  }

  function addInspectionRow() {
    setInspectionRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        academicYear: "",
        overallRating: "",
        inspectionAuthority: "",
        reportFileName: "",
        reportPdfPath: "",
        pdfFile: null,
        notes: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

function updateInspectionRow(
  clientId: string,
  key: keyof InspectionRow,
  value: string | File | null
) {
  setInspectionRows((current) =>
    current.map((row) =>
      row.clientId === clientId
        ? ({ ...row, [key]: value } as InspectionRow)
        : row
    )
  );
}

  function removeInspectionRow(clientId: string) {
    setInspectionRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  function addParentGuideRow() {
    setParentGuideRows((current) => [
      ...current,
      {
        clientId: newClientId(),
        title: "",
        itemsText: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function updateParentGuideRow(
    clientId: string,
    key: keyof ParentGuideRow,
    value: string
  ) {
    setParentGuideRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeParentGuideRow(clientId: string) {
    setParentGuideRows((current) =>
      current.filter((row) => row.clientId !== clientId)
    );
  }

  async function uploadInspectionPdf(
  file: File,
  academicYear: string
) {
  if (!schoolId) {
    throw new Error("School ID is missing.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("academicYear", academicYear);

  const response = await fetch(
    `/api/school-portal/schools/${schoolId}/inspection-reports/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || "Could not upload inspection PDF.");
  }

  return {
    filePath: String(result.filePath || ""),
    fileName: String(result.fileName || ""),
  };
}

  async function saveProfile() {
    if (!schoolId) return;

    if (!form.name.trim()) {
      alert("School name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace("/school-access");
        return;
      }
      const preparedInspectionRows = await Promise.all(
  inspectionRows.map(async (row) => {
    if (!row.pdfFile) {
      return row;
    }

    if (!row.academicYear.trim()) {
      throw new Error(
        "Academic year is required before uploading an inspection PDF."
      );
    }

    const uploaded = await uploadInspectionPdf(
      row.pdfFile,
      row.academicYear
    );

    return {
      ...row,
      reportPdfPath: uploaded.filePath,
      reportFileName: uploaded.fileName,
      pdfFile: null,
    };
  })
);

      const response = await fetch(
        `/api/school-portal/schools/${schoolId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            listing: {
              name: form.name,
              emirate: form.emirate,
              area: form.area,
              address: form.address,
              phone: form.phone,
              email: form.email,
              website: form.website,
              short_description: form.shortDescription,
            },

            profile: {
              curricula: textToArray(form.curriculaText),
              grades: textToArray(form.gradesText),
              fee_min: numberOrNull(form.feeMin),
              fee_max: numberOrNull(form.feeMax),
              rating: form.rating,
              gender: form.gender,
              priorities: textToArray(form.prioritiesText),
              facilities: textToArray(form.facilitiesText),
            },

            details: {
              description: form.description,
              school_type: form.schoolType,
              school_phase: form.schoolPhase,
              founded_year: form.foundedYear,
              authority: form.authority,
              inspection_rating: form.inspectionRating,
              wellbeing_rating: form.wellbeingRating,
              inclusion_rating: form.inclusionRating,
              last_inspection_year: form.lastInspectionYear,
              opening_year: form.openingYear,
              teacher_turnover: form.teacherTurnover,
              principal_name: form.principalName,
              owner_name: form.ownerName,
              community: form.community,
              main_teacher_nationality: form.mainTeacherNationality,
              application_fee: form.applicationFee,
              registration_fee: form.registrationFee,
              transport_fee_note: form.transportFeeNote,
              admission_notes: form.admissionNotes,
              academics_highlights: textToArray(form.academicsHighlightsText),
              admissions_requirements: textToArray(
                form.admissionsRequirementsText
              ),
              admissions_process: textToArray(form.admissionsProcessText),
              visit_checklist: textToArray(form.visitChecklistText),
              reasons: textToArray(form.reasonsText),
            },

            fees: feeRows.map((row) => ({
              grade_name: row.gradeName,
              current_year: row.currentYear,
              current_fee: numberOrNull(row.currentFee),
              next_year: row.nextYear,
              next_fee: numberOrNull(row.nextFee),
              notes: row.notes,
              sort_order: row.sortOrder,
            })),

            availability: availabilityRows.map((row) => ({
              grade_name: row.gradeName,
              academic_year: row.academicYear,
              status: row.status,
              notes: row.notes,
              sort_order: row.sortOrder,
            })),

            contacts: contactRows.map((row) => ({
              type: row.type,
              label: row.label,
              value: row.value,
              href: row.href,
              sort_order: row.sortOrder,
            })),

            facilities: facilityRows.map((row) => ({
              facility_name: row.facilityName,
              facility_type: row.facilityType,
              is_available: row.isAvailable,
              notes: row.notes,
              sort_order: row.sortOrder,
            })),

            qa: qaRows.map((row) => ({
              question: row.question,
              answer: row.answer,
              sort_order: row.sortOrder,
            })),

            inspectionReports: preparedInspectionRows.map((row) => ({
              academic_year: row.academicYear,
              overall_rating: row.overallRating,
              inspection_authority: row.inspectionAuthority,
              report_file_name: row.reportFileName,
              report_pdf_path: row.reportPdfPath,
              notes: row.notes,
              sort_order: row.sortOrder,
            })),

            parentGuides: parentGuideRows.map((row) => ({
              title: row.title,
              items: textToArray(row.itemsText),
              sort_order: row.sortOrder,
            })),
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "Could not save school profile.");
        return;
      }

      setSchoolName(form.name.trim());
      alert("School profile updated successfully.");
    } catch {
      setError("Could not save school profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        Loading school profile...
      </main>
    );
  }

  if (error && !schoolName) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            School profile unavailable
          </h1>

          <p className="mt-3 text-slate-500">{error}</p>

          <Link
            href="/school-dashboard"
            className="mt-6 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Back to School Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/school-dashboard"
              className="text-sm font-semibold text-blue-600"
            >
              ← Back to School Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Edit School Profile
            </h1>

            <p className="mt-2 text-slate-500">
              Update public information for {schoolName}.
            </p>
          </div>

          {schoolSlug && (
            <Link
              href={`/schools/${schoolSlug}`}
              target="_blank"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              View Public Profile
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <Section title="Basic Information">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="School Name"
                value={form.name}
                onChange={(value) => updateField("name", value)}
              />

              <Input
                label="Emirate"
                value={form.emirate}
                onChange={(value) => updateField("emirate", value)}
              />

              <Input
                label="Area"
                value={form.area}
                onChange={(value) => updateField("area", value)}
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />

              <Input
                label="Public Email"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
              />

              <Input
                label="Website"
                value={form.website}
                onChange={(value) => updateField("website", value)}
              />

              <Textarea
                label="Address"
                value={form.address}
                onChange={(value) => updateField("address", value)}
              />

              <Textarea
                label="Short Description"
                value={form.shortDescription}
                onChange={(value) => updateField("shortDescription", value)}
              />
            </div>
          </Section>

          <Section title="School Summary">
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Curricula — one per line"
                value={form.curriculaText}
                onChange={(value) => updateField("curriculaText", value)}
              />

              <Textarea
                label="Grades — one per line"
                value={form.gradesText}
                onChange={(value) => updateField("gradesText", value)}
              />

              <Input
                label="Fee Range From"
                value={form.feeMin}
                onChange={(value) => updateField("feeMin", value)}
              />

              <Input
                label="Fee Range To"
                value={form.feeMax}
                onChange={(value) => updateField("feeMax", value)}
              />

              <Input
                label="Rating"
                value={form.rating}
                onChange={(value) => updateField("rating", value)}
              />

              <Input
                label="Gender"
                value={form.gender}
                onChange={(value) => updateField("gender", value)}
              />

              <Textarea
                label="Key Priorities — one per line"
                value={form.prioritiesText}
                onChange={(value) => updateField("prioritiesText", value)}
              />

              <Textarea
                label="Facilities Summary — one per line"
                value={form.facilitiesText}
                onChange={(value) => updateField("facilitiesText", value)}
              />
            </div>
          </Section>

          <Section
            title="Fees by Grade"
            action={
              <AddButton label="Add Fee Row" onClick={addFeeRow} />
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Add grade-wise current and next-year fees.
            </p>

            <div className="space-y-4">
              {feeRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Fee Row ${index + 1}`}
                  onRemove={() => removeFeeRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <SmallInput
                      label="Grade"
                      value={row.gradeName}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "gradeName", value)
                      }
                    />

                    <SmallInput
                      label="Current Year"
                      value={row.currentYear}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "currentYear", value)
                      }
                    />

                    <SmallInput
                      label="Current Fee"
                      value={row.currentFee}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "currentFee", value)
                      }
                    />

                    <SmallInput
                      label="Next Year"
                      value={row.nextYear}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "nextYear", value)
                      }
                    />

                    <SmallInput
                      label="Next Fee"
                      value={row.nextFee}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "nextFee", value)
                      }
                    />

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateFeeRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <div className="md:col-span-2">
                      <SmallInput
                        label="Notes"
                        value={row.notes}
                        onChange={(value) =>
                          updateFeeRow(row.clientId, "notes", value)
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {feeRows.length === 0 && (
                <EmptyEditorText text="No fee rows yet." />
              )}
            </div>
          </Section>

          <Section
            title="Availability by Grade"
            action={
              <AddButton
                label="Add Availability Row"
                onClick={addAvailabilityRow}
              />
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Add seat availability by grade and academic year.
            </p>

            <div className="space-y-4">
              {availabilityRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Availability Row ${index + 1}`}
                  onRemove={() => removeAvailabilityRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <SmallInput
                      label="Grade"
                      value={row.gradeName}
                      onChange={(value) =>
                        updateAvailabilityRow(row.clientId, "gradeName", value)
                      }
                    />

                    <SmallInput
                      label="Academic Year"
                      value={row.academicYear}
                      onChange={(value) =>
                        updateAvailabilityRow(
                          row.clientId,
                          "academicYear",
                          value
                        )
                      }
                    />

                    <SelectInput
                      label="Status"
                      value={row.status}
                      onChange={(value) =>
                        updateAvailabilityRow(row.clientId, "status", value)
                      }
                      options={[
                        "Open",
                        "Limited seats",
                        "Waiting list",
                        "Closed",
                        "Not updated",
                      ]}
                    />

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateAvailabilityRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <div className="md:col-span-4">
                      <SmallInput
                        label="Notes"
                        value={row.notes}
                        onChange={(value) =>
                          updateAvailabilityRow(row.clientId, "notes", value)
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {availabilityRows.length === 0 && (
                <EmptyEditorText text="No availability rows yet." />
              )}
            </div>
          </Section>

          <Section
            title="School Contacts"
            action={<AddButton label="Add Contact" onClick={addContactRow} />}
          >
            <p className="mb-4 text-sm text-slate-500">
              Add admissions email, phone, WhatsApp or website contacts.
            </p>

            <div className="space-y-4">
              {contactRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Contact ${index + 1}`}
                  onRemove={() => removeContactRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <SelectInput
                      label="Type"
                      value={row.type}
                      onChange={(value) =>
                        updateContactRow(row.clientId, "type", value)
                      }
                      options={["email", "phone", "website", "whatsapp", "other"]}
                    />

                    <SmallInput
                      label="Label"
                      value={row.label}
                      onChange={(value) =>
                        updateContactRow(row.clientId, "label", value)
                      }
                    />

                    <SmallInput
                      label="Value"
                      value={row.value}
                      onChange={(value) =>
                        updateContactRow(row.clientId, "value", value)
                      }
                    />

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateContactRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <div className="md:col-span-4">
                      <SmallInput
                        label="Href"
                        value={row.href}
                        onChange={(value) =>
                          updateContactRow(row.clientId, "href", value)
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {contactRows.length === 0 && (
                <EmptyEditorText text="No contacts yet." />
              )}
            </div>
          </Section>

          <Section
            title="Facilities"
            action={
              <AddButton label="Add Facility" onClick={addFacilityRow} />
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Add detailed facilities shown on the public profile.
            </p>

            <div className="space-y-4">
              {facilityRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Facility ${index + 1}`}
                  onRemove={() => removeFacilityRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <SmallInput
                      label="Facility Name"
                      value={row.facilityName}
                      onChange={(value) =>
                        updateFacilityRow(row.clientId, "facilityName", value)
                      }
                    />

                    <SmallInput
                      label="Facility Type"
                      value={row.facilityType}
                      onChange={(value) =>
                        updateFacilityRow(row.clientId, "facilityType", value)
                      }
                    />

                    <SelectInput
                      label="Available"
                      value={row.isAvailable ? "yes" : "no"}
                      onChange={(value) =>
                        updateFacilityRow(
                          row.clientId,
                          "isAvailable",
                          value === "yes"
                        )
                      }
                      options={["yes", "no"]}
                    />

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateFacilityRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <div className="md:col-span-4">
                      <SmallInput
                        label="Notes"
                        value={row.notes}
                        onChange={(value) =>
                          updateFacilityRow(row.clientId, "notes", value)
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {facilityRows.length === 0 && (
                <EmptyEditorText text="No detailed facilities yet." />
              )}
            </div>
          </Section>

          <Section
            title="Q&A"
            action={<AddButton label="Add Q&A" onClick={addQaRow} />}
          >
            <p className="mb-4 text-sm text-slate-500">
              Add common parent questions and answers.
            </p>

            <div className="space-y-4">
              {qaRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Q&A ${index + 1}`}
                  onRemove={() => removeQaRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="md:col-span-3">
                      <SmallInput
                        label="Question"
                        value={row.question}
                        onChange={(value) =>
                          updateQaRow(row.clientId, "question", value)
                        }
                      />
                    </div>

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateQaRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <div className="md:col-span-4">
                      <Textarea
                        label="Answer"
                        value={row.answer}
                        onChange={(value) =>
                          updateQaRow(row.clientId, "answer", value)
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {qaRows.length === 0 && (
                <EmptyEditorText text="No Q&A entries yet." />
              )}
            </div>
          </Section>

          <Section
            title="Inspection Reports"
            action={
              <AddButton
                label="Add Inspection Report"
                onClick={addInspectionRow}
              />
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Update ratings, authority and existing report details. PDF upload
              will be added once for both platform admin and school admin.
            </p>

            <div className="space-y-4">
              {inspectionRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Inspection Report ${index + 1}`}
                  onRemove={() => removeInspectionRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <SmallInput
                      label="Academic Year"
                      value={row.academicYear}
                      onChange={(value) =>
                        updateInspectionRow(
                          row.clientId,
                          "academicYear",
                          value
                        )
                      }
                    />

                    <SmallInput
                      label="Overall Rating"
                      value={row.overallRating}
                      onChange={(value) =>
                        updateInspectionRow(
                          row.clientId,
                          "overallRating",
                          value
                        )
                      }
                    />

                    <SmallInput
                      label="Authority"
                      value={row.inspectionAuthority}
                      onChange={(value) =>
                        updateInspectionRow(
                          row.clientId,
                          "inspectionAuthority",
                          value
                        )
                      }
                    />

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateInspectionRow(row.clientId, "sortOrder", value)
                      }
                    />

                    <SmallInput
                      label="File Name"
                      value={row.reportFileName}
                      onChange={(value) =>
                        updateInspectionRow(
                          row.clientId,
                          "reportFileName",
                          value
                        )
                      }
                    />
                    <div className="md:col-span-3">
  <label className="text-xs font-semibold text-slate-600">
    Upload PDF Report
  </label>

  <input
    type="file"
    accept="application/pdf"
    onChange={(event) =>
      updateInspectionRow(
        row.clientId,
        "pdfFile",
        event.target.files?.[0] || null
      )
    }
    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
  />

  {row.pdfFile && (
    <p className="mt-1 text-xs text-blue-600">
      Selected: {row.pdfFile.name}
    </p>
  )}

  {row.reportPdfPath && !row.pdfFile && (
    <p className="mt-1 text-xs text-slate-500">
      Current PDF: {row.reportPdfPath}
    </p>
  )}
</div>

                    <div className="md:col-span-3">
                      <SmallInput
                        label="Notes"
                        value={row.notes}
                        onChange={(value) =>
                          updateInspectionRow(row.clientId, "notes", value)
                        }
                      />
                    </div>

                    {row.reportPdfPath && (
                      <div className="md:col-span-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                        Existing PDF: {row.reportPdfPath}
                      </div>
                    )}
                  </div>
                </EditableRow>
              ))}

              {inspectionRows.length === 0 && (
                <EmptyEditorText text="No inspection reports yet." />
              )}
            </div>
          </Section>

          <Section
            title="Parent Guide"
            action={
              <AddButton
                label="Add Parent Guide"
                onClick={addParentGuideRow}
              />
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Add parent decision groups. Write items one per line.
            </p>

            <div className="space-y-4">
              {parentGuideRows.map((row, index) => (
                <EditableRow
                  key={row.clientId}
                  title={`Parent Guide ${index + 1}`}
                  onRemove={() => removeParentGuideRow(row.clientId)}
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="md:col-span-3">
                      <SmallInput
                        label="Title"
                        value={row.title}
                        onChange={(value) =>
                          updateParentGuideRow(row.clientId, "title", value)
                        }
                      />
                    </div>

                    <SmallInput
                      label="Sort Order"
                      value={row.sortOrder}
                      onChange={(value) =>
                        updateParentGuideRow(
                          row.clientId,
                          "sortOrder",
                          value
                        )
                      }
                    />

                    <div className="md:col-span-4">
                      <Textarea
                        label="Items — one per line"
                        value={row.itemsText}
                        onChange={(value) =>
                          updateParentGuideRow(
                            row.clientId,
                            "itemsText",
                            value
                          )
                        }
                      />
                    </div>
                  </div>
                </EditableRow>
              ))}

              {parentGuideRows.length === 0 && (
                <EmptyEditorText text="No parent guide entries yet." />
              )}
            </div>
          </Section>

          <Section title="Detailed Overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Full Description"
                value={form.description}
                onChange={(value) => updateField("description", value)}
              />

              <Textarea
                label="Admission Notes"
                value={form.admissionNotes}
                onChange={(value) => updateField("admissionNotes", value)}
              />

              <Input
                label="School Type"
                value={form.schoolType}
                onChange={(value) => updateField("schoolType", value)}
              />

              <Input
                label="School Phase"
                value={form.schoolPhase}
                onChange={(value) => updateField("schoolPhase", value)}
              />

              <Input
                label="Founded Year"
                value={form.foundedYear}
                onChange={(value) => updateField("foundedYear", value)}
              />

              <Input
                label="Authority"
                value={form.authority}
                onChange={(value) => updateField("authority", value)}
              />

              <Input
                label="Inspection Rating"
                value={form.inspectionRating}
                onChange={(value) => updateField("inspectionRating", value)}
              />

              <Input
                label="Wellbeing Rating"
                value={form.wellbeingRating}
                onChange={(value) => updateField("wellbeingRating", value)}
              />

              <Input
                label="Inclusion Rating"
                value={form.inclusionRating}
                onChange={(value) => updateField("inclusionRating", value)}
              />

              <Input
                label="Last Inspection Year"
                value={form.lastInspectionYear}
                onChange={(value) => updateField("lastInspectionYear", value)}
              />

              <Input
                label="Opening Year"
                value={form.openingYear}
                onChange={(value) => updateField("openingYear", value)}
              />

              <Input
                label="Teacher Turnover"
                value={form.teacherTurnover}
                onChange={(value) => updateField("teacherTurnover", value)}
              />

              <Input
                label="Principal Name"
                value={form.principalName}
                onChange={(value) => updateField("principalName", value)}
              />

              <Input
                label="Owner Name"
                value={form.ownerName}
                onChange={(value) => updateField("ownerName", value)}
              />

              <Input
                label="Community"
                value={form.community}
                onChange={(value) => updateField("community", value)}
              />

              <Input
                label="Main Teacher Nationality"
                value={form.mainTeacherNationality}
                onChange={(value) =>
                  updateField("mainTeacherNationality", value)
                }
              />

              <Input
                label="Application Fee"
                value={form.applicationFee}
                onChange={(value) => updateField("applicationFee", value)}
              />

              <Input
                label="Registration Fee"
                value={form.registrationFee}
                onChange={(value) => updateField("registrationFee", value)}
              />

              <Textarea
                label="Transport Fee Note"
                value={form.transportFeeNote}
                onChange={(value) => updateField("transportFeeNote", value)}
              />
            </div>
          </Section>

          <Section title="Lists and Parent Content">
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Academic Highlights — one per line"
                value={form.academicsHighlightsText}
                onChange={(value) =>
                  updateField("academicsHighlightsText", value)
                }
              />

              <Textarea
                label="Admission Requirements — one per line"
                value={form.admissionsRequirementsText}
                onChange={(value) =>
                  updateField("admissionsRequirementsText", value)
                }
              />

              <Textarea
                label="Admission Process — one per line"
                value={form.admissionsProcessText}
                onChange={(value) =>
                  updateField("admissionsProcessText", value)
                }
              />

              <Textarea
                label="Visit Checklist — one per line"
                value={form.visitChecklistText}
                onChange={(value) =>
                  updateField("visitChecklistText", value)
                }
              />

              <Textarea
                label="Reasons / Notes — one per line"
                value={form.reasonsText}
                onChange={(value) => updateField("reasonsText", value)}
              />
            </div>
          </Section>

          <div className="sticky bottom-6 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {action}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function EditableRow({
  title,
  children,
  onRemove,
}: {
  title: string;
  children: ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{title}</p>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
        >
          Remove
        </button>
      </div>

      {children}
    </div>
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {label}
    </button>
  );
}

function EmptyEditorText({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed px-4 py-5 text-sm text-slate-500">
      {text}
    </p>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SmallInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}