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
import { TodaysMeetingsWidget } from "@/components/dashboard/widgets/TodaysMeetingsWidget";
import { AttentionWidget } from "@/components/dashboard/widgets/AttentionWidget";
import { WaitingReplyWidget } from "@/components/dashboard/widgets/WaitingReplyWidget";
import { CriticalCustomersWidget } from "@/components/dashboard/widgets/CriticalCustomersWidget";
import { HighPriorityEmailsWidget } from "@/components/dashboard/widgets/HighPriorityEmailsWidget";
import { RecentMemoriesWidget } from "@/components/dashboard/widgets/RecentMemoriesWidget";
import { RecommendationsWidget } from "@/components/dashboard/widgets/RecommendationsWidget";
import { KnowledgeUpdatesWidget } from "@/components/dashboard/widgets/KnowledgeUpdatesWidget";
import { TopRelationshipsWidget } from "@/components/dashboard/widgets/TopRelationshipsWidget";
import { StaleRelationshipsWidget } from "@/components/dashboard/widgets/StaleRelationshipsWidget";
import { NewRelationshipsWidget } from "@/components/dashboard/widgets/NewRelationshipsWidget";
import { ChampionsWidget } from "@/components/dashboard/widgets/ChampionsWidget";
import { DecisionMakersWidget } from "@/components/dashboard/widgets/DecisionMakersWidget";
import { dashboardPageContent } from "@/config/dashboard-metrics";
import { createServerClient } from "@/lib/supabase/server";
import { createExecutiveMetricsService } from "@/services/dashboard/executive-metrics-service";
import { createIntelligenceService } from "@/services/intelligence/intelligence-service";

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
  const intelligenceService = createIntelligenceService(supabase);

  const [dashboard, context, recentDocs] = await Promise.all([
    executiveMetricsService.getExecutiveDashboard({
      userId: user.id,
      userEmail: user.email,
    }),
    intelligenceService.getIntelligenceContext(user.id).catch(() => null),
    supabase
      .from("knowledge_documents")
      .select("id, title, category, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10)
      .then(({ data }) => data ?? []),
  ]);

  const knowledgeDocs = recentDocs.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    updatedAt: d.updated_at,
  }));

  const emptyState = dashboard.workspace
    ? dashboardPageContent.emptyDashboardState
    : dashboardPageContent.emptyWorkspaceState;

  const hasIntelligence = context !== null;

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
            Your Executive OS is ready. Connect your data sources — Gmail, Calendar, and CRM — and your metrics, signals, and briefings will appear here automatically.
          </p>
        </SectionCard>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <KpiCard key={metric.label} metric={metric} />
        ))}
      </section>

      {/* ── Executive Intelligence Widgets ── */}
      {hasIntelligence ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-slate-950">
              Executive Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Real-time signals from your connected sources
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TodaysMeetingsWidget items={context.todayAgenda.filter((a) => a.type === "meeting")} />
            <AttentionWidget signals={context.learningSignals} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <WaitingReplyWidget threads={context.emailIntelligence.awaitingReplies} />
            <CriticalCustomersWidget
              criticalThreads={context.emailIntelligence.criticalThreads}
              topRisks={context.topRisks}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <HighPriorityEmailsWidget threads={context.emailIntelligence.highPriorityThreads} />
            <RecentMemoriesWidget memories={context.recentMemories} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RecommendationsWidget recommendations={context.activeRecommendations} />
            <KnowledgeUpdatesWidget
              documents={knowledgeDocs}
              totalCount={knowledgeDocs.length}
            />
          </div>
        </section>
      ) : null}

      {/* ── People Intelligence Widgets ── */}
      {hasIntelligence && context.peopleIntelligence ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-slate-950">
              People Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Relationship strength, champions, and engagement signals
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <TopRelationshipsWidget profiles={context.peopleIntelligence.topRelationships} />
            <ChampionsWidget profiles={context.peopleIntelligence.champions} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DecisionMakersWidget profiles={context.peopleIntelligence.decisionMakers} />
            <NewRelationshipsWidget profiles={context.peopleIntelligence.newRelationships} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <StaleRelationshipsWidget profiles={context.peopleIntelligence.staleRelationships} />
          </div>
        </section>
      ) : null}

      {/* ── Existing executive sections ── */}
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
