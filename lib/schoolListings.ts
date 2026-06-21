import { supabase } from "@/lib/SupabaseClient";

export type SchoolListing = {
  id: string;
  name: string;
  slug: string;
  emirate: string;
  area: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  shortDescription?: string;
  sourceUrl?: string;

  curricula: string[];
  grades: string[];
  feeRange: {
    min: number;
    max: number;
  };
  rating?: string;
  gender?: string;
  priorities: string[];
  facilities: string[];
};

export type SchoolFeeRow = {
  id?: string;
  gradeName: string;
  currentYear?: string;
  currentFee?: number | string | null;
  nextYear?: string;
  nextFee?: number | string | null;
  notes?: string | null;
  sortOrder?: number;
};

export type SchoolAvailabilityRow = {
  id?: string;
  gradeName: string;
  academicYear?: string;
  status: string;
  notes?: string | null;
  sortOrder?: number;
};

export type SchoolInspectionReport = {
  id?: string;
  academicYear: string;
  overallRating?: string | null;
  inspectionAuthority?: string | null;
  reportPdfPath?: string | null;
  reportFileName?: string | null;
  notes?: string | null;
  sortOrder?: number;
};

export type SchoolFacility = {
  id?: string;
  facilityName: string;
  facilityType?: string | null;
  isAvailable?: boolean;
  notes?: string | null;
  sortOrder?: number;
};

export type SchoolQa = {
  id?: string;
  question: string;
  answer?: string | null;
  sortOrder?: number;
};

export type SchoolContact = {
  id?: string;
  type: "phone" | "email" | "website" | "whatsapp" | "other";
  label?: string;
  value: string;
  href?: string;
  sortOrder?: number;
};

export type DecisionGroup = {
  id?: string;
  title: string;
  items: string[];
  sortOrder?: number;
};

export type SchoolDetailListing = Omit<SchoolListing, "facilities"> & {
  heroVideoUrl?: string | null;
  heroVideoPosterUrl?: string | null;
  heroImageUrl?: string | null;

  description?: string;

  schoolType?: string;
  schoolPhase?: string;
  foundedYear?: number | string;
  authority?: string;
  inspectionRating?: string;
  wellbeingRating?: string;
  inclusionRating?: string;
  lastInspectionYear?: string;
  status?: string;
  openingYear?: string;
  teacherTurnover?: string;
  principalName?: string;
  ownerName?: string;
  community?: string;
  mainTeacherNationality?: string;

  applicationFee?: number | string | null;
  registrationFee?: number | string | null;
  transportFeeNote?: string | null;
  admissionNotes?: string;

  academicsHighlights?: string[];
  admissionsRequirements?: string[];
  admissionsProcess?: string[];
  visitChecklist?: string[];
  reasons?: string[];

  feesByGrade?: SchoolFeeRow[];
  availabilityByGrade?: SchoolAvailabilityRow[];
  facilities?: SchoolFacility[];
  inspectionReports?: SchoolInspectionReport[];
  parentGuides?: DecisionGroup[];
  qa?: SchoolQa[];
  contacts?: SchoolContact[];
};

type SchoolProfileRow = {
  curricula: string[] | null;
  grades: string[] | null;
  fee_min: number | null;
  fee_max: number | null;
  rating: string | null;
  gender: string | null;
  priorities: string[] | null;
  facilities: string[] | null;
};

type ListingRow = {
  id: string;
  name: string;
  slug: string;
  emirate: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  short_description: string | null;
  source_url: string | null;
  school_profiles: SchoolProfileRow[] | SchoolProfileRow | null;
};

