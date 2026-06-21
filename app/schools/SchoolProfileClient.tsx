"use client";

import { useEffect,useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  GitCompare,
  Globe2,
  Mail,
  MapPin,
  Phone,
  School,
} from "lucide-react";
import type { SchoolDetailListing } from "@/lib/schoolListings";
import { supabase } from "@/lib/SupabaseClient";

type TabKey =
  | "overview"
  | "fees"
  | "academics"
  | "facilities"
  | "admissions"
  | "inspection"
  | "parentGuide"
  | "visitChecklist"
  | "qa"
  | "contact";

type SchoolFeeRow = {
  id?: string;
  gradeName: string;
  currentYear?: string;
  currentFee?: number | string | null;
  nextYear?: string;
  nextFee?: number | string | null;
  notes?: string | null;
  sortOrder?: number;
};

type SchoolAvailabilityRow = {
  id?: string;
  gradeName: string;
  academicYear?: string;
  status: string;
  notes?: string | null;
  sortOrder?: number;
};

type SchoolInspectionReport = {
  id?: string;
  academicYear: string;
  overallRating?: string | null;
  inspectionAuthority?: string | null;
  reportPdfPath?: string | null;
  reportFileName?: string | null;
  notes?: string | null;
  sortOrder?: number;
};

type SchoolFacility = {
  id?: string;
  facilityName: string;
  facilityType?: string | null;
  isAvailable?: boolean;
  notes?: string | null;
  sortOrder?: number;
};

type SchoolQa = {
  id?: string;
  question: string;
  answer?: string | null;
  sortOrder?: number;
};

type SchoolContact = {
  id?: string;
  type: "phone" | "email" | "website" | "whatsapp" | "other";
  label?: string;
  value: string;
  href?: string;
  sortOrder?: number;
};

type DecisionGroup = {
  id?: string;
  title: string;
  items: string[];
  sortOrder?: number;
};

type SchoolProfile = Omit<SchoolDetailListing, "facilities"> & {
  heroVideoUrl?: string | null;
  heroVideoPosterUrl?: string | null;
  heroImageUrl?: string | null;

  description?: string;

  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };

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

  feesByGrade?: SchoolFeeRow[];
  availabilityByGrade?: SchoolAvailabilityRow[];
  facilities?: Array<SchoolFacility | string>;
  inspectionReports?: SchoolInspectionReport[];
  parentGuides?: DecisionGroup[];
  visitChecklist?: string[];
  qa?: SchoolQa[];
  contacts?: SchoolContact[];

  academicsHighlights?: string[];
  admissionsRequirements?: string[];
  admissionsProcess?: string[];
  admissionNotes?: string;
  applicationFee?: number | string | null;
  registrationFee?: number | string | null;
  transportFeeNote?: string | null;

  reasons?: string[];
};

const profileTabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "fees", label: "Fees & Availability" },
  { key: "academics", label: "Academics" },
  { key: "facilities", label: "Facilities" },
  { key: "inspection", label: "Inspection" },
  { key: "parentGuide", label: "Parent Guide" },
  { key: "qa", label: "Q&A" },
  { key: "contact", label: "Contact" },
];

