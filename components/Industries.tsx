"use client";

import { motion } from "framer-motion";
import Container from "./Container";

const industries = [
  {
    title: "Aviation",
    emoji: "✈️",
    desc: "Airport operations, aircraft maintenance exposure, aviation safety, and airline ecosystem awareness.",
  },
  {
    title: "Manufacturing",
    emoji: "🏭",
    desc: "Factory workflows, production lines, quality checks, machinery, and industrial process understanding.",
  },
  {
    title: "Technology",
    emoji: "💻",
    desc: "Software companies, innovation labs, AI exposure, product development, and digital transformation.",
  },
  {
    title: "Healthcare",
    emoji: "🏥",
    desc: "Healthcare operations, hospital departments, medical technology, and future healthcare careers.",
  },
  {
    title: "Logistics",
    emoji: "🚢",
    desc: "Supply chains, warehouse operations, ports, transportation, and movement of goods.",
  },
  {
    title: "Energy",
    emoji: "⚡",
    desc: "Power generation, sustainability, renewable energy, utilities, and future energy careers.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-24 bg-slate-50">
      <Container>
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold mb-3">
            Industry Exposure Areas
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Career-connected visits across major sectors
          </h2>

          <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
            Students get practical exposure to industries that shape the economy and future career opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-8 shadow-sm border"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-6">
                {industry.emoji}
              </div>

              <h3 className="text-2xl font-semibold">
                {industry.title}
              </h3>

              <p className="mt-4 text-slate-600 leading-7">
                {industry.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}