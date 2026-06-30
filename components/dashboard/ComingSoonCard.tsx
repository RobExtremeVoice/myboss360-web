export type ComingSoonCardProps = {
  title: string;
  description: string;
};

export function ComingSoonCard({
  title,
  description,
}: ComingSoonCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.18)]">
      <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Coming Soon
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}
