import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type DealRow = Database["public"]["Tables"]["deals"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type ExecutiveDashboardSnapshot = {
  companies: CompanyRow[];
  deals: DealRow[];
  tasks: TaskRow[];
  projects: ProjectRow[];
  meetings: CalendarEventRow[];
  activities: ActivityRow[];
  documents: DocumentRow[];
  notifications: NotificationRow[];
};

export function createDashboardRepository(db: SupabaseClient<Database>) {
  return {
    async getExecutiveSnapshot(
      workspaceId: string,
      userId: string
    ): Promise<ExecutiveDashboardSnapshot> {
      const nowIso = new Date().toISOString();

      const [
        { data: companies, error: companiesError },
        { data: deals, error: dealsError },
        { data: tasks, error: tasksError },
        { data: projects, error: projectsError },
        { data: meetings, error: meetingsError },
        { data: activities, error: activitiesError },
        { data: documents, error: documentsError },
        { data: notifications, error: notificationsError },
      ] = await Promise.all([
        db
          .from("companies")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .order("name"),
        db
          .from("deals")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false }),
        db
          .from("tasks")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .order("due_date", { ascending: true, nullsFirst: false }),
        db
          .from("projects")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .order("due_date", { ascending: true, nullsFirst: false }),
        db
          .from("calendar_events")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .gte("start_at", nowIso)
          .order("start_at", { ascending: true })
          .limit(6),
        db
          .from("activities")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("occurred_at", { ascending: false })
          .limit(12),
        db
          .from("documents")
          .select("*")
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null)
          .eq("is_folder", false)
          .order("updated_at", { ascending: false })
          .limit(6),
        db
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

      if (companiesError) throw companiesError;
      if (dealsError) throw dealsError;
      if (tasksError) throw tasksError;
      if (projectsError) throw projectsError;
      if (meetingsError) throw meetingsError;
      if (activitiesError) throw activitiesError;
      if (documentsError) throw documentsError;
      if (notificationsError) throw notificationsError;

      return {
        companies: companies ?? [],
        deals: deals ?? [],
        tasks: tasks ?? [],
        projects: projects ?? [],
        meetings: meetings ?? [],
        activities: activities ?? [],
        documents: documents ?? [],
        notifications: notifications ?? [],
      };
    },
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
