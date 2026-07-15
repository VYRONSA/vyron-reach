import type { PermissionKey, UserRole } from "./types";

const rolePermissions: Record<UserRole, PermissionKey[]> = {
  Owner: [
    "manageWorkspace",
    "manageUsers",
    "manageCampaigns",
    "manageLeads",
    "manageTasks",
    "manageContent",
    "exportReports",
    "viewReports",
  ],
  "Marketing Manager": [
    "manageCampaigns",
    "manageLeads",
    "manageTasks",
    "manageContent",
    "exportReports",
    "viewReports",
  ],
  "Sales User": ["manageLeads", "manageTasks", "viewReports"],
  Viewer: ["viewReports"],
};

export function can(role: UserRole, permission: PermissionKey) {
  return rolePermissions[role].includes(permission);
}