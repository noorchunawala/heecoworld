"use client";

import { motion } from "framer-motion";
import Container from "./Container";

const stats = [
  {
    number: "100+",
    label: "Industry Visits",
  },
  {
    number: "5000+",
    label: "Students",
  },
  {
    number: "50+",
    label: "Partner Industries",
  },
  {
    number: "20+",
    label: "Schools & Colleges",
  },
];

export default function Stats() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((item, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 50,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              className="
                bg-white
                rounded-3xl
                shadow-sm
                p-8
                text-center
              "
            >
              <h3 className="text-4xl font-bold text-blue-600">
                {item.number}
              </h3>

              <p className="mt-3 text-slate-600">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}