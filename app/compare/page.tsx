"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  GitCompare,
  MapPin,
  School,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { compareFields } from "@/data/compareFields";
import { getSchoolListings, type SchoolListing } from "@/lib/schoolListings";
import { useAuth } from "@/components/AuthProvider";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { isLoginRequired } from "@/lib/feature";
import BookTourInterestButton from "@/components/BookTourInterestButton";
import { trackCompareAdded, trackComparisonCompleted } from "@/lib/analytics";

const MAX_COMPARE = 3;

export default function ComparePage() {
  const [schools, setSchools] = useState<SchoolListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const { status } = useAuth();
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const compareLocked =
    requiresLogin && status !== "loading" && status !== "authenticated";

  useEffect(() => {
    async function loadFeatureSetting() {
      const required = await isLoginRequired("compare");
      setRequiresLogin(required);

      if (required && status !== "loading" && status !== "authenticated") {
        setShowLoginModal(true);
      }
    }

    loadFeatureSetting();
  }, [status]);

  useEffect(() => {
    async function loadSchools() {
      const data = await getSchoolListings();
      setSchools(data);
      setLoading(false);
    }

    loadSchools();
  }, []);

  const validSchoolIds = useMemo(() => {
    return new Set(schools.map((school) => school.id));
  }, [schools]);

  useEffect(() => {
    if (schools.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get("schoolIds") || params.get("schoolId");

    if (!queryValue) return;

    const idsFromUrl = queryValue
      .split(",")
      .map((id) => id.trim())
      .filter((id) => validSchoolIds.has(id));

    const uniqueIds = Array.from(new Set(idsFromUrl)).slice(0, MAX_COMPARE);

    if (compareLocked) {
      setShowLoginModal(true);
      return;
    }

    if (uniqueIds.length > 0) {
      setSelectedIds(uniqueIds);
    }
  }, [schools, validSchoolIds, compareLocked]);

  const selectedSchools = useMemo(() => {
    return selectedIds
      .map((id) => schools.find((school) => school.id === id))
      .filter((school): school is SchoolListing => Boolean(school));
  }, [selectedIds, schools]);

  useEffect(() => {
    if (selectedSchools.length < 2) return;

    const key = `comparison_${selectedSchools
      .map((school) => school.id)
      .sort()
      .join("_")}`;

    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "true");

    trackComparisonCompleted(
      selectedSchools.map((school) => ({
        id: school.id,
        name: school.name,
        emirate: school.emirate,
      }))
    );
  }, [selectedSchools]);

  const filteredSchools = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return [];

    return schools
      .filter((school) => {
        const searchableText = [
          school.name,
          school.emirate,
          school.area,
          school.curricula?.join(" "),
          school.grades?.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .slice(0, 8);
  }, [searchText, schools]);

  const toggleSchool = (schoolId: string) => {
    if (compareLocked) {
      setShowLoginModal(true);
      return;
    }

    setSelectedIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((id) => id !== schoolId);
      }

      if (current.length >= MAX_COMPARE) {
        return current;
      }

      const school = schools.find((s) => s.id === schoolId);

      if (school) {
        trackCompareAdded({
          id: school.id,
          name: school.name,
        });
      }

      return [...current, schoolId];
    });

    setSearchText("");
  };

  const removeSchool = (schoolId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== schoolId));
  };

  const clearCompare = () => {
    setSelectedIds([]);
    setSearchText("");
  };

  const canAddMore = selectedIds.length < MAX_COMPARE;
  const hasSearch = searchText.trim().length > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet-500/5">
            <p className="text-sm font-bold text-slate-600">
              Loading schools...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] text-[#111135]">
      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        feature="compare"
      />

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.16),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.14),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-[#5B3DF5] shadow-sm backdrop-blur">
              <GitCompare className="h-4 w-4" />
              Compare Schools
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
              Compare schools side by side.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Select up to three schools and compare curriculum, fees, grades,
              location and key details before shortlisting or booking a tour.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-violet-500/10 backdrop-blur">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
                  Select schools
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#111135]">
                  Choose up to {MAX_COMPARE} schools to compare
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {selectedSchools.length}/{MAX_COMPARE} selected
                  {!canAddMore && " · Remove one school to add another"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-5 font-bold text-[#111135] hover:bg-[#F7F6FF]"
                >
                  <Link href="/schools">Back to Schools</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-5 font-bold text-[#111135] hover:bg-[#F7F6FF]"
                >
                  <Link href="/shortlist">View Shortlist</Link>
                </Button>

                {selectedSchools.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearCompare}
                    className="rounded-full border-red-200 bg-white px-5 font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6">
              {selectedSchools.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {selectedSchools.map((school) => (
                    <div
                      key={school.id}
                      className="inline-flex items-center gap-2 rounded-full bg-[#111135] px-4 py-2 text-sm font-bold text-white"
                    >
                      <span>✓ {school.name}</span>

                      <button
                        type="button"
                        onClick={() => removeSchool(school.id)}
                        className="rounded-full bg-white/10 p-1 transition hover:bg-white/20"
                        aria-label={`Remove ${school.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  readOnly={compareLocked}
                  onClick={() => {
                    if (compareLocked) setShowLoginModal(true);
                  }}
                  disabled={!canAddMore}
                  placeholder={
                    canAddMore
                      ? "Search school name, emirate, curriculum or grades..."
                      : "Maximum 3 schools selected"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-semibold text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />

                {hasSearch && canAddMore && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-violet-500/15">
                    {filteredSchools.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto p-2">
                        {filteredSchools.map((school) => {
                          const isSelected = selectedIds.includes(school.id);

                          return (
                            <button
                              key={school.id}
                              type="button"
                              onClick={() => toggleSchool(school.id)}
                              disabled={isSelected}
                              className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition ${
                                isSelected
                                  ? "cursor-not-allowed bg-[#F7F6FF] text-slate-400"
                                  : "hover:bg-[#F7F6FF]"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-black text-[#111135]">
                                  {school.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {[school.area, school.emirate]
                                    .filter(Boolean)
                                    .join(", ") || "Location not added"}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-black text-[#5B3DF5]">
                                {isSelected ? "Selected" : "Add"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 text-sm text-slate-500">
                        No schools found. Try another keyword.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!hasSearch && canAddMore && selectedSchools.length === 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Start typing to search and select schools for comparison.
                </p>
              )}

              {!hasSearch && canAddMore && selectedSchools.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Search again to add another school.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {selectedSchools.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {selectedSchools.map((school) => (
              <div
                key={school.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-violet-500/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-[#111135]">
                      {school.name}
                    </h3>

                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <MapPin className="h-4 w-4 text-[#5B3DF5]" />
                      {[school.area, school.emirate].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSchool(school.id)}
                    className="rounded-full bg-[#F7F6FF] p-2 text-[#111135] hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${school.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {school.curricula?.length ? (
                    school.curricula.slice(0, 3).map((curriculum) => (
                      <span
                        key={curriculum}
                        className="rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-bold text-[#5B3DF5]"
                      >
                        {curriculum}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      Curriculum not added
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSchools.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <BookTourInterestButton
              schoolIds={selectedIds}
              schoolNames={selectedSchools.map((school) => school.name)}
              label="Book tours for selected schools"
            />
          </div>
        )}

        {selectedSchools.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-lg shadow-violet-500/5">
            <School className="mx-auto h-12 w-12 text-[#5B3DF5]" />

            <h2 className="mt-4 text-2xl font-black text-[#111135]">
              No schools selected yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Start by searching and selecting schools above, or go back to the
              schools page and open a school profile before adding it to compare.
            </p>

            <Button
              asChild
              className="mt-6 rounded-full bg-[#111135] px-6 text-white hover:bg-[#1D1B4F]"
            >
              <Link href="/schools">Explore Schools</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-violet-500/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#111135] text-white">
                    <th className="w-52 px-6 py-5 text-left text-sm font-black">
                      Details
                    </th>

                    {selectedSchools.map((school) => (
                      <th
                        key={school.id}
                        className="min-w-64 px-6 py-5 text-left align-top"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black">{school.name}</p>

                            <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-300">
                              <MapPin className="h-4 w-4 text-[#A99BFF]" />
                              {[school.area, school.emirate]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSchool(school.id)}
                            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                            aria-label={`Remove ${school.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {compareFields.map((field) => (
                    <tr key={field.key} className="border-t border-slate-100">
                      <td className="bg-[#F7F6FF] px-6 py-5 text-sm font-black text-[#111135]">
                        {field.label}
                      </td>

                      {selectedSchools.map((school) => {
                        const value = field.getValue(school);

                        return (
                          <td
                            key={`${school.id}-${field.key}`}
                            className="px-6 py-5 align-top"
                          >
                            {Array.isArray(value) ? (
                              value.length > 0 ? (
                                <div className="space-y-2">
                                  {value.map((item, index) => (
                                    <div
                                      key={`${item}-${index}`}
                                      className="flex items-start gap-2 text-sm text-slate-700"
                                    >
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5B3DF5]" />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500">
                                  Not added
                                </span>
                              )
                            ) : (
                              <span className="text-sm text-slate-700">
                                {value || "Not added"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr className="border-t border-slate-100">
                    <td className="bg-[#F7F6FF] px-6 py-5 text-sm font-black text-[#111135]">
                      Location
                    </td>

                    {selectedSchools.map((school) => (
                      <td
                        key={`${school.id}-location`}
                        className="px-6 py-5 align-top"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {school.address ||
                            [school.area, school.emirate]
                              .filter(Boolean)
                              .join(", ") ||
                            "Location not added"}
                        </p>
                      </td>
                    ))}
                  </tr>

                  <tr className="border-t border-slate-100">
                    <td className="bg-[#F7F6FF] px-6 py-5 text-sm font-black text-[#111135]">
                      Action
                    </td>

                    {selectedSchools.map((school) => (
                      <td key={`${school.id}-action`} className="px-6 py-5">
                        <div className="flex flex-col gap-3">
                          <Button
                            asChild
                            className="rounded-full bg-[#111135] text-white hover:bg-[#1D1B4F]"
                          >
                            <Link href={`/schools/${school.slug}`}>
                              View School
                            </Link>
                          </Button>

                          <BookTourInterestButton
                            schoolIds={[school.id]}
                            schoolNames={[school.name]}
                            label="Book Tour"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}