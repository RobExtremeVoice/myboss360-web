type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-slate-50/80 px-5 py-10 text-center">
      <p className="text-sm font-medium text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
