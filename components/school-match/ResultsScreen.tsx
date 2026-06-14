import SchoolMatchCard from "@/components/school/SchoolMatchCard";
import { sampleMatchedSchools } from "@/app/heeco-match/schools";

export default function ResultsScreen() {
  return (
    <div className="mx-auto max-w-5xl py-12">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Heeco Match™
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
          🎉 Your Matches Are Ready
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          We found schools that match your preferences.
        </p>
      </div>

      <div className="grid gap-5">
        {sampleMatchedSchools.map((school) => (
          <SchoolMatchCard key={school.id} school={school} />
        ))}
      </div>
    </div>
  );
}