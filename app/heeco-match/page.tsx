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
    const [screen, setScreen] = useState<"welcome" | "questions" | "loading" | "results">("welcome");
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
    if (screen === "questions" && currentQuestion) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10">
      <LoginRequiredModal
  open={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  feature="heecoMatch"
/>
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
    </main>
  );
}
if (screen === "loading") {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 ">
      <LoginRequiredModal
  open={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  feature="heecoMatch"
/>
 
        <LoadingScreen />
      
    </main>
  );
}
if (screen === "results") {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 ">
      <LoginRequiredModal
  open={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  feature="heecoMatch"
/>
       <ResultsScreen answers={answers} onRematch={resetMatch}/>
      
    </main>
  );
}
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10">
        <LoginRequiredModal
  open={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  feature="heecoMatch"
/>
      <WelcomeScreen
  onStart={() => {
    if (matchLocked) {
      setShowLoginModal(true);
      return;
    }

    setScreen("questions");
  }}
/>
    </main>
  );
}