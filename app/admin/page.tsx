"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/SupabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, CalendarDays, Eye, School, X } from "lucide-react";

type AdminTab = "enquiries" | "tourRequests" | "analytics";

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

type TourRequest = {
  id: string;
  school_ids: string[];
  school_names: string[];
  parent_name: string;
  mobile: string;
  email: string | null;
  child_grade: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  status: string;
  otp_verified?: boolean;
  created_at: string;
};

type SchoolPageView = {
  id: string;
  listing_id: string;
  school_name: string;
  school_slug: string;
  page_path: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

type SchoolRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("enquiries");

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [pageViews, setPageViews] = useState<SchoolPageView[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [selectedTourRequest, setSelectedTourRequest] =
    useState<TourRequest | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        router.push("/admin/login");
        return;
      }

      const [
        enquiriesResult,
        tourRequestsResult,
        pageViewsResult,
        schoolsResult,
      ] = await Promise.all([
        supabase
          .from("enquiries")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("tour_requests")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("school_page_views")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("listings")
          .select("id, name, slug, status")
          .eq("type", "school")
          .order("name", { ascending: true }),
      ]);

      if (enquiriesResult.error) {
        alert(enquiriesResult.error.message);
        setLoading(false);
        return;
      }

      if (tourRequestsResult.error) {
        alert(tourRequestsResult.error.message);
        setLoading(false);
        return;
      }

      if (pageViewsResult.error) {
        alert(pageViewsResult.error.message);
        setLoading(false);
        return;
      }

      if (schoolsResult.error) {
        alert(schoolsResult.error.message);
        setLoading(false);
        return;
      }

      setEnquiries(enquiriesResult.data || []);
      setTourRequests(tourRequestsResult.data || []);
      setPageViews(pageViewsResult.data || []);
      setSchools(schoolsResult.data || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const updateEnquiryStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from("enquiries")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setEnquiries((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const updateTourRequestStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("tour_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setTourRequests((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );

    setSelectedTourRequest((current) =>
      current && current.id === id ? { ...current, status } : current
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

  const filteredTourRequests = useMemo(() => {
    const q = search.toLowerCase();

    return tourRequests.filter((item) => {
      return (
        item.parent_name?.toLowerCase().includes(q) ||
        item.mobile?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.child_grade?.toLowerCase().includes(q) ||
        item.school_names.join(" ").toLowerCase().includes(q)
      );
    });
  }, [search, tourRequests]);

  const enquiryCounts = {
    new: enquiries.filter((x) => x.status === "new").length,
    proposal_sent: enquiries.filter((x) => x.status === "proposal_sent").length,
    confirmed: enquiries.filter((x) => x.status === "confirmed").length,
    completed: enquiries.filter((x) => x.status === "completed").length,
  };

  const tourCounts = {
    new: tourRequests.filter((x) => x.status === "new").length,
    contacted: tourRequests.filter((x) => x.status === "contacted").length,
    confirmed: tourRequests.filter((x) => x.status === "confirmed").length,
    closed: tourRequests.filter((x) => x.status === "closed").length,
  };

  const mostViewedSchools = useMemo(() => {
    const map = new Map<
      string,
      {
        listingId: string;
        schoolName: string;
        schoolSlug: string;
        views: number;
        latestView: string;
      }
    >();

    pageViews.forEach((view) => {
      const current = map.get(view.listing_id);

      if (!current) {
        map.set(view.listing_id, {
          listingId: view.listing_id,
          schoolName: view.school_name,
          schoolSlug: view.school_slug,
          views: 1,
          latestView: view.created_at,
        });
        return;
      }

      current.views += 1;

      if (new Date(view.created_at) > new Date(current.latestView)) {
        current.latestView = view.created_at;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [pageViews]);

  const mostRequestedSchools = useMemo(() => {
    const map = new Map<
      string,
      {
        schoolId: string;
        schoolName: string;
        requests: number;
      }
    >();

    tourRequests.forEach((request) => {
      request.school_names.forEach((schoolName, index) => {
        const schoolId = request.school_ids?.[index] || schoolName;
        const current = map.get(schoolId);

        if (!current) {
          map.set(schoolId, {
            schoolId,
            schoolName,
            requests: 1,
          });
          return;
        }

        current.requests += 1;
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }, [tourRequests]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading admin dashboard...
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
              Manage enquiries, school tours and school analytics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
  href="/admin/schools"
  className="bg-blue-600 text-white px-5 py-2 rounded-xl"
>
  Manage Schools
</Link>
            <Link
              href="/schools"
              className="bg-white border px-5 py-2 rounded-xl text-slate-900"
            >
              View Website
            </Link>
             <Link
  href="/admin/new-school"
  className="rounded-xl bg-blue-600 px-5 py-2 text-white"
>
  + Add School
</Link>

            <button
              onClick={logout}
              className="bg-slate-900 text-white px-5 py-2 rounded-xl"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <TabButton
            active={activeTab === "enquiries"}
            onClick={() => {
              setActiveTab("enquiries");
              setSearch("");
            }}
          >
            Industrial Visit Enquiries
          </TabButton>

          <TabButton
            active={activeTab === "tourRequests"}
            onClick={() => {
              setActiveTab("tourRequests");
              setSearch("");
            }}
          >
            School Tour Requests
          </TabButton>

          <TabButton
            active={activeTab === "analytics"}
            onClick={() => {
              setActiveTab("analytics");
              setSearch("");
            }}
          >
            School Analytics
          </TabButton>
        </div>

        {activeTab === "enquiries" && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <SummaryCard title="New" value={enquiryCounts.new} />
              <SummaryCard
                title="Proposal Sent"
                value={enquiryCounts.proposal_sent}
              />
              <SummaryCard title="Confirmed" value={enquiryCounts.confirmed} />
              <SummaryCard title="Completed" value={enquiryCounts.completed} />
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
                            updateEnquiryStatus(item.id, e.target.value)
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
                            onClick={() => setSelectedEnquiry(item)}
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
                      <td
                        colSpan={9}
                        className="p-8 text-center text-slate-500"
                      >
                        No enquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "tourRequests" && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <SummaryCard title="New" value={tourCounts.new} />
              <SummaryCard title="Contacted" value={tourCounts.contacted} />
              <SummaryCard title="Confirmed" value={tourCounts.confirmed} />
              <SummaryCard title="Closed" value={tourCounts.closed} />
            </div>

            <div className="mb-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parent, mobile, email, grade or school..."
                className="w-full bg-white border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Parent</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Schools</th>
                    <th className="p-4">Preferred</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTourRequests.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-4 font-medium">
                        {item.parent_name}
                        {item.child_grade && (
                          <>
                            <br />
                            <span className="text-slate-500">
                              {item.child_grade}
                            </span>
                          </>
                        )}
                      </td>

                      <td className="p-4">
                        {item.mobile}
                        <br />
                        <span className="text-slate-500">
                          {item.email || "No email"}
                        </span>
                      </td>

                      <td className="p-4">{item.school_names.join(", ")}</td>

                      <td className="p-4">
                        {item.preferred_date || "No date"}
                        <br />
                        <span className="text-slate-500">
                          {item.preferred_time || "No time"}
                        </span>
                      </td>

                      <td className="p-4">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            updateTourRequestStatus(item.id, e.target.value)
                          }
                          className="border rounded-lg px-3 py-2"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTourRequest(item)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                          >
                            View
                          </button>

                          <a
                            href={`https://wa.me/${item.mobile}`}
                            target="_blank"
                            className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTourRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500"
                      >
                        No tour requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <SummaryCard title="Active Schools" value={schools.length} />
              <SummaryCard title="Profile Views" value={pageViews.length} />
              <SummaryCard title="Tour Requests" value={tourRequests.length} />
              <SummaryCard title="Enquiries" value={enquiries.length} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <AnalyticsCard title="Most Viewed Schools" icon={<Eye />}>
                {mostViewedSchools.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No school views recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mostViewedSchools.map((item) => (
                      <div
                        key={item.listingId}
                        className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl p-4"
                      >
                        <div>
                          <Link
                            href={`/schools/${item.schoolSlug}`}
                            className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                          >
                            {item.schoolName}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1">
                            Latest: {new Date(item.latestView).toLocaleString()}
                          </p>
                        </div>

                        <span className="bg-slate-900 text-white rounded-full px-3 py-1 text-sm font-semibold">
                          {item.views}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </AnalyticsCard>

              <AnalyticsCard
                title="Most Requested Schools"
                icon={<CalendarDays />}
              >
                {mostRequestedSchools.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No school tour requests yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mostRequestedSchools.map((item) => (
                      <div
                        key={item.schoolId}
                        className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {item.schoolName}
                        </p>

                        <span className="bg-slate-900 text-white rounded-full px-3 py-1 text-sm font-semibold">
                          {item.requests}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </AnalyticsCard>

              <AnalyticsCard title="School Records" icon={<School />}>
                <div className="space-y-3">
                  {schools.map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between gap-4 bg-slate-50 rounded-2xl p-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {school.name}
                        </p>
                        <p className="text-xs text-slate-500">{school.slug}</p>
                      </div>

                      <Link
                        href={`/schools/${school.slug}`}
                        className="text-sm font-semibold text-blue-600"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Recent Profile Views" icon={<BarChart3 />}>
                {pageViews.slice(0, 10).map((view) => (
                  <div
                    key={view.id}
                    className="bg-slate-50 rounded-2xl p-4 mb-3"
                  >
                    <p className="font-semibold text-slate-900">
                      {view.school_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(view.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}

                {pageViews.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    No recent profile views.
                  </p>
                )}
              </AnalyticsCard>
            </div>
          </>
        )}
      </div>

      {selectedEnquiry && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setSelectedEnquiry(null)}
              className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {selectedEnquiry.institution}
            </h2>

            <p className="text-slate-500 mb-6">
              Enquiry received on{" "}
              {new Date(selectedEnquiry.created_at).toLocaleString()}
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Detail label="Contact Person" value={selectedEnquiry.full_name} />
              <Detail label="Phone" value={selectedEnquiry.phone} />
              <Detail label="Email" value={selectedEnquiry.email} />
              <Detail
                label="Students"
                value={selectedEnquiry.students?.toString()}
              />
              <Detail
                label="Preferred Month"
                value={selectedEnquiry.preferred_month}
              />
              <Detail label="Industry" value={selectedEnquiry.industry} />
              <Detail label="Status" value={selectedEnquiry.status} />
            </div>

            <div className="mt-6">
              <p className="font-semibold mb-2">Additional Message</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-600 leading-7">
                {selectedEnquiry.message || "No message provided."}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTourRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative">
            <button
              onClick={() => setSelectedTourRequest(null)}
              className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {selectedTourRequest.parent_name}
            </h2>

            <p className="text-slate-500 mb-6">
              Tour request received on{" "}
              {new Date(selectedTourRequest.created_at).toLocaleString()}
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Detail label="Mobile" value={selectedTourRequest.mobile} />
              <Detail label="Email" value={selectedTourRequest.email} />
              <Detail label="Child Grade" value={selectedTourRequest.child_grade} />
              <Detail
                label="Preferred Date"
                value={selectedTourRequest.preferred_date}
              />
              <Detail
                label="Preferred Time"
                value={selectedTourRequest.preferred_time}
              />
              <Detail label="Status" value={selectedTourRequest.status} />
            </div>

            <div className="mt-6">
              <p className="font-semibold mb-2">Selected Schools</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-600 leading-7">
                {selectedTourRequest.school_names.join(", ")}
              </div>
            </div>

            <div className="mt-6">
              <p className="font-semibold mb-2">Message</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-600 leading-7">
                {selectedTourRequest.message || "No message provided."}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${selectedTourRequest.mobile}`}
                target="_blank"
                className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                WhatsApp Parent
              </a>

              {selectedTourRequest.email && (
                <a
                  href={`mailto:${selectedTourRequest.email}`}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Email Parent
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold border transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
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

function AnalyticsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}