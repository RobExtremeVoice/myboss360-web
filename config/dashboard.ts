export type {
  DashboardActivityItem,
  DashboardBriefAction,
  DashboardBriefItem,
  DashboardBriefRisk,
  DashboardDocumentItem,
  DashboardHomeContent,
  DashboardMeetingItem,
  DashboardMetric,
  DashboardMetricTrend,
  DashboardOpportunityItem,
  DashboardPriorityItem,
  DashboardPriorityTone,
  DashboardQuickAction,
  DashboardShellStatus,
  ExecutiveDashboard,
} from "./dashboard-metrics";

export const dashboardShellContent = {
  workspaceName: "MyBoss360 HQ",
  workspaceStatus: {
    label: "Workspace status",
    value: "Stable",
  },
  aiStatus: {
    label: "AI",
    value: "Online",
  },
  primaryActionLabel: "New",
};
