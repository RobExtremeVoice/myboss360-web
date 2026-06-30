import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DocumentList } from "@/components/dashboard/DocumentList";
import { ExecutiveBriefCard } from "@/components/dashboard/ExecutiveBriefCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MeetingList } from "@/components/dashboard/MeetingList";
import { OpportunityList } from "@/components/dashboard/OpportunityList";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { dashboardPageContent } from "@/config/dashboard-metrics";
import { createServerClient } from "@/lib/supabase/server";
import { createExecutiveMetricsService } from "@/services/dashboard/executive-metrics-service";

function DashboardEmptyState(props: { title: string; description: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-slate-50/70 px-4 py-6">
      <p className="text-sm font-medium text-slate-950">{props.title}</p>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
        {props.description}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const executiveMetricsService = createExecutiveMetricsService(supabase);
  const dashboard = await executiveMetricsService.getExecutiveDashboard({
    userId: user.id,
    userEmail: user.email,
  });

  const emptyState = dashboard.workspace
    ? dashboardPageContent.emptyDashboardState
    : dashboardPageContent.emptyWorkspaceState;

  return (
    <div className="space-y-8 lg:space-y-10">
      <DashboardPageHeader
        title={dashboard.title}
        description={dashboard.description}
        greeting={dashboard.greeting}
      />

      {!dashboard.hasLiveData ? (
        <SectionCard
          title={emptyState.title}
          description={emptyState.description}
        >
          <p className="text-sm leading-6 text-slate-600">
            The dashboard is connected and ready. As soon as live Supabase records appear in
            this workspace, executive metrics will render here automatically without requiring
            any UI changes.
          </p>
        </SectionCard>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <KpiCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div>
          <ExecutiveBriefCard content={dashboard.executiveBrief} />
        </div>

        <div className="space-y-6">
          <SectionCard
            title={dashboardPageContent.sections.priorities.title}
            description={dashboardPageContent.sections.priorities.description}
          >
            {dashboard.priorities.length > 0 ? (
              <PriorityList items={dashboard.priorities} />
            ) : (
              <DashboardEmptyState
                title={dashboardPageContent.sections.priorities.emptyTitle}
                description={dashboardPageContent.sections.priorities.emptyDescription}
              />
            )}
          </SectionCard>

          <SectionCard
            title={dashboardPageContent.sections.opportunities.title}
            description={dashboardPageContent.sections.opportunities.description}
          >
            {dashboard.recentOpportunities.length > 0 ? (
              <OpportunityList items={dashboard.recentOpportunities} />
            ) : (
              <DashboardEmptyState
                title={dashboardPageContent.sections.opportunities.emptyTitle}
                description={dashboardPageContent.sections.opportunities.emptyDescription}
              />
            )}
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <SectionCard
          title={dashboardPageContent.sections.meetings.title}
          description={dashboardPageContent.sections.meetings.description}
        >
          {dashboard.upcomingMeetings.length > 0 ? (
            <MeetingList items={dashboard.upcomingMeetings} />
          ) : (
            <DashboardEmptyState
              title={dashboardPageContent.sections.meetings.emptyTitle}
              description={dashboardPageContent.sections.meetings.emptyDescription}
            />
          )}
        </SectionCard>

        <SectionCard
          title={dashboardPageContent.sections.quickActions.title}
          description={dashboardPageContent.sections.quickActions.description}
        >
          <QuickActionsGrid actions={dashboard.quickActions} />
        </SectionCard>

        <SectionCard
          title={dashboardPageContent.sections.activity.title}
          description={dashboardPageContent.sections.activity.description}
          action={
            <Button variant="outline" size="sm" className="rounded-full border-black/8 bg-white">
              View all
            </Button>
          }
        >
          {dashboard.recentActivity.length > 0 ? (
            <ActivityList items={dashboard.recentActivity} />
          ) : (
            <DashboardEmptyState
              title={dashboardPageContent.sections.activity.emptyTitle}
              description={dashboardPageContent.sections.activity.emptyDescription}
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title={dashboardPageContent.sections.documents.title}
        description={dashboardPageContent.sections.documents.description}
      >
        {dashboard.recentDocuments.length > 0 ? (
          <DocumentList items={dashboard.recentDocuments} />
        ) : (
          <DashboardEmptyState
            title={dashboardPageContent.sections.documents.emptyTitle}
            description={dashboardPageContent.sections.documents.emptyDescription}
          />
        )}
      </SectionCard>
    </div>
  );
}
