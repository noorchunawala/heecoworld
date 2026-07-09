"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import {
  CalendarDays,
  GitCompare,
  Heart,
  MapPin,
  School,
} from "lucide-react";
import {
  getSchoolListings,
  type SchoolListing,
} from "@/lib/schoolListings";
import { useAuth } from "@/components/AuthProvider";
import { getFavoriteSchoolIds } from "@/lib/favorites";
import BookTourInterestButton from "@/components/BookTourInterestButton";

export default function ShortlistPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { status, user } = useAuth();

  const loadFavorites = async () => {
    if (status !== "authenticated" || !user) {
      setFavoriteIds([]);
      return;
    }

    const ids = await getFavoriteSchoolIds(user.id);
    setFavoriteIds(ids);
  };

  useEffect(() => {
    async function loadData() {
      const data = await getSchoolListings();
      setSchools(data);

      if (status === "authenticated" && user) {
        const ids = await getFavoriteSchoolIds(user.id);
        setFavoriteIds(ids);
      }

      setLoading(false);
    }

    if (status !== "loading") {
      loadData();
    }

    window.addEventListener("heeco-favorites-updated", loadFavorites);

    return () => {
      window.removeEventListener("heeco-favorites-updated", loadFavorites);
    };
  }, [status, user]);

  const shortlistedSchools = useMemo(() => {
    return schools.filter((school) => favoriteIds.includes(school.id));
  }, [schools, favoriteIds]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet-500/5">
            <p className="text-sm font-bold text-slate-600">
              Loading shortlist...
            </p>
          </div>
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-[#5B3DF5] shadow-sm backdrop-blur">
              <Heart className="h-4 w-4" />
              My Shortlist
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">
              Your shortlisted schools.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Review your saved schools, compare them side by side, or request
              tours for your preferred options.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-violet-500/10 backdrop-blur sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
                  Saved schools
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#111135]">
                  {shortlistedSchools.length} school
                  {shortlistedSchools.length === 1 ? "" : "s"} shortlisted
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-5 font-bold text-[#111135] hover:bg-[#F7F6FF]"
                >
                  <Link href="/schools">Explore more schools</Link>
                </Button>

                {shortlistedSchools.length > 0 && (
                  <BookTourInterestButton
                    schoolIds={shortlistedSchools
                      .slice(0, 3)
                      .map((school) => school.id)}
                    schoolNames={shortlistedSchools
                      .slice(0, 3)
                      .map((school) => school.name)}
                    label="Book tours for selected schools"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {shortlistedSchools.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-lg shadow-violet-500/5">
            <Heart className="mx-auto h-12 w-12 text-[#5B3DF5]" />

            <h2 className="mt-4 text-2xl font-black text-[#111135]">
              No schools shortlisted yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Start exploring schools and use the shortlist button to save the
              ones you want to review later.
            </p>

            <Button
              asChild
              className="mt-6 rounded-full bg-[#111135] px-6 text-white hover:bg-[#1D1B4F]"
            >
              <Link href="/schools">Browse schools</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5">
            {shortlistedSchools.map((school) => {
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEFF] px-3 py-1.5 text-xs font-bold text-[#5B3DF5]">
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
                        {school.priorities.slice(0, 4).map((priority) => (
                          <div
                            key={priority}
                            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                          >
                            {priority}
                          </div>
                        ))}

                        {school.priorities.length === 0 && (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                            Priorities not added yet
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-[#111135] p-5 text-white lg:w-48 lg:shrink-0">
                      <School className="h-5 w-5 text-[#A99BFF]" />
                      <p className="mt-3 text-sm text-slate-300">Fees from</p>
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

                    <BookTourInterestButton
                      schoolIds={[school.id]}
                      schoolNames={[school.name]}
                      label="Book Tour"
                    />

                    <FavoriteButton schoolId={school.id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}