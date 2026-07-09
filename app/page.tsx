"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Search,
  Star,
} from "lucide-react";

const purple = "#5B3DF5";

const reviews = [
  {
    name: "Ayesha Khan",
    role: "Parent",
    text: "Scoolyx helps me understand what my child is learning and how they are improving.",
  },
  {
    name: "Rohan Mehta",
    role: "Parent",
    text: "The practice tests are easy to create and the results are very insightful.",
  },
  {
    name: "Fatima Al Mansoori",
    role: "Teacher",
    text: "Creating assessments from the question bank saves time and keeps papers structured.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#101044]">
      <section className="relative overflow-hidden bg-[#F7F6FF]">
        <div className="absolute inset-0">
          <Image
            src="/images/scoolyx-hero-clean.png"
            alt="Student learning with Scoolyx"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10" />
        </div>

        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            

            <h1 className="text-5xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-[70px]">
              Smarter Learning.
              <br />
              Better Tomorrow.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#33316B]">
              Understand your child&apos;s learning, create practice tests,
              track progress and stay connected with school results.
            </p>

            <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold text-[#33316B]">
              {[
                ["Curriculum aligned", BookOpen],
                ["First tests free", CheckCircle2],
                ["Track learning progress", BarChart3],
              ].map(([label, Icon]: any) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

           <div className="mt-10 flex flex-col items-start gap-4">
  <Link
    href="/complete-profile"
    className="inline-flex h-14 items-center justify-center rounded-full bg-[#111135] px-8 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-[#1D1B4F]"
  >
    Get Started
    <ArrowRight className="ml-2 h-4 w-4" />
  </Link>

  <p className="text-sm font-semibold text-[#33316B]">
    Already have an account?{" "}
    <Link href="/login" className="text-[#5B3DF5] hover:underline">
      Sign in →
    </Link>
  </p>
</div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Practice Tests
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em]">
              Practice tests made simple
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
              Choose a chapter or topic, set preferences and get instant results
              with detailed insights.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_0.55fr] lg:items-center">
            <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-violet-500/10">
              <p className="text-sm font-black text-[#101044]">
                Create a Practice Test
              </p>

              <div className="mt-6 grid gap-4">
                {[
                  ["Curriculum", "CBSE Class 10"],
                  ["Subject", "Science"],
                  ["Chapter / Topic", "Chemical Reactions and Equations"],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-2 sm:grid-cols-[0.35fr_1fr] sm:items-center">
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                      {value}
                    </div>
                  </div>
                ))}

                <div className="grid gap-2 sm:grid-cols-[0.35fr_1fr] sm:items-center">
                  <p className="text-xs font-bold text-slate-500">
                    No. of Questions
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 30, 50].map((item) => (
                      <div
                        key={item}
                        className={`rounded-xl border px-4 py-3 text-center text-sm font-bold ${
                          item === 20
                            ? "border-[#5B3DF5] bg-[#F1EEFF] text-[#5B3DF5]"
                            : "border-slate-200"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[0.35fr_1fr] sm:items-center">
                  <p className="text-xs font-bold text-slate-500">Difficulty</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Easy", "Medium", "Hard"].map((item) => (
                      <div
                        key={item}
                        className={`rounded-xl border px-4 py-3 text-center text-sm font-bold ${
                          item === "Medium"
                            ? "border-[#5B3DF5] bg-[#F1EEFF] text-[#5B3DF5]"
                            : "border-slate-200"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute left-5 top-0 h-full border-l border-dashed border-[#C9C1FF]" />
              {[
                "Choose curriculum",
                "Select chapter or topic",
                "Set questions and time",
                "Generate test",
                "View result & analysis",
              ].map((step, index) => (
                <div key={step} className="relative mb-8 flex items-center gap-5">
                  <span className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E3FF] text-sm font-black text-[#5B3DF5]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-[#33316B]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F6FF] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Progress Tracking
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em]">
              See progress.
              <br />
              Take action.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
              Track practice and school performance in one place. Focus on what
              matters most for your child.
            </p>

            <Link
              href="/my-learning/progress"
              className="mt-7 inline-flex items-center text-sm font-bold text-[#5B3DF5]"
            >
              Explore Progress <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-xl shadow-violet-500/10">
            <div className="grid gap-5 lg:grid-cols-[0.28fr_1fr]">
              <div className="rounded-2xl bg-[#F7F6FF] p-4">
                {["Overview", "Practice Tests", "School Result", "Subjects"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={`mb-3 rounded-xl px-3 py-3 text-xs font-bold ${
                        index === 0
                          ? "bg-white text-[#5B3DF5] shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>

              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-3">
                  <Kpi label="Overall Performance" value="85%" />
                  <Kpi label="Practice Score" value="92%" />
                  <Kpi label="School Result" value="84%" />
                </div>

                <div className="rounded-2xl border border-slate-100 p-5">
                  <p className="text-sm font-black">Subject Performance</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    {[
                      ["Science", "88%"],
                      ["Maths", "82%"],
                      ["English", "79%"],
                      ["Social Science", "91%"],
                    ].map(([subject, score]) => (
                      <div
                        key={subject}
                        className="rounded-xl bg-[#F7F6FF] px-4 py-4"
                      >
                        <p className="text-xs font-bold text-slate-500">
                          {subject}
                        </p>
                        <p className="mt-2 text-lg font-black text-emerald-600">
                          {score}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FFFCF5] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Find the right school
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em]">
              Explore. Compare.
              <br />
              Choose with confidence.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
              Search schools across UAE, compare what matters and book a tour.
            </p>

            <Link
              href="/schools"
              className="mt-7 inline-flex items-center text-sm font-bold text-[#5B3DF5]"
            >
              Browse Schools <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Search Schools", "Find schools by location, curriculum, grade and more.", Search],
              ["Compare Schools", "Compare up to 3 schools side by side.", ClipboardList],
              ["Book a Tour", "Request school tours in just a few clicks.", CalendarDays],
            ].map(([title, text, Icon]: any) => (
              <Link
                key={title}
                href={title === "Compare Schools" ? "/compare" : title === "Book a Tour" ? "/school-tour" : "/schools"}
                className="rounded-3xl bg-white p-7 shadow-lg shadow-violet-500/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EEFF] text-[#5B3DF5]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-black">{title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{text}</p>
                <ArrowRight className="mt-8 h-4 w-4 text-[#5B3DF5]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B3DF5]">
              Loved by parents and teachers
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em]">
              Trusted by families and schools
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="rounded-3xl border border-slate-100 bg-white p-7 shadow-lg shadow-violet-500/5"
              >
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {review.text}
                </p>
                <p className="mt-6 font-black">{review.name}</p>
                <p className="text-sm text-slate-500">{review.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-[#5B3DF5]">{value}</p>
    </div>
  );
}