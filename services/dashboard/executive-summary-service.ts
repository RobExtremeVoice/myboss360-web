import {
  dashboardPageContent,
  dashboardStageDefinitions,
  type DashboardActivityItem,
  type DashboardDocumentItem,
  type DashboardHomeContent,
  type DashboardMeetingItem,
  type DashboardMetric,
  type DashboardMetricTrend,
  type DashboardOpportunityItem,
  type DashboardPriorityItem,
  type DashboardPriorityTone,
  type DashboardStageSummary,
  type ExecutiveDashboard,
} from "@/config/dashboard-metrics";
import type { ExecutiveDashboardSnapshot } from "@/repositories/dashboard/dashboard-repository";
import type { Database } from "@/types/database";
import {
  formatCompactCurrency,
  formatCurrency,
  formatRelativeTime,
  formatTitleCase,
} from "@/utils/formatters";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

type ExecutiveSummaryParams = {
  workspace: WorkspaceRow | null;
  snapshot: ExecutiveDashboardSnapshot;
  currentUserProfile: ProfileRow | null;
  currentUserEmail?: string | null;
};

type RankedPriority = DashboardPriorityItem & {
  rank: number;
};

const OPEN_DEAL_STAGES = new Set(["prospect", "qualified", "proposal", "negotiation"]);
const CLOSED_WON_STAGE = "closed_won";
const DONE_TASK_STATUSES = new Set(["done", "cancelled"]);
const PROJECT_RISK_STATUSES = new Set(["on_hold"]);

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function endOfToday(): Date {
  const now = startOfToday();
  now.setHours(23, 59, 59, 999);
  return now;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + Number(value ?? 0), 0);
}

function stageLabel(stage: string): string {
  return (
    dashboardStageDefinitions.find((item) => item.value === stage)?.label ??
    formatTitleCase(stage)
  );
}

function displayName(profile: ProfileRow | null, email?: string | null): string {
  if (profile?.full_name?.trim()) {
    return profile.full_name;
  }

  if (email?.trim()) {
    const [localPart] = email.split("@");
    if (localPart) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  }

  return "there";
}

