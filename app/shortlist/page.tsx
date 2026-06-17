"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sampleMatchedSchools } from "@/data/schools";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import {
  CalendarDays,
  GitCompare,
  Heart,
  MapPin,
  School,
} from "lucide-react";

const FAVORITES_KEY = "heeco_favorite_school_ids";

export default function ShortlistPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadFavorites = () => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    setFavoriteIds(ids);
  };

  useEffect(() => {
    loadFavorites();

    window.addEventListener("heeco-favorites-updated", loadFavorites);

    return () => {
      window.removeEventListener("heeco-favorites-updated", loadFavorites);
    };
  }, []);

  const shortlistedSchools = useMemo(() => {
    return sampleMatchedSchools.filter((school) =>
      favoriteIds.includes(school.id)
    );
  }, [favoriteIds]);

  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
              <Heart className="h-4 w-4" />
              My Shortlist
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your shortlisted schools.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Review the schools you saved, compare them side by side or request
              tours for your preferred options.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              المدارس التي قمت بحفظها للمراجعة
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="-mt-20 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                  Saved schools
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#071B33]">
                  {shortlistedSchools.length} school
                  {shortlistedSchools.length === 1 ? "" : "s"} shortlisted
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[#071B33]/15 text-[#071B33] hover:bg-[#F8F1E7]"
                >
                  <Link href="/schools">Explore more schools</Link>
                </Button>

                {shortlistedSchools.length > 0 && (
                  <Button
                    asChild
                    className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
                  >
                    <Link
                      href={`/school-tour?schoolIds=${shortlistedSchools
                        .slice(0, 3)
                        .map((school) => school.id)
                        .join(",")}`}
                    >
                      Book tours
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {shortlistedSchools.length === 0 ? (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-xl shadow-[#071B33]/8">
            <Heart className="mx-auto h-12 w-12 text-[#B58A34]" />

            <h2 className="mt-4 text-2xl font-semibold text-[#071B33]">
              No schools shortlisted yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Start exploring schools and use the Shortlist button to save the
              ones you want to review later.
            </p>

            <Button
              asChild
              className="mt-6 rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
            >
              <Link href="/schools">Browse schools</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {shortlistedSchools.map((school) => (
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F1E7] px-3 py-1.5 text-xs font-semibold text-[#071B33]">
                        <MapPin className="h-3.5 w-3.5 text-[#B58A34]" />
                        {school.emirate}
                      </span>

                      {school.curricula.map((curriculum) => (
                        <span
                          key={curriculum}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          {curriculum}
                        </span>
                      ))}

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        AED {school.feeRange.min.toLocaleString()} - AED{" "}
                        {school.feeRange.max.toLocaleString()}
                      </span>
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
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-[#071B33] p-5 text-white lg:w-44 lg:shrink-0">
                    <School className="h-5 w-5 text-[#D6B46A]" />
                    <p className="mt-3 text-sm text-slate-300">From</p>
                    <p className="mt-2 text-2xl font-semibold text-[#D6B46A]">
                      AED {school.feeRange.min.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">per year</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                  <Button
                    asChild
                    className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
                  >
                    <Link href={`/schools/${school.id}`}>View School</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-[#071B33]/15 text-[#071B33] hover:bg-[#F8F1E7]"
                  >
                    <Link href="/compare">
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}