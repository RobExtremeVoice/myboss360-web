import Link from "next/link";

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {content.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {content.description}
          </p>
        </div>

        <Button
          size="sm"
          asChild={Boolean(content.primaryActionHref)}
          className="w-fit rounded-full px-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.32)] transition-all duration-150 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.42)]"
        >
          {content.primaryActionHref ? (
            <Link href={content.primaryActionHref}>{content.primaryActionLabel}</Link>
          ) : (
            <span>{content.primaryActionLabel}</span>
          )}
        </Button>
      </div>

      <div className="rounded-[1.65rem] border border-black/6 bg-white px-6 py-5 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.14)]">
        <div className="border-l-2 border-slate-950/20 pl-5">
          <p className="text-sm leading-7 text-slate-600">{content.summary}</p>
        </div>
      </div>
    </header>
  );
}
