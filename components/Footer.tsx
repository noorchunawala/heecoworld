import Link from "next/link";
import {
  CalendarDays,
  Factory,
  GitCompare,
  Heart,
  Mail,
  MapPin,
  School,
  Search,
  Sparkles,
} from "lucide-react";

const productLinks = [
  { label: "Home", href: "/" },
  { label: "Schools Directory", href: "/schools" },
  { label: "Heeco Match", href: "/heeco-match" },
  { label: "Compare Schools", href: "/compare" },
  { label: "Shortlist", href: "/shortlist" },
  { label: "Book School Tour", href: "/school-tour" },
];

const verticalLinks = [
  { label: "Industrial Visits", href: "/industrial-visits" },
  { label: "For Schools", href: "/schools" },
  { label: "School Profiles", href: "/schools" },
];

const featureLinks = [
  {
    label: "Search schools",
    href: "/schools",
    icon: Search,
  },
  {
    label: "Find best match",
    href: "/heeco-match",
    icon: Sparkles,
  },
  {
    label: "Compare schools",
    href: "/compare",
    icon: GitCompare,
  },
  {
    label: "Save shortlist",
    href: "/shortlist",
    icon: Heart,
  },
  {
    label: "Book tours",
    href: "/school-tour",
    icon: CalendarDays,
  },
  {
    label: "Industrial visits",
    href: "/industrial-visits",
    icon: Factory,
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#E8DCC6] bg-[#071B33] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D6B46A] font-bold text-[#071B33]">
                H
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  HeecoWorld
                </h2>
                <p className="text-sm text-slate-300">
                  UAE Education Marketplace
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Find, compare, shortlist and book school tours across the UAE.
              HeecoWorld helps parents make clearer school decisions from one
              simple platform.
            </p>

            <p className="mt-4 text-sm leading-7 text-[#F5E6C8]" dir="rtl">
              منصة تعليمية لاكتشاف ومقارنة المدارس في دولة الإمارات
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D6B46A]">
              Product
            </h3>

            <div className="mt-5 grid gap-3">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-300 transition hover:text-[#D6B46A]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D6B46A]">
              Verticals
            </h3>

            <div className="mt-5 grid gap-3">
              {verticalLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-sm text-slate-300 transition hover:text-[#D6B46A]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D6B46A]">
              Platform features
            </h3>

            <div className="mt-5 grid gap-3">
              {featureLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#D6B46A]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#D6B46A]" />
              United Arab Emirates
            </span>

            <span className="hidden text-slate-600 sm:inline">•</span>

            <span className="inline-flex items-center gap-2">
              <School className="h-4 w-4 text-[#D6B46A]" />
              For parents, schools and education partners
            </span>

            <span className="hidden text-slate-600 sm:inline">•</span>

            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#D6B46A]" />
              info@heecoworld.com
            </span>
          </div>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} HeecoWorld. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}