import { redirect } from "next/navigation";

import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { CRMHeader } from "@/components/crm/CRMHeader";
import { CRMToolbar } from "@/components/crm/CRMToolbar";
import { CustomerHealthCard } from "@/components/crm/CustomerHealthCard";
import { EmptyState } from "@/components/crm/EmptyState";
import { LeadTable } from "@/components/crm/LeadTable";
import { OpportunityCard } from "@/components/crm/OpportunityCard";
import { PipelineCard } from "@/components/crm/PipelineCard";
import { PriorityCard } from "@/components/crm/PriorityCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { crmPageContent } from "@/config/crm";
import { createServerClient } from "@/lib/supabase/server";
import { createCRMService } from "@/services/crm/crm-service";

type CrmPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    stage?: string | string[];
    leadStatus?: string | string[];
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
      />

      {!crmView.workspace ? (
        <EmptyState
          title={crmPageContent.workspaceEmptyState.title}
          description={crmPageContent.workspaceEmptyState.description}
        />
      ) : (
        <>
          <SectionCard
            title={crmPageContent.pipelineSummary.title}
            description={crmPageContent.pipelineSummary.description}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {crmView.pipelineStages.map((stage) => (
                <PipelineCard key={stage.key} stage={stage} />
              ))}
            </div>
          </SectionCard>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <SectionCard
              title={crmPageContent.recentLeads.title}
              description={crmPageContent.recentLeads.description}
            >
              {crmView.recentLeads.length > 0 ? (
                <LeadTable
                  labels={crmPageContent.recentLeads.columnLabels}
                  leads={crmView.recentLeads}
                />
              ) : (
                <EmptyState
                  title={crmPageContent.recentLeads.emptyState.title}
                  description={crmPageContent.recentLeads.emptyState.description}
                />
              )}
            </SectionCard>

            <SectionCard
              title={crmPageContent.priorities.title}
              description={crmPageContent.priorities.description}
            >
              {crmView.priorities.length > 0 ? (
                <div className="space-y-4">
                  {crmView.priorities.map((item) => (
                    <PriorityCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={crmPageContent.priorities.emptyState.title}
                  description={crmPageContent.priorities.emptyState.description}
                />
              )}
            </SectionCard>
          </section>

          <SectionCard
            title={crmPageContent.openOpportunities.title}
            description={crmPageContent.openOpportunities.description}
          >
            {crmView.opportunities.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                {crmView.opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={crmPageContent.openOpportunities.emptyState.title}
                description={crmPageContent.openOpportunities.emptyState.description}
              />
            )}
          </SectionCard>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <SectionCard
              title={crmPageContent.activityTimeline.title}
              description={crmPageContent.activityTimeline.description}
            >
              {crmView.activities.length > 0 ? (
                <ActivityTimeline items={crmView.activities} />
              ) : (
                <EmptyState
                  title={crmPageContent.activityTimeline.emptyState.title}
                  description={crmPageContent.activityTimeline.emptyState.description}
                />
              )}
            </SectionCard>

            <SectionCard
              title={crmPageContent.customerHealth.title}
              description={crmPageContent.customerHealth.description}
            >
              {crmView.customerHealth.length > 0 ? (
                <div className="space-y-4">
                  {crmView.customerHealth.map((account) => (
                    <CustomerHealthCard key={account.id} account={account} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={crmPageContent.customerHealth.emptyState.title}
                  description={crmPageContent.customerHealth.emptyState.description}
                />
              )}
            </SectionCard>
          </section>
        </>
      )}
    </div>
  );
}
