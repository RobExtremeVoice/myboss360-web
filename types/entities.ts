export type EntityId = string;
export type ISODateString = string;

export interface User {
  id: EntityId;
  organizationId: EntityId;
  workspaceIds: EntityId[];
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: "active" | "invited" | "suspended";
  avatarUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Organization {
  id: EntityId;
  name: string;
  slug: string;
  industry?: string;
  size?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Workspace {
  id: EntityId;
  organizationId: EntityId;
  name: string;
  slug: string;
  description?: string;
  memberIds: EntityId[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Project {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  description?: string;
  status: "planned" | "active" | "at-risk" | "completed" | "archived";
  ownerId: EntityId;
  dueDate?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Task {
  id: EntityId;
  projectId?: EntityId;
  workspaceId: EntityId;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId?: EntityId;
  dueDate?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Contact {
  id: EntityId;
  workspaceId: EntityId;
  companyId?: EntityId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  ownerId?: EntityId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Company {
  id: EntityId;
  workspaceId: EntityId;
  name: string;
  website?: string;
  industry?: string;
  employeeRange?: string;
  ownerId?: EntityId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Deal {
  id: EntityId;
  workspaceId: EntityId;
  companyId?: EntityId;
  contactId?: EntityId;
  name: string;
  stage: string;
  value: number;
  currency: string;
  ownerId: EntityId;
  expectedCloseDate?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Invoice {
  id: EntityId;
  workspaceId: EntityId;
  companyId?: EntityId;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  amount: number;
  currency: string;
  issueDate: ISODateString;
  dueDate: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CalendarEvent {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  description?: string;
  startAt: ISODateString;
  endAt: ISODateString;
  location?: string;
  attendeeIds: EntityId[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Notification {
  id: EntityId;
  userId: EntityId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  readAt?: ISODateString;
  createdAt: ISODateString;
}
