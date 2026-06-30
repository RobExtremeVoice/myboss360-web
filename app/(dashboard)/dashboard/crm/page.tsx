import { redirect } from "next/navigation";

import { CRMHeader } from "@/components/crm/CRMHeader";
import { CRMToolbar } from "@/components/crm/CRMToolbar";
import { CRMWorkspace } from "@/components/crm/CRMWorkspace";
import { EmptyState } from "@/components/crm/EmptyState";
import { crmPageContent } from "@/config/crm";
import { createServerClient } from "@/lib/supabase/server";
import { createCRMService } from "@/services/crm/crm-service";

type CrmPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    stage?: string | string[];
    leadStatus?: string | string[];
    owner?: string | string[];
    company?: string | string[];
  }>;
};

function getParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function CrmPage({ searchParams }: CrmPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const service = createCRMService(supabase);
  const crmView = await service.getWorkspaceView(user.id, {
    q: getParam(params?.q),
    stage: getParam(params?.stage),
    leadStatus: getParam(params?.leadStatus),
    owner: getParam(params?.owner),
    company: getParam(params?.company),
  });

  const headerContent = {
    ...crmPageContent.header,
    summary: crmView.workspace
      ? `${crmPageContent.header.summary} Active workspace: ${crmView.workspace.name}.`
      : crmPageContent.workspaceEmptyState.description,
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <CRMHeader content={headerContent} />

      <CRMToolbar
        search={crmView.filters.q}
        stage={crmView.filters.stage}
        leadStatus={crmView.filters.leadStatus}
        owner={crmView.filters.owner}
        company={crmView.filters.company}
        ownerOptions={crmView.ownerOptions}
        companyOptions={crmView.companyOptions}
      />

      {!crmView.workspace ? (
        <EmptyState
          title={crmPageContent.workspaceEmptyState.title}
          description={crmPageContent.workspaceEmptyState.description}
        />
      ) : (
        <CRMWorkspace view={crmView} />
      )}
    </div>
  );
}
