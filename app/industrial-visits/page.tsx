import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BriefcaseBusiness,
  Bus,
  CheckCircle2,
  ClipboardList,
  Factory,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import OpenEnquiryButton from "@/components/OpenEnquiryButton";

const visitTypes = [
  {
    title: "Manufacturing & Production",
    description:
      "Help students understand how products are made, packaged and distributed.",
    icon: Factory,
  },
  {
    title: "Business & Operations",
    description:
      "Introduce students to real departments, workflows and workplace roles.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Career Exposure Visits",
    description:
      "Give students early exposure to industries, skills and future career paths.",
    icon: GraduationCap,
  },
];

const process = [
  "School shares grade level and learning objective",
  "HeecoWorld suggests suitable visit options",
  "Visit plan, timing and safety details are aligned",
  "Students attend a structured real-world learning experience",
];

const safetyPoints = [
  "School-friendly itinerary",
  "Age-appropriate visit planning",
  "Transport coordination support",
  "Clear timings and visit instructions",
];

export default function IndustrialVisitsPage() {
  return (
    <main className="min-h-screen bg-[#F8F1E7]">
      <section className="relative overflow-hidden bg-[#071B33] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,180,106,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_34%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-medium text-[#F5E6C8] backdrop-blur">
              <Factory className="h-4 w-4" />
              Industrial Visits for Schools
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Real-world learning experiences for UAE students.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              HeecoWorld helps schools plan structured industrial visits that
              connect classroom learning with real businesses, industries and
              workplaces across the UAE.
            </p>

            <p className="mt-4 text-xl leading-8 text-[#F5E6C8]" dir="rtl">
              رحلات تعليمية ميدانية تربط الطلاب بعالم الأعمال والصناعة
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                className="rounded-full bg-[#D6B46A] px-7 py-6 text-[#071B33] hover:bg-[#E3C982]"
              >
                <OpenEnquiryButton className="inline-flex items-center justify-center rounded-full bg-[#D6B46A] px-7 py-3 text-sm font-semibold text-[#071B33] transition hover:bg-[#E3C982]">
  Request a Visit
</OpenEnquiryButton>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 px-7 py-6 text-white hover:bg-white/20"
              >
                <Link href="/schools">Explore Schools</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#B58A34]">
                Visit Planning
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-[#071B33]">
                From school requirement to structured visit.
              </h2>

              <div className="mt-7 space-y-4">
                {process.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-2xl bg-[#FAF7F0] p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#071B33] text-sm font-semibold text-[#D6B46A]">
                      {index + 1}
                    </div>

                    <p className="text-sm font-medium leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#071B33] p-5 text-white">
                <p className="text-sm text-slate-300">Designed for</p>
                <p className="mt-1 text-lg font-semibold">
                  Schools, institutes and student groups
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
            Visit categories
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071B33] sm:text-4xl">
            Curated experiences beyond the classroom.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            This section is one vertical inside HeecoWorld’s education
            marketplace, supporting schools that want practical exposure for
            students.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {visitTypes.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-[#071B33]/8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071B33] text-[#D6B46A]">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-[#071B33]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-[#071B33] p-8 text-white shadow-xl shadow-[#071B33]/20">
            <ShieldCheck className="h-10 w-10 text-[#D6B46A]" />

            <h2 className="mt-5 text-3xl font-semibold">
              Safety-first visit coordination.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Industrial visits need careful planning because students are
              entering active business or operational environments. HeecoWorld’s
              role is to make the visit structured, clear and school-ready.
            </p>

            <div className="mt-7 grid gap-3">
              {safetyPoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#D6B46A]" />
                  <span className="text-sm font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white p-8 shadow-xl shadow-[#071B33]/8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
              For schools
            </p>

            <h2 className="mt-3 text-3xl font-semibold text-[#071B33]">
              Add real-world exposure to your academic calendar.
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Student groups"
                text="Suitable for class groups, clubs or career exposure activities."
              />

              <FeatureCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="Learning objective"
                text="Visits can be aligned with curriculum themes or career guidance."
              />

              <FeatureCard
                icon={<Bus className="h-5 w-5" />}
                title="Transport support"
                text="Transport can be coordinated depending on school requirement."
              />

              <FeatureCard
                icon={<MapPin className="h-5 w-5" />}
                title="UAE focused"
                text="Built around local schools, local industries and UAE logistics."
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="rounded-full bg-[#071B33] text-white hover:bg-[#0B2A4D]"
              >
                <OpenEnquiryButton className="inline-flex items-center justify-center rounded-full bg-[#071B33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B2A4D]">
  Request a Visit
</OpenEnquiryButton>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF7F0] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#B58A34]">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-[#071B33]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}