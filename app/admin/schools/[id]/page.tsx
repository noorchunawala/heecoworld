"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";

type FormState = {
  name: string;
  slug: string;
  emirate: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  shortDescription: string;
  sourceUrl: string;
  status: string;

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

type FeeEditorRow = {
  clientId: string;
  id?: string;
  gradeName: string;
  currentYear: string;
  currentFee: string;
  nextYear: string;
  nextFee: string;
  notes: string;
  sortOrder: string;
};

type AvailabilityEditorRow = {
  clientId: string;
  id?: string;
  gradeName: string;
  academicYear: string;
  status: string;
  notes: string;
  sortOrder: string;
};

type ContactEditorRow = {
  clientId: string;
  id?: string;
  type: string;
  label: string;
  value: string;
  href: string;
  sortOrder: string;
};

type FacilityEditorRow = {
  clientId: string;
  id?: string;
  facilityName: string;
  facilityType: string;
  isAvailable: boolean;
  notes: string;
  sortOrder: string;
};

type QaEditorRow = {
  clientId: string;
  id?: string;
  question: string;
  answer: string;
  sortOrder: string;
};

type InspectionEditorRow = {
  clientId: string;
  id?: string;
  academicYear: string;
  overallRating: string;
  inspectionAuthority: string;
  reportFileName: string;
  notes: string;
  sortOrder: string;
  reportPdfPath: string;
pdfFile?: File | null;
};

type ParentGuideEditorRow = {
  clientId: string;
  id?: string;
  title: string;
  itemsText: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  emirate: "",
  area: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  shortDescription: "",
  sourceUrl: "",
  status: "active",

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

export default function AdminSchoolEditPage() {
  const router = useRouter();
  const params = useParams();

  const schoolId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [feeRows, setFeeRows] = useState<FeeEditorRow[]>([]);
  const [availabilityRows, setAvailabilityRows] = useState<
    AvailabilityEditorRow[]
  >([]);
  const [contactRows, setContactRows] = useState<ContactEditorRow[]>([]);
  const [facilityRows, setFacilityRows] = useState<FacilityEditorRow[]>([]);
  const [inspectionRows, setInspectionRows] = useState<InspectionEditorRow[]>([]);
const [parentGuideRows, setParentGuideRows] = useState<ParentGuideEditorRow[]>([]);
const [qaRows, setQaRows] = useState<QaEditorRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    async function loadSchool() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/admin/login");
        return;
      }

      if (!schoolId) {
        alert("School id missing.");
        router.push("/admin/schools");
        return;
      }

      const [
        listingResult,
        profileResult,
        detailResult,
        feesResult,
        availabilityResult,
        contactsResult,
        facilitiesResult,
qaResult,
inspectionReportsResult,
parentGuidesResult,
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .eq("id", schoolId)
          .eq("type", "school")
          .single(),

        supabase
          .from("school_profiles")
          .select("*")
          .eq("listing_id", schoolId)
          .maybeSingle(),

        supabase
          .from("school_profile_details")
          .select("*")
          .eq("listing_id", schoolId)
          .maybeSingle(),

        supabase
          .from("school_fees")
          .select("*")
          .eq("listing_id", schoolId)
          .order("sort_order", { ascending: true }),

        supabase
          .from("school_availability")
          .select("*")
          .eq("listing_id", schoolId)
          .order("sort_order", { ascending: true }),

        supabase
          .from("school_contacts")
          .select("*")
          .eq("listing_id", schoolId)
          .order("sort_order", { ascending: true }),
             supabase
  .from("school_facilities")
  .select("*")
  .eq("listing_id", schoolId)
  .order("sort_order", { ascending: true }),

supabase
  .from("school_qa")
  .select("*")
  .eq("listing_id", schoolId)
  .order("sort_order", { ascending: true }),

supabase
  .from("school_inspection_reports")
  .select("*")
  .eq("listing_id", schoolId)
  .order("sort_order", { ascending: true }),

supabase
  .from("school_parent_guides")
  .select("*")
  .eq("listing_id", schoolId)
  .order("sort_order", { ascending: true }),

      ]);
   

      if (listingResult.error) {
        alert(listingResult.error.message);
        router.push("/admin/schools");
        return;
      }

      if (profileResult.error) {
        alert(profileResult.error.message);
        return;
      }

      if (detailResult.error) {
        alert(detailResult.error.message);
        return;
      }

      if (feesResult.error) {
        alert(feesResult.error.message);
        return;
      }

      if (availabilityResult.error) {
        alert(availabilityResult.error.message);
        return;
      }

      if (contactsResult.error) {
        alert(contactsResult.error.message);
        return;
      }
if (facilitiesResult.error) {
  alert(facilitiesResult.error.message);
  return;
}
if (inspectionReportsResult.error) {
  alert(inspectionReportsResult.error.message);
  return;
}

if (parentGuidesResult.error) {
  alert(parentGuidesResult.error.message);
  return;
}
if (qaResult.error) {
  alert(qaResult.error.message);
  return;
}
      const listing = listingResult.data;
      const profile = profileResult.data;
      const details = detailResult.data;

      setForm({
        name: listing.name || "",
        slug: listing.slug || "",
        emirate: listing.emirate || "",
        area: listing.area || "",
        address: listing.address || "",
        phone: listing.phone || "",
        email: listing.email || "",
        website: listing.website || "",
        shortDescription: listing.short_description || "",
        sourceUrl: listing.source_url || "",
        status: listing.status || "active",

        curriculaText: arrayToText(profile?.curricula),
        gradesText: arrayToText(profile?.grades),
        feeMin: profile?.fee_min?.toString() || "",
        feeMax: profile?.fee_max?.toString() || "",
        rating: profile?.rating || "",
        gender: profile?.gender || "",
        prioritiesText: arrayToText(profile?.priorities),
        facilitiesText: arrayToText(profile?.facilities),

        description: details?.description || "",
        schoolType: details?.school_type || "",
        schoolPhase: details?.school_phase || "",
        foundedYear: details?.founded_year || "",
        authority: details?.authority || "",
        inspectionRating: details?.inspection_rating || "",
        wellbeingRating: details?.wellbeing_rating || "",
        inclusionRating: details?.inclusion_rating || "",
        lastInspectionYear: details?.last_inspection_year || "",
        openingYear: details?.opening_year || "",
        teacherTurnover: details?.teacher_turnover || "",
        principalName: details?.principal_name || "",
        ownerName: details?.owner_name || "",
        community: details?.community || "",
        mainTeacherNationality: details?.main_teacher_nationality || "",

        applicationFee: details?.application_fee || "",
        registrationFee: details?.registration_fee || "",
        transportFeeNote: details?.transport_fee_note || "",
        admissionNotes: details?.admission_notes || "",

        academicsHighlightsText: arrayToText(details?.academics_highlights),
        admissionsRequirementsText: arrayToText(
          details?.admissions_requirements
        ),
        admissionsProcessText: arrayToText(details?.admissions_process),
        visitChecklistText: arrayToText(details?.visit_checklist),
        reasonsText: arrayToText(details?.reasons),
      });

      setFeeRows(
        (feesResult.data || []).map((row) => ({
          clientId: row.id || createClientId(),
          id: row.id,
          gradeName: row.grade_name || "",
          currentYear: row.current_year || "",
          currentFee: row.current_fee?.toString() || "",
          nextYear: row.next_year || "",
          nextFee: row.next_fee?.toString() || "",
          notes: row.notes || "",
          sortOrder: row.sort_order?.toString() || "",
        }))
      );

      setAvailabilityRows(
        (availabilityResult.data || []).map((row) => ({
          clientId: row.id || createClientId(),
          id: row.id,
          gradeName: row.grade_name || "",
          academicYear: row.academic_year || "",
          status: row.status || "Not updated",
          notes: row.notes || "",
          sortOrder: row.sort_order?.toString() || "",
        }))
      );

      setContactRows(
        (contactsResult.data || []).map((row) => ({
          clientId: row.id || createClientId(),
          id: row.id,
          type: row.type || "other",
          label: row.label || "",
          value: row.value || "",
          href: row.href || "",
          sortOrder: row.sort_order?.toString() || "",
        }))
      );
      setFacilityRows(
  (facilitiesResult.data || []).map((row) => ({
    clientId: row.id || createClientId(),
    id: row.id,
    facilityName: row.facility_name || "",
    facilityType: row.facility_type || "",
    isAvailable: row.is_available ?? true,
    notes: row.notes || "",
    sortOrder: row.sort_order?.toString() || "",
  }))
);

setQaRows(
  (qaResult.data || []).map((row) => ({
    clientId: row.id || createClientId(),
    id: row.id,
    question: row.question || "",
    answer: row.answer || "",
    sortOrder: row.sort_order?.toString() || "",
  }))
);

setInspectionRows(
  (inspectionReportsResult.data || []).map((row) => ({
    clientId: row.id || createClientId(),
    id: row.id,
    academicYear: row.academic_year || "",
    overallRating: row.overall_rating || "",
    inspectionAuthority: row.inspection_authority || "",
    reportFileName: row.report_file_name || "",
    notes: row.notes || "",
    sortOrder: row.sort_order?.toString() || "",
    reportPdfPath: row.report_pdf_path || "",
pdfFile: null,
  }))
);

setParentGuideRows(
  (parentGuidesResult.data || []).map((row) => ({
    clientId: row.id || createClientId(),
    id: row.id,
    title: row.title || "",
    itemsText: arrayToText(row.items),
    sortOrder: row.sort_order?.toString() || "",
  }))
);

      setLoading(false);
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
        clientId: createClientId(),
        gradeName: "",
        currentYear: "",
        currentFee: "",
        nextYear: "",
        nextFee: "",
        notes: "",
        sortOrder: (current.length + 1).toString(),
      },
    ]);
  }

  function updateFeeRow(
    clientId: string,
    key: keyof FeeEditorRow,
    value: string
  ) {
    setFeeRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [key]: value } : row
      )
    );
  }

  function removeFeeRow(clientId: string) {
    setFeeRows((current) => current.filter((row) => row.clientId !== clientId));
  }

  function addAvailabilityRow() {
    setAvailabilityRows((current) => [
      ...current,
      {
        clientId: createClientId(),
        gradeName: "",
        academicYear: "",
        status: "Not updated",
        notes: "",
        sortOrder: (current.length + 1).toString(),
      },
    ]);
  }

  function updateAvailabilityRow(
    clientId: string,
    key: keyof AvailabilityEditorRow,
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
        clientId: createClientId(),
        type: "email",
        label: "",
        value: "",
        href: "",
        sortOrder: (current.length + 1).toString(),
      },
    ]);
  }

  function updateContactRow(
    clientId: string,
    key: keyof ContactEditorRow,
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
      clientId: createClientId(),
      facilityName: "",
      facilityType: "",
      isAvailable: true,
      notes: "",
      sortOrder: (current.length + 1).toString(),
    },
  ]);
}

