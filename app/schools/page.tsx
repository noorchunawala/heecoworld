"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  GitCompare,
  MapPin,
  Search,
  School,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import {
  getSchoolListings,
  type SchoolListing,
} from "@/lib/schoolListings";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedEmirate, setSelectedEmirate] = useState("All");

  useEffect(() => {
    async function loadSchools() {
      const data = await getSchoolListings();
      setSchools(data);
      setLoading(false);
    }

    loadSchools();
  }, []);

  const emirates = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          schools
            .map((school) => school.emirate)
            .filter((emirate) => emirate && emirate.trim().length > 0)
        )
      ),
    ];
  }, [schools]);

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const query = search.toLowerCase();

      const matchesSearch =
        school.name.toLowerCase().includes(query) ||
        school.curricula.join(" ").toLowerCase().includes(query) ||
        school.grades.join(" ").toLowerCase().includes(query) ||
        school.emirate.toLowerCase().includes(query) ||
        school.area.toLowerCase().includes(query);

      const matchesEmirate =
        selectedEmirate === "All" || school.emirate === selectedEmirate;

      return matchesSearch && matchesEmirate;
    });
  }, [schools, search, selectedEmirate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F1E7]">
        <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl">
            <p className="text-sm font-medium text-slate-300">
              Loading schools...
            </p>
          </div>
        </section>
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
              <School className="h-4 w-4" />
              UAE School Directory
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore schools across the UAE.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Search schools, compare key details and shortlist the right options
              for your child.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              ابحث عن المدارس وقارن الخيارات المناسبة لطفلك
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="-mt-20 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by school, curriculum or emirate..."
                  className="h-13 w-full rounded-full border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-[#D6B46A] focus:bg-white"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedEmirate}
                  onChange={(e) => setSelectedEmirate(e.target.value)}
                  className="h-13 w-full appearance-none rounded-full border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-medium text-[#071B33] outline-none transition focus:border-[#D6B46A] focus:bg-white"
                >
                  {emirates.map((emirate) => (
                    <option key={emirate} value={emirate}>
                      {emirate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-[#071B33]">
                  {filteredSchools.length}
                </span>{" "}
                schools
              </p>

              <a
                href="/heeco-match"
                className="text-sm font-semibold text-[#071B33] underline-offset-4 hover:underline"
              >
                Not sure? Try Heeco Match
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {filteredSchools.map((school) => {
            const hasFeeRange =
              Boolean(school.feeRange?.min) && Boolean(school.feeRange?.max);

            return (
              <div
                key={school.id}
                className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-xl shadow-[#071B33]/8 transition hover:-translate-y-0.5 hover:shadow-2xl sm:p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#071B33]">
                      {school.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {school.emirate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F1E7] px-3 py-1.5 text-xs font-semibold text-[#071B33]">
                          <MapPin className="h-3.5 w-3.5 text-[#B58A34]" />
                          {school.emirate}
                        </span>
                      )}

                      {school.curricula.map((curriculum) => (
                        <span
                          key={curriculum}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {curriculum}
                        </span>
                      ))}

                      {hasFeeRange && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          AED {school.feeRange.min.toLocaleString()} - AED{" "}
                          {school.feeRange.max.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {school.priorities.slice(0, 4).map((priority) => (
                        <div
                          key={priority}
                          className="rounded-2xl bg-[#FAF7F0] px-4 py-3 text-sm font-medium text-slate-700"
                        >
                          {priority}
                        </div>
                      ))}

                      {school.priorities.length === 0 && (
                        <div className="rounded-2xl bg-[#FAF7F0] px-4 py-3 text-sm font-medium text-slate-500">
                          Priorities not added yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-[#071B33] p-5 text-white lg:w-44 lg:shrink-0">
                    <p className="text-sm text-slate-300">From</p>
                    <p className="mt-2 text-2xl font-semibold text-[#D6B46A]">
                      {school.feeRange.min
                        ? `AED ${school.feeRange.min.toLocaleString()}`
                        : "Not added"}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">per year</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                  <Button
                    asChild
                    className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
                  >
                    <Link href={`/schools/${school.slug}`}>View School</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-[#071B33]/15 text-[#071B33] hover:bg-[#F8F1E7]"
                  >
                    <Link href={`/compare?schoolIds=${school.id}`}>
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]"
                  >
                    <Link href={`/school-tour?schoolId=${school.id}`}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Book Tour
                    </Link>
                  </Button>

                  <FavoriteButton schoolId={school.id} />
                </div>
              </div>
            );
          })}

          {filteredSchools.length === 0 && (
            <div className="rounded-[2rem] border border-white/80 bg-white p-10 text-center shadow-xl shadow-[#071B33]/8">
              <School className="mx-auto h-12 w-12 text-[#B58A34]" />

              <h2 className="mt-4 text-2xl font-semibold text-[#071B33]">
                No schools found
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Try another search keyword or change the emirate filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}