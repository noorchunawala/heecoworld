import Container from "./Container";

export default function About() {
  return (
    <section id="about" className="py-24 bg-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-blue-600 font-semibold mb-4">
              About HeecoWorld
            </p>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              A platform for experiential education and corporate exposure.
            </h2>
          </div>

          <div className="space-y-6 text-slate-600 text-lg leading-8">
            <p>
              HeecoWorld is an educational experience platform created to connect
              students with real-world industries, workplaces, innovation spaces,
              and professional environments.
            </p>

            <p>
              Our goal is to help schools and colleges move beyond classroom-only
              learning by giving students structured exposure to how industries
              operate, how professionals work, and how future careers are built.
            </p>

            <p>
              Heeco stands for Hub of Experiential Education and Corporate
              Outreach - a broader vision to build meaningful bridges between
              education, industry, and career readiness.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}