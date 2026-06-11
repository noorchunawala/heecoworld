import Container from "./Container";

const items = [
  {
    title: "Our Mission",
    desc: "To make real-world industry exposure accessible, structured, and valuable for students across schools and colleges.",
  },
  {
    title: "Our Vision",
    desc: "To become a leading experiential education platform connecting academic institutions with industries, mentors, and future career pathways.",
  },
  {
    title: "Our Goal",
    desc: "To help students understand careers practically through guided visits, industry interactions, workshops, and curated learning experiences.",
  },
];

export default function MissionVision() {
  return (
    <section className="py-24 bg-slate-50">
      <Container>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-3xl p-8 border shadow-sm"
            >
              <h3 className="text-2xl font-bold mb-4">
                {item.title}
              </h3>

              <p className="text-slate-600 leading-7">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}