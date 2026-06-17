import Link from "next/link";
import HeroV2 from "@/components/HeroV2";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Factory,
  GitCompare,
  Heart,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const productSteps = [
  {
    title: "Search UAE schools",
    description:
      "Browse schools by emirate, curriculum, fees and key priorities.",
    icon: Search,
    href: "/schools",
  },
  {
    title: "Find your best match",
    description:
      "Answer guided questions and get school recommendations based on your needs.",
    icon: Sparkles,
    href: "/heeco-match",
  },
  {
    title: "Compare shortlisted schools",
    description:
      "Review schools side by side before deciding which ones to visit.",
    icon: GitCompare,
    href: "/compare",
  },
  {
    title: "Book school tours",
    description:
      "Request tours for one school or up to three shortlisted schools together.",
    icon: CalendarDays,
    href: "/school-tour",
  },
];

const parentBenefits = [
  "Search schools in one place",
  "Compare curriculum, fees and location",
  "Save schools to your shortlist",
  "Request school tours easily",
];

const schoolBenefits = [
  "Get discovered by UAE parents",
  "Receive qualified tour requests",
  "Showcase curriculum, fees and facilities",
  "Build trust with a stronger school profile",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <HeroV2 />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
            How HeecoWorld works
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071B33] sm:text-4xl">
            A clearer way for parents to choose the right school.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            HeecoWorld brings school search, matching, comparison, shortlisting
            and tour requests into one simple product journey.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {productSteps.map((step) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.title}
                href={step.href}
                className="group rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-[#071B33]/8 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071B33] text-[#D6B46A]">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-[#071B33]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>

                <div className="mt-5 inline-flex items-center text-sm font-semibold text-[#B58A34]">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      

      

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-[#071B33] p-8 text-white shadow-xl shadow-[#071B33]/20">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#F5E6C8]">
                <Factory className="h-4 w-4 text-[#D6B46A]" />
                Educational experiences
              </div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Industrial visits are now a separate HeecoWorld vertical.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Alongside school discovery, HeecoWorld also supports schools
                with structured real-world learning experiences and industrial
                visits across the UAE.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button
                asChild
                className="rounded-full bg-[#D6B46A] text-[#071B33] hover:bg-[#E3C982]"
              >
                <Link href="/industrial-visits">
                  Explore Industrial Visits
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/schools">Back to Schools</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E8DCC6] bg-[#071B33] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D6B46A]">
              HeecoWorld
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Find, compare, shortlist and visit schools.
            </h2>

            <p className="mt-2 text-sm text-slate-300" dir="rtl">
              منصة تعليمية لاكتشاف المدارس المناسبة في دولة الإمارات
            </p>
          </div>

          <Button
            asChild
            className="rounded-full bg-[#D6B46A] text-[#071B33] hover:bg-[#E3C982]"
          >
            <Link href="/heeco-match">
              Start Heeco Match
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}