type DashboardPageHeaderProps = {
  title: string;
  description: string;
};

export function DashboardPageHeader({
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Executive overview
      </p>
      <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </header>
  );
}
