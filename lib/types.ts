export type LeadStatus =
  | "New"
  | "Hot"
  | "Warm"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export type CampaignStatus = "Live" | "Scheduled" | "Paused" | "Completed";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Due" | "Done";
export type ContentStatus = "Draft" | "Scheduled" | "Approved" | "Published" | "Archived";
export type UserRole = "Owner" | "Marketing Manager" | "Sales User" | "Viewer";
export type StorageMode = "demo" | "live";
export type ConnectionStatus = "Demo Mode" | "Live Ready" | "Live Connected" | "Live Error";

export type Workspace = {
  id: number;
  companyName: string;
  productName: string;
  currency: string;
  roiTarget: number;
  industry: string;
  contactEmail: string;
  status: "Demo" | "V1 Ready" | "Backend Ready" | "Market Ready";
  onboardingComplete: boolean;
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Invited" | "Disabled";
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type PermissionKey =
  | "manageWorkspace"
  | "manageUsers"
  | "manageCampaigns"
  | "manageLeads"
  | "manageTasks"
  | "manageContent"
  | "exportReports"
  | "viewReports";

export type LeadNote = {
  id: number;
  leadId: number;
  createdAt: string;
  author: string;
  note: string;
};

export type ActivityItem = {
  id: number;
  entityType: "Lead" | "Campaign" | "Task" | "Content" | "System" | "User" | "Workspace";
  entityId: number;
  title: string;
  description: string;
  createdAt: string;
};

export type Lead = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  priority: TaskPriority;
  source: string;
  campaign: string;
  value: number;
  followUp: string;
  lastContact: string;
  assignedTo: string;
  notes: string;
};

export type Campaign = {
  id: number;
  name: string;
  channel: string;
  status: CampaignStatus;
  budget: number;
  leads: number;
  revenue: number;
};

export type Task = {
  id: number;
  title: string;
  type: string;
  due: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type ContentItem = {
  id: number;
  title: string;
  type: string;
  channel: string;
  scheduled: string;
  status: ContentStatus;
};

export type AppData = {
  workspace: Workspace;
  users: AppUser[];
  leads: Lead[];
  campaigns: Campaign[];
  tasks: Task[];
  content: ContentItem[];
  leadNotes: LeadNote[];
  activities: ActivityItem[];
};