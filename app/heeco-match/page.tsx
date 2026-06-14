"use client";


import { useEffect, useState } from "react";
import WelcomeScreen from "@/components/school-match/WelcomeScreen";
import QuestionScreen from "@/components/school-match/QuestionScreen";
import { heecoMatchQuestions } from "./questions";
import LoadingScreen from "@/components/school-match/LoadingScreen";
import ResultsScreen from "@/components/school-match/ResultsScreen";

export default function HeecoMatchPage() {
    const [screen, setScreen] = useState<"welcome" | "questions" | "loading" | "results">("welcome");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const currentQuestion = heecoMatchQuestions[currentQuestionIndex];
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
     <QuestionScreen
  question={currentQuestion}
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
  
  onBack={() => setCurrentQuestionIndex((prev) => prev - 1)}
  canGoBack={currentQuestionIndex > 0}
/>
    </main>
  );
}
if (screen === "loading") {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 ">
 
        <LoadingScreen />
      
    </main>
  );
}
if (screen === "results") {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 ">
      
       <ResultsScreen />
      
    </main>
  );
}
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10">
        
      <WelcomeScreen onStart={() => setScreen("questions")} />
    </main>
  );
}