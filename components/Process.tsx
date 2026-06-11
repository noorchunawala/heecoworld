"use client";

import { motion } from "framer-motion";
import Container from "./Container";

const steps = [
  {
    title: "Submit Request",
    desc: "School shares student count, preferred date, and industry interest.",
  },
  {
    title: "Receive Proposal",
    desc: "HeecoWorld prepares a structured itinerary and visit plan.",
  },
  {
    title: "Confirm Visit",
    desc: "Dates, transport, approvals, and visit flow are finalized.",
  },
  {
    title: "Experience Industry",
    desc: "Students visit, learn, interact, and understand real workplaces.",
  },
];

export default function Process() {
  return (
 <section id="process" className="py-24 bg-slate-50">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold">
            From enquiry to industry visit
          </h2>

          <p className="mt-4 text-slate-600">
            A simple process designed for schools and colleges.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 border shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold mb-6">
                {index + 1}
              </div>

              <h3 className="text-xl font-semibold">
                {step.title}
              </h3>

              <p className="mt-3 text-slate-600 text-sm leading-6">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}