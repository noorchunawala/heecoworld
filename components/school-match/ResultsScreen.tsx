import SchoolMatchCard from "@/components/school/SchoolMatchCard";

import { rankSchools, type MatchAnswers } from "@/lib/matching";
import { CalendarDays, GitCompare, School, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getSchoolListings, type SchoolListing } from "@/lib/schoolListings";
import type { MatchableSchool } from "@/lib/matching"
import { trackMatchResult } from "@/lib/analytics";

type ResultsScreenProps = {
  answers: MatchAnswers;
  onRematch: () => void;
};

export default function ResultsScreen({ answers ,onRematch  }: ResultsScreenProps) {

    const [schools, setSchools] = useState<MatchableSchool[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadSchools() {
    const data = await getSchoolListings();

    const matchableSchools: MatchableSchool[] = data.map((school: SchoolListing) => ({
      id: school.id,
      name: school.name,
      emirate: school.emirate,
      slug:school.slug,
      curricula: school.curricula,
      feeRange: school.feeRange,
      grades: school.grades,
      priorities: school.priorities,
      reasons: [],
      location: {
        address: school.address || [school.area, school.emirate].filter(Boolean).join(", "),
        lat: 0,
        lng: 0,
      },
      heroImageUrl: null,
      heroVideoUrl: null,
      heroVideoPosterUrl: null,
    }));

    setSchools(matchableSchools);
    setLoading(false);
  }

  loadSchools();
}, []);
 const rankedSchools = rankSchools(schools, answers);
 const topResults = rankedSchools.slice(0, 20);
 useEffect(() => {
  if (loading) return;
  if (topResults.length === 0) return;

  topResults.forEach((school, index) => {
    trackMatchResult(
      {
        id: school.id,
        name: school.name,
        emirate: school.emirate,
      },
      school.matchScore || 0
    );
  });
}, [loading, topResults]);
if (loading) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F7F6FF] px-4 py-10">
      Loading matched schools...
    </div>
  );
}


  const bestMatch = topResults[0];
const otherMatches = topResults.slice(1);

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#F7F6FF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,180,106,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(7,27,51,0.10),transparent_34%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-[#111135]/10 backdrop-blur">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#F7F6FF] px-4 py-2 text-sm font-semibold text-[#111135]">
                  <Sparkles className="h-4 w-4 text-[#5B3DF5]" />
                  Scoolyx Match
                </div>

                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#111135] sm:text-5xl">
                  Your best school match is ready.
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Based on your answers, we found the strongest match first.
                  You can also scroll down to explore other recommended schools.
                </p>

                <p className="mt-3 text-lg text-[#8A651F]" dir="rtl">
                  تم تجهيز أفضل مدرسة مناسبة لطفلك
                </p>
                <button
  type="button"
  onClick={onRematch}
  className="mt-5 rounded-full border border-[#111135]/20 bg-white px-5 py-3 text-sm font-semibold text-[#111135] hover:bg-[#F7F6FF]"
>
  Start a new match
</button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl bg-[#111135] p-5 text-white">
                  <School className="h-5 w-5 text-[#A99BFF]" />
                  <p className="mt-3 text-2xl font-semibold">
                   {topResults.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Showing top 20 matches
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F6FF] p-5 text-[#111135]">
                  <GitCompare className="h-5 w-5 text-[#5B3DF5]" />
                  <p className="mt-3 text-lg font-semibold">Compare</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Review your shortlist
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F3E3C3] p-5 text-[#111135]">
                  <CalendarDays className="h-5 w-5 text-[#8A651F]" />
                  <p className="mt-3 text-lg font-semibold">Tour</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Request a school visit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {bestMatch && (
          <div className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5B3DF5]">
                  Best match
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#111135]">
                  Recommended first for your family
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                This school is shown first because it best matches your selected
                preferences.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#A99BFF]/50 bg-white/80 p-3 shadow-xl shadow-[#111135]/10 backdrop-blur">
              <div className="mb-3 inline-flex rounded-full bg-[#111135] px-4 py-2 text-xs font-semibold text-white">
                Best overall match
              </div>

              <SchoolMatchCard
                school={{
                  ...bestMatch,
                  badge: "Best Match",
                }}
              />
            </div>
          </div>
        )}

        {otherMatches.length > 0 && (
          <div>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5B3DF5]">
                  More recommendations
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#111135]">
                  Other schools to explore
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                Scroll through the remaining matches and compare which school
                fits your priorities best.
              </p>
            </div>

            <div className="grid gap-5">
              {otherMatches.map((school) => (
                <SchoolMatchCard key={school.id} school={school} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}