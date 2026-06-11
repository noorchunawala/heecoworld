"use client";

import { useState } from "react";
import Container from "./Container";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What does HeecoWorld do?",
    answer:
      "HeecoWorld helps schools and colleges plan structured educational visits to industries, workplaces, innovation spaces, and professional environments.",
  },
  {
    question: "Which students can participate?",
    answer:
      "Visits can be planned for school and college students depending on the institution requirement, student age group, and the suitability of the visit location.",
  },
  {
    question: "Do you arrange transport?",
    answer:
      "HeecoWorld can help coordinate transport planning through suitable transport providers based on the visit requirement and institution preference.",
  },
  {
    question: "Can visits be customised?",
    answer:
      "Yes. Visit plans can be customised based on academic stream, grade level, industry interest, student count, and learning objective.",
  },
  {
    question: "How early should an institution enquire?",
    answer:
      "It is better to enquire in advance so that availability, scheduling, approvals, transport coordination, and itinerary planning can be managed smoothly.",
  },
  {
    question: "Which industries can students explore?",
    answer:
      "Possible exposure areas include aviation, technology, logistics, healthcare, manufacturing, energy, sustainability, and other professional sectors depending on availability.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-slate-50">
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-blue-600 font-semibold mb-3">
            FAQs
          </p>

          <h2 className="text-4xl md:text-5xl font-bold">
            Questions schools usually ask
          </h2>

          <p className="mt-5 text-slate-600">
            Simple answers before you submit an enquiry.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="bg-white border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="w-full flex items-center justify-between text-left p-6"
                >
                  <span className="font-semibold text-lg">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    size={20}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 leading-7">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}