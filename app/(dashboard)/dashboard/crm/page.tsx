import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { CRMHeader } from "@/components/crm/CRMHeader";
import { CustomerHealthCard } from "@/components/crm/CustomerHealthCard";
import { EmptyState } from "@/components/crm/EmptyState";
import { LeadTable } from "@/components/crm/LeadTable";
import { OpportunityCard } from "@/components/crm/OpportunityCard";
import { PipelineCard } from "@/components/crm/PipelineCard";
import { PriorityCard } from "@/components/crm/PriorityCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { crmPageContent } from "@/config/crm";

export default function CrmPage() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <CRMHeader content={crmPageContent.header} />

      <SectionCard
        title={crmPageContent.pipelineSummary.title}
        description={crmPageContent.pipelineSummary.description}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {crmPageContent.pipelineSummary.stages.map((stage) => (
            <PipelineCard key={stage.name} stage={stage} />
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SectionCard
          title={crmPageContent.recentLeads.title}
          description={crmPageContent.recentLeads.description}
        >
          <LeadTable
            labels={crmPageContent.recentLeads.columnLabels}
            leads={crmPageContent.recentLeads.leads}
          />
        </SectionCard>

        <SectionCard
          title={crmPageContent.priorities.title}
          description={crmPageContent.priorities.description}
        >
          <div className="space-y-4">
            {crmPageContent.priorities.items.map((item) => (
              <PriorityCard key={item.title} item={item} />
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title={crmPageContent.openOpportunities.title}
        description={crmPageContent.openOpportunities.description}
      >
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {crmPageContent.openOpportunities.opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.company}
              opportunity={opportunity}
            />
          ))}
        </div>
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionCard
          title={crmPageContent.activityTimeline.title}
          description={crmPageContent.activityTimeline.description}
        >
          {crmPageContent.activityTimeline.items.length > 0 ? (
            <ActivityTimeline items={crmPageContent.activityTimeline.items} />
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
          <div className="space-y-4">
            {crmPageContent.customerHealth.accounts.map((account) => (
              <CustomerHealthCard key={account.company} account={account} />
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
