"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { getApprovedReviews, submitSchoolReview } from "@/lib/reviews";

type ReviewerType = "all" | "parent" | "student" | "alumni";

export default function SchoolReviews({ schoolId }: { schoolId: string }) {
  const { status, user, profile } = useAuth();

  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<ReviewerType>("all");
  const [showLogin, setShowLogin] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [academicsRating, setAcademicsRating] = useState(5);
  const [teachersRating, setTeachersRating] = useState(5);
  const [facilitiesRating, setFacilitiesRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [saving, setSaving] = useState(false);

useEffect(() => {
  if (!showReviewModal) {
    document.body.classList.remove("review-modal-open");
    return;
  }

  document.body.classList.add("review-modal-open");

  return () => {
    document.body.classList.remove("review-modal-open");
  };
}, [showReviewModal]);

  const calculatedRating = Math.round(
    (academicsRating +
      teachersRating +
      facilitiesRating +
      communicationRating +
      valueRating) / 5
  );

  async function loadReviews() {
    const data = await getApprovedReviews(schoolId);
    setReviews(data);
  }

  useEffect(() => {
    loadReviews();
  }, [schoolId]);

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter((r) => r.reviewer_type === filter);
  }, [reviews, filter]);
const [visibleCount, setVisibleCount] = useState(5);

const visibleReviews = filteredReviews.slice(0, visibleCount);
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      : 0;

  const handleWriteReview = () => {
    if (status !== "authenticated") {
      setShowLogin(true);
      return;
    }

    setShowReviewModal(true);
  };

  const closeModal = () => setShowReviewModal(false);

  const submitReview = async () => {
    if (!user || !profile) return;

    if (!title.trim()) {
      alert("Please add review title.");
      return;
    }

    if (!reviewText.trim()) {
      alert("Please write your review.");
      return;
    }

    setSaving(true);

    try {
      await submitSchoolReview({
        userId: user.id,
        schoolId,
        reviewerType: profile.user_type as "parent" | "student" | "alumni",
        rating: calculatedRating,
        academicsRating,
        teachersRating,
        facilitiesRating,
        communicationRating,
        valueRating,
        title,
        reviewText,
        reviewerName: profile.full_name,
      });

      alert("Thank you for sharing your experience! Your review has been submitted successfully and will be reviewed by the Scoolyx team before it is published. This helps us maintain a trustworthy and respectful community for everyone.");

      closeModal();
      setTitle("");
      setReviewText("");
      setAcademicsRating(5);
      setTeachersRating(5);
      setFacilitiesRating(5);
      setCommunicationRating(5);
      setValueRating(5);
    } catch (error: any) {
      alert(error.message || "Could not submit review.");
    }

    setSaving(false);
  };

  return (
    <div>
      <LoginRequiredModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        feature="reviews"
      />

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-violet-500/5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-4xl font-semibold text-[#111135]">
              {averageRating ? averageRating.toFixed(1) : "—"}
            </p>

            <StarDisplay value={averageRating || 0} />

            <p className="mt-2 text-sm text-slate-600">
              {reviews.length}  review{reviews.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleWriteReview}
            className="rounded-full bg-[#111135] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D1B4F]"
          >
            Write a Review
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "parent", label: "Parents" },
          { key: "student", label: "Students" },
          { key: "alumni", label: "Alumni" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key as ReviewerType)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === item.key
                ? "bg-[#111135] text-white"
                : "bg-[#F7F6FF] text-[#111135]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#111135]/80 p-4 backdrop-blur-md">
          <div className="flex h-[78vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h3 className="text-xl font-semibold text-[#111135]">
                  Write a Review
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Reviews are moderated by Scoolyx before publication.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-[#F7F6FF] p-2 text-[#111135] transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-3xl bg-[#F7F6FF] p-4">
                <div className="space-y-3">
                  <RatingRow
                    label="Academics"
                    value={academicsRating}
                    onChange={setAcademicsRating}
                  />
                  <RatingRow
                    label="Teachers"
                    value={teachersRating}
                    onChange={setTeachersRating}
                  />
                  <RatingRow
                    label="Facilities"
                    value={facilitiesRating}
                    onChange={setFacilitiesRating}
                  />
                  <RatingRow
                    label="Communication"
                    value={communicationRating}
                    onChange={setCommunicationRating}
                  />
                  <RatingRow
                    label="Value for Money"
                    value={valueRating}
                    onChange={setValueRating}
                  />
                </div>

                <div className="mt-4 rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-[#111135]">
                  Overall Rating: {calculatedRating}/5
                </div>
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review title"
                className="mt-4 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5B3DF5]"
              />

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell other families about your experience..."
                rows={3}
                className="mt-3 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#5B3DF5]"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-white p-5">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitReview}
                disabled={saving}
                className="flex-1 rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-[#F7F6FF] p-6 text-center text-sm font-semibold text-slate-500">
            No reviews yet.
          </div>
        ) : (
          visibleReviews.map((review) => (
            <div key={review.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <StarDisplay value={Number(review.rating || 0)} />

              <h3 className="mt-3 font-semibold text-[#111135]">
                {review.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {review.review_text}
              </p>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5B3DF5]">
               {review.reviewer_name} - Verified {review.reviewer_type}
              </p>
            </div>
          ))
        )}
        {filteredReviews.length > visibleCount && (
  <button
    type="button"
    onClick={() => setVisibleCount((current) => current + 5)}
    className="mt-4 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#111135] transition hover:bg-[#F7F6FF]"
  >
    Show more reviews
  </button>
)}
      </div>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-[#111135]">{label}</span>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xl transition hover:bg-white ${
              value >= star ? "text-amber-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="mt-2 flex gap-1 text-xl">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={value >= star ? "text-amber-400" : "text-slate-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}