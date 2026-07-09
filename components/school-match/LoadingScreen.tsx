import { CheckCircle2, Sparkles } from "lucide-react";

const loadingSteps = [
  "Reviewing your preferences",
  "Checking curriculum and location",
  "Preparing your school matches",
];

export default function LoadingScreen() {
  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden rounded-3xl bg-[#F7F6FF] px-4 py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.14),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-white/80 bg-white/80 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111135] text-white shadow-lg shadow-slate-900/10">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>

          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5B3DF5]">
            Scoolyx Match
          </p>

          <h1 className="mx-auto mt-3 max-w-xl text-3xl font-black tracking-tight text-[#111135]">
            Preparing your school matches
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
            We are turning your answers into a clearer shortlist of UAE schools
            to explore and compare.
          </p>

          <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
            {loadingSteps.map((step) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F1EEFF] text-[#5B3DF5]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <p className="text-sm font-semibold text-slate-700">{step}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-4/5 rounded-full bg-[#5B3DF5]" />
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Almost ready...
          </p>
        </div>
      </div>
    </div>
  );
}