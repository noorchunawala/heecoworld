"use client";

import { useEffect, useState } from "react";
import WelcomeScreen from "@/components/school-match/WelcomeScreen";
import QuestionScreen from "@/components/school-match/QuestionScreen";
import {
  americanGradeOptions,
  britishGradeOptions,
  cbseGradeOptions,
  heecoMatchQuestions,
  ibGradeOptions,
} from "./questions";
import LoadingScreen from "@/components/school-match/LoadingScreen";
import ResultsScreen from "@/components/school-match/ResultsScreen";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { useAuth } from "@/components/AuthProvider";
import { isLoginRequired } from "@/lib/feature";

export default function HeecoMatchPage() {
  const [screen, setScreen] = useState<
    "welcome" | "questions" | "loading" | "results"
  >("welcome");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const { status } = useAuth();
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    async function loadFeatureSetting() {
      const required = await isLoginRequired("heeco_match");
      setRequiresLogin(required);
    }

    loadFeatureSetting();
  }, []);

  const matchLocked =
    requiresLogin && status !== "loading" && status !== "authenticated";

  function getCurrentQuestion() {
    const baseQuestion = heecoMatchQuestions[currentQuestionIndex];

    if (baseQuestion?.id !== "grade") {
      return baseQuestion;
    }

    const selectedCurriculum = answers.curriculum;

    if (selectedCurriculum === "British") {
      return { ...baseQuestion, options: britishGradeOptions };
    }

    if (selectedCurriculum === "CBSE") {
      return { ...baseQuestion, options: cbseGradeOptions };
    }

    if (selectedCurriculum === "American") {
      return { ...baseQuestion, options: americanGradeOptions };
    }

    if (selectedCurriculum === "IB") {
      return { ...baseQuestion, options: ibGradeOptions };
    }

    return baseQuestion;
  }

  function resetMatch() {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setScreen("welcome");
  }

  const currentQuestion = getCurrentQuestion();

  useEffect(() => {
    if (screen !== "loading") return;

    const timer = setTimeout(() => {
      setScreen("results");
    }, 2500);

    return () => clearTimeout(timer);
  }, [screen]);

  const shellClass =
    "min-h-screen bg-[#F7F6FF] px-4 py-10 text-[#111135] sm:px-6 lg:px-8";

  const backgroundGlow = (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.14),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />
  );

  const modal = (
    <LoginRequiredModal
      open={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      feature="heecoMatch"
    />
  );

  if (screen === "questions" && currentQuestion) {
    return (
      <main className={shellClass}>
        {backgroundGlow}
        {modal}

        <div className="mx-auto max-w-5xl">
          <QuestionScreen
            question={currentQuestion}
            totalQuestions={heecoMatchQuestions.length}
            selectedAnswer={answers[currentQuestion.id] as string | undefined}
            onSelect={(answerId) => {
              setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: answerId,
              }));

              setTimeout(() => {
                const isLastQuestion =
                  currentQuestionIndex === heecoMatchQuestions.length - 1;

                if (isLastQuestion) {
                  setScreen("loading");
                  return;
                }

                setCurrentQuestionIndex((prev) => prev + 1);
              }, 250);
            }}
          />
        </div>
      </main>
    );
  }

  if (screen === "loading") {
    return (
      <main className={shellClass}>
        {backgroundGlow}
        {modal}

        <div className="mx-auto max-w-5xl">
          <LoadingScreen />
        </div>
      </main>
    );
  }

  if (screen === "results") {
    return (
      <main className={shellClass}>
        {backgroundGlow}
        {modal}

        <div className="mx-auto max-w-7xl">
          <ResultsScreen answers={answers} onRematch={resetMatch} />
        </div>
      </main>
    );
  }

  return (
    <main className={shellClass}>
      {backgroundGlow}
      {modal}

      <div className="mx-auto max-w-5xl">
        <WelcomeScreen
          onStart={() => {
            if (matchLocked) {
              setShowLoginModal(true);
              return;
            }

            setScreen("questions");
          }}
        />
      </div>
    </main>
  );
}