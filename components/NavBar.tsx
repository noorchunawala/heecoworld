"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Container from "./Container";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const openEnquiry = () => {
    document.dispatchEvent(new Event("open-enquiry"));
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200">
      <Container>
        <div className="h-20 flex items-center justify-between">
          <a href="#" className="text-xl font-bold">
            HeecoWorld
          </a>

          <nav className="hidden md:flex gap-8 text-sm">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-blue-600">
                {link.label}
              </a>
            ))}
          </nav>

          <button
            onClick={openEnquiry}
            className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition"
          >
            Request Proposal
          </button>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-6">
            <div className="rounded-2xl bg-white border shadow-sm p-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}

              <button
                onClick={openEnquiry}
                className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl"
              >
                Request Proposal
              </button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}