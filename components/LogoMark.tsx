export function LogoMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30">
        <div className="absolute left-[13px] top-[10px] h-8 w-3 rotate-[-28deg] rounded-sm bg-white" />
        <div className="absolute right-[13px] top-[10px] h-8 w-3 rotate-[28deg] rounded-sm bg-slate-950/80" />
      </div>

      <div>
        <div className="text-2xl font-black tracking-[0.34em] text-white">VYRON</div>
        <div className="mt-[-2px] text-xs font-semibold tracking-[0.55em] text-fuchsia-300">
          REACH
        </div>
      </div>
    </div>
  );
}