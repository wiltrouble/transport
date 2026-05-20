type OccupancyBarProps = {
  percent: number;
  className?: string;
};

/**
 * Visual indicator for student-to-capacity ratio. Tone shifts from indigo →
 * amber (>=80%) → red (>=100%) so the route operator sees overflow instantly.
 */
export function OccupancyBar({ percent, className }: OccupancyBarProps) {
  const value = Math.max(0, Math.min(100, percent));
  const tone =
    percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-indigo-500";
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className ?? ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className={`h-full rounded-full transition-all ${tone}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
