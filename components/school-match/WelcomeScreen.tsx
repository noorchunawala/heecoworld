import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

type WelcomeScreenProps = {
  onStart: () => void;
};

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl items-center justify-center">
      <div className="w-full rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-100/50 sm:p-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
          <Sparkles className="h-7 w-7" />
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          Heeco Match™
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Find the right school in under 60 seconds.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Answer a few simple questions and HeecoWorld will recommend schools
          that match your child, budget, curriculum and location.
        </p>

        <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {[
            "Personalized recommendations",
            "Compare schools instantly",
            "Book school tours easily",
            "Built for UAE parents",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-blue-700" />
              <span className="text-sm font-medium text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Button size="lg" className="gap-2" onClick={onStart}>
            Start Matching
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}