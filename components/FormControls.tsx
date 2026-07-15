export function TextInput({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-sm font-bold outline-none focus:border-fuchsia-400"
    />
  );
}

export function SmallButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-black ${
        danger ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
      }`}
    >
      {label}
    </button>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-purple-400">
        {label}
      </div>
      <div className="mt-1 font-bold">{value || "Not set"}</div>
    </div>
  );
}