import { Button } from "@/components/ui/button";
import type { CrmPageContent } from "@/config/crm";

type CRMHeaderProps = {
  content: CrmPageContent["header"];
};

export function CRMHeader({ content }: CRMHeaderProps) {
  return (
    <header className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {content.description}
          </p>
        </div>

        <Button size="lg" className="rounded-full px-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.16)]">
          {content.primaryActionLabel}
        </Button>
      </div>

      <div className="rounded-[1.65rem] border border-black/6 bg-white px-6 py-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.14)]">
        <p className="text-sm leading-7 text-slate-600">{content.summary}</p>
      </div>
    </header>
  );
}