function formatMetricChange(current: number, previous: number): string {
  if (current === 0 && previous === 0) {
    return "0%";
  }

  if (previous === 0) {
    return current > 0 ? "New" : "0%";
  }

  const delta = ((current - previous) / previous) * 100;
  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta.toFixed(1)}%`;
}

function metricTrend(current: number, previous: number): DashboardMetricTrend {
  if (current === 0 && previous === 0) {
    return "flat";
  }

  if (previous === 0) {
    return current > 0 ? "up" : "flat";
  }

  const ratio = current / previous;
  if (ratio >= 1.05) return "up";
  if (ratio <= 0.95) return "attention";
  return "flat";
}

function buildBackwardSeries(
  values: Array<{ date: string | null; amount: number }>,
  bucketCount: number,
  bucketSizeDays: number
): number[] {
  const now = startOfToday();
  const points = Array.from({ length: bucketCount }, () => 0);

  for (const item of values) {
    if (!item.date) continue;

    const diffMs = now.getTime() - new Date(item.date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) continue;

    const bucketIndex = bucketCount - 1 - Math.floor(diffDays / bucketSizeDays);
    if (bucketIndex < 0 || bucketIndex >= bucketCount) continue;

    points[bucketIndex] += item.amount;
  }

  return points;
}

function buildForwardTaskSeries(tasks: TaskRow[]): number[] {
  const today = startOfToday();
  const points = Array.from({ length: 7 }, () => 0);

  for (const task of tasks) {
    if (!task.due_date || DONE_TASK_STATUSES.has(task.status)) continue;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0 || diffDays > 6) continue;
    points[diffDays] += 1;
  }

  return points;
}

function companyLabel(company: CompanyRow | undefined): string {
  return company?.name ?? "Independent account";
}

function businessHealthSummary(
  companies: CompanyRow[],
  deals: DealRow[],
  activities: ExecutiveDashboardSnapshot["activities"]
): {
  averageScore: number | null;
  healthyAccounts: number;
  atRiskAccounts: number;
} {
  if (companies.length === 0) {
    return {
      averageScore: null,
      healthyAccounts: 0,
      atRiskAccounts: 0,
    };
  }

  const activityByCompany = new Map<string, number>();
  const openDealsByCompany = new Map<string, DealRow[]>();

  for (const activity of activities) {
    if (!activity.company_id) continue;
    activityByCompany.set(
      activity.company_id,
      (activityByCompany.get(activity.company_id) ?? 0) + 1
    );
  }

  for (const deal of deals) {
    if (!deal.company_id || !OPEN_DEAL_STAGES.has(deal.stage)) continue;
    const current = openDealsByCompany.get(deal.company_id) ?? [];
    current.push(deal);
    openDealsByCompany.set(deal.company_id, current);
  }

  const scores = companies.map((company) => {
    const companyDeals = openDealsByCompany.get(company.id) ?? [];
    const companyActivities = activityByCompany.get(company.id) ?? 0;
    const probabilityAverage =
      companyDeals.length > 0
        ? companyDeals.reduce((total, deal) => total + Number(deal.probability ?? 0), 0) /
          companyDeals.length
        : 0;
    const score = clamp(
      Math.round(
        52 +
          Math.min(companyActivities * 8, 16) +
          Math.min(companyDeals.length * 6, 18) +
          probabilityAverage * 0.18
      ),
      38,
      95
    );

    return score;
  });

  return {
    averageScore: scores.length > 0 ? Math.round(sum(scores) / scores.length) : null,
    healthyAccounts: scores.filter((score) => score >= 75).length,
    atRiskAccounts: scores.filter((score) => score < 60).length,
  };
}

function buildDealsByStage(deals: DealRow[]): DashboardStageSummary[] {
  return dashboardStageDefinitions.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage.value);

    return {
      stage: stage.value,
      label: stage.label,
      count: stageDeals.length,
      value: sum(stageDeals.map((deal) => deal.value)),
    };
  });
}

function buildActivities(snapshot: ExecutiveDashboardSnapshot): DashboardActivityItem[] {
  return snapshot.activities.slice(0, 4).map((activity) => ({
    title: activity.title,
    detail: activity.body ?? "Workspace activity recorded.",
    timestamp: formatRelativeTime(activity.occurred_at),
    category: formatTitleCase(activity.type),
    actor: activity.created_by ? "Workspace team" : "System",
  }));
}

function formatMeetingTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildMeetings(snapshot: ExecutiveDashboardSnapshot): DashboardMeetingItem[] {
  return snapshot.meetings.slice(0, 3).map((meeting) => ({
    title: meeting.title,
    time: formatMeetingTime(meeting.start_at),
    attendees:
      meeting.attendees.length > 0
        ? `${meeting.attendees.length} attendee${meeting.attendees.length === 1 ? "" : "s"}`
        : "Leadership team",
    location: meeting.location ?? (meeting.all_day ? "All-day event" : "Workspace calendar"),
  }));
}

function buildDocuments(
  snapshot: ExecutiveDashboardSnapshot,
  currentUserProfile: ProfileRow | null
): DashboardDocumentItem[] {
  return snapshot.documents.slice(0, 3).map((document) => ({
    name: document.title,
    category: formatTitleCase(document.content_type),
    updatedAt: `Updated ${formatRelativeTime(document.updated_at)}`,
    owner: document.created_by === currentUserProfile?.id && currentUserProfile?.full_name
      ? currentUserProfile.full_name
      : "Workspace team",
  }));
}

function buildOpportunities(
  deals: DealRow[],
  companies: CompanyRow[]
): DashboardOpportunityItem[] {
  const companiesMap = new Map(companies.map((company) => [company.id, company]));

  return deals
    .filter((deal) => OPEN_DEAL_STAGES.has(deal.stage))
    .sort((left, right) => {
      const leftScore = Number(left.probability ?? 0) * 1000 + Number(left.value ?? 0);
      const rightScore = Number(right.probability ?? 0) * 1000 + Number(right.value ?? 0);
      return rightScore - leftScore;
    })
    .slice(0, 3)
    .map((deal) => ({
      name: deal.title,
      company: companyLabel(companiesMap.get(deal.company_id ?? "")),
      value: formatCurrency(deal.value, deal.currency),
      stage: stageLabel(deal.stage),
      confidence: `${Math.max(35, Number(deal.probability ?? 50))}%`,
    }));
}

function buildPriorities(
  snapshot: ExecutiveDashboardSnapshot,
  unreadNotifications: number
): DashboardPriorityItem[] {
  const today = startOfToday();
  const nextWeek = addDays(today, 7);

  const ranked: RankedPriority[] = [];

  for (const task of snapshot.tasks) {
    if (!task.due_date || DONE_TASK_STATUSES.has(task.status)) continue;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate > nextWeek) continue;

    const overdue = dueDate < today;
    const critical = overdue || task.priority === "critical";
    const tone: DashboardPriorityTone = critical
      ? "critical"
      : task.priority === "high"
        ? "watch"
        : "ready";

    ranked.push({
      title: task.title,
      detail:
        task.description ??
        "This task is approaching its due window and needs executive follow-through.",
      status: overdue ? "Overdue" : "Due soon",
      owner: "Operations",
      dueWindow: formatRelativeTime(task.due_date),
      tone,
      rank: overdue ? 100 : task.priority === "critical" ? 92 : task.priority === "high" ? 84 : 70,
    });
  }

  for (const deal of snapshot.deals) {
    if (!OPEN_DEAL_STAGES.has(deal.stage)) continue;

    const dueSoon =
      deal.expected_close_date !== null &&
      new Date(deal.expected_close_date).getTime() <= nextWeek.getTime();

    const probability = Number(deal.probability ?? 0);
    if (!dueSoon && probability < 70) continue;

    ranked.push({
      title: `Advance ${deal.title}`,
      detail:
        deal.notes ??
        "This opportunity is close enough to warrant leadership attention in the current decision window.",
      status: stageLabel(deal.stage),
      owner: "Revenue",
      dueWindow: deal.expected_close_date
        ? formatRelativeTime(deal.expected_close_date)
        : "Next close window",
      tone: dueSoon || probability >= 85 ? "critical" : "watch",
      rank: dueSoon ? 95 : 80 + Math.round(probability / 5),
    });
  }

  for (const project of snapshot.projects) {
    if (project.completed_at) continue;

    const dueSoon =
      project.due_date !== null &&
      new Date(project.due_date).getTime() <= nextWeek.getTime();
    const atRisk = PROJECT_RISK_STATUSES.has(project.status) || dueSoon;
    if (!atRisk) continue;

    ranked.push({
      title: `Stabilize ${project.name}`,
      detail:
        project.description ??
        "This project has entered a risk window and should be reviewed before it impacts execution confidence.",
      status: PROJECT_RISK_STATUSES.has(project.status) ? "On hold" : "At risk",
      owner: "Projects",
      dueWindow: project.due_date ? formatRelativeTime(project.due_date) : "Needs review",
      tone: PROJECT_RISK_STATUSES.has(project.status) ? "critical" : "watch",
      rank: PROJECT_RISK_STATUSES.has(project.status) ? 94 : 78,
    });
  }

  if (unreadNotifications > 0) {
    ranked.push({
      title: "Review unread notifications",
      detail:
        unreadNotifications === 1
          ? "One unread system notification still needs review."
          : `${unreadNotifications} unread system notifications still need review.`,
      status: `${unreadNotifications} unread`,
      owner: "Inbox",
      dueWindow: "Today",
      tone: unreadNotifications >= 5 ? "watch" : "ready",
      rank: unreadNotifications >= 5 ? 76 : 64,
    });
  }

  return ranked
    .sort((left, right) => right.rank - left.rank)
    .slice(0, 3)
    .map((priority) => ({
      title: priority.title,
      detail: priority.detail,
      status: priority.status,
      owner: priority.owner,
      dueWindow: priority.dueWindow,
      tone: priority.tone,
    }));
}

function buildMetrics(
  snapshot: ExecutiveDashboardSnapshot,
  dealsByStage: DashboardStageSummary[],
  unreadNotifications: number
): DashboardMetric[] {
  const today = startOfToday();
  const revenueWindowStart = addDays(today, -90);
  const previousRevenueWindowStart = addDays(today, -180);
  const cashWindowStart = addDays(today, -30);
  const previousCashWindowStart = addDays(today, -60);

  const closedWonDeals = snapshot.deals.filter((deal) => deal.stage === CLOSED_WON_STAGE);
  const openDeals = snapshot.deals.filter((deal) => OPEN_DEAL_STAGES.has(deal.stage));
  const tasksDueToday = snapshot.tasks.filter(
    (task) =>
      task.due_date &&
      !DONE_TASK_STATUSES.has(task.status) &&
      new Date(task.due_date).getTime() >= today.getTime() &&
      new Date(task.due_date).getTime() <= endOfToday().getTime()
  );
  const overdueTasks = snapshot.tasks.filter(
    (task) =>
      task.due_date &&
      !DONE_TASK_STATUSES.has(task.status) &&
      new Date(task.due_date).getTime() < today.getTime()
  );

  const revenueCurrent = sum(
    closedWonDeals
      .filter(
        (deal) =>
          deal.closed_at !== null &&
          new Date(deal.closed_at).getTime() >= revenueWindowStart.getTime()
      )
      .map((deal) => deal.value)
  );
  const revenuePrevious = sum(
    closedWonDeals
      .filter((deal) => {
        if (!deal.closed_at) return false;
        const closedAt = new Date(deal.closed_at).getTime();
        return (
          closedAt >= previousRevenueWindowStart.getTime() &&
          closedAt < revenueWindowStart.getTime()
        );
      })
      .map((deal) => deal.value)
  );

  const cashCurrent = sum(
    closedWonDeals
      .filter(
        (deal) =>
          deal.closed_at !== null &&
          new Date(deal.closed_at).getTime() >= cashWindowStart.getTime()
      )
      .map((deal) => deal.value)
  );
  const cashPrevious = sum(
    closedWonDeals
      .filter((deal) => {
        if (!deal.closed_at) return false;
        const closedAt = new Date(deal.closed_at).getTime();
        return (
          closedAt >= previousCashWindowStart.getTime() &&
          closedAt < cashWindowStart.getTime()
        );
      })
      .map((deal) => deal.value)
  );

  const proposalAndNegotiationValue = sum(
    openDeals
      .filter((deal) => deal.stage === "proposal" || deal.stage === "negotiation")
      .map((deal) => deal.value)
  );

  const highestStage = dealsByStage
    .filter((stage) => OPEN_DEAL_STAGES.has(stage.stage))
    .sort((left, right) => right.value - left.value)[0];

  return [
    {
      label: "Revenue",
      value: formatCompactCurrency(revenueCurrent, "USD"),
      change: formatMetricChange(revenueCurrent, revenuePrevious),
      comparison: "trailing 90 days",
      detail:
        revenueCurrent > 0
          ? `Closed-won revenue is being led by ${closedWonDeals.length} successfully converted deals in the current rolling quarter.`
          : "Closed-won revenue will populate here as deals move into the won stage.",
      trend: metricTrend(revenueCurrent, revenuePrevious),
      sparkline: buildBackwardSeries(
        closedWonDeals.map((deal) => ({
          date: deal.closed_at,
          amount: Number(deal.value ?? 0),
        })),
        7,
        14
      ),
    },
    {
      label: "Pipeline",
      value: formatCompactCurrency(sum(openDeals.map((deal) => deal.value)), "USD"),
      change: `${openDeals.length} open`,
      comparison: "weighted open pipeline",
      detail:
        highestStage && highestStage.value > 0
          ? `${highestStage.label} is the strongest concentration of pipeline value, with ${formatCompactCurrency(highestStage.value, "USD")} currently active.`
          : "Open deals and stage distribution will appear here once opportunities exist in the workspace.",
      trend:
        proposalAndNegotiationValue > 0
          ? "up"
          : openDeals.length > 0
            ? "flat"
            : "attention",
      sparkline: buildBackwardSeries(
        openDeals.map((deal) => ({
          date: deal.updated_at,
          amount: Number(deal.value ?? 0),
        })),
        7,
        7
      ),
    },
    {
      label: "Tasks Due",
      value: `${tasksDueToday.length}`,
      change: overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "On track",
      comparison: "due today",
      detail:
        tasksDueToday.length > 0 || overdueTasks.length > 0
          ? `${tasksDueToday.length} task${tasksDueToday.length === 1 ? "" : "s"} due today, with ${overdueTasks.length} older item${overdueTasks.length === 1 ? "" : "s"} still open.`
          : "No active due-today workload is currently scheduled in the workspace.",
      trend: overdueTasks.length > 0 ? "attention" : tasksDueToday.length > 0 ? "flat" : "up",
      sparkline: buildForwardTaskSeries(snapshot.tasks),
    },
    {
      label: "Cash Flow",
      value: formatCompactCurrency(cashCurrent, "USD"),
      change: formatMetricChange(cashCurrent, cashPrevious),
      comparison: "30-day inflow proxy",
      detail:
        cashCurrent > 0 || cashPrevious > 0
          ? `Closed-won deal volume implies ${formatCompactCurrency(cashCurrent, "USD")} of recent inflow, with ${unreadNotifications} unread notification${unreadNotifications === 1 ? "" : "s"} still waiting in the operating inbox.`
          : "Recent won deals and collections signals will shape this rolling inflow summary as finance data grows.",
      trend: metricTrend(cashCurrent, cashPrevious),
      sparkline: buildBackwardSeries(
        closedWonDeals.map((deal) => ({
          date: deal.closed_at,
          amount: Number(deal.value ?? 0),
        })),
        7,
        7
      ),
    },
  ];
}

function buildExecutiveBrief(
  params: {
    hasLiveData: boolean;
    metrics: DashboardMetric[];
    priorities: DashboardPriorityItem[];
    openDeals: DealRow[];
    projectsAtRisk: number;
    tasksDueToday: number;
    overdueTasks: number;
    unreadNotifications: number;
    customerHealthScore: number | null;
  }
): DashboardHomeContent["executiveBrief"] {
  if (!params.hasLiveData) {
    return {
      title: "Executive Operating Summary",
      summary:
        "No live workspace data is available yet. As soon as your teams begin tracking revenue, projects, meetings, and activity in Supabase, the executive brief will start generating real operational guidance.",
      confidenceLabel: "Awaiting data",
      healthScore: "—",
      recommendation:
        "Create or sync the first deal, task, meeting, or document so the executive dashboard can begin building a real leadership view.",
      items: [
        {
          label: "Revenue signal",
          detail: "No live revenue data has been captured in this workspace yet.",
        },
        {
          label: "Execution signal",
          detail: "No tasks, projects, or activities are available to evaluate delivery pressure yet.",
        },
        {
          label: "Customer signal",
          detail: "Customer health and opportunity momentum will populate automatically after CRM records exist.",
        },
      ],
      risks: [
        {
          title: "No tracked operating data",
          detail:
            "Leadership visibility is limited until the workspace begins recording deals, tasks, and activity.",
          tone: "watch",
        },
      ],
      actions: [
        {
          title: "Create the first operating records",
          detail:
            "Start with a deal, task, or calendar event so the executive metrics engine has live workspace signals to process.",
        },
      ],
    };
  }

  const healthBase = params.customerHealthScore ?? 74;
  const healthScore = clamp(
    Math.round(
      healthBase -
        params.projectsAtRisk * 5 -
        params.overdueTasks * 3 -
        Math.min(params.unreadNotifications, 6) +
        Math.min(params.openDeals.length * 2, 10)
    ),
    38,
    97
  );

  const primaryPriority = params.priorities[0];
  const confidenceLabel =
    params.openDeals.length + params.tasksDueToday + params.projectsAtRisk >= 6
      ? "High confidence"
      : "Moderate confidence";
  const risks = params.priorities
    .filter((priority) => priority.tone !== "ready")
    .slice(0, 2)
    .map((priority) => ({
      title: priority.title,
      detail: priority.detail,
      tone: priority.tone,
    }));
  const actions = params.priorities.slice(0, 3).map((priority) => ({
    title: priority.title,
    detail: `${priority.owner} · ${priority.dueWindow}`,
  }));

  return {
    title: "Executive Operating Summary",
    summary: `Pipeline currently holds ${params.metrics[1]?.value ?? "—"} in active opportunities, ${params.tasksDueToday} tasks are due today, and ${params.projectsAtRisk} project${params.projectsAtRisk === 1 ? "" : "s"} require extra scrutiny.`,
    confidenceLabel,
    healthScore: String(healthScore),
    recommendation:
      primaryPriority?.detail ??
      "Review the strongest revenue and execution signals first, then resolve any overdue follow-through before the end of the day.",
    items: [
      {
        label: "Revenue signal",
        detail:
          params.openDeals.length > 0
            ? `${params.openDeals.length} open deal${params.openDeals.length === 1 ? "" : "s"} are shaping the near-term commercial picture, with live stage distribution feeding the pipeline summary.`
            : "No open deals are active yet, so the revenue signal remains early-stage.",
      },
      {
        label: "Execution signal",
        detail:
          params.overdueTasks > 0
            ? `${params.overdueTasks} overdue task${params.overdueTasks === 1 ? "" : "s"} and ${params.projectsAtRisk} at-risk project${params.projectsAtRisk === 1 ? "" : "s"} are driving today’s execution pressure.`
            : "Execution pressure is currently contained, with no overdue task load pulling the dashboard into alert mode.",
      },
      {
        label: "Customer signal",
        detail:
          params.customerHealthScore !== null
            ? `Average customer health is ${params.customerHealthScore}/100 across active accounts, with notifications and recent activity feeding the leadership view.`
            : "Customer health will become measurable once more live CRM activity accumulates.",
      },
    ],
    risks:
      risks.length > 0
        ? risks
        : [
            {
              title: "No immediate operating risks detected",
              detail:
                "The current workspace signals do not show any material risk concentration that needs escalation right now.",
              tone: "ready",
            },
          ],
    actions:
      actions.length > 0
        ? actions
        : [
            {
              title: "Keep monitoring new workspace signals",
              detail:
                "As more live deals, tasks, meetings, and activities arrive, the action queue will become more specific.",
            },
          ],
  };
}

export function buildExecutiveDashboardSummary({
  workspace,
  snapshot,
  currentUserProfile,
  currentUserEmail,
}: ExecutiveSummaryParams): ExecutiveDashboard {
  const currentUserName = displayName(currentUserProfile, currentUserEmail);
  const greeting = dashboardPageContent.greetingTemplate.replace("{name}", currentUserName);

  const hasLiveData =
    snapshot.companies.length +
      snapshot.deals.length +
      snapshot.tasks.length +
      snapshot.projects.length +
      snapshot.meetings.length +
      snapshot.activities.length +
      snapshot.documents.length +
      snapshot.notifications.length >
    0;

  const unreadNotifications = snapshot.notifications.filter(
    (notification) => notification.read_at === null
  ).length;
  const dealsByStage = buildDealsByStage(snapshot.deals);
  const tasksDueToday = snapshot.tasks.filter(
    (task) =>
      task.due_date &&
      !DONE_TASK_STATUSES.has(task.status) &&
      new Date(task.due_date).getTime() >= startOfToday().getTime() &&
      new Date(task.due_date).getTime() <= endOfToday().getTime()
  ).length;
  const overdueTasks = snapshot.tasks.filter(
    (task) =>
      task.due_date &&
      !DONE_TASK_STATUSES.has(task.status) &&
      new Date(task.due_date).getTime() < startOfToday().getTime()
  ).length;
  const projectsAtRisk = snapshot.projects.filter((project) => {
    if (project.completed_at) return false;

    const dueSoon =
      project.due_date !== null &&
      new Date(project.due_date).getTime() <= addDays(startOfToday(), 7).getTime();

    return PROJECT_RISK_STATUSES.has(project.status) || dueSoon;
  }).length;
  const customerHealth = businessHealthSummary(
    snapshot.companies,
    snapshot.deals,
    snapshot.activities
  );
  const metrics = buildMetrics(snapshot, dealsByStage, unreadNotifications);
  const priorities = buildPriorities(snapshot, unreadNotifications);
  const executiveBrief = buildExecutiveBrief({
    hasLiveData,
    metrics,
    priorities,
    openDeals: snapshot.deals.filter((deal) => OPEN_DEAL_STAGES.has(deal.stage)),
    projectsAtRisk,
    tasksDueToday,
    overdueTasks,
    unreadNotifications,
    customerHealthScore: customerHealth.averageScore,
  });

  return {
    workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
    hasLiveData,
    title: dashboardPageContent.title,
    description:
      workspace !== null
        ? `${dashboardPageContent.description} Active workspace: ${workspace.name}.`
        : dashboardPageContent.description,
    greeting,
    metrics,
    recentActivity: buildActivities(snapshot),
    upcomingMeetings: buildMeetings(snapshot),
    priorities,
    executiveBrief,
    recentDocuments: buildDocuments(snapshot, currentUserProfile),
    recentOpportunities: buildOpportunities(snapshot.deals, snapshot.companies),
    quickActions: [...dashboardPageContent.quickActions],
    insights: {
      dealsByStage,
      tasksDueToday,
      projectsAtRisk,
      customerHealthScore: customerHealth.averageScore,
      unreadNotifications,
      cashFlowSummary: {
        currentPeriodValue: sum(
          snapshot.deals
            .filter(
              (deal) =>
                deal.stage === CLOSED_WON_STAGE &&
                deal.closed_at !== null &&
                new Date(deal.closed_at).getTime() >= addDays(startOfToday(), -30).getTime()
            )
            .map((deal) => deal.value)
        ),
        previousPeriodValue: sum(
          snapshot.deals
            .filter((deal) => {
              if (deal.stage !== CLOSED_WON_STAGE || !deal.closed_at) return false;
              const closedAt = new Date(deal.closed_at).getTime();
              return (
                closedAt >= addDays(startOfToday(), -60).getTime() &&
                closedAt < addDays(startOfToday(), -30).getTime()
              );
            })
            .map((deal) => deal.value)
        ),
      },
    },
  };
}
