"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/lib/SupabaseClient";

type Account = {
  fullName: string | null;
  userType: "parent" | "student";
};

type School = {
  id: string;
  name: string;
  emirate: string | null;
  area: string | null;
};

type Learner = {
  id: string;
  full_name: string;
  relationship: "self" | "child";
  curriculum_id: string | null;
  curriculum_level_id: string | null;
  grade: string | null;
  section: string | null;
  academic_year: string | null;
  verification_status: "self_declared" | "verified";
  status: "active";
  created_at: string;
  school_listing_id: string | null;
  listings: School | School[] | null;
};

type LearningResponse = {
  account: Account;
  learners: Learner[];
};

type CurriculumLevelOption = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
};

type CurriculumOption = {
  id: string;
  code: string;
  displayName: string;
  levels: CurriculumLevelOption[];
};

type SchoolCurriculumOptionsResponse = {
  curricula?: CurriculumOption[];
  message?: string | null;
  error?: string;
};

type AssessmentAttempt = {
  status: "in_progress" | "submitted" | "auto_submitted";
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  submittedAt: string | null;
  isCompleted: boolean;
};

type LearnerAssessment = {
  id: string;
  title: string;
  teacherName: string;
  curriculumName: string | null;
  classLevel: string | null;
  subject: string | null;
  topic: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  publishedAt: string;
  availability: "available" | "not_started" | "closed";
  startedCount: number;
  completedCount: number;
  learnerAttempt: AssessmentAttempt | null;
};

type AssessmentCatalogResponse = {
  learner?: {
    id: string;
    fullName: string;
  };
  assessments?: LearnerAssessment[];
  error?: string;
};

function getLearnerSchool(learner: Learner) {
  if (Array.isArray(learner.listings)) {
    return learner.listings[0] || null;
  }

  return learner.listings || null;
}

function getSchoolLocation(school: School) {
  return [school.area, school.emirate].filter(Boolean).join(", ");
}

export default function MyLearningPage() {
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childFormError, setChildFormError] = useState("");

  const [childFullName, setChildFullName] = useState("");
  const [childSchoolSearch, setChildSchoolSearch] = useState("");
  const [childSchoolListingId, setChildSchoolListingId] = useState("");
  const [childCurriculumId, setChildCurriculumId] = useState("");
  const [childCurriculumLevelId, setChildCurriculumLevelId] = useState("");
  const [childCurricula, setChildCurricula] = useState<CurriculumOption[]>([]);
  const [loadingChildCurricula, setLoadingChildCurricula] = useState(false);
  const [childCurriculumMessage, setChildCurriculumMessage] = useState("");
  const [childSection, setChildSection] = useState("");
  const [childAcademicYear, setChildAcademicYear] = useState("");
  const [childSchoolEmail, setChildSchoolEmail] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [showSchoolOptions, setShowSchoolOptions] = useState(false);

  const [assessments, setAssessments] = useState<LearnerAssessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState("");
  const [assessmentTab, setAssessmentTab] = useState<"available" | "completed">("available");
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [codeTarget, setCodeTarget] = useState<LearnerAssessment | null>(null);
  const [startCode, setStartCode] = useState("");
  const [startCodeError, setStartCodeError] = useState("");
  const [startingWithCode, setStartingWithCode] = useState(false);
  const [schoolAccessNotice, setSchoolAccessNotice] = useState("");
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
const [updatingLearner, setUpdatingLearner] = useState(false);
const [practiceTests, setPracticeTests] = useState<LearnerAssessment[]>([]);
const [loadingPracticeTests, setLoadingPracticeTests] = useState(false);
const [practiceTestsError, setPracticeTestsError] = useState("");
const [practiceModalOpen, setPracticeModalOpen] = useState(false);
type PracticeSubject = {
  id: string;
  name: string;
 chapters: {
  id: string;
  name: string;
  questionCount: number;
  topics: {
    id: string;
    name: string;
    questionCount: number;
  }[];
}[];
};

const [practiceSubjects, setPracticeSubjects] = useState<PracticeSubject[]>([]);
const [loadingPracticeOptions, setLoadingPracticeOptions] = useState(false);

const [selectedSubjectId, setSelectedSubjectId] = useState("");
const [selectedSectionId, setSelectedSectionId] = useState("");
const [selectedChapterId, setSelectedChapterId] = useState("");
const [creatingPracticeTest, setCreatingPracticeTest] = useState(false);
const [createPracticeError, setCreatePracticeError] = useState("");
const [practiceScope, setPracticeScope] =
  useState<"chapter" | "topic">("chapter");

const [practiceQuestionCount, setPracticeQuestionCount] = useState(20);
const [practiceDifficulty, setPracticeDifficulty] =
  useState<"easy" | "mixed" | "challenging">("mixed");

const [practiceDuration, setPracticeDuration] = useState(30);

const [practiceOptionsError, setPracticeOptionsError] = useState("");
const selectedChapter =
  practiceSubjects
    .find((subject) => subject.id === selectedSubjectId)
    ?.chapters.find((chapter) => chapter.id === selectedChapterId) ?? null;

const selectedTopic =
  selectedChapter?.topics.find(
    (topic) => topic.id === selectedSectionId
  ) ?? null;

const availableQuestions =
  practiceScope === "chapter"
    ? selectedChapter?.questionCount ?? 0
    : selectedTopic?.questionCount ?? 0;

