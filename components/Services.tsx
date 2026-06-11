"use client";

import { motion } from "framer-motion";
import Container from "./Container";
import { Bus, Building2, ClipboardCheck, Users } from "lucide-react";

const services = [
  {
    icon: Building2,
    title: "Industrial Visits",
    desc: "Structured visits to workplaces, factories, innovation centres, and professional environments.",
  },
  {
    icon: Bus,
    title: "End-to-End Trip Planning",
    desc: "Support with itinerary planning, transport coordination, schedules, and visit flow.",
  },
  {
    icon: Users,
    title: "Career Exposure Programs",
    desc: "Experiences designed to help students understand real career paths and industry roles.",
  },
  {
    icon: ClipboardCheck,
    title: "Custom Learning Itineraries",
    desc: "Tailored visit plans based on age group, academic stream, institution goals, and industry interest.",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <Container>
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold mb-3">
            What We Offer
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Educational experiences designed for institutions
          </h2>

          <p className="mt-5 text-slate-600 max-w-2xl mx-auto">
            HeecoWorld helps schools and colleges organise meaningful learning experiences beyond the classroom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.title}
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
                  {service.title}
                </h3>

                <p className="text-slate-600 leading-7 text-sm">
                  {service.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}