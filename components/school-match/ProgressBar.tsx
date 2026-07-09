type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        <span className="text-slate-600">
          Question {current} of {total}
        </span>

        <span className="rounded-full bg-[#F1EEFF] px-3 py-1 text-xs font-black text-[#5B3DF5]">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#5B3DF5] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}