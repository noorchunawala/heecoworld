"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/SupabaseClient";

type SchoolRow = {
  id: string;
  name: string;
  slug: string;
  emirate: string | null;
  area: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function AdminSchoolsPage() {
  const router = useRouter();

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadSchools() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id, name, slug, emirate, area, status, email, phone, created_at")
        .eq("type", "school")
        .order("name", { ascending: true });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setSchools(data || []);
      setLoading(false);
    }

    loadSchools();
  }, [router]);

  const filteredSchools = useMemo(() => {
    const q = search.toLowerCase();

    return schools.filter((school) => {
      return (
        school.name?.toLowerCase().includes(q) ||
        school.slug?.toLowerCase().includes(q) ||
        school.emirate?.toLowerCase().includes(q) ||
        school.area?.toLowerCase().includes(q) ||
        school.email?.toLowerCase().includes(q) ||
        school.phone?.toLowerCase().includes(q)
      );
    });
  }, [schools, search]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading schools...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Schools</h1>
            <p className="text-slate-500">
              Update school information without opening Supabase.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="bg-white border px-5 py-2 rounded-xl text-slate-900"
            >
              Back to Admin
            </Link>

            <Link
              href="/schools"
              className="bg-slate-900 text-white px-5 py-2 rounded-xl"
            >
              View Website
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <SummaryCard title="Total Schools" value={schools.length} />
          <SummaryCard
            title="Active"
            value={schools.filter((x) => x.status === "active").length}
          />
          <SummaryCard
            title="Inactive"
            value={schools.filter((x) => x.status !== "active").length}
          />
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by school, slug, emirate, area, email or phone..."
            className="w-full bg-white border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-4">School</th>
                <th className="p-4">Location</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.id} className="border-t">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">
                      {school.name}
                    </p>
                    <p className="text-xs text-slate-500">{school.slug}</p>
                  </td>

                  <td className="p-4">
                    {school.emirate || "-"}
                    <br />
                    <span className="text-slate-500">
                      {school.area || "-"}
                    </span>
                  </td>

                  <td className="p-4">
                    {school.phone || "-"}
                    <br />
                    <span className="text-slate-500">
                      {school.email || "-"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {school.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/schools/${school.id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/schools/${school.slug}`}
                        className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSchools.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
}