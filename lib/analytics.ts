type EventType =
  | "profile_view"
  | "tab_view"
  | "shortlist_added"
  | "shortlist_removed"
  | "compare_added"
  | "heeco_match_result"
  | "tour_interest"
  | "phone_click"
  | "email_click"
  | "website_click"
  | "map_click"
  | "inspection_downloaded"
  | "review_submitted"
  | "comparison_completed";

type School = {
  id: string;
  name: string;
  emirate?: string;
};

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null;

  const key = "heeco_visitor_id";
  let visitorId = localStorage.getItem(key);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }

  return visitorId;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;

  const key = "heeco_session_id";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

async function track(
  listingId: string,
  eventType: EventType,
  metadata: Record<string, any> = {}
) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId,
        eventType,
        metadata,
        sessionId: getOrCreateSessionId(),
        visitorId: getOrCreateVisitorId(),
        sourcePage:
          typeof window !== "undefined" ? window.location.pathname : null,
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      }),
    });
  } catch (error) {
    console.error("Analytics tracking failed", error);
  }
}

export function trackProfileView(school: School) {
  return track(school.id, "profile_view", {
    schoolName: school.name,
    emirate: school.emirate,
    source: "school_profile",
  });
}

export function trackCompareAdded(school: School) {
  return track(school.id, "compare_added", {
    schoolName: school.name,
    source: "compare",
  });
}

export function trackTourInterest(school: School) {
  return track(school.id, "tour_interest", {
    schoolName: school.name,
    source: "book_tour",
  });
}

export function trackWebsiteClick(school: School) {
  return track(school.id, "website_click", {
    schoolName: school.name,
    source: "contact",
  });
}

export function trackPhoneClick(school: School) {
  return track(school.id, "phone_click", {
    schoolName: school.name,
    source: "contact",
  });
}

export function trackEmailClick(school: School) {
  return track(school.id, "email_click", {
    schoolName: school.name,
    source: "contact",
  });
}

export function trackMapClick(school: School) {
  return track(school.id, "map_click", {
    schoolName: school.name,
    source: "contact",
  });
}

export function trackReviewSubmitted(school: School) {
  return track(school.id, "review_submitted", {
    schoolName: school.name,
    source: "reviews",
  });
}

export function trackFavoriteAdded(school: School) {
  return track(school.id, "shortlist_added", {
    schoolName: school.name,
    source: "shortlist",
  });
}

export function trackMatchResult(school: School, score: number) {
  return track(school.id, "heeco_match_result", {
    schoolName: school.name,
    score,
    source: "heeco_match",
  });
}
export function trackComparisonCompleted(schools: School[]) {
  if (schools.length < 2) return;

  return Promise.all(
    schools.map((school) =>
      track(school.id, "comparison_completed", {
        schoolName: school.name,
        source: "compare",
        comparedSchoolIds: schools
          .filter((s) => s.id !== school.id)
          .map((s) => s.id),
        comparedSchoolNames: schools
          .filter((s) => s.id !== school.id)
          .map((s) => s.name),
      })
    )
  );
}