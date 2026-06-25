"use client";

import Link from "next/link";

type FeatureKey = "compare" | "shortlist" | "heecoMatch" | "reviews" | "bookTour";

type Props = {
  open: boolean;
  onClose: () => void;
  feature?: FeatureKey;
  title?: string;
  description?: string;
};

const featureContent: Record<
  FeatureKey,
  { title: string; description: string; benefits: string[] }
> = {
  compare: {
    title: "Compare Schools",
    description:
      "Create your free account to compare schools side by side and keep your decisions synced.",
    benefits: [
      "Compare schools side by side",
      "Save your shortlist",
      "Access everything from any device",
    ],
  },
  shortlist: {
    title: "Save this School",
    description:
      "Create your free account to save schools and access your shortlist anytime.",
    benefits: [
      "Build your school shortlist",
      "Book tours faster",
      "Access saved schools from any device",
    ],
  },
  heecoMatch: {
    title: "Save your Heeco Match",
    description:
      "Create your free account to save your best school matches and recommendations.",
    benefits: [
      "Save personalised matches",
      "Track recommended schools",
      "Access matches from any device",
    ],
  },
  reviews: {
    title: "Write a Verified Review",
    description:
      "Create your free account to share trusted school feedback with other parents.",
    benefits: [
      "Write verified reviews",
      "Edit your review later",
      "Help other families decide",
    ],
  },
  bookTour: {
    title: "Book a School Tour",
    description:
      "Create your free account to request tours and track your school visit requests.",
    benefits: [
      "Book tours faster",
      "Track your tour requests",
      "Receive updates in one place",
    ],
  },
};

export default function LoginRequiredModal({
  open,
  onClose,
  feature = "compare",
  title,
  description,
}: Props) {
  if (!open) return null;

  const content = featureContent[feature];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071B33]/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-2xl font-semibold text-[#071B33]">
          {title || content.title}
        </h2>

        <p className="mt-3 leading-6 text-slate-600">
          {description || content.description}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl bg-[#F8F1E7] p-5">
          {content.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <span className="text-[#B58A34]">✓</span>
              <span className="text-sm font-medium text-[#071B33]">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 px-5 py-3 font-medium transition hover:bg-slate-50"
          >
            Maybe later
          </button>

          <Link
            href="/login"
            className="flex-1 rounded-full bg-[#071B33] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#0B2A4D]"
          >
            Create free account
          </Link>
        </div>
      </div>
    </div>
  );
}