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
  totalQuestions,
}: QuestionScreenProps) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#F8F1E7] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,180,106,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(7,27,51,0.10),transparent_34%)]" />

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center"
      >
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-2xl shadow-[#071B33]/10 backdrop-blur sm:p-5">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[#B58A34]">
                  Heeco Match
                </p>

                <p className="rounded-full bg-[#F8F1E7] px-4 py-2 text-xs font-semibold text-[#071B33]">
                  Question {question.step} of {totalQuestions}
                </p>
              </div>

              <ProgressBar current={question.step} total={totalQuestions} />
            </div>

            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#071B33] sm:text-4xl">
              {question.title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Choose the option that best matches what you are looking for. You
              can refine your school preferences step by step.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    className={cn(
                      "group flex min-h-[92px] items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
                      isSelected
                        ? "border-[#071B33] bg-[#071B33] text-white shadow-lg shadow-[#071B33]/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#D6B46A] hover:bg-[#FFFBF3] hover:shadow-md"
                    )}
                  >
                    <span className="text-base font-medium leading-6">
                      {option.label}
                    </span>

                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition",
                        isSelected
                          ? "border-[#D6B46A] bg-[#D6B46A] text-[#071B33]"
                          : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-[#D6B46A] group-hover:text-[#071B33]"
                      )}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl bg-[#F8F1E7] px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                Your answers help HeecoWorld suggest schools that fit your
                location, curriculum preference, budget and priorities.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}