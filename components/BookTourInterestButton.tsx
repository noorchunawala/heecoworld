"use client";

import { useState } from "react";

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

  const handleClick = async () => {
    if (!schoolIds.length) return;

    setLoading(true);

    await fetch("/api/tour-interest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ schoolIds ,schoolNames }),
    });

    setLoading(false);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{color:'#d6b46a'}}
        className="rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 "
      >
        {loading ? "Please wait..." : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#071B33]/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
              Interest recorded
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#071B33]">
              Thanks for your interest
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This school is not currently onboarded for direct school tours or
              virtual tours through HeecoWorld. Your interest has been recorded,
              and we are working with schools to enable this feature soon.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-full bg-[#071B33] px-5 py-3 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}