function updateFacilityRow(
  clientId: string,
  key: keyof FacilityEditorRow,
  value: string | boolean
) {
  setFacilityRows((current) =>
    current.map((row) =>
      row.clientId === clientId ? { ...row, [key]: value } : row
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
      clientId: createClientId(),
      question: "",
      answer: "",
      sortOrder: (current.length + 1).toString(),
    },
  ]);
}

function updateQaRow(clientId: string, key: keyof QaEditorRow, value: string) {
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
      clientId: createClientId(),
      academicYear: "",
      overallRating: "",
      inspectionAuthority: "",
      reportFileName: "",
      notes: "",
      sortOrder: (current.length + 1).toString(),
      reportPdfPath: "",
pdfFile: null,
    },
  ]);
}

function updateInspectionRow(
  clientId: string,
  key: keyof InspectionEditorRow,
  value: string | File | null
) {
  setInspectionRows((current) =>
    current.map((row) =>
      row.clientId === clientId ? { ...row, [key]: value } : row
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
      clientId: createClientId(),
      title: "",
      itemsText: "",
      sortOrder: (current.length + 1).toString(),
    },
  ]);
}

function updateParentGuideRow(
  clientId: string,
  key: keyof ParentGuideEditorRow,
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
  async function saveSchool() {
    if (!schoolId) return;

    if (!form.name.trim() || !form.slug.trim()) {
      alert("School name and slug are required.");
      return;
    }

    setSaving(true);

    const listingPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      emirate: nullIfEmpty(form.emirate),
      area: nullIfEmpty(form.area),
      address: nullIfEmpty(form.address),
      phone: nullIfEmpty(form.phone),
      email: nullIfEmpty(form.email),
      website: nullIfEmpty(form.website),
      short_description: nullIfEmpty(form.shortDescription),
      source_url: nullIfEmpty(form.sourceUrl),
      status: form.status || "active",
      type: "school",
    };

    const profilePayload = {
      listing_id: schoolId,
      curricula: textToArray(form.curriculaText),
      grades: textToArray(form.gradesText),
      fee_min: numberOrNull(form.feeMin),
      fee_max: numberOrNull(form.feeMax),
      rating: nullIfEmpty(form.rating),
      gender: nullIfEmpty(form.gender),
      priorities: textToArray(form.prioritiesText),
      facilities: textToArray(form.facilitiesText),
    };

    const detailsPayload = {
      listing_id: schoolId,
      description: nullIfEmpty(form.description),
      school_type: nullIfEmpty(form.schoolType),
      school_phase: nullIfEmpty(form.schoolPhase),
      founded_year: nullIfEmpty(form.foundedYear),
      authority: nullIfEmpty(form.authority),
      inspection_rating: nullIfEmpty(form.inspectionRating),
      wellbeing_rating: nullIfEmpty(form.wellbeingRating),
      inclusion_rating: nullIfEmpty(form.inclusionRating),
      last_inspection_year: nullIfEmpty(form.lastInspectionYear),
      opening_year: nullIfEmpty(form.openingYear),
      teacher_turnover: nullIfEmpty(form.teacherTurnover),
      principal_name: nullIfEmpty(form.principalName),
      owner_name: nullIfEmpty(form.ownerName),
      community: nullIfEmpty(form.community),
      main_teacher_nationality: nullIfEmpty(form.mainTeacherNationality),

      application_fee: nullIfEmpty(form.applicationFee),
      registration_fee: nullIfEmpty(form.registrationFee),
      transport_fee_note: nullIfEmpty(form.transportFeeNote),
      admission_notes: nullIfEmpty(form.admissionNotes),

      academics_highlights: textToArray(form.academicsHighlightsText),
      admissions_requirements: textToArray(form.admissionsRequirementsText),
      admissions_process: textToArray(form.admissionsProcessText),
      visit_checklist: textToArray(form.visitChecklistText),
      reasons: textToArray(form.reasonsText),
      updated_at: new Date().toISOString(),
    };

    const listingResult = await supabase
      .from("listings")
      .update(listingPayload)
      .eq("id", schoolId);

    if (listingResult.error) {
      alert(listingResult.error.message);
      setSaving(false);
      return;
    }

    const profileResult = await supabase
      .from("school_profiles")
      .upsert(profilePayload, { onConflict: "listing_id" });

    if (profileResult.error) {
      alert(profileResult.error.message);
      setSaving(false);
      return;
    }

    const detailsResult = await supabase
      .from("school_profile_details")
      .upsert(detailsPayload, { onConflict: "listing_id" });

    if (detailsResult.error) {
      alert(detailsResult.error.message);
      setSaving(false);
      return;
    }

    const deleteFeesResult = await supabase
      .from("school_fees")
      .delete()
      .eq("listing_id", schoolId);

    if (deleteFeesResult.error) {
      alert(deleteFeesResult.error.message);
      setSaving(false);
      return;
    }

    const feePayload = feeRows
      .filter((row) => row.gradeName.trim())
      .map((row, index) => ({
        listing_id: schoolId,
        grade_name: row.gradeName.trim(),
        current_year: nullIfEmpty(row.currentYear),
        current_fee: numberOrNull(row.currentFee),
        next_year: nullIfEmpty(row.nextYear),
        next_fee: numberOrNull(row.nextFee),
        notes: nullIfEmpty(row.notes),
        sort_order: orderNumber(row.sortOrder, index),
      }));

    if (feePayload.length > 0) {
      const insertFeesResult = await supabase
        .from("school_fees")
        .insert(feePayload);

      if (insertFeesResult.error) {
        alert(insertFeesResult.error.message);
        setSaving(false);
        return;
      }
    }

    const deleteAvailabilityResult = await supabase
      .from("school_availability")
      .delete()
      .eq("listing_id", schoolId);

    if (deleteAvailabilityResult.error) {
      alert(deleteAvailabilityResult.error.message);
      setSaving(false);
      return;
    }

    const availabilityPayload = availabilityRows
      .filter((row) => row.gradeName.trim())
      .map((row, index) => ({
        listing_id: schoolId,
        grade_name: row.gradeName.trim(),
        academic_year: nullIfEmpty(row.academicYear),
        status: row.status.trim() || "Not updated",
        notes: nullIfEmpty(row.notes),
        sort_order: orderNumber(row.sortOrder, index),
      }));

    if (availabilityPayload.length > 0) {
      const insertAvailabilityResult = await supabase
        .from("school_availability")
        .insert(availabilityPayload);

      if (insertAvailabilityResult.error) {
        alert(insertAvailabilityResult.error.message);
        setSaving(false);
        return;
      }
    }

    const deleteContactsResult = await supabase
      .from("school_contacts")
      .delete()
      .eq("listing_id", schoolId);

    if (deleteContactsResult.error) {
      alert(deleteContactsResult.error.message);
      setSaving(false);
      return;
    }

    const contactsPayload = contactRows
      .filter((row) => row.value.trim())
      .map((row, index) => ({
        listing_id: schoolId,
        type: row.type || "other",
        label: nullIfEmpty(row.label),
        value: row.value.trim(),
        href: nullIfEmpty(row.href),
        sort_order: orderNumber(row.sortOrder, index),
      }));

    if (contactsPayload.length > 0) {
      const insertContactsResult = await supabase
        .from("school_contacts")
        .insert(contactsPayload);

      if (insertContactsResult.error) {
        alert(insertContactsResult.error.message);
        setSaving(false);
        return;
      }
    }

   
    const deleteFacilitiesResult = await supabase
  .from("school_facilities")
  .delete()
  .eq("listing_id", schoolId);

if (deleteFacilitiesResult.error) {
  alert(deleteFacilitiesResult.error.message);
  setSaving(false);
  return;
}

const facilitiesPayload = facilityRows
  .filter((row) => row.facilityName.trim())
  .map((row, index) => ({
    listing_id: schoolId,
    facility_name: row.facilityName.trim(),
    facility_type: nullIfEmpty(row.facilityType),
    is_available: row.isAvailable,
    notes: nullIfEmpty(row.notes),
    sort_order: orderNumber(row.sortOrder, index),
  }));

if (facilitiesPayload.length > 0) {
  const insertFacilitiesResult = await supabase
    .from("school_facilities")
    .insert(facilitiesPayload);

  if (insertFacilitiesResult.error) {
    alert(insertFacilitiesResult.error.message);
    setSaving(false);
    return;
  }
}

const deleteQaResult = await supabase
  .from("school_qa")
  .delete()
  .eq("listing_id", schoolId);

if (deleteQaResult.error) {
  alert(deleteQaResult.error.message);
  setSaving(false);
  return;
}

const qaPayload = qaRows
  .filter((row) => row.question.trim())
  .map((row, index) => ({
    listing_id: schoolId,
    question: row.question.trim(),
    answer: nullIfEmpty(row.answer),
    sort_order: orderNumber(row.sortOrder, index),
  }));

if (qaPayload.length > 0) {
  const insertQaResult = await supabase.from("school_qa").insert(qaPayload);

  if (insertQaResult.error) {
    alert(insertQaResult.error.message);
    setSaving(false);
    return;
  }
}

const deleteInspectionReportsResult = await supabase
  .from("school_inspection_reports")
  .delete()
  .eq("listing_id", schoolId);

if (deleteInspectionReportsResult.error) {
  alert(deleteInspectionReportsResult.error.message);
  setSaving(false);
  return;
}

const inspectionReportsPayload = await Promise.all(
  inspectionRows
    .filter((row) => row.academicYear.trim())
    .map(async (row, index) => {
      let reportPdfPath = row.reportPdfPath || null;

      if (row.pdfFile) {
        reportPdfPath = await uploadInspectionReport(
          row.pdfFile,
          form.slug.trim(),
          row.academicYear.trim()
        );
      }

      return {
        listing_id: schoolId,
        academic_year: row.academicYear.trim(),
        overall_rating: nullIfEmpty(row.overallRating),
        inspection_authority: nullIfEmpty(row.inspectionAuthority),
        report_file_name: nullIfEmpty(row.reportFileName),
        report_pdf_path: reportPdfPath,
        notes: nullIfEmpty(row.notes),
        sort_order: orderNumber(row.sortOrder, index),
      };
    })
);

if (inspectionReportsPayload.length > 0) {
  const insertInspectionReportsResult = await supabase
    .from("school_inspection_reports")
    .insert(inspectionReportsPayload);

  if (insertInspectionReportsResult.error) {
    alert(insertInspectionReportsResult.error.message);
    setSaving(false);
    return;
  }
}

const deleteParentGuidesResult = await supabase
  .from("school_parent_guides")
  .delete()
  .eq("listing_id", schoolId);

if (deleteParentGuidesResult.error) {
  alert(deleteParentGuidesResult.error.message);
  setSaving(false);
  return;
}

const parentGuidesPayload = parentGuideRows
  .filter((row) => row.title.trim())
  .map((row, index) => ({
    listing_id: schoolId,
    title: row.title.trim(),
    items: textToArray(row.itemsText),
    sort_order: orderNumber(row.sortOrder, index),
  }));

if (parentGuidesPayload.length > 0) {
  const insertParentGuidesResult = await supabase
    .from("school_parent_guides")
    .insert(parentGuidesPayload);

  if (insertParentGuidesResult.error) {
    alert(insertParentGuidesResult.error.message);
    setSaving(false);
    return;
  }
}
 setSaving(false);
    alert("School updated successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading school editor...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Edit School</h1>
            <p className="text-slate-500">
              Update overview, fees, availability and contacts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/schools"
              className="bg-white border px-5 py-2 rounded-xl text-slate-900"
            >
              Back
            </Link>

            <Link
              href={`/schools/${form.slug}`}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl"
            >
              View School
            </Link>

            <button
              onClick={saveSchool}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <Section title="Basic Information">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="School Name"
              value={form.name}
              onChange={(v) => updateField("name", v)}
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(v) => updateField("slug", v)}
            />

            <Input
              label="Emirate"
              value={form.emirate}
              onChange={(v) => updateField("emirate", v)}
            />

            <Input
              label="Area"
              value={form.area}
              onChange={(v) => updateField("area", v)}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
            />

            <Input
              label="Email"
              value={form.email}
              onChange={(v) => updateField("email", v)}
            />

            <Input
              label="Website"
              value={form.website}
              onChange={(v) => updateField("website", v)}
            />

            <Input
              label="Source URL"
              value={form.sourceUrl}
              onChange={(v) => updateField("sourceUrl", v)}
            />

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Textarea
              label="Address"
              value={form.address}
              onChange={(v) => updateField("address", v)}
            />

            <Textarea
              label="Short Description"
              value={form.shortDescription}
              onChange={(v) => updateField("shortDescription", v)}
            />
          </div>
        </Section>

        <Section title="School Summary">
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea
              label="Curricula — one per line"
              value={form.curriculaText}
              onChange={(v) => updateField("curriculaText", v)}
            />

            <Textarea
              label="Grades — one per line"
              value={form.gradesText}
              onChange={(v) => updateField("gradesText", v)}
            />

            <Input
              label="Fee Min"
              value={form.feeMin}
              onChange={(v) => updateField("feeMin", v)}
            />

            <Input
              label="Fee Max"
              value={form.feeMax}
              onChange={(v) => updateField("feeMax", v)}
            />

            <Input
              label="Rating"
              value={form.rating}
              onChange={(v) => updateField("rating", v)}
            />

            <Input
              label="Gender"
              value={form.gender}
              onChange={(v) => updateField("gender", v)}
            />

            <Textarea
              label="Priorities — one per line"
              value={form.prioritiesText}
              onChange={(v) => updateField("prioritiesText", v)}
            />

            <Textarea
              label="Facilities Summary — one per line"
              value={form.facilitiesText}
              onChange={(v) => updateField("facilitiesText", v)}
            />
          </div>
        </Section>

        <Section title="Fees by Grade">
          <div className="mb-4 flex justify-between gap-4">
            <p className="text-sm text-slate-500">
              Add grade-wise current and next year fees.
            </p>

            <button
              type="button"
              onClick={addFeeRow}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add Fee Row
            </button>
          </div>

          <div className="space-y-4">
            {feeRows.map((row, index) => (
              <div
                key={row.clientId}
                className="rounded-2xl border bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    Fee Row {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeFeeRow(row.clientId)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                  <SmallInput
                    label="Grade"
                    value={row.gradeName}
                    onChange={(v) => updateFeeRow(row.clientId, "gradeName", v)}
                  />

                  <SmallInput
                    label="Current Year"
                    value={row.currentYear}
                    onChange={(v) =>
                      updateFeeRow(row.clientId, "currentYear", v)
                    }
                  />

                  <SmallInput
                    label="Current Fee"
                    value={row.currentFee}
                    onChange={(v) =>
                      updateFeeRow(row.clientId, "currentFee", v)
                    }
                  />

                  <SmallInput
                    label="Next Year"
                    value={row.nextYear}
                    onChange={(v) => updateFeeRow(row.clientId, "nextYear", v)}
                  />

                  <SmallInput
                    label="Next Fee"
                    value={row.nextFee}
                    onChange={(v) => updateFeeRow(row.clientId, "nextFee", v)}
                  />

                  <SmallInput
                    label="Sort Order"
                    value={row.sortOrder}
                    onChange={(v) => updateFeeRow(row.clientId, "sortOrder", v)}
                  />

                  <div className="md:col-span-2">
                    <SmallInput
                      label="Notes"
                      value={row.notes}
                      onChange={(v) => updateFeeRow(row.clientId, "notes", v)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {feeRows.length === 0 && (
              <EmptyEditorText text="No fee rows yet. Click Add Fee Row." />
            )}
          </div>
        </Section>

        <Section title="Availability by Grade">
          <div className="mb-4 flex justify-between gap-4">
            <p className="text-sm text-slate-500">
              Add seat availability by grade and academic year.
            </p>

            <button
              type="button"
              onClick={addAvailabilityRow}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add Availability Row
            </button>
          </div>

          <div className="space-y-4">
            {availabilityRows.map((row, index) => (
              <div
                key={row.clientId}
                className="rounded-2xl border bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    Availability Row {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeAvailabilityRow(row.clientId)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                  <SmallInput
                    label="Grade"
                    value={row.gradeName}
                    onChange={(v) =>
                      updateAvailabilityRow(row.clientId, "gradeName", v)
                    }
                  />

                  <SmallInput
                    label="Academic Year"
                    value={row.academicYear}
                    onChange={(v) =>
                      updateAvailabilityRow(row.clientId, "academicYear", v)
                    }
                  />

                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Status
                    </label>
                    <select
                      value={row.status}
                      onChange={(event) =>
                        updateAvailabilityRow(
                          row.clientId,
                          "status",
                          event.target.value
                        )
                      }
                      className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Open">Open</option>
                      <option value="Limited seats">Limited seats</option>
                      <option value="Waiting list">Waiting list</option>
                      <option value="Closed">Closed</option>
                      <option value="Not updated">Not updated</option>
                    </select>
                  </div>

                  <SmallInput
                    label="Sort Order"
                    value={row.sortOrder}
                    onChange={(v) =>
                      updateAvailabilityRow(row.clientId, "sortOrder", v)
                    }
                  />

                  <div className="md:col-span-4">
                    <SmallInput
                      label="Notes"
                      value={row.notes}
                      onChange={(v) =>
                        updateAvailabilityRow(row.clientId, "notes", v)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {availabilityRows.length === 0 && (
              <EmptyEditorText text="No availability rows yet. Click Add Availability Row." />
            )}
          </div>
        </Section>

        <Section title="School Contacts">
          <div className="mb-4 flex justify-between gap-4">
            <p className="text-sm text-slate-500">
              Add phone, email, website or WhatsApp contacts. School tour email
              notification will use contact type email.
            </p>

            <button
              type="button"
              onClick={addContactRow}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add Contact
            </button>
          </div>

          <div className="space-y-4">
            {contactRows.map((row, index) => (
              <div
                key={row.clientId}
                className="rounded-2xl border bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    Contact {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeContactRow(row.clientId)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Type
                    </label>
                    <select
                      value={row.type}
                      onChange={(event) =>
                        updateContactRow(row.clientId, "type", event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="website">Website</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <SmallInput
                    label="Label"
                    value={row.label}
                    onChange={(v) => updateContactRow(row.clientId, "label", v)}
                  />

                  <SmallInput
                    label="Value"
                    value={row.value}
                    onChange={(v) => updateContactRow(row.clientId, "value", v)}
                  />

                  <SmallInput
                    label="Sort Order"
                    value={row.sortOrder}
                    onChange={(v) =>
                      updateContactRow(row.clientId, "sortOrder", v)
                    }
                  />

                  <div className="md:col-span-4">
                    <SmallInput
                      label="Href"
                      value={row.href}
                      onChange={(v) => updateContactRow(row.clientId, "href", v)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {contactRows.length === 0 && (
              <EmptyEditorText text="No contacts yet. Click Add Contact." />
            )}
          </div>
        </Section>
<Section title="Facilities">
  <div className="mb-4 flex justify-between gap-4">
    <p className="text-sm text-slate-500">
      Add detailed facilities shown in the Facilities tab.
    </p>

    <button
      type="button"
      onClick={addFacilityRow}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Add Facility
    </button>
  </div>

  <div className="space-y-4">
    {facilityRows.map((row, index) => (
      <div key={row.clientId} className="rounded-2xl border bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-900">
            Facility {index + 1}
          </p>

          <button
            type="button"
            onClick={() => removeFacilityRow(row.clientId)}
            className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <SmallInput
            label="Facility Name"
            value={row.facilityName}
            onChange={(v) =>
              updateFacilityRow(row.clientId, "facilityName", v)
            }
          />

          <SmallInput
            label="Facility Type"
            value={row.facilityType}
            onChange={(v) =>
              updateFacilityRow(row.clientId, "facilityType", v)
            }
          />

          <div>
            <label className="text-xs font-semibold text-slate-600">
              Available
            </label>
            <select
              value={row.isAvailable ? "yes" : "no"}
              onChange={(event) =>
                updateFacilityRow(
                  row.clientId,
                  "isAvailable",
                  event.target.value === "yes"
                )
              }
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <SmallInput
            label="Sort Order"
            value={row.sortOrder}
            onChange={(v) =>
              updateFacilityRow(row.clientId, "sortOrder", v)
            }
          />

          <div className="md:col-span-4">
            <SmallInput
              label="Notes"
              value={row.notes}
              onChange={(v) => updateFacilityRow(row.clientId, "notes", v)}
            />
          </div>
        </div>
      </div>
    ))}

    {facilityRows.length === 0 && (
      <EmptyEditorText text="No facilities yet. Click Add Facility." />
    )}
  </div>
</Section>

<Section title="Q&A">
  <div className="mb-4 flex justify-between gap-4">
    <p className="text-sm text-slate-500">
      Add common parent questions and answers.
    </p>

    <button
      type="button"
      onClick={addQaRow}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Add Q&A
    </button>
  </div>

  <div className="space-y-4">
    {qaRows.map((row, index) => (
      <div key={row.clientId} className="rounded-2xl border bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-900">
            Q&A {index + 1}
          </p>

          <button
            type="button"
            onClick={() => removeQaRow(row.clientId)}
            className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
            <SmallInput
              label="Question"
              value={row.question}
              onChange={(v) => updateQaRow(row.clientId, "question", v)}
            />
          </div>

          <SmallInput
            label="Sort Order"
            value={row.sortOrder}
            onChange={(v) => updateQaRow(row.clientId, "sortOrder", v)}
          />

          <div className="md:col-span-4">
            <Textarea
              label="Answer"
              value={row.answer}
              onChange={(v) => updateQaRow(row.clientId, "answer", v)}
            />
          </div>
        </div>
      </div>
    ))}

    {qaRows.length === 0 && (
      <EmptyEditorText text="No Q&A yet. Click Add Q&A." />
    )}
  </div>
</Section>
<Section title="Inspection Reports">
   
  <div className="mb-4 flex justify-between gap-4">
    <p className="text-sm text-slate-500">
      Add inspection ratings and report links. Storage path can be used later for uploaded PDFs.
    </p>

    <button
      type="button"
      onClick={addInspectionRow}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Add Inspection Report
    </button>
  </div>

  <div className="space-y-4">
    {inspectionRows.map((row, index) => (
      <div key={row.clientId} className="rounded-2xl border bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-900">
            Inspection Report {index + 1}
          </p>

          <button
            type="button"
            onClick={() => removeInspectionRow(row.clientId)}
            className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <SmallInput
            label="Academic Year"
            value={row.academicYear}
            onChange={(v) =>
              updateInspectionRow(row.clientId, "academicYear", v)
            }
          />

          <SmallInput
            label="Overall Rating"
            value={row.overallRating}
            onChange={(v) =>
              updateInspectionRow(row.clientId, "overallRating", v)
            }
          />

          <SmallInput
            label="Authority"
            value={row.inspectionAuthority}
            onChange={(v) =>
              updateInspectionRow(row.clientId, "inspectionAuthority", v)
            }
          />

          <SmallInput
            label="Sort Order"
            value={row.sortOrder}
            onChange={(v) =>
              updateInspectionRow(row.clientId, "sortOrder", v)
            }
          />

          

         <div className="md:col-span-1">
  <SmallInput
    label="File Name"
    value={row.reportFileName}
    onChange={(v) =>
      updateInspectionRow(row.clientId, "reportFileName", v)
    }
  />
</div>
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

  {row.reportPdfPath && (
    <p className="mt-1 text-xs text-slate-500">
      Current PDF: {row.reportPdfPath}
    </p>
  )}
</div>
          <div className="md:col-span-3">
            <SmallInput
              label="Notes"
              value={row.notes}
              onChange={(v) => updateInspectionRow(row.clientId, "notes", v)}
            />
          </div>
        </div>
      </div>
    ))}

    {inspectionRows.length === 0 && (
      <EmptyEditorText text="No inspection reports yet. Click Add Inspection Report." />
    )}
  </div>
</Section>

<Section title="Parent Guide">
  <div className="mb-4 flex justify-between gap-4">
    <p className="text-sm text-slate-500">
      Add parent decision groups. Items should be written one per line.
    </p>

    <button
      type="button"
      onClick={addParentGuideRow}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Add Parent Guide
    </button>
  </div>

  <div className="space-y-4">
    {parentGuideRows.map((row, index) => (
      <div key={row.clientId} className="rounded-2xl border bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-900">
            Parent Guide {index + 1}
          </p>

          <button
            type="button"
            onClick={() => removeParentGuideRow(row.clientId)}
            className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
            <SmallInput
              label="Title"
              value={row.title}
              onChange={(v) => updateParentGuideRow(row.clientId, "title", v)}
            />
          </div>

          <SmallInput
            label="Sort Order"
            value={row.sortOrder}
            onChange={(v) =>
              updateParentGuideRow(row.clientId, "sortOrder", v)
            }
          />

          <div className="md:col-span-4">
            <Textarea
              label="Items — one per line"
              value={row.itemsText}
              onChange={(v) =>
                updateParentGuideRow(row.clientId, "itemsText", v)
              }
            />
          </div>
        </div>
      </div>
    ))}

    {parentGuideRows.length === 0 && (
      <EmptyEditorText text="No parent guide rows yet. Click Add Parent Guide." />
    )}
  </div>
</Section>
        <Section title="Detailed Overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea
              label="Full Description"
              value={form.description}
              onChange={(v) => updateField("description", v)}
            />

            <Textarea
              label="Admission Notes"
              value={form.admissionNotes}
              onChange={(v) => updateField("admissionNotes", v)}
            />

            <Input
              label="School Type"
              value={form.schoolType}
              onChange={(v) => updateField("schoolType", v)}
            />

            <Input
              label="School Phase"
              value={form.schoolPhase}
              onChange={(v) => updateField("schoolPhase", v)}
            />

            <Input
              label="Founded Year"
              value={form.foundedYear}
              onChange={(v) => updateField("foundedYear", v)}
            />

            <Input
              label="Authority"
              value={form.authority}
              onChange={(v) => updateField("authority", v)}
            />

            <Input
              label="Inspection Rating"
              value={form.inspectionRating}
              onChange={(v) => updateField("inspectionRating", v)}
            />

            <Input
              label="Wellbeing Rating"
              value={form.wellbeingRating}
              onChange={(v) => updateField("wellbeingRating", v)}
            />

            <Input
              label="Inclusion Rating"
              value={form.inclusionRating}
              onChange={(v) => updateField("inclusionRating", v)}
            />

            <Input
              label="Last Inspection Year"
              value={form.lastInspectionYear}
              onChange={(v) => updateField("lastInspectionYear", v)}
            />

            <Input
              label="Opening Year"
              value={form.openingYear}
              onChange={(v) => updateField("openingYear", v)}
            />

            <Input
              label="Teacher Turnover"
              value={form.teacherTurnover}
              onChange={(v) => updateField("teacherTurnover", v)}
            />

            <Input
              label="Principal Name"
              value={form.principalName}
              onChange={(v) => updateField("principalName", v)}
            />

            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={(v) => updateField("ownerName", v)}
            />

            <Input
              label="Community"
              value={form.community}
              onChange={(v) => updateField("community", v)}
            />

            <Input
              label="Main Teacher Nationality"
              value={form.mainTeacherNationality}
              onChange={(v) => updateField("mainTeacherNationality", v)}
            />

            <Input
              label="Application Fee"
              value={form.applicationFee}
              onChange={(v) => updateField("applicationFee", v)}
            />

            <Input
              label="Registration Fee"
              value={form.registrationFee}
              onChange={(v) => updateField("registrationFee", v)}
            />

            <Textarea
              label="Transport Fee Note"
              value={form.transportFeeNote}
              onChange={(v) => updateField("transportFeeNote", v)}
            />
          </div>
        </Section>

        <Section title="Lists and Parent Content">
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea
              label="Academic Highlights — one per line"
              value={form.academicsHighlightsText}
              onChange={(v) => updateField("academicsHighlightsText", v)}
            />

            <Textarea
              label="Admission Requirements — one per line"
              value={form.admissionsRequirementsText}
              onChange={(v) => updateField("admissionsRequirementsText", v)}
            />

            <Textarea
              label="Admission Process — one per line"
              value={form.admissionsProcessText}
              onChange={(v) => updateField("admissionsProcessText", v)}
            />

            <Textarea
              label="Visit Checklist — one per line"
              value={form.visitChecklistText}
              onChange={(v) => updateField("visitChecklistText", v)}
            />

            <Textarea
              label="Reasons / Notes — one per line"
              value={form.reasonsText}
              onChange={(v) => updateField("reasonsText", v)}
            />
          </div>
        </Section>

        <div className="sticky bottom-6 mt-8 flex justify-end">
          <button
            onClick={saveSchool}
            disabled={saving}
            className="rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
async function uploadInspectionReport(file: File, schoolSlug: string, year: string) {
  const filePath = `${schoolSlug}/${year}-${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from("inspection-reports")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  return filePath;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Input({
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
      <input
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

function EmptyEditorText({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function arrayToText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.filter(Boolean).join("\n");
}

function textToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullIfEmpty(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value: string) {
  const cleaned = value.replace(/,/g, "").trim();

  if (!cleaned) return null;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function orderNumber(value: string, index: number) {
  const cleaned = value.trim();

  if (!cleaned) return index + 1;

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : index + 1;
}

function createClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}