type SchoolDetailRow = ListingRow & {
 school_profile_details:
  | {
      hero_video_url: string | null;
      hero_video_poster_url: string | null;
      hero_image_url: string | null;
      description: string | null;
      school_type: string | null;
      school_phase: string | null;
      founded_year: string | null;
      authority: string | null;
      inspection_rating: string | null;
      wellbeing_rating: string | null;
      inclusion_rating: string | null;
      last_inspection_year: string | null;
      opening_year: string | null;
      teacher_turnover: string | null;
      principal_name: string | null;
      owner_name: string | null;
      community: string | null;
      main_teacher_nationality: string | null;
      application_fee: string | null;
      registration_fee: string | null;
      transport_fee_note: string | null;
      admission_notes: string | null;
      academics_highlights: string[] | null;
      admissions_requirements: string[] | null;
      admissions_process: string[] | null;
      visit_checklist: string[] | null;
      reasons: string[] | null;
    }
  | {
      hero_video_url: string | null;
      hero_video_poster_url: string | null;
      hero_image_url: string | null;
      description: string | null;
      school_type: string | null;
      school_phase: string | null;
      founded_year: string | null;
      authority: string | null;
      inspection_rating: string | null;
      wellbeing_rating: string | null;
      inclusion_rating: string | null;
      last_inspection_year: string | null;
      opening_year: string | null;
      teacher_turnover: string | null;
      principal_name: string | null;
      owner_name: string | null;
      community: string | null;
      main_teacher_nationality: string | null;
      application_fee: string | null;
      registration_fee: string | null;
      transport_fee_note: string | null;
      admission_notes: string | null;
      academics_highlights: string[] | null;
      admissions_requirements: string[] | null;
      admissions_process: string[] | null;
      visit_checklist: string[] | null;
      reasons: string[] | null;
    }[]
  | null;

  school_fees: {
    id: string;
    grade_name: string;
    current_year: string | null;
    current_fee: number | null;
    next_year: string | null;
    next_fee: number | null;
    notes: string | null;
    sort_order: number | null;
  }[];

  school_availability: {
    id: string;
    grade_name: string;
    academic_year: string | null;
    status: string | null;
    notes: string | null;
    sort_order: number | null;
  }[];

  school_facilities: {
    id: string;
    facility_name: string;
    facility_type: string | null;
    is_available: boolean | null;
    notes: string | null;
    sort_order: number | null;
  }[];

  school_inspection_reports: {
    id: string;
    academic_year: string;
    overall_rating: string | null;
    inspection_authority: string | null;
    report_pdf_path: string | null,
    report_file_name: string | null;
    notes: string | null;
    sort_order: number | null;
  }[];

  school_parent_guides: {
    id: string;
    title: string;
    items: string[] | null;
    sort_order: number | null;
  }[];

  school_qa: {
    id: string;
    question: string;
    answer: string | null;
    sort_order: number | null;
  }[];

  school_contacts: {
    id: string;
    type: "phone" | "email" | "website" | "whatsapp" | "other";
    label: string | null;
    value: string;
    href: string | null;
    sort_order: number | null;
  }[];
};

function mapBaseSchoolRow(school: ListingRow): SchoolListing {
  const profile = Array.isArray(school.school_profiles)
  ? school.school_profiles[0]
  : school.school_profiles;

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    emirate: school.emirate || "",
    area: school.area || "",
    address: school.address || undefined,
    phone: school.phone || undefined,
    email: school.email || undefined,
    website: school.website || undefined,
    shortDescription: school.short_description || undefined,
    sourceUrl: school.source_url || undefined,

    curricula: profile?.curricula || [],
    grades: profile?.grades || [],
    feeRange: {
      min: profile?.fee_min || 0,
      max: profile?.fee_max || 0,
    },
    rating: profile?.rating || undefined,
    gender: profile?.gender || undefined,
    priorities: profile?.priorities || [],
    facilities: profile?.facilities || [],
  };
}

