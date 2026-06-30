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
    <div className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.12)]">
      <span
        className={[
          "size-1.5 shrink-0 rounded-full",
          tone === "success" ? "bg-emerald-500" : "bg-slate-300",
        ].join(" ")}
      />
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-950">{value}</span>
    </div>
  );
}
