"use client";

import { useState } from "react";
import { trackTourInterest } from "@/lib/analytics";

export default function BookTourInterestButton({
  schoolIds,
  schoolNames,
  label = "Book Tour",
}: {
  schoolIds: string[];
  schoolNames: string[];
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

 const handleClick = () => {
  if (!schoolIds.length) return;
  setOpen(true);
};
const submitInterest = async () => {
  if (!email.trim()) {
    alert("Please enter your email.");
    return;
  }

  setLoading(true);

  await fetch("/api/tour-interest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ schoolIds, schoolNames, email }),
  });

  await Promise.all(
    schoolIds.map((id, index) =>
      trackTourInterest({
        id,
        name: schoolNames?.[index] || "Unknown school",
      })
    )
  );

  setLoading(false);
  setSaved(true);
};

 
  return (
  <>
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{ color: "#d6b46a" }}
      className="rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {label}
    </button>

    {open && (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#071B33]/75 p-4 backdrop-blur-md">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
          {!saved ? (
            <>
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
      School tours coming soon
    </p>

    <h2 className="mt-3 text-2xl font-semibold text-[#071B33]">
      Help us bring tours to this school
    </h2>

    <p className="mt-3 text-sm leading-6 text-slate-600">
      This school is not yet partnered with HeecoWorld for direct tour bookings
      or virtual tours. Leave your email and we’ll notify you when tours become
      available.
    </p>

    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="Enter your email"
      className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#D6B46A]"
    />

    <button
      type="button"
      onClick={submitInterest}
      disabled={loading}
      className="mt-4 w-full rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Saving..." : "Notify Me"}
    </button>

    <button
      type="button"
      onClick={() => setOpen(false)}
      className="mt-3 w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-[#071B33]"
    >
      Maybe later
    </button>
  </>
          ) : (
             <>
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
      You’re on the list
    </p>

    <h2 className="mt-3 text-2xl font-semibold text-[#071B33]">
      Thanks for your interest
    </h2>

    <p className="mt-3 text-sm leading-6 text-slate-600">
      We’ll notify you when this school starts accepting tour bookings through
      HeecoWorld.
    </p>

    <button
      type="button"
      onClick={() => setOpen(false)}
      className="mt-6 w-full rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white"
    >
      Done
    </button>
  </>
          )}
        </div>
      </div>
    )}
  </>
);}
    
