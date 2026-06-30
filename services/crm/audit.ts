type CrmAuditAction =
  | "company.created"
  | "company.updated"
  | "company.deleted"
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "deal.created"
  | "deal.updated"
  | "deal.deleted"
  | "deal.stage_updated"
  | "activity.created";

export type CrmAuditEvent = {
  action: CrmAuditAction;
  actorUserId: string;
  workspaceId: string | null;
  entityId: string;
  entityType: "company" | "contact" | "deal" | "activity";
  metadata?: Record<string, unknown>;
};

export async function recordCrmAuditEvent(event: CrmAuditEvent) {
  void event;
  // Reserved for Sprint 12+ audit persistence.
  // This hook intentionally stays side-effect free for now so UI work can ship
  // without locking us into a final audit storage format.
}
