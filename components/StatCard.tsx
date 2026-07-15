export function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-[0_20px_40px_rgba(88,28,135,0.08)]">
      <div className="flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-900 text-fuchsia-300">
          ●
        </div>

        <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600">
          Live
        </span>
      </div>

      <div className="mt-7 text-4xl font-black">{value}</div>
      <div className="mt-2 text-sm font-bold text-slate-700">{label}</div>
      <div className="mt-3 text-xs font-bold text-emerald-600">{note}</div>
    </div>
  );
}