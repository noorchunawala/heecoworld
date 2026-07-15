import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  GitCompare,
  GraduationCap,
  Mail,
  MapPin,
  School,
  Search,
  Sparkles,
} from "lucide-react";

const productLinks = [
  { label: "Home", href: "/" },
  { label: "Learning", href: "/my-learning" },
  { label: "Schools", href: "/schools" },
  { label: "Scoolyx Match", href: "/heeco-match" },
  { label: "Compare Schools", href: "/compare" },
  { label: "For Schools", href: "/for-schools" },
];

const learningLinks = [
  { label: "Practice Tests", href: "/my-learning", icon: BookOpen },
  { label: "Progress Reports", href: "/my-learning/progress", icon: BarChart3 },
  { label: "School Assessments", href: "/my-learning", icon: GraduationCap },
];

const schoolLinks = [
  { label: "Search Schools", href: "/schools", icon: Search },
  { label: "Scoolyx Match", href: "/heeco-match", icon: Sparkles },
  { label: "Compare Schools", href: "/compare", icon: GitCompare },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-[#111135] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <img
    src="/FooterLogo.png"
    alt="Scoolyx"
    className="h-12 w-auto"
  />
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
              Smarter learning for parents and students. Create practice tests,
              track progress, stay connected with school assessments and explore
              the right schools with confidence.
            </p>

            <div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#DCD7FF]">
              Smarter Learning. Better Tomorrow.
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#A99BFF]">
              Platform
            </h3>

            <div className="mt-5 grid gap-3">
              {productLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#A99BFF]">
              Learning
            </h3>

            <div className="mt-5 grid gap-3">
              {learningLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.10] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#A99BFF]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#A99BFF]">
              Schools
            </h3>

            <div className="mt-5 grid gap-3">
              {schoolLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.10] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#A99BFF]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/for-schools"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111135] transition hover:bg-[#F1EEFF]"
            >
              <School className="h-4 w-4" />
              School Portal
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#A99BFF]" />
              United Arab Emirates
            </span>

            <span className="hidden text-slate-700 sm:inline">•</span>

           

            <span className="hidden text-slate-700 sm:inline">•</span>

            <a
              href="mailto:info@scoolyx.com"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <Mail className="h-4 w-4 text-[#A99BFF]" />
              info@scoolyx.com
            </a>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Scoolyx. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}