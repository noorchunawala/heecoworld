"use client";

import { motion } from "framer-motion";
import Container from "./Container";
import HeroMockup from "./HeroMockUp";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center py-24">
          
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex mb-6 px-4 py-2 rounded-full border bg-white shadow-sm">
              Built for School & Industry Collaboration
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Educational Industry Visits for Future Professionals
            </h1>

            <p className="mt-8 text-xl text-slate-600 max-w-2xl">
              Connect students with real-world industries through curated educational experiences.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() =>
                  document.dispatchEvent(new Event("open-enquiry"))
                }
                className="bg-blue-600 text-white px-8 py-4 rounded-xl text-center"
              >
                Request Proposal
              </button>

              <a href="#process" className="border px-8 py-4 rounded-xl bg-white text-center">
                How it works
              </a>
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <HeroMockup />
          </motion.div>

        </div>
      </Container>
    </section>
  );
}