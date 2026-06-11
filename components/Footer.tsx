import Container from "./Container";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white py-14">
      <Container>
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold">
              HeecoWorld
            </h3>

            <p className="mt-4 text-slate-400 max-w-md leading-7">
              Heeco - Hub of Experiential Education and Corporate Outreach.
              Building meaningful bridges between students, institutions, and real-world industry exposure.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Quick Links
            </h4>

            <div className="space-y-3 text-slate-400">
              <a href="#about" className="block hover:text-white">
                About
              </a>
              <a href="#services" className="block hover:text-white">
                Services
              </a>
              <a href="#industries" className="block hover:text-white">
                Industries
              </a>
              <a href="#process" className="block hover:text-white">
                Process
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Contact
            </h4>

            <div className="space-y-3 text-slate-400">
              <p>Dubai / Sharjah, UAE</p>
              <p>info@heecoworld.com</p>
              <p>+971 0585377860</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-slate-500 flex flex-col md:flex-row justify-between gap-4">
          <p>
            © {new Date().getFullYear()} HeecoWorld. All rights reserved.
          </p>

          <p>
            Experiential Education • Corporate Outreach • Career Exposure
          </p>
        </div>
      </Container>
    </footer>
  );
}