"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, User, X } from "lucide-react";
import Container from "./Container";
import { useAuth } from "@/components/AuthProvider";
import { useUI } from "@/components/UIProvider";

const navLinks = [
  { label: "Learning", href: "/practice-tests" },
  { label: "Schools", href: "/schools" },
  { label: "For Schools", href: "/for-schools" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { status } = useAuth();
  const { openAccount } = useUI();
 

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <Container>
        <div className="flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
  <img
    src="/logo.png"
    alt="Scoolyx"
    className="h-12 w-auto"
  />
</Link>

          <nav className="hidden items-center gap-2 rounded-full bg-slate-50 p-1 text-sm font-bold lg:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`rounded-full px-5 py-2.5 transition ${
                    active
                      ? "bg-white text-[#5B3DF5] shadow-sm"
                      : "text-[#111135] hover:bg-white hover:text-[#5B3DF5]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/shortlist"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-[#111135] transition hover:bg-[#F7F6FF] hover:text-[#5B3DF5]"
              aria-label="Shortlist"
            >
              <Heart className="h-4 w-4" />
            </Link>

            {status === "authenticated" ? (
              <button
                onClick={openAccount}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#111135] transition hover:bg-[#F7F6FF] hover:text-[#5B3DF5]"
              >
                <User className="h-4 w-4" />
                My Dashboard
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#111135] transition hover:bg-[#F7F6FF] hover:text-[#5B3DF5]"
              >
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F6FF] text-[#111135] lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="pb-6 lg:hidden">
            <div className="space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              {navLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isActive(link.href)
                      ? "bg-[#F7F6FF] text-[#5B3DF5]"
                      : "text-[#111135] hover:bg-[#F7F6FF]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {status === "authenticated" ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    openAccount();
                  }}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#111135] hover:bg-[#F7F6FF]"
                >
                  My Dashboard
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-[#111135] hover:bg-[#F7F6FF]"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}