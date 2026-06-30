import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { CompanyDirectory } from "@/components/crm/CompanyDirectory";
import { ContactDirectory } from "@/components/crm/ContactDirectory";
import {
  ActivityForm,
  CompanyForm,
  ContactForm,
  DealForm,
  FormSection,
} from "@/components/crm/CRMForms";
import { CustomerHealthCard } from "@/components/crm/CustomerHealthCard";
import { EmptyState } from "@/components/crm/EmptyState";
import { LeadTable } from "@/components/crm/LeadTable";
import { OpportunityCard } from "@/components/crm/OpportunityCard";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PipelineCard } from "@/components/crm/PipelineCard";
import { PriorityCard } from "@/components/crm/PriorityCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { crmPageContent, type CrmWorkspaceView } from "@/config/crm";

type CRMWorkspaceProps = {
  view: CrmWorkspaceView;
};

export function CRMWorkspace({ view }: CRMWorkspaceProps) {
  const isFallback = view.dataMode === "fallback";

  return (
    <div className="space-y-8 lg:space-y-10">
      {isFallback ? (
        <SectionCard
          title={crmPageContent.fallbackNotice.title}
          description={crmPageContent.fallbackNotice.description}
          className="border-blue-200/70 bg-blue-50/70"
        >
          <p className="text-sm leading-6 text-blue-900/75">
            Create real companies, contacts, deals, and activities below. The sample dataset
            will disappear automatically as soon as live CRM records exist in this workspace.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard
        title={crmPageContent.controlCenter.title}
        description={crmPageContent.controlCenter.description}
        className="scroll-mt-24"
      >
        <div id="crm-control-center" className="grid gap-4 xl:grid-cols-2">
          <FormSection
            title="Create company"
            description="Add a new account record with firmographic context."
          >
            <CompanyForm mode="create" />
          </FormSection>

          <FormSection
            title="Create contact"
            description="Add a stakeholder and optionally link them to a company."
          >
            <ContactForm mode="create" companies={view.companyOptions} />
          </FormSection>

          <FormSection
            title="Create deal"
            description="Open a deal, assign ownership, and define close expectations."
          >
            <DealForm
              mode="create"
              companies={view.companyOptions}
              contacts={view.contactOptions}
              owners={view.ownerOptions}
            />
          </FormSection>

          <FormSection
            title="Log activity"
            description="Capture calls, meetings, proposals, and contract movement."
          >
            <ActivityForm
              companies={view.companyOptions}
              contacts={view.contactOptions}
              deals={view.deals}
            />
          </FormSection>
        </div>
      </SectionCard>

      <SectionCard
        title={crmPageContent.pipelineSummary.title}
        description={crmPageContent.pipelineSummary.description}
      >
        {view.pipelineStages.some((stage) => stage.dealCount > 0) ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {view.pipelineStages.map((stage) => (
              <PipelineCard key={stage.key} stage={stage} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={crmPageContent.pipelineSummary.emptyState.title}
            description={crmPageContent.pipelineSummary.emptyState.description}
          />
        )}
      </SectionCard>

      <SectionCard
        title={crmPageContent.pipelineBoard.title}
        description={crmPageContent.pipelineBoard.description}
      >
        <PipelineBoard
          board={view.pipelineBoard}
          companies={view.companyOptions}
          contacts={view.contactOptions}
          owners={view.ownerOptions}
          dataMode={view.dataMode}
          emptyTitle={crmPageContent.pipelineBoard.emptyState.title}
          emptyDescription={crmPageContent.pipelineBoard.emptyState.description}
        />
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title={crmPageContent.companies.title}
          description={crmPageContent.companies.description}
        >
          <CompanyDirectory
            companies={view.companies}
            dataMode={view.dataMode}
            emptyTitle={crmPageContent.companies.emptyState.title}
            emptyDescription={crmPageContent.companies.emptyState.description}
          />
        </SectionCard>

        <SectionCard
          title={crmPageContent.contacts.title}
          description={crmPageContent.contacts.description}
        >
          <ContactDirectory
            contacts={view.contacts}
            companies={view.companyOptions}
            dataMode={view.dataMode}
            emptyTitle={crmPageContent.contacts.emptyState.title}
            emptyDescription={crmPageContent.contacts.emptyState.description}
          />
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SectionCard
          title={crmPageContent.recentLeads.title}
          description={crmPageContent.recentLeads.description}
        >
          {view.recentLeads.length > 0 ? (
            <LeadTable
              labels={crmPageContent.recentLeads.columnLabels}
              leads={view.recentLeads}
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
          {view.priorities.length > 0 ? (
            <div className="space-y-4">
              {view.priorities.map((item) => (
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
        {view.opportunities.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {view.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
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
          {view.activities.length > 0 ? (
            <ActivityTimeline items={view.activities} />
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
          {view.customerHealth.length > 0 ? (
            <div className="space-y-4">
              {view.customerHealth.map((account) => (
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
    </div>
  );
}
