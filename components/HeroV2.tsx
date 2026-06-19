"use client";

import { useEffect, useState } from "react";
import { motion ,AnimatePresence  } from "framer-motion";

const demoSteps = [
  {
    label: "Question 1 of 5",
    title: "Where are you looking?",
    value: "Dubai",
    progress: 20,
  },
  {
    label: "Question 2 of 5",
    title: "Preferred curriculum",
    value: "British",
    progress: 40,
  },
  {
    label: "Question 3 of 5",
    title: "Grade level",
    value: "Year 4",
    progress: 60,
  },
  {
    label: "Analysing preferences",
    title: "Finding schools that fit your family",
    value: "92% match found",
    progress: 85,
  },
  {
    label: "Top recommendation",
    title: "Demo British School",
    value: "98% Match",
    progress: 100,
  },
];

const activeStep = demoSteps[Math.floor(Date.now() / 2200) % demoSteps.length];

export default function HeroV2() {
  const highlights = [
  "Heeco Match™",
  "Compare Schools",
  "Request Tours",
  "UAE School Guide",
];


const [activeIndex, setActiveIndex] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setActiveIndex((current) => (current + 1) % demoSteps.length);
  }, 2200);

  return () => clearInterval(timer);
}, []);

const activeStep = demoSteps[activeIndex];

  return (
    <section className="relative overflow-hidden bg-[#071B33]">
      {/* Background Video */}
<video
  autoPlay
  muted
  loop
  playsInline
  className="absolute inset-0 h-full w-full object-cover"
>
  <source src="/video/HeroVideo.mp4" type="video/mp4" />
</video>

{/* Dark Overlay */}
<div className="absolute inset-0 bg-[#071B33]/70" />

{/* Premium Gradient */}
<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_38%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F8F1E7] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
              UAE School Discovery Platform
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
        Find the right UAE school for your child.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
             HeecoWorld helps parents discover UAE schools, use Heeco Match™ for guided recommendations, compare shortlisted options and request school tours from one platform.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              اكتشف المدرسة الأنسب لطفلك في دولة الإمارات
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/heeco-match"
                className="rounded-full bg-[#D6B46A] px-7 py-3.5 text-center text-sm font-semibold text-[#071B33] shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#E3C982] hover:shadow-2xl"
              >
                Start Heeco Match™
              </a>

              <a
                href="/schools"
                className="rounded-full border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
              >
                Browse Schools
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4 backdrop-blur"
                >
                  <p className="text-sm font-medium text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
  className="relative"
  animate={{
    y: [0, -8, 0],
  }}
  transition={{
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.1] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#F8F1E7] p-5 sm:p-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B58A34]">
                        HeecoWorld
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[#071B33]">
                      Heeco Match™
                      </h2>
                    </div>

                    <div className="rounded-full bg-[#071B33] px-4 py-2 text-xs font-semibold text-white">
                      UAE
                    </div>
                  </div>

                <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-4">
  <div className="mb-4 flex items-center justify-between">
    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
      {activeStep.label}
    </span>
  
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
    <motion.div
      key={activeStep.progress}
      initial={{ width: 0 }}
      animate={{ width: `${activeStep.progress}%` }}
      transition={{ duration: 0.6 }}
      className="h-full rounded-full bg-[#D6B46A]"
    />
  </div>

  <AnimatePresence mode="wait">
    <motion.div
      key={activeIndex}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="mt-5"
    >
      <p className="text-sm font-semibold text-[#071B33]">
        {activeStep.title}
      </p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm">
        <span className="text-sm font-medium text-slate-700">
          {activeStep.value}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D6B46A] text-xs font-bold text-[#071B33]">
          ✓
        </span>
      </div>
    </motion.div>
  </AnimatePresence>
</div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#071B33] p-4 text-white">
                      <p className="text-lg font-semibold">Compare</p>
                      <p className="mt-1 text-xs text-slate-300">
                        Shortlisted schools
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F3E3C3] p-4 text-[#071B33]">
                      <p className="text-lg font-semibold">Tour</p>
                      <p className="mt-1 text-xs text-slate-700">
                        Request a visit
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#071B33]">
                        Suggested next step
                      </p>
                      <span className="text-xs font-medium text-[#B58A34]">
                        Match ready
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                     Answer a few guided questions and get school recommendations your family can compare and visit.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-[#D6B46A] px-6 py-4 shadow-xl lg:block">
              <p className="text-sm font-semibold text-[#071B33]">
              Built for UAE families
              </p>
            </div>
         </motion.div>
        </div>
      </div>
    </section>
  );
}