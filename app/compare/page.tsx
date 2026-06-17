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

const MAX_COMPARE = 3;

export default function ComparePage() {
  const [schools, setSchools] = useState<SchoolListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

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

    if (uniqueIds.length > 0) {
      setSelectedIds(uniqueIds);
    }
  }, [schools, validSchoolIds]);

  const selectedSchools = useMemo(() => {
    return selectedIds
      .map((id) => schools.find((school) => school.id === id))
      .filter((school): school is SchoolListing => Boolean(school));
  }, [selectedIds, schools]);

  const filteredSchools = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return schools;

    return schools.filter((school) => {
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
    });
  }, [searchText, schools]);

  const toggleSchool = (schoolId: string) => {
    setSelectedIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((id) => id !== schoolId);
      }

      if (current.length >= MAX_COMPARE) {
        return current;
      }

      return [...current, schoolId];
    });
  };

  const removeSchool = (schoolId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== schoolId));
  };

  const clearCompare = () => {
    setSelectedIds([]);
  };

  const canAddMore = selectedIds.length < MAX_COMPARE;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-[#071B33]/8">
            <p className="text-sm font-medium text-slate-600">
              Loading schools...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
              <GitCompare className="h-4 w-4" />
              Compare Schools
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Compare schools side by side.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Select schools and compare curriculum, fees, grades, location and
              key strengths before shortlisting or booking a tour.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              قارن بين المدارس واختر الأنسب لطفلك
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="-mt-20 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                  Select schools
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#071B33]">
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
                  className="rounded-full border-[#071B33]/15 bg-white/70 text-[#071B33] hover:bg-white"
                >
                  <Link href="/schools">Back to Schools</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[#D6B46A]/60 bg-white/70 text-[#071B33] hover:bg-white"
                >
                  <Link href="/shortlist">View Shortlist</Link>
                </Button>

                {selectedSchools.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearCompare}
                    className="rounded-full border-red-200 bg-white/70 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search school name, emirate, curriculum or grades..."
                  className="w-full rounded-full border border-slate-200 bg-[#FAF7F0] py-3 pl-11 pr-4 text-sm font-medium text-[#071B33] outline-none transition placeholder:text-slate-400 focus:border-[#D6B46A] focus:bg-white"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {filteredSchools.map((school) => {
                  const isSelected = selectedIds.includes(school.id);
                  const isDisabled =
                    !isSelected && selectedIds.length >= MAX_COMPARE;

                  return (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => toggleSchool(school.id)}
                      disabled={isDisabled}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-[#071B33] bg-[#071B33] text-white"
                          : isDisabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-[#071B33] hover:border-[#D6B46A] hover:bg-[#F8F1E7]"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}
                      {school.name}
                    </button>
                  );
                })}

                {filteredSchools.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No schools found. Try another keyword.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedSchools.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {selectedSchools.map((school) => (
              <div
                key={school.id}
                className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-lg shadow-[#071B33]/8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#071B33]">
                      {school.name}
                    </h3>

                    <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                      <MapPin className="h-4 w-4 text-[#B58A34]" />
                      {[school.area, school.emirate].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSchool(school.id)}
                    className="rounded-full bg-[#FAF7F0] p-2 text-[#071B33] hover:bg-red-50 hover:text-red-600"
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
                        className="rounded-full bg-[#FAF7F0] px-3 py-1 text-xs font-semibold text-[#071B33]"
                      >
                        {curriculum}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-[#FAF7F0] px-3 py-1 text-xs font-semibold text-slate-500">
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
            <Button
              asChild
              className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
            >
              <Link href={`/school-tour?schoolIds=${selectedIds.join(",")}`}>
                Book tours for selected schools
              </Link>
            </Button>
          </div>
        )}

        {selectedSchools.length === 0 ? (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-xl shadow-[#071B33]/8">
            <School className="mx-auto h-12 w-12 text-[#B58A34]" />

            <h2 className="mt-4 text-2xl font-semibold text-[#071B33]">
              No schools selected yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Start by selecting schools from the list above, or go back to the
              schools page and open a school profile before adding it to compare.
            </p>

            <Button
              asChild
              className="mt-6 rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
            >
              <Link href="/schools">Explore Schools</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl shadow-[#071B33]/8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#071B33] text-white">
                    <th className="w-52 px-6 py-5 text-left text-sm font-semibold">
                      Details
                    </th>

                    {selectedSchools.map((school) => (
                      <th
                        key={school.id}
                        className="min-w-64 px-6 py-5 text-left align-top"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold">
                              {school.name}
                            </p>

                            <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-300">
                              <MapPin className="h-4 w-4 text-[#D6B46A]" />
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
                      <td className="bg-[#FAF7F0] px-6 py-5 text-sm font-semibold text-[#071B33]">
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
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B58A34]" />
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
                    <td className="bg-[#FAF7F0] px-6 py-5 text-sm font-semibold text-[#071B33]">
                      Location
                    </td>

                    {selectedSchools.map((school) => (
                      <td
                        key={`${school.id}-location`}
                        className="px-6 py-5 align-top"
                      >
                        <p className="text-sm font-medium text-slate-700">
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
                    <td className="bg-[#FAF7F0] px-6 py-5 text-sm font-semibold text-[#071B33]">
                      Action
                    </td>

                    {selectedSchools.map((school) => (
                      <td key={`${school.id}-action`} className="px-6 py-5">
                        <div className="flex flex-col gap-3">
                          <Button
                            asChild
                            className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
                          >
                            <Link href={`/schools/${school.slug}`}>
                              View School
                            </Link>
                          </Button>

                          <Button
                            asChild
                            variant="outline"
                            className="rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]"
                          >
                            <Link href={`/school-tour?schoolId=${school.id}`}>
                              Book Tour
                            </Link>
                          </Button>
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