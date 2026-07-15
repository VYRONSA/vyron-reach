export function StatusPill({ value }: { value: string }) {
  const style =
    value === "Hot" || value === "High"
      ? "bg-rose-100 text-rose-700"
      : value === "Warm" || value === "Medium" || value === "Approved"
      ? "bg-amber-100 text-amber-700"
      : value === "Won" || value === "Live" || value === "Done" || value === "Published"
      ? "bg-emerald-100 text-emerald-700"
      : value === "Lost" || value === "Paused" || value === "Archived"
      ? "bg-slate-200 text-slate-700"
      : "bg-fuchsia-100 text-fuchsia-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{value}</span>;
}