import { CheckCircle2, Sparkles } from "lucide-react";

const loadingSteps = [
  "Checking your preferences",
  "Matching curriculum and budget",
  "Finding suitable school locations",
  "Reviewing ratings and facilities",
  "Finalising your recommendations",
];

export default function LoadingScreen() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-100/50 sm:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white">
          <Sparkles className="h-7 w-7" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Heeco Match™
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Finding your perfect schools...
        </h1>

        <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
          {loadingSteps.map((step) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
            >
              <CheckCircle2 className="h-5 w-5 text-blue-700" />
              <span className="text-sm font-medium text-slate-700">{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-3/4 rounded-full bg-blue-700" />
        </div>

        <p className="mt-4 text-sm text-slate-500">Almost there...</p>
      </div>
    </div>
  );
}