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
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden rounded-3xl bg-[#F7F6FF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(91,61,245,0.14),transparent_30%),radial-gradient(circle_at_88%_32%,rgba(245,158,11,0.12),transparent_32%)]" />

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center"
      >
        <div className="w-full rounded-3xl border border-white/80 bg-white/80 p-5 shadow-2xl shadow-violet-500/10 backdrop-blur">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm font-black text-[#5B3DF5]">
                  Scoolyx Match
                </p>

                <p className="rounded-full bg-[#F1EEFF] px-4 py-2 text-xs font-black text-[#5B3DF5]">
                  Question {question.step} of {totalQuestions}
                </p>
              </div>

              <ProgressBar current={question.step} total={totalQuestions} />
            </div>

            <h2 className="max-w-3xl text-3xl font-black tracking-tight text-[#111135] sm:text-4xl">
              {question.title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Choose the option that best matches what you are looking for.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => onSelect(option.id)}
                    className={cn(
                      "group flex min-h-[92px] items-center justify-between gap-4 rounded-3xl border p-5 text-left transition-all duration-200",
                      isSelected
                        ? "border-[#111135] bg-[#111135] text-white shadow-lg shadow-slate-900/10"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#5B3DF5] hover:bg-[#F7F6FF] hover:shadow-md"
                    )}
                  >
                    <span className="text-base font-semibold leading-6">
                      {option.label}
                    </span>

                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-black transition",
                        isSelected
                          ? "border-[#5B3DF5] bg-[#5B3DF5] text-white"
                          : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-[#5B3DF5] group-hover:text-[#5B3DF5]"
                      )}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl bg-[#F7F6FF] px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                Your answers help Scoolyx suggest schools that fit your
                location, curriculum preference, budget and priorities.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}