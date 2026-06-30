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
import { dashboardHomeContent } from "@/config/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={dashboardHomeContent.title}
        description={dashboardHomeContent.description}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardHomeContent.metrics.map((metric) => (
          <KpiCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Recent Activity"
            description="The latest cross-functional updates affecting leadership visibility."
            action={
              <Button variant="outline" size="sm" className="rounded-full border-black/8 bg-white">
                View all
              </Button>
            }
          >
            <ActivityList items={dashboardHomeContent.recentActivity} />
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Upcoming Meetings"
              description="Meetings requiring awareness today."
            >
              <MeetingList items={dashboardHomeContent.upcomingMeetings} />
            </SectionCard>

            <SectionCard
              title="Today's Priorities"
              description="Items that need leadership action or review."
            >
              <PriorityList items={dashboardHomeContent.priorities} />
            </SectionCard>
          </div>
        </div>

        <ExecutiveBriefCard content={dashboardHomeContent.executiveBrief} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard
          title="Recent Documents"
          description="Recently updated notes and files from across the workspace."
        >
          <DocumentList items={dashboardHomeContent.recentDocuments} />
        </SectionCard>

        <SectionCard
          title="Recent CRM Opportunities"
          description="High-signal opportunities currently in motion."
        >
          <OpportunityList items={dashboardHomeContent.recentOpportunities} />
        </SectionCard>
      </section>

      <SectionCard
        title="Quick Actions"
        description="Common entry points for the next operating task."
      >
        <QuickActionsGrid actions={dashboardHomeContent.quickActions} />
      </SectionCard>
    </div>
  );
}