function getSchoolChangeLockDate(learner: Learner | null) {
  const lastChanged =
    (learner as any)?.school_last_changed_at ||
    (learner as any)?.school_assigned_at ||
    learner?.created_at;

  if (!lastChanged) return null;

  const lockDate = new Date(lastChanged);
  lockDate.setDate(lockDate.getDate() + 90);

  return lockDate;
}

  useEffect(() => {
    async function loadMyLearning() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent("/my-learning")}`
          );
          return;
        }

        const response = await fetch("/api/learner-profiles", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const result = (await response.json().catch(() => null)) as
          | LearningResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          const message =
            result && "error" in result
              ? result.error
              : "Could not load My Learning.";

          if (response.status === 401) {
            router.replace(
              `/login?redirectTo=${encodeURIComponent("/my-learning")}`
            );
            return;
          }

         if (
  response.status === 403 &&
  message?.toLowerCase().includes("complete your profile")
) {
  const loggedInEmail = sessionData.session?.user?.email?.trim().toLowerCase();

  if (loggedInEmail) {
    const schoolAccessCheck = await fetch(
      `/api/school-access/activate?email=${encodeURIComponent(loggedInEmail)}`,
      { cache: "no-store" }
    );

    if (schoolAccessCheck.ok) {
      setSchoolAccessNotice(
        "You’ve been added as a teacher or school admin on Scoolyx. Please open the School Portal to continue."
      );
      setLoading(false);
      return;
    }
  }

  router.replace(
    `/complete-profile?redirectTo=${encodeURIComponent("/my-learning")}`
  );
  return;
}

          throw new Error(message || "Could not load My Learning.");
        }

        const learningData = result as LearningResponse;

        setAccount(learningData.account);
        setLearners(learningData.learners || []);
        setActiveLearnerId(learningData.learners?.[0]?.id || "");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load My Learning."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMyLearning();
  }, [router]);

  useEffect(() => {
    if (!addChildOpen || schools.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadSchools() {
      setSchoolsLoading(true);

      const { data, error } = await supabase
        .from("listings")
        .select("id, name, emirate, area")
        .eq("type", "school")
        .eq("status", "active")
        .order("name");

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Could not load schools:", error);
        setChildFormError("Could not load schools. Please try again.");
      } else {
        setSchools(data || []);
      }

      setSchoolsLoading(false);
    }

    loadSchools();

    return () => {
      cancelled = true;
    };
  }, [addChildOpen, schools.length]);

  useEffect(() => {
    const selectedLearner = learners.find(
      (learner) => learner.id === activeLearnerId
    );

    if (!selectedLearner) {
      setAssessments([]);
      setAssessmentsError("");
      setLoadingAssessments(false);
      return;
    }

    const learnerId = selectedLearner.id;
    let cancelled = false;

    async function loadAssessments() {
      try {
        setLoadingAssessments(true);
        setAssessmentsError("");

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          router.replace(
            `/login?redirectTo=${encodeURIComponent("/my-learning")}`
          );
          return;
        }

        const response = await fetch(
          `/api/learner-assessments?learnerId=${encodeURIComponent(
            learnerId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = (await response
          .json()
          .catch(() => ({}))) as AssessmentCatalogResponse;

        if (!response.ok) {
          throw new Error(
            result.error || "Could not load school assessments for this learner."
          );
        }

        if (!cancelled) {
          setAssessments(result.assessments || []);
        }
      } catch (error) {
        if (!cancelled) {
          setAssessments([]);
          setAssessmentsError(
            error instanceof Error
              ? error.message
              : "Could not load school assessments for this learner."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAssessments(false);
        }
      }
    }
   

    void loadAssessments();

    return () => {
      cancelled = true;
    };
  }, [activeLearnerId, learners, router]);
   useEffect(() => {
  const selectedLearner = learners.find(
    (learner) => learner.id === activeLearnerId
  );

  if (!selectedLearner) {
    setPracticeTests([]);
    setPracticeTestsError("");
    setLoadingPracticeTests(false);
    return;
  }

  const learnerId = selectedLearner.id;
  let cancelled = false;

  async function loadPracticeTests() {
    try {
      setLoadingPracticeTests(true);
      setPracticeTestsError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace(`/login?redirectTo=${encodeURIComponent("/my-learning")}`);
        return;
      }

      const response = await fetch(
        `/api/practice-tests?learnerId=${encodeURIComponent(learnerId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = (await response.json().catch(() => ({}))) as AssessmentCatalogResponse;

      if (!response.ok) {
        throw new Error(result.error || "Could not load practice tests for this learner.");
      }

      if (!cancelled) {
        setPracticeTests(result.assessments || []);
      }
    } catch (error) {
      if (!cancelled) {
        setPracticeTests([]);
        setPracticeTestsError(
          error instanceof Error
            ? error.message
            : "Could not load practice tests for this learner."
        );
      }
    } finally {
      if (!cancelled) {
        setLoadingPracticeTests(false);
      }
    }
  }

  void loadPracticeTests();

  return () => {
    cancelled = true;
  };
}, [activeLearnerId, learners, router]);



  const activeLearner =
    learners.find((learner) => learner.id === activeLearnerId) || null;

    useEffect(() => {
  if (!practiceModalOpen || !activeLearner) return;
const learnerId = activeLearner.id;
  let cancelled = false;

  async function loadOptions() {
    try {
      setLoadingPracticeOptions(true);
      setPracticeOptionsError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `/api/practice-tests/create-options?learnerId=${learnerId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load options.");
      }

      if (cancelled) return;

      setPracticeSubjects(result.subjects || []);

     if (result.subjects?.length) {
  const firstSubject = result.subjects[0];
  const firstChapter = firstSubject.chapters?.[0];
  const firstTopic = firstChapter?.topics?.[0];

  setSelectedSubjectId(firstSubject.id);
  setSelectedChapterId(firstChapter?.id || "");
  setSelectedSectionId(firstTopic?.id || "");
}
    } catch (error) {
      if (!cancelled) {
        setPracticeOptionsError(
          error instanceof Error ? error.message : "Could not load options."
        );
      }
    } finally {
      if (!cancelled) {
        setLoadingPracticeOptions(false);
      }
    }
  }

  loadOptions();

  return () => {
    cancelled = true;
  };
}, [practiceModalOpen, activeLearner]);
    

  const school = activeLearner ? getLearnerSchool(activeLearner) : null;

  const schoolLocation = school ? getSchoolLocation(school) : "";

  const completedAssessments = assessments.filter(
    (assessment) => assessment.learnerAttempt?.isCompleted
  );
  

  const availableAssessments = assessments.filter((assessment) => {
    const isInProgress = assessment.learnerAttempt?.status === "in_progress";
    return !assessment.learnerAttempt?.isCompleted &&
      (isInProgress || assessment.availability === "available");
  });

  const teacherOptions = Array.from(
    new Set(assessments.map((assessment) => assessment.teacherName).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const subjectOptions = Array.from(
    new Set(assessments.map((assessment) => assessment.subject).filter((subject): subject is string => Boolean(subject)))
  ).sort((a, b) => a.localeCompare(b));

  const assessmentSource =
    assessmentTab === "available" ? availableAssessments : completedAssessments;

  const visibleAssessments = assessmentSource.filter((assessment) => {
    const query = assessmentSearch.trim().toLowerCase();
    const searchableText = [
      assessment.title,
      assessment.teacherName,
      assessment.subject,
      assessment.classLevel,
      assessment.topic,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);
    const matchesTeacher = !teacherFilter || assessment.teacherName === teacherFilter;
    const matchesSubject = !subjectFilter || assessment.subject === subjectFilter;

    return matchesSearch && matchesTeacher && matchesSubject;
  });

  const childSchoolMatches = schools
    .filter((schoolOption) => {
      const query = childSchoolSearch.trim().toLowerCase();

      if (!query) {
        return true;
      }

      const searchableText = [
        schoolOption.name,
        schoolOption.area,
        schoolOption.emirate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .slice(0, 12);
  const selectedChildCurriculum = childCurricula.find(
    (curriculum) => curriculum.id === childCurriculumId
  );

  const availableChildLevels = selectedChildCurriculum?.levels || [];

  function clearChildCurriculumSelection() {
    setChildCurriculumId("");
    setChildCurriculumLevelId("");
    setChildCurricula([]);
    setChildCurriculumMessage("");
    setLoadingChildCurricula(false);
  }

  async function loadChildSchoolCurriculumOptions(
    selectedSchoolId: string,
  preselectCurriculumId = "",
  preselectLevelId = ""
  ) {
    try {
      setLoadingChildCurricula(true);
      setChildCurriculumId("");
      setChildCurriculumLevelId("");
      setChildCurricula([]);
      setChildCurriculumMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent("/my-learning")}`
        );
        return;
      }

      const response = await fetch(
        `/api/learner-profiles/school-curriculum-options?schoolId=${encodeURIComponent(
          selectedSchoolId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const payload = (await response
        .json()
        .catch(() => ({}))) as SchoolCurriculumOptionsResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Could not load assessment curriculum options for this school."
        );
      }

      setChildCurricula(payload.curricula || []);
      setChildCurriculumMessage(payload.message || "");
      if (preselectCurriculumId) {
  setChildCurriculumId(preselectCurriculumId);
}

if (preselectLevelId) {
  setChildCurriculumLevelId(preselectLevelId);
}
    } catch (error) {
      setChildCurriculumMessage(
        error instanceof Error
          ? error.message
          : "Could not load assessment curriculum options for this school."
      );
    } finally {
      setLoadingChildCurricula(false);
    }
  }

  function assessmentCodeStorageKey(learnerId: string, testId: string) {
    return `scoolyx-assessment-code:${learnerId}:${testId}`;
  }

  async function handleStartWithCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStartCodeError("");

    if (!activeLearner || !codeTarget) {
      return;
    }

    const code = startCode.trim().toUpperCase();

    if (!code) {
      setStartCodeError("Enter the assessment code shared by the teacher.");
      return;
    }

    try {
      setStartingWithCode(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace(`/login?redirectTo=${encodeURIComponent("/my-learning")}`);
        return;
      }

      const verifyResponse = await fetch("/api/learner-assessments/resolve-code", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          learnerId: activeLearner.id,
          assessmentCode: code,
        }),
      });

      const verified = (await verifyResponse.json().catch(() => ({}))) as {
        test?: { id: string };
        error?: string;
      };

      if (!verifyResponse.ok || verified.test?.id !== codeTarget.id) {
        throw new Error(
          verified.error || "This assessment code does not match the selected test."
        );
      }

      const startResponse = await fetch(
        `/api/learner-assessments/${codeTarget.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            learnerId: activeLearner.id,
            assessmentCode: code,
          }),
        }
      );

      const started = (await startResponse.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!startResponse.ok) {
        throw new Error(started.error || "Could not start this assessment.");
      }

      window.sessionStorage.setItem(
        assessmentCodeStorageKey(activeLearner.id, codeTarget.id),
        code
      );

      const targetId = codeTarget.id;
      setCodeTarget(null);
      setStartCode("");
      router.push(`/my-learning/assessments/${targetId}?learnerId=${activeLearner.id}`);
    } catch (error) {
      setStartCodeError(
        error instanceof Error
          ? error.message
          : "This assessment code could not be used for this learner."
      );
    } finally {
      setStartingWithCode(false);
    }
  }

  function openAssessment(assessment: LearnerAssessment) {
    if (!activeLearner) {
      return;
    }

    const isCompleted = assessment.learnerAttempt?.isCompleted;
    const isInProgress = assessment.learnerAttempt?.status === "in_progress";

    if (isCompleted || isInProgress) {
      router.push(
        `/my-learning/assessments/${assessment.id}?learnerId=${activeLearner.id}`
      );
      return;
    }

    setStartCode("");
    setStartCodeError("");
    setCodeTarget(assessment);
  }
  function openPracticeTest(practiceTest: LearnerAssessment) {
  if (!activeLearner) {
    return;
  }

  router.push(
    `/my-learning/assessments/${practiceTest.id}?learnerId=${activeLearner.id}&mode=practice`
  );
}

  function resetChildForm() {
    setChildFullName("");
    setChildSchoolSearch("");
    setChildSchoolListingId("");
    clearChildCurriculumSelection();
    setChildSection("");
    setChildAcademicYear("");
    setChildSchoolEmail("");
    setShowSchoolOptions(false);
    setChildFormError("");
  }

function closeAddChildModal() {
  setAddChildOpen(false);
  setEditingLearner(null);
  setShowSchoolOptions(false);
  setChildFormError("");
  resetChildForm();
}
  function openEditLearnerModal(learner: Learner) {
  const learnerSchool = getLearnerSchool(learner);

  setEditingLearner(learner);
  setAddChildOpen(true);
  setChildFormError("");

  setChildFullName(learner.full_name || "");
  setChildSchoolListingId(learner.school_listing_id || "");

  setChildSchoolSearch(
    learnerSchool
      ? `${learnerSchool.name}${
          getSchoolLocation(learnerSchool)
            ? ` — ${getSchoolLocation(learnerSchool)}`
            : ""
        }`
      : ""
  );

  setChildCurriculumId(learner.curriculum_id || "");
  setChildCurriculumLevelId(learner.curriculum_level_id || "");
  setChildSection(learner.section || "");
  setChildAcademicYear(learner.academic_year || "");
  setChildSchoolEmail((learner as any).school_registered_email || "");

  if (learner.school_listing_id) {
    void loadChildSchoolCurriculumOptions(
  learner.school_listing_id,
  learner.curriculum_id || "",
  learner.curriculum_level_id || ""
);
  }
}

  async function handleUpdateLearner(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!editingLearner) return;

  setChildFormError("");

  if (!childFullName.trim()) {
    setChildFormError("Enter the learner’s full name.");
    return;
  }

  try {
    setUpdatingLearner(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      router.replace(`/login?redirectTo=${encodeURIComponent("/my-learning")}`);
      return;
    }

    const response = await fetch("/api/learner-profiles", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        learnerId: editingLearner.id,
        fullName: childFullName.trim(),
        schoolListingId: childSchoolListingId,
        curriculumId: childCurriculumId,
        curriculumLevelId: childCurriculumLevelId,
        section: childSection,
        academicYear: childAcademicYear,
        schoolRegisteredEmail: childSchoolEmail,
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { learner?: Learner; error?: string }
      | null;

    if (!response.ok || !result?.learner) {
      throw new Error(
        result?.error || "Could not update this learner profile."
      );
    }

    setLearners((currentLearners) =>
  currentLearners.map((learner) =>
    learner.id === result.learner!.id ? result.learner! : learner
  )
);

setActiveLearnerId(result.learner.id);
setEditingLearner(null);
setAddChildOpen(false);
resetChildForm();
  } catch (error) {
    setChildFormError(
      error instanceof Error
        ? error.message
        : "Could not update this learner profile."
    );
  } finally {
    setUpdatingLearner(false);
  }
}

  async function handleAddChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChildFormError("");

    if (!childFullName.trim()) {
      setChildFormError("Enter the child’s full name.");
      return;
    }

    if (!childSchoolListingId) {
      setChildFormError("Select the child’s school from the suggestions.");
      return;
    }

    if (loadingChildCurricula) {
      setChildFormError(
        "Please wait while we load this school’s curriculum options."
      );
      return;
    }

    if (!childCurriculumId) {
      setChildFormError("Select the child’s curriculum.");
      return;
    }

    if (!childCurriculumLevelId) {
      setChildFormError("Select the child’s academic level.");
      return;
    }

    try {
      setAddingChild(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        router.replace(
          `/login?redirectTo=${encodeURIComponent("/my-learning")}`
        );
        return;
      }

      const response = await fetch("/api/learner-profiles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: childFullName.trim(),
          schoolListingId: childSchoolListingId,
          curriculumId: childCurriculumId,
          curriculumLevelId: childCurriculumLevelId,
          section: childSection,
          academicYear: childAcademicYear,
          schoolRegisteredEmail: childSchoolEmail,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { learner?: Learner; error?: string }
        | null;

      if (!response.ok || !result?.learner) {
        throw new Error(
          result?.error || "Could not add this child. Please try again."
        );
      }

      setLearners((currentLearners) => [
        ...currentLearners,
        result.learner as Learner,
      ]);

      setActiveLearnerId(result.learner.id);
      resetChildForm();
      setAddChildOpen(false);
    } catch (error) {
      setChildFormError(
        error instanceof Error
          ? error.message
          : "Could not add this child. Please try again."
      );
    } finally {
      setAddingChild(false);
    }
  }

  async function handleCreatePracticeTest() {
  if (!activeLearner) return;

  try {
    setCreatingPracticeTest(true);
    setCreatePracticeError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error("Please sign in again.");
    }

    const response = await fetch("/api/practice-tests/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        learnerId: activeLearner.id,
        chapterId:
          practiceScope === "chapter"
            ? selectedChapterId
            : null,
        sectionId:
          practiceScope === "topic"
            ? selectedSectionId
            : null,
        questionCount: practiceQuestionCount,
        durationMinutes: practiceDuration,
        difficultyMode: practiceDifficulty,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to create practice test.");
    }

    router.push(
      `/my-learning/assessments/${result.test.id}?learnerId=${activeLearner.id}&mode=practice`
    );
  } catch (error) {
    setCreatePracticeError(
      error instanceof Error
        ? error.message
        : "Unable to create practice test."
    );
  } finally {
    setCreatingPracticeTest(false);
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
          Loading My Learning...
        </div>
      </main>
    );
  }
  if (schoolAccessNotice) {
  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5B3DF5]">
          School Portal Access
        </p>

        <h1 className="mt-3 text-2xl font-black text-[#111135]">
          You’ve been added to a school workspace
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          This account is linked to a school role on Scoolyx. Please open the
          School Portal to activate your access and manage assessments.
        </p>

        <button
          type="button"
          onClick={() => router.push("/school-access")}
          className="mt-6 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white"
        >
          Open School Portal
        </button>
      </div>
    </main>
  );
}

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-semibold text-[#111135]">
            We could not open My Learning
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!activeLearner) {
    return (
      <main className="min-h-screen bg-[#F7F6FF] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-semibold text-[#111135]">
            No learner profile found
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Complete your learner profile to view school assessments and
            learning progress.
          </p>

          <Link
            href="/complete-profile?redirectTo=%2Fmy-learning"
            className="mt-6 inline-flex rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white"
          >
            Complete Profile
          </Link>
        </div>
      </main>
    );
  }

  const firstName = account?.fullName?.trim().split(" ")[0] || "there";
  const schoolChangeLockedUntil = editingLearner
  ? getSchoolChangeLockDate(editingLearner)
  : null;

const schoolChangeLocked =
  Boolean(schoolChangeLockedUntil) &&
  schoolChangeLockedUntil!.getTime() > Date.now();

  return (
    <main className="min-h-screen bg-[#F7F6FF] px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[#5B3DF5] transition hover:text-[#111135]"
        >
          ← Back to Home
        </Link>

        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5B3DF5]">
              My Learning
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#111135] md:text-4xl">
              Welcome back, {firstName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Everything your child studies, practises and achieves stays organised here.
            </p>
          </div>

          {account?.userType === "parent" && (
            <button
              type="button"
            onClick={() => {
  setEditingLearner(null);
  resetChildForm();
  setChildFormError("");
  setAddChildOpen(true);
}}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D1B4F]"
            >
              <Plus className="h-4 w-4" />
              Add another child
            </button>
          )}
        </div>

        {account?.userType === "parent" && learners.length > 1 && (
          <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#111135]">
              Viewing learner
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {learners.map((learner) => (
                <button
                  key={learner.id}
                  type="button"
                  onClick={() => setActiveLearnerId(learner.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    learner.id === activeLearner.id
                      ? "bg-[#111135] text-white"
                      : "bg-[#F7F6FF] text-[#111135] hover:bg-[#F1EEFF]"
                  }`}
                >
                  {learner.full_name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl bg-[#111135] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A99BFF]">
                {activeLearner.relationship === "child"
                  ? "Learner Profile"
                  : "Student Profile"}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {activeLearner.full_name}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
                {school && (
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {school.name}
                  </span>
                )}

                {activeLearner.grade && (
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {activeLearner.grade}
                    {activeLearner.section
                      ? ` · ${activeLearner.section}`
                      : ""}
                  </span>
                )}

                {activeLearner.academic_year && (
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {activeLearner.academic_year}
                  </span>
                )}
              </div>
            </div>

           <div className="flex flex-col gap-3">
  <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm">
    <p className="font-semibold text-[#A99BFF]">School profile</p>
    <p className="mt-1 text-slate-200">
      {schoolLocation || "School location not available"}
    </p>
  </div>

  {(account?.userType === "parent" || account?.userType === "student") && (
  <button
    type="button"
    onClick={() => openEditLearnerModal(activeLearner)}
    className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#111135] transition hover:bg-[#F7F6FF]"
  >
    Edit Profile
  </button>
)}
</div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <a href="#school-assessments" className="block transition hover:-translate-y-0.5">
          <LearningCard
            icon={<BookOpen className="h-6 w-6" />}
            title="School Assessments"
            description={`${assessments.length} published assessment${
              assessments.length === 1 ? "" : "s"
            } matched to this learner's school, curriculum, and academic level.`}
            status={loadingAssessments ? "Loading" : "Available now"}
          />
</a>
<a href="#practice-tests" className="block transition hover:-translate-y-0.5">
          <LearningCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Practice Tests"
           description={`${practiceTests.length} practice test${
  practiceTests.length === 1 ? "" : "s"
} created for this learner.`}
status={loadingPracticeTests ? "Loading" : "Available now"}
          />
</a>
          <Link
            href={`/my-learning/progress?learnerId=${encodeURIComponent(activeLearner.id)}`}
            className="block transition hover:-translate-y-0.5"
          >
            <LearningCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Progress"
              description={` View results, scores, and subject progress.`}
              status="View progress"
            />
          </Link>
        </section>

        <section id="school-assessments" className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F6FF] text-[#5B3DF5]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#111135]">
                School assessments for {activeLearner.full_name}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Published assessments matching this learner&apos;s school, curriculum, and
                academic level appear here. A teacher&apos;s assessment code is required
                only when starting a new attempt.
              </p>
            </div>

            <Link
              href={`/my-learning/progress?learnerId=${encodeURIComponent(activeLearner.id)}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#111135] transition hover:bg-[#F7F6FF]"
            >
              <TrendingUp className="h-4 w-4" />
              View progress
            </Link>
          </div>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="inline-flex w-full rounded-xl bg-[#F7F6FF] p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setAssessmentTab("available")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  assessmentTab === "available"
                    ? "bg-[#111135] text-white"
                    : "text-[#111135] hover:bg-white"
                }`}
              >
                Available tests ({availableAssessments.length})
              </button>
              <button
                type="button"
                onClick={() => setAssessmentTab("completed")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  assessmentTab === "completed"
                    ? "bg-[#111135] text-white"
                    : "text-[#111135] hover:bg-white"
                }`}
              >
                Completed ({completedAssessments.length})
              </button>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-3xl">
              <label className="relative block sm:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={assessmentSearch}
                  onChange={(event) => setAssessmentSearch(event.target.value)}
                  placeholder="Search tests"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                />
              </label>
              <select
                value={teacherFilter}
                onChange={(event) => setTeacherFilter(event.target.value)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
              >
                <option value="">All teachers</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher} value={teacher}>
                    {teacher}
                  </option>
                ))}
              </select>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
              >
                <option value="">All subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingAssessments ? (
            <div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#F7F6FF] px-4 py-5 text-sm font-semibold text-[#111135]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading learner assessments...
            </div>
          ) : assessmentsError ? (
            <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
              {assessmentsError}
            </div>
          ) : visibleAssessments.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-[#F7F6FF] px-5 py-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-[#5B3DF5]" />
              <p className="mt-3 font-semibold text-[#111135]">
                {assessmentTab === "available"
                  ? "No available assessments found"
                  : "No completed assessments found"}
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                {assessmentSearch || teacherFilter || subjectFilter
                  ? "Try clearing a search or filter."
                  : assessmentTab === "available"
                    ? "When a teacher publishes an assessment for this learner's school, curriculum, and academic level, it will appear here."
                    : "Completed assessments and results will stay in this tab."}
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4">
              {visibleAssessments.map((assessment) => {
                const isCompleted = assessment.learnerAttempt?.isCompleted;
                const isInProgress = assessment.learnerAttempt?.status === "in_progress";
                const actionLabel = isCompleted
                  ? "View result"
                  : isInProgress
                    ? "Resume assessment"
                    : "Start assessment";

                return (
                  <article
                    key={assessment.id}
                    className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#5B3DF5]/40 md:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#F7F6FF] px-3 py-1 text-xs font-semibold text-[#111135]">
                            {assessment.curriculumName}
                            {assessment.classLevel ? ` · ${assessment.classLevel}` : ""}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          ) : isInProgress ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              <RotateCcw className="h-3.5 w-3.5" />
                              In progress
                            </span>
                          ) : (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                              Code required to start
                            </span>
                          )}
                        </div>

                        <h4 className="mt-3 text-lg font-semibold text-[#111135]">
                          {assessment.title}
                        </h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {assessment.teacherName} · {assessment.subject || "Subject"}
                        </p>
                        {assessment.topic && (
                          <p className="mt-2 text-sm font-medium text-[#5B3DF5]">
                            {assessment.topic}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-full border border-slate-200 px-3 py-1.5">
                            {assessment.totalQuestions} questions
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {assessment.durationMinutes} min
                          </span>
                          <span className="rounded-full border border-slate-200 px-3 py-1.5">
                            {assessment.startedCount} started · {assessment.completedCount} completed
                          </span>
                          {isCompleted && assessment.learnerAttempt?.percentage !== null && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800">
                              Score: {assessment.learnerAttempt?.percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openAssessment(assessment)}
                        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                          isCompleted
                            ? "border border-slate-200 bg-white text-[#111135] hover:bg-[#F7F6FF]"
                            : "bg-[#111135] text-white hover:bg-[#1D1B4F]"
                        }`}
                      >
                        {isInProgress ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {actionLabel}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <section id="practice-tests" className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F6FF] text-[#5B3DF5]">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-xl font-black text-[#111135]">
        Practice tests for {activeLearner.full_name}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Practice tests are created from the question bank and do not require a teacher code.
      </p>
    </div>

    <button
      type="button"
        onClick={() => setPracticeModalOpen(true)}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#111135] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D1B4F]"
    >
      <Plus className="h-4 w-4" />
      Create practice test
    </button>
  </div>

  {loadingPracticeTests ? (
    <div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#F7F6FF] px-4 py-5 text-sm font-semibold text-[#111135]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading practice tests...
    </div>
  ) : practiceTestsError ? (
    <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
      {practiceTestsError}
    </div>
  ) : practiceTests.length === 0 ? (
    <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-[#F7F6FF] px-5 py-8 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-[#5B3DF5]" />
      <p className="mt-3 font-semibold text-[#111135]">
        No practice tests yet
      </p>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
        Create a chapter-wise practice test for this learner when you are ready.
      </p>
    </div>
  ) : (
    <div className="mt-7 grid gap-4">
      {practiceTests.map((practiceTest) => {
        const isCompleted = practiceTest.learnerAttempt?.isCompleted;
        const isInProgress = practiceTest.learnerAttempt?.status === "in_progress";

        const actionLabel = isCompleted
          ? "View result"
          : isInProgress
            ? "Resume practice"
            : "Start practice";

        return (
          <article
            key={practiceTest.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-[#5B3DF5]/40 md:p-6"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F7F6FF] px-3 py-1 text-xs font-semibold text-[#111135]">
                    {practiceTest.curriculumName}
                    {practiceTest.classLevel ? ` · ${practiceTest.classLevel}` : ""}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      <RotateCcw className="h-3.5 w-3.5" />
                      In progress
                    </span>
                  ) : (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                      No code required
                    </span>
                  )}
                </div>

                <h4 className="mt-3 text-lg font-semibold text-[#111135]">
                  {practiceTest.title}
                </h4>

                <p className="mt-1 text-sm text-slate-600">
                  Practice Test · {practiceTest.subject || "Subject"}
                </p>

                {practiceTest.topic && (
                  <p className="mt-2 text-sm font-medium text-[#5B3DF5]">
                    {practiceTest.topic}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="rounded-full border border-slate-200 px-3 py-1.5">
                    {practiceTest.totalQuestions} questions
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {practiceTest.durationMinutes} min
                  </span>
                  {isCompleted && practiceTest.learnerAttempt?.percentage !== null && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800">
                      Score: {practiceTest.learnerAttempt?.percentage}%
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => openPracticeTest(practiceTest)}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  isCompleted
                    ? "border border-slate-200 bg-white text-[#111135] hover:bg-[#F7F6FF]"
                    : "bg-[#111135] text-white hover:bg-[#1D1B4F]"
                }`}
              >
                {isInProgress ? (
                  <RotateCcw className="h-4 w-4" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {actionLabel}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  )}
</section>
      </div>

      {codeTarget && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close assessment code form"
            onClick={() => {
              if (!startingWithCode) {
                setCodeTarget(null);
                setStartCode("");
                setStartCodeError("");
              }
            }}
            className="absolute inset-0 bg-[#111135]/45 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-code-title"
            className="relative w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F6FF] text-[#5B3DF5]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 id="assessment-code-title" className="mt-5 text-2xl font-black text-[#111135]">
              Enter assessment code
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the code shared by {codeTarget.teacherName} to start
              <span className="font-semibold text-[#111135]"> {codeTarget.title}</span>.
            </p>

            <form onSubmit={handleStartWithCode} className="mt-6">
              <label className="text-sm font-semibold text-[#111135]">
                Assessment code
              </label>
              <input
                value={startCode}
                onChange={(event) => setStartCode(event.target.value.toUpperCase())}
                placeholder="Example: A4K92P1M"
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-[#111135] outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
              />
              {startCodeError && (
                <p className="mt-3 text-sm leading-6 text-red-700">
                  {startCodeError}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={startingWithCode}
                  onClick={() => {
                    setCodeTarget(null);
                    setStartCode("");
                    setStartCodeError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#111135] transition hover:bg-[#F7F6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingWithCode}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#111135] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D1B4F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startingWithCode ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start assessment
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {practiceModalOpen && (
  <div className="fixed inset-0 z-[65] flex items-end justify-center p-0 sm:items-center sm:p-6">
    <button
      type="button"
      onClick={() => setPracticeModalOpen(false)}
      className="absolute inset-0 bg-[#111135]/45 backdrop-blur-sm"
    />

    <section className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5B3DF5]">
            Practice Test
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#111135]">
            Generate Practice Test
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Create a new chapter-wise practice test for{" "}
            <span className="font-semibold">
              {activeLearner.full_name}
            </span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPracticeModalOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F6FF]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

     <div className="mt-8 space-y-5">
  {loadingPracticeOptions ? (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F7F6FF] px-4 py-5 text-sm font-semibold text-[#111135]">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading practice options...
    </div>
  ) : practiceOptionsError ? (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
      {practiceOptionsError}
    </div>
  ) : practiceSubjects.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F6FF] px-5 py-8 text-center">
      <p className="font-semibold text-[#111135]">No question bank found</p>
      <p className="mt-2 text-sm text-slate-600">
        Practice tests can be generated once questions are available for this learner.
      </p>
    </div>
  ) : (
    <>
      <div>
        <label className="text-sm font-semibold text-[#111135]">Subject</label>
        <select
          value={selectedSubjectId}
       onChange={(event) => {
  const subjectId = event.target.value;
  const subject = practiceSubjects.find((item) => item.id === subjectId);
  const firstChapter = subject?.chapters?.[0];
  const firstTopic = firstChapter?.topics?.[0];

  setSelectedSubjectId(subjectId);
  setSelectedChapterId(firstChapter?.id || "");
  setSelectedSectionId(firstTopic?.id || "");
}}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
        >
          {practiceSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

     <div>
  <label className="text-sm font-semibold text-[#111135]">Chapter</label>
  <select
    value={selectedChapterId}
    onChange={(event) => {
      const chapterId = event.target.value;
      const subject = practiceSubjects.find((item) => item.id === selectedSubjectId);
      const chapter = subject?.chapters.find((item) => item.id === chapterId);
      const firstTopic = chapter?.topics?.[0];

      setSelectedChapterId(chapterId);
      setSelectedSectionId(firstTopic?.id || "");
    }}
    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
  >
    {(practiceSubjects.find((item) => item.id === selectedSubjectId)?.chapters || []).map(
      (chapter) => (
        <option key={chapter.id} value={chapter.id}>
          {chapter.name}
        </option>
      )
    )}
  </select>
</div>
<div>
  <label className="text-sm font-semibold text-[#111135]">
    Practice Scope
  </label>

  <div className="mt-2 grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setPracticeScope("chapter")}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        practiceScope === "chapter"
          ? "border-[#B58A34] bg-[#F7F6FF] text-[#111135]"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      Entire Chapter
    </button>

    <button
      type="button"
      onClick={() => setPracticeScope("topic")}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        practiceScope === "topic"
          ? "border-[#B58A34] bg-[#F7F6FF] text-[#111135]"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      Specific Topic
    </button>
  </div>
</div>
<div className="rounded-2xl bg-[#F7F6FF] px-4 py-4">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
    Available Questions
  </p>
  <p className="mt-1 text-2xl font-bold text-[#111135]">
    {availableQuestions}
  </p>
  <p className="mt-1 text-sm text-slate-600">
    {practiceScope === "chapter"
      ? "Questions available across this full chapter."
      : "Questions available for this topic."}
  </p>
</div>

<div className="grid gap-5 sm:grid-cols-2">
  <div>
    <label className="text-sm font-semibold text-[#111135]">
      Number of questions
    </label>
    <input
      type="number"
      min={1}
      max={availableQuestions || 100}
      value={practiceQuestionCount}
     onChange={(e) => {
  const value = Number(e.target.value);

  setPracticeQuestionCount(
    Math.max(1, Math.min(value, availableQuestions))
  );
}}
      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
    />
    {practiceQuestionCount > availableQuestions && (
      <p className="mt-2 text-xs font-medium text-red-600">
        Only {availableQuestions} questions are available.
      </p>
    )}
  </div>

  <div>
    <label className="text-sm font-semibold text-[#111135]">
      Duration in minutes
    </label>
    <input
      type="number"
      min={1}
      max={240}
      value={practiceDuration}
      onChange={(event) =>
        setPracticeDuration(Number(event.target.value))
      }
      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
    />
  </div>
</div>


{practiceScope === "topic" && (
<div>
  <label className="text-sm font-semibold text-[#111135]">Topic</label>
  <select
    value={selectedSectionId}
    onChange={(event) => setSelectedSectionId(event.target.value)}
    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
  >
    {(
      practiceSubjects
        .find((item) => item.id === selectedSubjectId)
        ?.chapters.find((chapter) => chapter.id === selectedChapterId)
        ?.topics || []
    ).map((topic) => (
      <option key={topic.id} value={topic.id}>
        {topic.name} ({topic.questionCount} questions)
      </option>
    ))}
  </select>
</div>
)}

<div>
  <label className="text-sm font-semibold text-[#111135]">
    Difficulty
  </label>

  <div className="mt-3 flex flex-wrap gap-3">
    {[
      {id:"easy",label:"Easy"},
      {id:"mixed",label:"Mixed ⭐"},
      {id:"challenging",label:"Challenging"},
    ].map((item)=>(
      <button
        key={item.id}
        type="button"
        onClick={()=>setPracticeDifficulty(item.id as any)}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
          practiceDifficulty===item.id
            ? "bg-[#111135] text-white"
            : "bg-[#F7F6FF] text-[#111135]"
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
</div>

    </>
  )}
  {createPracticeError && (
  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {createPracticeError}
  </p>
)}

<div className="mt-6 flex justify-end gap-3">
  <button
    type="button"
    onClick={() => setPracticeModalOpen(false)}
    disabled={creatingPracticeTest}
    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
  >
    Cancel
  </button>

  <button
    type="button"
    onClick={handleCreatePracticeTest}
    disabled={
      creatingPracticeTest ||
      availableQuestions === 0 ||
      practiceQuestionCount < 1
    }
    className="rounded-2xl bg-[#111135] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    {creatingPracticeTest
      ? "Generating..."
      : "Generate Practice Test"}
  </button>
</div>
</div>
    </section>
  </div>
)}

      {addChildOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close add child form"
            onClick={closeAddChildModal}
            className="absolute inset-0 bg-[#111135]/45 backdrop-blur-sm"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-child-title"
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-3xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5B3DF5]">
  {account?.userType === "parent"
    ? "Parent Account"
    : "Student Account"}
</p>

                <h2
                  id="add-child-title"
                  className="mt-2 text-2xl font-black text-[#111135]"
                >
                  {editingLearner ? "Edit learner profile" : "Add another child"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This child will receive a separate learning space, school
                  assessments, and progress history.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddChildModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F6FF] text-[#111135] transition hover:bg-[#F1EEFF]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
  onSubmit={editingLearner ? handleUpdateLearner : handleAddChild}
  className="mt-7 space-y-5"
>
  {editingLearner && schoolChangeLocked && schoolChangeLockedUntil && (
  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
    School, curriculum and academic level are locked. You can change them again on{" "}
    <span className="font-semibold">
      {schoolChangeLockedUntil.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
    </span>.
  </div>
)}
              <div>
                <label className="text-sm font-semibold text-[#111135]">
                  Child&apos;s full name
                </label>

                <input
                  value={childFullName}
                  onChange={(event) => setChildFullName(event.target.value)}
                  placeholder="e.g. Ayaan Khan"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="relative">
                <label className="text-sm font-semibold text-[#111135]">
                  School
                </label>

                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={childSchoolSearch}
                    disabled={Boolean(editingLearner) && schoolChangeLocked}
                    onFocus={() => setShowSchoolOptions(true)}
                    onChange={(event) => {
                      setChildSchoolSearch(event.target.value);
                      setChildSchoolListingId("");
                      clearChildCurriculumSelection();
                      setShowSchoolOptions(true);
                    }}
                    onBlur={() => {
                      window.setTimeout(
                        () => setShowSchoolOptions(false),
                        150
                      );
                    }}
                    placeholder="Start typing the school name"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                {showSchoolOptions && !(editingLearner && schoolChangeLocked) && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {schoolsLoading ? (
                      <p className="px-3 py-3 text-sm text-slate-500">
                        Loading schools...
                      </p>
                    ) : childSchoolMatches.length > 0 ? (
                      childSchoolMatches.map((schoolOption) => (
                        <button
                          key={schoolOption.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setChildSchoolListingId(schoolOption.id);
                            setChildSchoolSearch(
                              `${schoolOption.name}${
                                getSchoolLocation(schoolOption)
                                  ? ` — ${getSchoolLocation(schoolOption)}`
                                  : ""
                              }`
                            );
                            setShowSchoolOptions(false);
                            void loadChildSchoolCurriculumOptions(
                              schoolOption.id
                            );
                          }}
                          className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-[#F7F6FF]"
                        >
                          <span className="block text-sm font-semibold text-[#111135]">
                            {schoolOption.name}
                          </span>

                          {getSchoolLocation(schoolOption) && (
                            <span className="mt-1 block text-xs text-slate-500">
                              {getSchoolLocation(schoolOption)}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-3 text-sm text-slate-500">
                        No matching school found.
                      </p>
                    )}
                  </div>
                )}

                {childSchoolListingId && (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    School selected
                  </p>
                )}
                {childSchoolListingId && loadingChildCurricula && (
                  <p className="mt-2 text-xs font-medium text-[#5B3DF5]">
                    Loading this school&apos;s curriculum options...
                  </p>
                )}

                {childSchoolListingId &&
                  !loadingChildCurricula &&
                  childCurriculumMessage && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {childCurriculumMessage}
                    </p>
                  )}
              </div>

              {childSchoolListingId && (
                <div className="mt-2 flex justify-end">
                  <button
                  disabled={Boolean(editingLearner) && schoolChangeLocked}
                    type="button"
                    onClick={() => {
                      setChildSchoolListingId("");
                      setChildSchoolSearch("");
                      clearChildCurriculumSelection();
                      setShowSchoolOptions(true);
                    }}
                    className="text-xs font-semibold text-[#5B3DF5] transition hover:text-[#111135]"
                  >
                    Change school
                  </button>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#111135]">
                    Curriculum
                  </label>

                  <select
                    value={childCurriculumId}
                    onChange={(event) => {
                      setChildCurriculumId(event.target.value);
                      setChildCurriculumLevelId("");
                    }}
                   disabled={
  (Boolean(editingLearner) && schoolChangeLocked) ||
  !childSchoolListingId ||
  loadingChildCurricula ||
  childCurricula.length === 0
}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      {!childSchoolListingId
                        ? "Select school first"
                        : loadingChildCurricula
                          ? "Loading curricula..."
                          : childCurricula.length === 0
                            ? "No curriculum available"
                            : "Select curriculum"}
                    </option>

                    {childCurricula.map((curriculum) => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#111135]">
                    Academic level
                  </label>

                  <select
                    value={childCurriculumLevelId}
                    onChange={(event) =>
                      setChildCurriculumLevelId(event.target.value)
                    }
                    disabled={
  (Boolean(editingLearner) && schoolChangeLocked) ||
  !childCurriculumId ||
  loadingChildCurricula
}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      {!childCurriculumId
                        ? "Select curriculum first"
                        : "Select academic level"}
                    </option>

                    {availableChildLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#111135]">
                    Section{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    value={childSection}
                    onChange={(event) => setChildSection(event.target.value)}
                    placeholder="e.g. 5A"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#111135]">
                    Academic year{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>

                  <input
                    value={childAcademicYear}
                    onChange={(event) =>
                      setChildAcademicYear(event.target.value)
                    }
                    placeholder="e.g. 2026–2027"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#111135]">
                    School email{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>

                  <input
                    type="email"
                    value={childSchoolEmail}
                    onChange={(event) => setChildSchoolEmail(event.target.value)}
                    placeholder="Child&apos;s school email"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-[#111135] outline-none transition placeholder:text-slate-400 focus:border-[#5B3DF5] focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              {childFormError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {childFormError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddChildModal}
                  disabled={addingChild}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-[#111135] transition hover:bg-[#F7F6FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                disabled={
  addingChild ||
  updatingLearner ||
  schoolsLoading ||
  loadingChildCurricula ||
  (Boolean(childSchoolListingId) && childCurricula.length === 0)
}
                  className="rounded-full bg-[#111135] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D1B4F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingLearner
  ? updatingLearner
    ? "Saving changes..."
    : "Save changes"
  : addingChild
    ? "Adding child..."
    : "Add child"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function LearningCard({
  icon,
  title,
  description,
  status,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F6FF] text-[#5B3DF5]">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#111135]">{title}</h3>

      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {status}
        </span>

        <ChevronRight className="h-4 w-4 text-[#5B3DF5]" />
      </div>
    </article>
  );
}