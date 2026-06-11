"use client";

import Container from "./Container";

export default function FinalCTA() {
  return (
    <section id="contact" className="py-24">
      <Container>
        <div className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-cyan-500 p-10 md:p-16 text-center text-white shadow-xl">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to inspire your students?
          </h2>

          <p className="mt-5 text-blue-50 max-w-2xl mx-auto">
            Submit your enquiry and let HeecoWorld help plan a structured educational industry visit.
          </p>

          <button
            onClick={() =>
              document.dispatchEvent(new Event("open-enquiry"))
            }
            className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
          >
            Submit Enquiry
          </button>
        </div>
      </Container>
    </section>
  );
}