export default function SchoolProfileClient({
  school,
}: {
  school: SchoolProfile;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  useEffect(() => {
  async function trackSchoolView() {
    if (!school?.id) return;

    const sessionKey = `school-view-${school.id}`;

    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    sessionStorage.setItem(sessionKey, "true");

  const { error } = await supabase.from("school_page_views").insert({
  listing_id: school.id,
  school_name: school.name || "Unknown school",
  school_slug: school.slug || window.location.pathname.split("/").pop() || "unknown",
  page_path: window.location.pathname,
  referrer: document.referrer || null,
  user_agent: navigator.userAgent || null,
});

    if (error) {
      console.error("Error tracking school page view:", error);
    }
  }

  trackSchoolView();
}, [school.id, school.name, school.slug]);

  const hasFeeRange =
    Boolean(school.feeRange?.min) && Boolean(school.feeRange?.max);

  const feeRangeText = hasFeeRange
    ? `AED ${school.feeRange!.min.toLocaleString()} - AED ${school.feeRange!.max.toLocaleString()}`
    : "Not added by admin";

  const inspectionRatingText = school.inspectionRating || school.rating;

  const sortedFees = useMemo(
    () => sortByOrder(school.feesByGrade || []),
    [school.feesByGrade]
  );

  const sortedAvailability = useMemo(
    () => sortByOrder(school.availabilityByGrade || []),
    [school.availabilityByGrade]
  );

  const sortedFacilities = useMemo(() => {
    const normalizedFacilities: SchoolFacility[] = (school.facilities || []).map(
      (facility, index) => {
        if (typeof facility === "string") {
          return {
            id: `${facility}-${index}`,
            facilityName: facility,
            isAvailable: true,
            sortOrder: index,
          };
        }

        return facility;
      }
    );

    return sortByOrder(normalizedFacilities);
  }, [school.facilities]);

  const sortedReports = useMemo(
    () => sortByOrder(school.inspectionReports || []),
    [school.inspectionReports]
  );

  const sortedParentGuides = useMemo(() => {
    if (school.parentGuides && school.parentGuides.length > 0) {
      return sortByOrder(school.parentGuides);
    }

    const legacyGroups: DecisionGroup[] = [];

    if (school.priorities && school.priorities.length > 0) {
      legacyGroups.push({
        title: "Why parents may shortlist this school",
        items: school.priorities,
      });
    }

    if (school.reasons && school.reasons.length > 0) {
      legacyGroups.push({
        title: "Useful things to consider",
        items: school.reasons,
      });
    }

    return legacyGroups;
  }, [school.parentGuides, school.priorities, school.reasons]);

  const sortedQa = useMemo(() => sortByOrder(school.qa || []), [school.qa]);

  const contacts = useMemo(() => {
    if (school.contacts && school.contacts.length > 0) {
      return sortByOrder(school.contacts);
    }

    const fallbackContacts: SchoolContact[] = [];

    if (school.phone) {
      fallbackContacts.push({
        type: "phone",
        label: "Phone",
        value: school.phone,
        href: `tel:${school.phone}`,
      });
    }

    if (school.email) {
      fallbackContacts.push({
        type: "email",
        label: "Email",
        value: school.email,
        href: `mailto:${school.email}`,
      });
    }

    if (school.website) {
      fallbackContacts.push({
        type: "website",
        label: "Website",
        value: school.website,
        href: school.website,
      });
    }

    return fallbackContacts;
  }, [school.contacts, school.phone, school.email, school.website]);

  const address =
    school.location?.address ||
    school.address ||
    [school.area, school.emirate].filter(Boolean).join(", ");

  const hasCoordinates =
    typeof school.location?.lat === "number" &&
    typeof school.location?.lng === "number";

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${school.location?.lat},${school.location?.lng}&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(
        address || school.name
      )}&output=embed`;

      console.log("Inspection reports:", sortedReports);

  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-14 sm:px-6 lg:px-8">
        {school.heroVideoUrl ? (
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            src={school.heroVideoUrl}
            poster={school.heroVideoPosterUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : school.heroImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45"
            style={{
              backgroundImage: `url(${school.heroImageUrl})`,
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-[#071B33]/72" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <Button
            asChild
            variant="outline"
            className="mb-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/schools">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to schools
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
                <School className="h-4 w-4" />
                School Profile
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {school.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                {school.emirate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                    <MapPin className="h-4 w-4 text-[#D6B46A]" />
                    {school.emirate}
                  </span>
                )}

                {(school.curricula || []).map((curriculum) => (
                  <span
                    key={curriculum}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {curriculum}
                  </span>
                ))}
              </div>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                {school.description ||
                  school.shortDescription ||
                  "Explore school details, fees, curriculum, inspection reports, facilities and parent decision points before shortlisting or booking a tour."}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur">
              <p className="text-sm text-slate-300">Fee range</p>

              <p className="mt-2 text-3xl font-semibold text-[#D6B46A]">
                {feeRangeText}
              </p>

              <p className="mt-2 text-sm text-slate-300">per academic year</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  asChild
                  className="rounded-full bg-[#D6B46A] text-[#071B33] hover:bg-[#E3C982]"
                >
                  <Link href={`/school-tour?schoolId=${school.id}`}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Book Tour
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link href={`/compare?schoolId=${school.id}`}>
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare
                  </Link>
                </Button>

                <FavoriteButton schoolId={school.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 border-b border-[#E8DCC8] bg-[#F8F1E7]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto py-4">
          {profileTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition",
                  isActive
                    ? "border-[#071B33] bg-[#071B33] text-white"
                    : "border-[#D6B46A]/30 bg-white text-[#071B33] hover:bg-[#071B33] hover:text-white",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            {activeTab === "overview" && (
              <SectionCard eyebrow="Overview" title="School information">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <InfoCard label="Emirate" value={school.emirate} />
                  <InfoCard label="Area" value={school.area} />
                  <InfoCard
                    label="Curriculum"
                    value={school.curricula?.join(", ")}
                  />
                  <InfoCard label="Grades" value={school.grades?.join(", ")} />
                  <InfoCard label="School type" value={school.schoolType} />
                  <InfoCard label="School phase" value={school.schoolPhase} />
                  <InfoCard label="Gender" value={school.gender} />
                  <InfoCard label="Founded" value={school.foundedYear} />
                  <InfoCard label="Authority" value={school.authority} />
                  <InfoCard
                    label="Inspection rating"
                    value={inspectionRatingText}
                  />
                  <InfoCard label="Status" value={school.status} />
                  <InfoCard label="Principal" value={school.principalName} />
                  <InfoCard label="Owner" value={school.ownerName} />
                  <InfoCard label="Community" value={school.community} />
                  <InfoCard
                    label="Teacher turnover"
                    value={school.teacherTurnover}
                  />
                </div>
              </SectionCard>
            )}

            {activeTab === "fees" && (
              <SectionCard
                eyebrow="Fees & Availability"
                title="Annual fees and seat availability"
                description=""
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label="Fee range" value={feeRangeText} />
                  <InfoCard
                    label="Application fee"
                    value={formatMoneyOrText(school.applicationFee)}
                  />
                  <InfoCard
                    label="Registration fee"
                    value={formatMoneyOrText(school.registrationFee)}
                  />
                  <InfoCard
                    label="Transport fee"
                    value={school.transportFeeNote}
                  />
                </div>

                <DataBlock
                  title="Annual fees by grade"
                  description=""
                >
                  {sortedFees.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            <TableHead>Grade / Year</TableHead>
                            <TableHead>Current year</TableHead>
                            <TableHead>Current fee</TableHead>
                            <TableHead>Next year</TableHead>
                            <TableHead>Next fee</TableHead>
                            <TableHead>Notes</TableHead>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sortedFees.map((fee, index) => (
                            <tr key={fee.id || `${fee.gradeName}-${index}`}>
                              <TableCell strong>{fee.gradeName}</TableCell>
                              <TableCell>{fee.currentYear}</TableCell>
                              <TableCell>
                                {formatMoneyOrText(fee.currentFee)}
                              </TableCell>
                              <TableCell>{fee.nextYear}</TableCell>
                              <TableCell>
                                {formatMoneyOrText(fee.nextFee)}
                              </TableCell>
                              <TableCell>{fee.notes}</TableCell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No grade-wise fees added by admin yet." />
                  )}
                </DataBlock>

                <DataBlock
                  title="Availability by grade"
                  description=""
                >
                  {sortedAvailability.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            <TableHead>Grade / Year</TableHead>
                            <TableHead>Academic year</TableHead>
                            <TableHead>Seat status</TableHead>
                            <TableHead>Notes</TableHead>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sortedAvailability.map((item, index) => (
                            <tr key={item.id || `${item.gradeName}-${index}`}>
                              <TableCell strong>{item.gradeName}</TableCell>
                              <TableCell>{item.academicYear}</TableCell>
                              <TableCell>
                                <StatusPill label={item.status} />
                              </TableCell>
                              <TableCell>{item.notes}</TableCell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No availability rows added by admin yet." />
                  )}
                </DataBlock>
              </SectionCard>
            )}

            {activeTab === "academics" && (
              <SectionCard
                eyebrow="Academics"
                title="Curriculum and learning approach"
                description=""
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    label="Curriculum taught"
                    value={school.curricula?.join(", ")}
                  />
                  <InfoCard
                    label="Grade range"
                    value={school.grades?.join(", ")}
                  />
                  <InfoCard label="Authority" value={school.authority} />
                  <InfoCard
                    label="Main teacher nationality"
                    value={school.mainTeacherNationality}
                  />
                </div>

                <ListBlock
                  title="Academic highlights"
                  items={school.academicsHighlights || []}
                  emptyMessage="No academic highlights added by admin yet."
                />
              </SectionCard>
            )}

            {activeTab === "facilities" && (
              <SectionCard
                eyebrow="Facilities"
                title="Campus facilities"
                description=""
              >
                {sortedFacilities.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sortedFacilities.map((facility, index) => (
                      <div
                        key={facility.id || `${facility.facilityName}-${index}`}
                        className="rounded-2xl bg-[#FAF7F0] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-[#071B33]">
                              {facility.facilityName}
                            </h3>
                            {facility.facilityType && (
                              <p className="mt-1 text-sm text-slate-500">
                                {facility.facilityType}
                              </p>
                            )}
                          </div>

                          <StatusPill
                            label={
                              facility.isAvailable === false
                                ? "Not available"
                                : "Available"
                            }
                          />
                        </div>

                        {facility.notes && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {facility.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No facilities added by admin yet." />
                )}
              </SectionCard>
            )}

            {activeTab === "admissions" && (
              <SectionCard
                eyebrow="Admissions"
                title="Admissions process and requirements"
                description=""
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard label="Admission status" value={school.status} />
                  <InfoCard
                    label="Application fee"
                    value={formatMoneyOrText(school.applicationFee)}
                  />
                  <InfoCard
                    label="Registration fee"
                    value={formatMoneyOrText(school.registrationFee)}
                  />
                  <InfoCard label="Notes" value={school.admissionNotes} />
                </div>

                <ListBlock
                  title="Required documents"
                  items={school.admissionsRequirements || []}
                  emptyMessage="No admission requirements added by admin yet."
                />

                <ListBlock
                  title="Admission process"
                  items={school.admissionsProcess || []}
                  emptyMessage="No admission process steps added by admin yet."
                />
              </SectionCard>
            )}

            {activeTab === "inspection" && (
              <SectionCard
                eyebrow="Inspection"
                title="Year-wise inspection reports"
                description=""
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard
                    label="Current rating"
                    value={inspectionRatingText}
                  />
                  <InfoCard
                    label="Wellbeing rating"
                    value={school.wellbeingRating}
                  />
                  <InfoCard
                    label="Inclusion rating"
                    value={school.inclusionRating}
                  />
                  <InfoCard
                    label="Last inspection"
                    value={school.lastInspectionYear}
                  />
                </div>

                <DataBlock
                  title="Inspection rating history"
                  description=""
                >
                  {sortedReports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-white text-slate-500">
                          <tr>
                            <TableHead>Academic year</TableHead>
                            <TableHead>Authority</TableHead>
                            <TableHead>Overall rating</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Report</TableHead>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sortedReports.map((report, index) => (
                            
                            <tr
                              key={
                                report.id || `${report.academicYear}-${index}`
                              }
                            >
                              <TableCell strong>
                                {report.academicYear}
                              </TableCell>
                              <TableCell>
                                {report.inspectionAuthority}
                              </TableCell>
                              <TableCell>
                                <StatusPill
                                  label={
                                    report.overallRating || "Not available"
                                  }
                                />
                              </TableCell>
                              <TableCell>{report.notes}</TableCell>
                            <TableCell>
  {report.reportPdfPath ? (
    <a
      href={
        supabase.storage
          .from("inspection-reports")
          .getPublicUrl(report.reportPdfPath).data.publicUrl
      }
      target="_blank"
      rel="noreferrer"
      download={report.reportFileName || undefined}
      className="inline-flex items-center gap-2 rounded-full bg-[#071B33] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0B2A4D]"
    >
      <Download className="h-4 w-4" />
      Download
    </a>
  ) : (
    <span className="text-sm text-slate-400">Not uploaded</span>
  )}
</TableCell>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No inspection reports added by admin yet." />
                  )}
                </DataBlock>
              </SectionCard>
            )}

            {activeTab === "parentGuide" && (
              <SectionCard
                eyebrow="Parent Guide"
                title="Decision guide for parents"
                description=""
              >
                {sortedParentGuides.length > 0 ? (
                  <div className="grid gap-4">
                    {sortedParentGuides.map((group, index) => (
                      <DecisionBox
                        key={group.id || `${group.title}-${index}`}
                        title={group.title}
                        items={group.items}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No parent guide content added by admin yet." />
                )}
              </SectionCard>
            )}

            {activeTab === "visitChecklist" && (
              <SectionCard
                eyebrow="Visit Checklist"
                title="Questions to ask during your school visit"
                description=""
              >
                <ListBlock
                  title="School visit checklist"
                  items={school.visitChecklist || []}
                  emptyMessage="No visit checklist added by admin yet."
                />
              </SectionCard>
            )}

            {activeTab === "qa" && (
              <SectionCard
                eyebrow="Q&A"
                title="Common parent questions"
                description=""
              >
                {sortedQa.length > 0 ? (
                  <div className="space-y-4">
                    {sortedQa.map((item, index) => (
                      <div
                        key={item.id || `${item.question}-${index}`}
                        className="rounded-2xl bg-[#FAF7F0] p-5"
                      >
                        <h3 className="font-semibold text-[#071B33]">
                          {item.question}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {item.answer || "Answer not added yet."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No Q&A added by admin yet." />
                )}
              </SectionCard>
            )}

            {activeTab === "contact" && (
              <SectionCard
                eyebrow="Contact"
                title="Location and contact information"
                description=""
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {contacts.length > 0 ? (
                    contacts.map((contact, index) => (
                      <ContactCard
                        key={contact.id || `${contact.type}-${index}`}
                        contact={contact}
                      />
                    ))
                  ) : (
                    <EmptyState message="No contact details added by admin yet." />
                  )}
                </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
  <iframe
    title={`${school.name} location`}
    src={mapUrl}
    className="h-80 w-full"
    loading="lazy"
  />
</div>

<div className="mt-4">
  <a
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      school.address ||
        `${school.name}, ${school.area}, ${school.emirate}, UAE`
    )}`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B2A4D]"
  >
    Open in Google Maps
  </a>
