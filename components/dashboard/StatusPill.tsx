type StatusPillProps = {
  label: string;
  value: string;
  tone?: "neutral" | "success";
};

export function StatusPill({
  label,
  value,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-2 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.12)]">
      {tone === "success" ? (
        <span className="size-2 rounded-full bg-emerald-500" />
      ) : (
        <span className="size-2 rounded-full bg-slate-400" />
      )}
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-950">{value}</span>
    </div>
  );
}
