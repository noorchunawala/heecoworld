"use client";

import { motion } from "framer-motion";
import Container from "./Container";
import {
  Network,
  Clock,
  GraduationCap,
  Repeat,
} from "lucide-react";

const reasons = [
  {
    icon: Network,
    title: "One Point of Coordination",
    desc: "Schools do not need to manage multiple conversations separately. HeecoWorld helps centralise enquiry, planning, communication, and visit flow.",
  },
  {
    icon: Clock,
    title: "Reduced Admin Effort",
    desc: "From visit requirements to itinerary planning, the process is designed to reduce manual coordination for school and college teams.",
  },
  {
    icon: GraduationCap,
    title: "Learning-First Approach",
    desc: "The focus is not just taking students outside campus, but creating experiences connected to learning, careers, and real-world understanding.",
  },
  {
    icon: Repeat,
    title: "Long-Term Program Vision",
    desc: "Heeco is built to support institutions with recurring exposure programs, future workshops, industry talks, and career-linked experiences.",
  },
];

export default function WhyHeeco() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold mb-3">
            Why Institutions Choose Heeco
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Simplifying industry exposure for schools and colleges
          </h2>

          <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
            HeecoWorld helps institutions move from scattered planning to a more organised, scalable, and student-focused experience model.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;

            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl border bg-slate-50 p-7 hover:bg-white hover:shadow-xl transition"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6">
                  <Icon size={24} />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  {reason.title}
                </h3>

                <p className="text-slate-600 leading-7 text-sm">
                  {reason.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}