import { CheckCircle2, Sparkles } from "lucide-react";

const loadingSteps = [
  "Reviewing your preferences",
  "Checking curriculum and location",
  "Preparing your school matches",
];

export default function LoadingScreen() {
  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-[#F8F1E7] px-4 py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,180,106,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(7,27,51,0.10),transparent_34%)]" />

      <div className="relative w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
        <div className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071B33] text-white shadow-lg shadow-[#071B33]/20">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#B58A34]">
            Heeco Match
          </p>

          <h1 className="mx-auto mt-3 max-w-xl text-2xl font-semibold tracking-tight text-[#071B33] sm:text-3xl">
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3E3C3] text-[#071B33]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <p className="text-sm font-medium text-slate-700">{step}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F1E7D3]">
              <div className="h-full w-4/5 rounded-full bg-[#D6B46A]" />
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Almost ready...
          </p>
        </div>
      </div>
    </div>
  );
}