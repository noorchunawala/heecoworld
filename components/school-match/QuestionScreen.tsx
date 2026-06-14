import { heecoMatchQuestions } from "@/app/heeco-match/questions";
import { cn } from "@/lib/utils";
type QuestionScreenProps = {
  question: (typeof heecoMatchQuestions)[number];
  selectedAnswer?: string;
  onSelect: (answerId: string) => void;
  onBack: () => void;
  canGoBack: boolean;
};
export default function QuestionScreen({
   question,
  selectedAnswer,
  onSelect,
  onBack,
  canGoBack
}: QuestionScreenProps) {
    //const question = heecoMatchQuestions[0];
  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
      <div className="w-full rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/50 sm:p-10">
        <p className="text-sm font-semibold text-blue-700">
          Step {question.step} of {heecoMatchQuestions.length}
        </p>

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
    </div>
  );
}