import { Button } from "@/components/ui/button";
import { CheckCircle2, Trophy } from "lucide-react";

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
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/40">
      {school.badge && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <Trophy className="h-4 w-4" />
          {school.badge}
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">{school.name}</h2>
          <p className="mt-2 text-slate-600">
            {school.emirate} • {school.curricula.join(", ")} • AED {school.feeRange.min.toLocaleString()} - AED {school.feeRange.max.toLocaleString()}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {school.reasons.map((reason) => (
              <div key={reason} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-blue-700" />
                {reason}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-5 text-center md:min-w-36">
          <div className="text-4xl font-bold text-blue-700">
            {school.matchScore}%
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-700">
            {school.matchLabel}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button>View School</Button>
        <Button variant="outline">Compare</Button>
        <Button variant="outline">Book Tour</Button>
      </div>
    </div>
  );
}