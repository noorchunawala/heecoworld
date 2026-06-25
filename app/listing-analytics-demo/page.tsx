"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Eye,
  Heart,
  LineChart,
  Mail,
  MapPin,
  MousePointerClick,
  Phone,
  School,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

const stats = [
  { label: "Profile Views", value: "2,847", trend: "+18%", icon: Eye },
  { label: "Shortlisted", value: "184", trend: "+12%", icon: Heart },
  { label: "Compared", value: "67", trend: "+9%", icon: BarChart3 },
  { label: "Tour Requests", value: "29", trend: "+21%", icon: CalendarDays },
  { label: "Reviews", value: "16", trend: "+6%", icon: Star },
  { label: "Heeco Match", value: "42", trend: "+14%", icon: Sparkles },
];

const weeklyData = [
  { day: "Mon", views: 42 },
  { day: "Tue", views: 58 },
  { day: "Wed", views: 51 },
  { day: "Thu", views: 76 },
  { day: "Fri", views: 88 },
  { day: "Sat", views: 101 },
  { day: "Sun", views: 94 },
];

const comparedSchools = [
  "GEMS Westminster School",
  "Sharjah English School",
  "DPS Dubai",
  "Ambassador School",
];

const clicks = [
  { label: "Phone Clicks", value: 148, icon: Phone },
  { label: "Email Clicks", value: 64, icon: Mail },
  { label: "Map Clicks", value: 91, icon: MapPin },
  { label: "Website Visits", value: 122, icon: MousePointerClick },
];

export default function ListingAnalyticsDemoPage() {
  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 text-[#071B33]">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] bg-[#071B33] p-8 text-white shadow-2xl"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6B46A]">
                Heeco Insights
              </p>
              <h1 className="mt-3 text-4xl font-semibold">
                Delhi Private School Sharjah
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Understand how parents discover, compare, shortlist and engage
                with your school on HeecoWorld.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">Visibility Score</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-5xl font-semibold text-[#D6B46A]">
                  82
                </span>
                <span className="pb-2 text-slate-300">/100</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Better than 78% of schools in Sharjah
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[1.5rem] bg-white p-6 shadow-xl shadow-[#071B33]/8 transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-[#F8F1E7] p-3 text-[#B58A34]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {item.trend}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-semibold">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#071B33]/8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                  Parent Interest
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Weekly profile activity
                </h2>
              </div>
              <LineChart className="h-6 w-6 text-[#B58A34]" />
            </div>

            <div className="mt-8 flex h-72 items-end gap-4">
              {weeklyData.map((item, index) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${item.views * 1.8}px` }}
                    transition={{ delay: index * 0.08, duration: 0.6 }}
                    className="w-full rounded-t-2xl bg-[#071B33]"
                  />
                  <p className="text-xs font-semibold text-slate-500">
                    {item.day}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#071B33]/8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
                Profile Health
              </p>
              <h3 className="mt-3 text-3xl font-semibold">95%</h3>
              <p className="mt-2 text-sm text-slate-600">
                Your profile is almost complete.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                {[
                  "Photos uploaded",
                  "Inspection report added",
                  "Fee structure added",
                  "Facilities completed",
                  "Contact details added",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-[#B58A34]">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#F8F1E7] p-4 text-sm">
                <strong>Recommendation:</strong> Upload a school video to
                increase parent engagement.
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#071B33]/8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
              Competitive Insight
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Most compared with</h2>

            <div className="mt-6 space-y-3">
              {comparedSchools.map((school, index) => (
                <div
                  key={school}
                  className="flex items-center justify-between rounded-2xl bg-[#FAF7F0] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#071B33] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="font-semibold">{school}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#B58A34]" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-[#071B33]/8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
              Contact Intent
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Parent actions</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {clicks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl bg-[#FAF7F0] p-5">
                    <Icon className="h-5 w-5 text-[#B58A34]" />
                    <p className="mt-4 text-2xl font-semibold">{item.value}</p>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-[#071B33]/8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
            Recent Parent Activity
          </p>

          <div className="mt-6 grid gap-3">
            {[
              "A parent shortlisted your school",
              "A parent viewed your fee structure",
              "A parent compared your school with GEMS Westminster",
              "A parent requested a school tour",
            ].map((activity) => (
              <div
                key={activity}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4"
              >
                <TrendingUp className="h-4 w-4 text-[#B58A34]" />
                <span className="text-sm font-medium">{activity}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}