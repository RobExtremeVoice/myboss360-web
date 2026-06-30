import type { SupabaseClient } from "@supabase/supabase-js";

import { createDashboardRepository } from "@/repositories/dashboard/dashboard-repository";
import { createProfilesRepository } from "@/repositories/users";
import { createWorkspacesRepository } from "@/repositories/workspaces";
import type { Database } from "@/types/database";

import { buildExecutiveDashboardSummary } from "./executive-summary-service";

export function createExecutiveMetricsService(db: SupabaseClient<Database>) {
  const dashboardRepository = createDashboardRepository(db);
  const profilesRepository = createProfilesRepository(db);
  const workspacesRepository = createWorkspacesRepository(db);

  async function resolveWorkspace(userId: string, preferredWorkspaceId?: string) {
    const workspaces = await workspacesRepository.listForUser(userId);
    if (workspaces.length === 0) {
      return null;
    }

    if (preferredWorkspaceId) {
      return workspaces.find((workspace) => workspace.id === preferredWorkspaceId) ?? workspaces[0];
    }

    return workspaces[0];
  }

  return {
    async getExecutiveDashboard(params: {
      userId: string;
      userEmail?: string | null;
      workspaceId?: string;
    }) {
      const workspace = await resolveWorkspace(params.userId, params.workspaceId);
      const currentUserProfile = await profilesRepository.findById(params.userId);

      if (!workspace) {
        return buildExecutiveDashboardSummary({
          workspace: null,
          snapshot: {
            companies: [],
            deals: [],
            tasks: [],
            projects: [],
            meetings: [],
            activities: [],
            documents: [],
            notifications: [],
          },
          currentUserProfile,
          currentUserEmail: params.userEmail,
        });
      }

      const snapshot = await dashboardRepository.getExecutiveSnapshot(
        workspace.id,
        params.userId
      );

      return buildExecutiveDashboardSummary({
        workspace,
        snapshot,
        currentUserProfile,
        currentUserEmail: params.userEmail,
      });
    },
  };
}

export type ExecutiveMetricsService = ReturnType<typeof createExecutiveMetricsService>;
