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
  Sparkles,
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
            .filter((emirate) => emirate && emirate.trim().length > 0),
        ),
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
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-24 shadow-sm">
          <p className="text-sm font-bold text-slate-600">Loading schools...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6FF] text-[#111135]">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.16),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.14),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] text-[#111135] sm:text-6xl">
              Find the right school with confidence.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Search UAE schools, compare key details and shortlist the right
              options for your child.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-violet-500/10 backdrop-blur">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by school, area, curriculum or emirate..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedEmirate}
                  onChange={(e) => setSelectedEmirate(e.target.value)}
                  className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                <span className="font-black text-[#111135]">
                  {filteredSchools.length}
                </span>{" "}
                schools
              </p>

              <Link
                href="/heeco-match"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#5B3DF5] underline-offset-4 hover:underline"
              >
                <Sparkles className="h-4 w-4" />
                Not sure? Try Scoolyx Match
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5">
          {filteredSchools.map((school) => {
            const hasFeeRange =
              Boolean(school.feeRange?.min) && Boolean(school.feeRange?.max);

            return (
              <article
                key={school.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-violet-500/5 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black tracking-tight text-[#111135]">
                      {school.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {school.emirate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F6FF] px-3 py-1.5 text-xs font-bold text-[#5B3DF5]">
                          <MapPin className="h-3.5 w-3.5" />
                          {school.emirate}
                        </span>
                      )}

                      {school.curricula.map((curriculum) => (
                        <span
                          key={curriculum}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                        >
                          {curriculum}
                        </span>
                      ))}

                      {hasFeeRange && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                          AED {school.feeRange.min.toLocaleString()} - AED{" "}
                          {school.feeRange.max.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {school.area || "Area not added"}
                      </div>

                      {school.grades.length > 0 && (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          {school.grades.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#111135] p-5 text-white lg:w-48 lg:shrink-0">
                    <p className="text-sm text-slate-300">Fees from</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {school.feeRange.min
                        ? `AED ${school.feeRange.min.toLocaleString()}`
                        : "Not added"}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">per year</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    className="rounded-full bg-[#111135] px-5 text-white hover:bg-[#1D1B4F]"
                  >
                    <Link href={`/schools/${school.slug}`}>View School</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-slate-200 px-5 font-bold text-[#111135] hover:bg-[#F7F6FF]"
                  >
                    <Link href={`/compare?schoolIds=${school.id}`}>
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare
                    </Link>
                  </Button>

                  {/* <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-slate-200 px-5 font-bold text-[#111135] hover:bg-[#F7F6FF]"
                  >
                    <Link href={`/school-tour?schoolId=${school.id}`}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Book Tour
                    </Link>
                  </Button> */}

                  <FavoriteButton schoolId={school.id} />
                </div>
              </article>
            );
          })}

          {filteredSchools.length === 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-lg shadow-violet-500/5">
              <School className="mx-auto h-12 w-12 text-[#5B3DF5]" />

              <h2 className="mt-4 text-2xl font-black text-[#111135]">
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