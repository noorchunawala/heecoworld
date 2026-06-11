import Container from "./Container";

const items = [
  "Schools",
  "Colleges",
  "Industries",
  "Transport Partners",
  "Career Mentors",
];

export default function CollaborationStrip() {
  return (
    <section className="py-10 border-y bg-white">
      <Container>
        <p className="text-center text-sm text-slate-500 mb-6">
          Built for smooth collaboration between education and industry
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {items.map((item) => (
            <div
              key={item}
              className="px-5 py-3 rounded-full bg-slate-50 border text-slate-700 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}