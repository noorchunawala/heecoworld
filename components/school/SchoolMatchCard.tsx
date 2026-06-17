import { Button } from "@/components/ui/button";
import {
  CalendarDays,
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
      className={`rounded-[2rem] border bg-white p-5 shadow-xl transition sm:p-6 ${
        isBestMatch
          ? "border-[#D6B46A]/60 shadow-[#071B33]/12"
          : "border-white/80 shadow-[#071B33]/8"
      }`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          {school.badge && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#071B33] px-4 py-2 text-xs font-semibold text-white">
              <Trophy className="h-4 w-4 text-[#D6B46A]" />
              {school.badge}
            </div>
          )}

          <h2 className="text-2xl font-semibold tracking-tight text-[#071B33] sm:text-3xl">
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
            {school.reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-start gap-3 rounded-2xl bg-[#FAF7F0] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#B58A34]" />
                <span className="text-sm font-medium leading-6 text-slate-700">
                  {reason}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[#071B33] p-5 text-white lg:w-44 lg:shrink-0">
          <p className="text-sm font-medium text-slate-300">Match score</p>

          <div className="mt-3 text-5xl font-semibold tracking-tight text-[#D6B46A]">
            {school.matchScore}%
          </div>

          <div className="mt-2 text-sm font-semibold text-white">
            {school.matchLabel}
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#D6B46A]"
              style={{ width: `${school.matchScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
        <Button
  asChild
  className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
>
  <Link href={`/schools/${school.id}`}>
    <Eye className="mr-2 h-4 w-4" />
    View School
  </Link>
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
  );
}