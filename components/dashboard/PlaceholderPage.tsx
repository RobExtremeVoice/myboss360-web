import { ComingSoonCard } from "@/components/dashboard/ComingSoonCard";

export type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>

      <ComingSoonCard
        title={`${title} is being prepared.`}
        description="This area is intentionally scaffolded as part of the first authenticated application shell. Product workflows, logic, and integrations will be added in later phases."
      />
    </section>
  );
}
