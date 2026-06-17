import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  School,
  Sparkles,
} from "lucide-react";

type WelcomeScreenProps = {
  onStart: () => void;
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const benefits = [
    "Personalized school recommendations",
    "Compare schools with confidence",
    "Shortlist options based on your needs",
    "Book school tours after matching",
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#F8F1E7] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,180,106,0.25),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(7,27,51,0.12),transparent_34%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-140px)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left content */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D6B46A]/40 bg-white/70 px-4 py-2 text-sm font-medium text-[#071B33] shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#B58A34]" />
            Heeco Match
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#071B33] sm:text-5xl lg:text-6xl">
            Find schools that match your child, not just your search.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Answer a few guided questions and HeecoWorld will suggest UAE schools
            based on your child’s needs, curriculum preference, location, budget
            and priorities.
          </p>

          <p className="mt-4 text-xl leading-8 text-[#8A651F]" dir="rtl">
            اكتشف المدارس الأنسب لطفلك بطريقة أسهل وأوضح
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={onStart}
              className="h-12 rounded-full bg-[#071B33] px-7 text-white hover:bg-[#0B2A4D]"
            >
              Start School Match
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center rounded-full border border-[#071B33]/15 bg-white/60 px-6 py-3 text-sm font-medium text-[#071B33] shadow-sm backdrop-blur">
              Takes about 1 minute
            </div>
          </div>

          <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
            {benefits.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#B58A34]" />
                <span className="text-sm font-medium text-slate-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right product card */}
        <div className="relative">
          <div className="rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-[#071B33] p-5 text-white">
              <div className="rounded-3xl bg-white p-5 text-[#071B33] shadow-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B58A34]">
                      Match Journey
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Your school shortlist starts here
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E3C3]">
                    <School className="h-6 w-6 text-[#071B33]" />
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071B33] text-white">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Step 1: Tell us what matters
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Curriculum, budget, location and school priorities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D6B46A] text-[#071B33]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Step 2: Get matched schools
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          See options aligned with your preferences.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071B33] text-white">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Step 3: Compare and book a tour
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Shortlist schools and request a visit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F8F1E7] p-4">
                  <p className="text-sm font-semibold text-[#071B33]">
                    Built for UAE parents
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    A clearer way to move from school search to confident
                    decision-making.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-[#D6B46A] px-5 py-4 shadow-xl lg:block">
            <p className="text-sm font-semibold text-[#071B33]">
              Search • Match • Compare • Tour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}