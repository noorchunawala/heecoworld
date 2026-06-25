"use client";

import { useEffect, useState } from "react";
import { getMyListingAdminAccess } from "@/lib/listingAdmin";

export default function ListingAdminPage() {
  const [loading, setLoading] = useState(true);
  const [accessRows, setAccessRows] = useState<any[]>([]);

  useEffect(() => {
    async function loadAccess() {
      try {
        const access = await getMyListingAdminAccess();
        setAccessRows(access);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    loadAccess();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
        Loading listing admin...
      </main>
    );
  }

  if (accessRows.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
        You do not have access to any listing dashboard.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
          Listing Admin
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#071B33]">
          Your listing dashboard
        </h1>

        <div className="mt-6 space-y-3">
          {accessRows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-100 bg-[#FAF7F0] p-5"
            >
              <p className="font-semibold text-[#071B33]">
                Listing ID: {row.listing_id}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Role: {row.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}