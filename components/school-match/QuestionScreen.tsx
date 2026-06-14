import { heecoMatchQuestions } from "@/app/heeco-match/questions";
import { cn } from "@/lib/utils";
import ProgressBar from "./ProgressBar";
import { motion } from "framer-motion";
type QuestionScreenProps = {
  question: (typeof heecoMatchQuestions)[number];
  totalQuestions: number;
  selectedAnswer?: string;
  onSelect: (answerId: string) => void;
};
export default function QuestionScreen({
   question,
  selectedAnswer,
  onSelect,
totalQuestions
}: QuestionScreenProps) {
    //const question = heecoMatchQuestions[0];
  return (
    <motion.div
  key={question.id}
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center"
>
      <div className="w-full rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/50 sm:p-10">
        
         <ProgressBar
  current={question.step}
  total={totalQuestions}
/>
        

        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          {question.title}
        </h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
  "rounded-2xl border p-5 transition",
  selectedAnswer === option.id
    ? "border-blue-700 bg-blue-700 text-white"
    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}