export async function getSchoolListings(): Promise<SchoolListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      name,
      slug,
      emirate,
      area,
      address,
      phone,
      email,
      website,
      short_description,
      source_url,
      school_profiles (
        curricula,
        grades,
        fee_min,
        fee_max,
        rating,
        gender,
        priorities,
        facilities
      )
    `
    )
    .eq("type", "school")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching school listings:", error);
    return [];
  }

  return ((data as unknown as ListingRow[]) || []).map(mapBaseSchoolRow);
}

export async function getSchoolListingBySlug(
  slug: string
): Promise<SchoolDetailListing | null> {
  const cleanSlug = slug.trim().toLowerCase();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      name,
      slug,
      emirate,
      area,
      address,
      phone,
      email,
      website,
      short_description,
      source_url,

      school_profiles (
        curricula,
        grades,
        fee_min,
        fee_max,
        rating,
        gender,
        priorities,
        facilities
      ),

      school_profile_details (
        hero_video_url,
        hero_video_poster_url,
        hero_image_url,
        description,
        school_type,
        school_phase,
        founded_year,
        authority,
        inspection_rating,
        wellbeing_rating,
        inclusion_rating,
        last_inspection_year,
        opening_year,
        teacher_turnover,
        principal_name,
        owner_name,
        community,
        main_teacher_nationality,
        application_fee,
        registration_fee,
        transport_fee_note,
        admission_notes,
        academics_highlights,
        admissions_requirements,
        admissions_process,
        visit_checklist,
        reasons
      ),

      school_fees (
        id,
        grade_name,
        current_year,
        current_fee,
        next_year,
        next_fee,
        notes,
        sort_order
      ),

      school_availability (
        id,
        grade_name,
        academic_year,
        status,
        notes,
        sort_order
      ),

      school_facilities (
        id,
        facility_name,
        facility_type,
        is_available,
        notes,
        sort_order
      ),

      school_inspection_reports (
        id,
        academic_year,
        overall_rating,
        inspection_authority,
       report_pdf_path,
        report_file_name,
        notes,
        sort_order
      ),

      school_parent_guides (
        id,
        title,
        items,
        sort_order
      ),

      school_qa (
        id,
        question,
        answer,
        sort_order
      ),

      school_contacts (
        id,
        type,
        label,
        value,
        href,
        sort_order
      )
    `
    )
    .eq("type", "school")
    .eq("status", "active")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching school by slug:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const school = data as unknown as SchoolDetailRow;
  const baseSchool = mapBaseSchoolRow(school);
  const details = Array.isArray(school.school_profile_details)
  ? school.school_profile_details[0]
  : school.school_profile_details;

  const detailedFacilities: SchoolFacility[] =
    school.school_facilities?.length > 0
      ? school.school_facilities.map((facility) => ({
          id: facility.id,
          facilityName: facility.facility_name,
          facilityType: facility.facility_type,
          isAvailable: facility.is_available ?? true,
          notes: facility.notes,
          sortOrder: facility.sort_order || 0,
        }))
      : baseSchool.facilities.map((facility, index) => ({
          id: `${facility}-${index}`,
          facilityName: facility,
          isAvailable: true,
          sortOrder: index,
        }));

  return {
    ...baseSchool,

    heroVideoUrl: details?.hero_video_url || null,
    heroVideoPosterUrl: details?.hero_video_poster_url || null,
    heroImageUrl: details?.hero_image_url || null,

    description: details?.description || baseSchool.shortDescription,

    schoolType: details?.school_type || undefined,
    schoolPhase: details?.school_phase || undefined,
    foundedYear: details?.founded_year || undefined,
    authority: details?.authority || undefined,
    inspectionRating: details?.inspection_rating || baseSchool.rating,
    wellbeingRating: details?.wellbeing_rating || undefined,
    inclusionRating: details?.inclusion_rating || undefined,
    lastInspectionYear: details?.last_inspection_year || undefined,
    openingYear: details?.opening_year || undefined,
    teacherTurnover: details?.teacher_turnover || undefined,
    principalName: details?.principal_name || undefined,
    ownerName: details?.owner_name || undefined,
    community: details?.community || undefined,
    mainTeacherNationality: details?.main_teacher_nationality || undefined,

    applicationFee: details?.application_fee || undefined,
    registrationFee: details?.registration_fee || undefined,
    transportFeeNote: details?.transport_fee_note || undefined,
    admissionNotes: details?.admission_notes || undefined,

    academicsHighlights: details?.academics_highlights || [],
    admissionsRequirements: details?.admissions_requirements || [],
    admissionsProcess: details?.admissions_process || [],
    visitChecklist: details?.visit_checklist || [],
    reasons: details?.reasons || [],

    feesByGrade:
      school.school_fees?.map((fee) => ({
        id: fee.id,
        gradeName: fee.grade_name,
        currentYear: fee.current_year || undefined,
        currentFee: fee.current_fee,
        nextYear: fee.next_year || undefined,
        nextFee: fee.next_fee,
        notes: fee.notes,
        sortOrder: fee.sort_order || 0,
      })) || [],

    availabilityByGrade:
      school.school_availability?.map((item) => ({
        id: item.id,
        gradeName: item.grade_name,
        academicYear: item.academic_year || undefined,
        status: item.status || "Not updated",
        notes: item.notes,
        sortOrder: item.sort_order || 0,
      })) || [],

    facilities: detailedFacilities,

    inspectionReports:
      school.school_inspection_reports?.map((report) => ({
        id: report.id,
        academicYear: report.academic_year,
        overallRating: report.overall_rating,
        inspectionAuthority: report.inspection_authority,
        reportPdfPath: report.report_pdf_path,
        reportFileName: report.report_file_name,
        notes: report.notes,
        sortOrder: report.sort_order || 0,
      })) || [],

    parentGuides:
      school.school_parent_guides?.map((guide) => ({
        id: guide.id,
        title: guide.title,
        items: guide.items || [],
        sortOrder: guide.sort_order || 0,
      })) || [],

    qa:
      school.school_qa?.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        sortOrder: item.sort_order || 0,
      })) || [],

    contacts:
      school.school_contacts?.map((contact) => ({
        id: contact.id,
        type: contact.type || "other",
        label: contact.label || undefined,
        value: contact.value,
        href: contact.href || undefined,
        sortOrder: contact.sort_order || 0,
      })) || [],
  };
}