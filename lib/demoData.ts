import type {
  ActivityItem,
  AppData,
  AppUser,
  Campaign,
  ContentItem,
  Lead,
  LeadNote,
  Task,
  Workspace,
} from "./types";

export const defaultWorkspace: Workspace = {
  id: 1,
  companyName: "VYRON Demo Client",
  productName: "VYRON REACH",
  currency: "ZAR",
  roiTarget: 4,
  industry: "Marketing / Growth",
  contactEmail: "owner@vyronreach.local",
  status: "V1 Ready",
  onboardingComplete: false,
};

export const defaultUsers: AppUser[] = [
  { id: 1, name: "Erki", email: "owner@vyronreach.local", role: "Owner", status: "Active" },
  { id: 2, name: "Marketing Manager", email: "marketing@vyronreach.local", role: "Marketing Manager", status: "Active" },
  { id: 3, name: "Sales User", email: "sales@vyronreach.local", role: "Sales User", status: "Invited" },
  { id: 4, name: "Report Viewer", email: "viewer@vyronreach.local", role: "Viewer", status: "Active" },
];

export const defaultCampaigns: Campaign[] = [
  { id: 1, name: "Spring Growth Drive", channel: "Facebook / Instagram", status: "Live", budget: 18500, leads: 142, revenue: 96200 },
  { id: 2, name: "Corporate Lead Push", channel: "LinkedIn", status: "Live", budget: 26000, leads: 64, revenue: 176800 },
  { id: 3, name: "Email Winback", channel: "Email", status: "Scheduled", budget: 3200, leads: 91, revenue: 9920 },
  { id: 4, name: "Low ROI Test Campaign", channel: "Google Search", status: "Paused", budget: 12000, leads: 18, revenue: 9000 },
];

export const defaultLeads: Lead[] = [
  {
    id: 1,
    name: "Michael Jacobs",
    company: "Maverick Foods",
    email: "michael@maverickfoods.co.za",
    phone: "082 555 1001",
    status: "Hot",
    priority: "High",
    source: "LinkedIn",
    campaign: "Corporate Lead Push",
    value: 85000,
    followUp: "Today 14:00",
    lastContact: "Yesterday",
    assignedTo: "Erki",
    notes: "Decision-maker. Wants a proposal and pricing options.",
  },
  {
    id: 2,
    name: "Sandra Meyer",
    company: "Cape Retail Group",
    email: "sandra@caperetail.co.za",
    phone: "083 555 2002",
    status: "Warm",
    priority: "Medium",
    source: "Facebook",
    campaign: "Spring Growth Drive",
    value: 42000,
    followUp: "Tomorrow 10:00",
    lastContact: "Monday",
    assignedTo: "Sales Team",
    notes: "Interested but needs internal approval.",
  },
  {
    id: 3,
    name: "Jason Pillay",
    company: "Urban Fit Studios",
    email: "jason@urbanfit.co.za",
    phone: "084 555 3003",
    status: "New",
    priority: "Low",
    source: "Website",
    campaign: "Spring Growth Drive",
    value: 28000,
    followUp: "",
    lastContact: "",
    assignedTo: "Erki",
    notes: "New website enquiry. No follow-up booked yet.",
  },
  {
    id: 4,
    name: "Natasha Williams",
    company: "Summit Retail Holdings",
    email: "natasha@summitretail.co.za",
    phone: "081 555 9090",
    status: "Proposal Sent",
    priority: "High",
    source: "Referral",
    campaign: "Corporate Lead Push",
    value: 125000,
    followUp: "Overdue - yesterday",
    lastContact: "Last week",
    assignedTo: "Erki",
    notes: "High-value opportunity. Needs urgent follow-up.",
  },
];

export const defaultLeadNotes: LeadNote[] = [
  { id: 1, leadId: 1, createdAt: "Today 09:15", author: "Erki", note: "Client asked for monthly pricing and onboarding plan." },
  { id: 2, leadId: 2, createdAt: "Yesterday 16:20", author: "Sales Team", note: "Waiting for internal sign-off from operations." },
];

export const defaultTasks: Task[] = [
  { id: 1, title: "Call Maverick Foods", type: "Call", due: "Today", priority: "High", status: "Due" },
  { id: 2, title: "Send proposal follow-up to Cape Retail Group", type: "Email", due: "Today 14:00", priority: "High", status: "Due" },
  { id: 3, title: "LinkedIn message to 12 new targets", type: "LinkedIn", due: "Tomorrow", priority: "Medium", status: "Due" },
  { id: 4, title: "Follow up Summit Retail Holdings proposal", type: "Call", due: "Overdue - yesterday", priority: "High", status: "Due" },
];

export const defaultContent: ContentItem[] = [
  { id: 1, title: "Case study post: lower lead cost", type: "Social Post", channel: "LinkedIn", scheduled: "Tomorrow", status: "Scheduled" },
  { id: 2, title: "Email campaign: winback offer", type: "Email", channel: "Mailchimp", scheduled: "Friday", status: "Draft" },
  { id: 3, title: "ROI calculator ad creative", type: "Ad Asset", channel: "Meta Ads", scheduled: "Next week", status: "Approved" },
  { id: 4, title: "Published client result post", type: "Social Post", channel: "LinkedIn", scheduled: "Last week", status: "Published" },
];

export const defaultActivities: ActivityItem[] = [
  { id: 1, entityType: "Lead", entityId: 1, title: "Lead added", description: "Maverick Foods entered the pipeline.", createdAt: "Today 08:30" },
  { id: 2, entityType: "Campaign", entityId: 2, title: "Campaign ROI updated", description: "Corporate Lead Push crossed 6x ROI.", createdAt: "Yesterday 15:10" },
  { id: 3, entityType: "Task", entityId: 4, title: "Overdue task detected", description: "Summit Retail Holdings needs urgent follow-up.", createdAt: "Today 07:45" },
];

export const defaultAppData: AppData = {
  workspace: defaultWorkspace,
  users: defaultUsers,
  leads: defaultLeads,
  campaigns: defaultCampaigns,
  tasks: defaultTasks,
  content: defaultContent,
  leadNotes: defaultLeadNotes,
  activities: defaultActivities,
};