</div>
              </SectionCard>
            )}
          </div>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-[#071B33]/8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                At a glance
              </p>

              <div className="mt-5 space-y-4">
                <SidebarFact label="School type" value={school.schoolType} />
                <SidebarFact label="School phase" value={school.schoolPhase} />
                <SidebarFact
                  label="Inspection rating"
                  value={inspectionRatingText}
                />
                <SidebarFact
                  label="Curricula taught"
                  value={school.curricula?.join(", ")}
                />
                <SidebarFact label="Annual fee" value={feeRangeText} />
                <SidebarFact label="Status" value={school.status} />
                <SidebarFact label="Gender" value={school.gender} />
                <SidebarFact label="Opening year" value={school.openingYear} />
                <SidebarFact label="Principal" value={school.principalName} />
              </div>
            </div>

            <div className="rounded-[2rem] bg-[#071B33] p-6 text-white shadow-xl shadow-[#071B33]/20">
              <p className="text-sm text-slate-300">Next step</p>

              <h3 className="mt-2 text-2xl font-semibold">
                Ready to visit this school?
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Request a school tour and compare real details before applying.
              </p>

              <Button
                asChild
                className="mt-6 w-full rounded-full bg-[#D6B46A] text-[#071B33] hover:bg-[#E3C982]"
              >
                <Link href={`/school-tour?schoolId=${school.id}`}>
                  Book School Tour
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-[#071B33]/8 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-[#071B33]">{title}</h2>

      {description && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7F0] p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#071B33]">
        {value || "Not added by admin"}
      </p>
    </div>
  );
}

function DataBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
      <div className="bg-[#FAF7F0] px-5 py-4">
        <h3 className="text-lg font-semibold text-[#071B33]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-t border-slate-200 px-5 py-3 font-semibold">
      {children}
    </th>
  );
}

function TableCell({
  children,
  strong,
}: {
  children?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={[
        "px-5 py-4",
        strong ? "font-semibold text-[#071B33]" : "text-slate-700",
      ].join(" ")}
    >
      {children || "—"}
    </td>
  );
}

function DecisionBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-[#FAF7F0] p-5">
      <h3 className="text-base font-semibold text-[#071B33]">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#B58A34]" />
            <p className="text-sm leading-6 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <div className="mt-8 rounded-2xl bg-[#FAF7F0] p-5">
      <h3 className="text-lg font-semibold text-[#071B33]">{title}</h3>

      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#B58A34]" />
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white px-5 py-6 text-sm text-slate-500">{message}</div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#FAF7F0] px-3 py-1 text-xs font-semibold text-[#071B33]">
      {label}
    </span>
  );
}

function SidebarFact({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#071B33]">
        {value || "Not added"}
      </p>
    </div>
  );
}

function ContactCard({ contact }: { contact: SchoolContact }) {
  const icon =
    contact.type === "phone" || contact.type === "whatsapp" ? (
      <Phone className="h-5 w-5" />
    ) : contact.type === "email" ? (
      <Mail className="h-5 w-5" />
    ) : contact.type === "website" ? (
      <Globe2 className="h-5 w-5" />
    ) : (
      <MapPin className="h-5 w-5" />
    );

  const content = (
    <div className="rounded-2xl bg-[#FAF7F0] p-5 transition hover:bg-[#F3E8D4]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-[#B58A34]">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-500">
            {contact.label || contact.type}
          </p>
          <p className="mt-1 break-words text-base font-semibold text-[#071B33]">
            {contact.value}
          </p>
        </div>
      </div>
    </div>
  );

  if (contact.href) {
    return (
      <a href={contact.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function sortByOrder<T extends { sortOrder?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function formatMoneyOrText(value?: number | string | null) {
  if (typeof value === "number") {
    return `AED ${value.toLocaleString()}`;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "Not added by admin";
}