import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Eye,
  GitCompare,
  MapPin,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";

type SchoolMatchCardProps = {
  school: {
    id: string;
    name: string;
    slug: string;
    emirate: string;
    curricula: string[];
    feeRange: {
      min: number;
      max: number;
    };
    grades: string[];
    priorities: string[];
    matchScore: number;
    matchLabel: string;
    badge: string | null;
    reasons: string[];
  };
};

export default function SchoolMatchCard({ school }: SchoolMatchCardProps) {
  const isBestMatch = school.badge === "Best Match";

  return (
    <div
      className={`rounded-3xl border bg-white p-5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${
        isBestMatch
          ? "border-[#5B3DF5]/25 shadow-violet-500/10"
          : "border-slate-100 shadow-violet-500/5"
      }`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          {school.badge && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#111135] px-4 py-2 text-xs font-black text-white">
              <Trophy className="h-4 w-4 text-[#A99BFF]" />
              {school.badge}
            </div>
          )}

          <h2 className="text-2xl font-black tracking-tight text-[#111135] sm:text-3xl">
            {school.name}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EEFF] px-3 py-1.5 text-xs font-bold text-[#5B3DF5]">
              <MapPin className="h-3.5 w-3.5" />
              {school.emirate}
            </span>

            {school.curricula.map((curriculum) => (
              <span
                key={curriculum}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                {curriculum}
              </span>
            ))}

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              AED {school.feeRange.min.toLocaleString()} - AED{" "}
              {school.feeRange.max.toLocaleString()}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {school.reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-start gap-3 rounded-2xl bg-[#F7F6FF] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5B3DF5]" />
                <span className="text-sm font-semibold leading-6 text-slate-700">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[#111135] p-5 text-white lg:w-44 lg:shrink-0">
          <p className="text-sm font-semibold text-slate-300">Match score</p>

          <div className="mt-3 text-5xl font-black tracking-tight text-white">
            {school.matchScore}%
          </div>

          <div className="mt-2 text-sm font-bold text-[#A99BFF]">
            {school.matchLabel}
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#5B3DF5]"
              style={{ width: `${school.matchScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <Button
          asChild
          className="rounded-full bg-[#111135] px-5 text-white hover:bg-[#1D1B4F]"
        >
          <Link href={`/schools/${school.slug}`}>
            <Eye className="mr-2 h-4 w-4" />
            View School
          </Link>
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

        <FavoriteButton schoolId={school.id} />
      </div>
    </div>
  );
}