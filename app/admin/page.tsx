"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Enquiry = {
  id: number;
  full_name: string;
  institution: string;
  phone: string;
  email: string;
  students: number | null;
  preferred_month: string | null;
  industry: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Enquiry | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setEnquiries(data || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const updateStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from("enquiries")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setEnquiries((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const filteredEnquiries = useMemo(() => {
    const q = search.toLowerCase();

    return enquiries.filter((item) => {
      return (
        item.full_name?.toLowerCase().includes(q) ||
        item.institution?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.industry?.toLowerCase().includes(q)
      );
    });
  }, [search, enquiries]);

  const counts = {
    new: enquiries.filter((x) => x.status === "new").length,
    proposal_sent: enquiries.filter((x) => x.status === "proposal_sent").length,
    confirmed: enquiries.filter((x) => x.status === "confirmed").length,
    completed: enquiries.filter((x) => x.status === "completed").length,
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading enquiries...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">HeecoWorld Admin</h1>
            <p className="text-slate-500">
              Manage enquiry leads from schools and colleges.
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-slate-900 text-white px-5 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="New" value={counts.new} />
          <SummaryCard title="Proposal Sent" value={counts.proposal_sent} />
          <SummaryCard title="Confirmed" value={counts.confirmed} />
          <SummaryCard title="Completed" value={counts.completed} />
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school, contact, phone, email or industry..."
            className="w-full bg-white border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Institution</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Industry</th>
                <th className="p-4">Students</th>
                <th className="p-4">Month</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEnquiries.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 font-medium">{item.institution}</td>

                  <td className="p-4">
                    {item.full_name}
                    <br />
                    <span className="text-slate-500">{item.email}</span>
                  </td>

                  <td className="p-4">{item.phone}</td>
                  <td className="p-4">{item.industry}</td>
                  <td className="p-4">{item.students}</td>
                  <td className="p-4">{item.preferred_month}</td>

                  <td className="p-4">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateStatus(item.id, e.target.value)
                      }
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="new">New</option>
                      <option value="proposal_sent">Proposal Sent</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(item)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        View
                      </button>

                      <a
                        href={`https://wa.me/${item.phone}`}
                        target="_blank"
                        className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {selected.institution}
            </h2>

            <p className="text-slate-500 mb-6">
              Enquiry received on{" "}
              {new Date(selected.created_at).toLocaleString()}
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Detail label="Contact Person" value={selected.full_name} />
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Students" value={selected.students?.toString()} />
              <Detail label="Preferred Month" value={selected.preferred_month} />
              <Detail label="Industry" value={selected.industry} />
              <Detail label="Status" value={selected.status} />
            </div>

            <div className="mt-6">
              <p className="font-semibold mb-2">Additional Message</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-600 leading-7">
                {selected.message || "No message provided."}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <p className="text-slate-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}