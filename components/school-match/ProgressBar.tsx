type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
        <span className="text-slate-600">
          Question {current} of {total}
        </span>

        <span className="rounded-full bg-[#F8F1E7] px-3 py-1 text-xs font-semibold text-[#071B33]">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#F1E7D3]">
        <div
          className="h-full rounded-full bg-[#D6B46A] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}