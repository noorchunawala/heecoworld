import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GitCompare,
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
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden rounded-3xl bg-[#F7F6FF] px-4 py-12 sm:px-6 lg:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.14),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-bold text-[#5B3DF5] shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Scoolyx Match
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-[-0.04em] text-[#111135] sm:text-6xl">
            Find schools that match your child.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Answer a few guided questions and Scoolyx will suggest UAE schools
            based on curriculum preference, location, budget and priorities.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={onStart}
              className="h-13 rounded-full bg-[#111135] px-7 text-white hover:bg-[#1D1B4F]"
            >
              Start Match
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="rounded-full bg-white/80 px-5 py-3 text-sm font-bold text-[#3A386A] shadow-sm backdrop-blur">
              Takes about 1 minute
            </div>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
            {benefits.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-3xl bg-white/85 p-4 shadow-sm backdrop-blur"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#5B3DF5]" />
                <span className="text-sm font-semibold text-slate-700">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5B3DF5]">
                    Match Journey
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#111135]">
                    From search to shortlist
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
                  <School className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <JourneyStep
                  icon={<ClipboardCheck className="h-5 w-5" />}
                  title="Tell us what matters"
                  text="Curriculum, budget, location and school priorities."
                  dark
                />

                <JourneyStep
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Get matched schools"
                  text="See options aligned with your preferences."
                />

                <JourneyStep
                  icon={<GitCompare className="h-5 w-5" />}
                  title="Compare your shortlist"
                  text="Review school options side by side."
                  dark
                />

                <JourneyStep
                  icon={<MapPin className="h-5 w-5" />}
                  title="Book a school tour"
                  text="Request a visit when you are ready."
                />
              </div>

              <div className="mt-6 rounded-3xl bg-[#F7F6FF] p-5">
                <p className="text-sm font-black text-[#111135]">
                  Built for UAE parents
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  A clearer way to move from school search to confident
                  decision-making.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-[#111135] px-5 py-4 shadow-xl lg:block">
            <p className="text-sm font-bold text-white">
              Search • Match • Compare • Tour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyStep({
  icon,
  title,
  text,
  dark,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            dark
              ? "bg-[#111135] text-white"
              : "bg-[#F1EEFF] text-[#5B3DF5]"
          }`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-black text-[#111135]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
        </div>
      </div>
    </div>
  );
}