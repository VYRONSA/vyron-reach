import type { PayPermissionKey, PayUserRole } from './types'

const rolePermissions: Record<PayUserRole, PayPermissionKey[]> = {
  Owner: [
    'manageWorkspace',
    'manageUsers',
    'manageCompanySettings',
    'managePayrollSettings',
    'manageEmployees',
    'viewEmployees',
  ],
  Administrator: ['manageCompanySettings', 'managePayrollSettings', 'manageEmployees', 'viewEmployees'],
  Viewer: ['viewEmployees'],
}

export function can(role: PayUserRole, permission: PayPermissionKey) {
  return rolePermissions[role].includes(permission)
}
