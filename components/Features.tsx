"use client";

import { motion } from "framer-motion";

const features = [
  "Industrial Visits",
  "University Exposure Tours",
  "Safe & Managed School Trips",
  "Custom Learning Experiences",
];

export default function Features() {
  return (
    <section className="grid md:grid-cols-4 gap-6 px-10 py-20 bg-white">
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-6 rounded-2xl bg-white/60 backdrop-blur-md shadow-md border hover:shadow-xl hover:-translate-y-1 transition"
        >
          <p className="font-medium text-gray-800">{f}</p>
        </motion.div>
      ))}
    </section>
  );
}