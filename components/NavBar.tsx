"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import Container from "./Container";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Schools", href: "/schools" },
  { label: "Heeco Match", href: "/heeco-match" },
  { label: "Compare", href: "/compare" },
  { label: "Shortlist", href: "/shortlist" },
  { label: "Experiences", href: "/industrial-visits" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071B33] font-bold text-[#D6B46A]">
              H
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#071B33]">
                HeecoWorld
              </h1>

              <p className="text-xs text-slate-500">
                UAE Education Marketplace
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-[#B58A34] ${
                  isActive(link.href)
                    ? "text-[#B58A34]"
                    : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/shortlist"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#071B33]/10 text-[#071B33] transition hover:bg-[#F8F1E7]"
              aria-label="Shortlist"
            >
              <Heart className="h-4 w-4" />
            </Link>

            <Link
              href="/for-schools"
              className="rounded-full bg-[#071B33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B2A4D]"
            >
              List Your School
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#071B33] lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="pb-6 lg:hidden">
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive(link.href)
                      ? "bg-[#F8F1E7] text-[#071B33]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/school-tour"
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-full bg-[#071B33] px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Book a School Tour
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}