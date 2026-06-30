type DashboardPageHeaderProps = {
  title: string;
  description: string;
  greeting: string;
};

export function DashboardPageHeader({
  title,
  description,
  greeting,
}: DashboardPageHeaderProps) {
  return (
    <header className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Executive overview
      </p>
      <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="text-base text-slate-500">{greeting}</p>
      <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </header>
  );
}
