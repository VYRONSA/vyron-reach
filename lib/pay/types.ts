export type PayUserRole = 'Owner' | 'Administrator' | 'Viewer'

export type PayPermissionKey =
  | 'manageWorkspace'
  | 'manageUsers'
  | 'manageCompanySettings'
  | 'managePayrollSettings'
  | 'manageEmployees'
  | 'viewEmployees'

export type PayFrequency = 'Monthly' | 'Weekly' | 'Bi-Weekly'

export type EmploymentType = 'Permanent' | 'Fixed-Term' | 'Temporary' | 'Contractor'

export type EmploymentStatus = 'Active' | 'Inactive' | 'Terminated'

export type PayCompany = {
  id: string
  companyName: string
  registrationNumber: string
  industryClassification: string
  contactEmail: string
  physicalAddress: string
  postalAddress: string
  currency: string
  inviteCode: string | null
  createdAt: string
}

export type PayCompanyUser = {
  id: string
  companyId: string
  userId: string
  email: string
  fullName: string | null
  role: PayUserRole
  status: 'Active' | 'Invited' | 'Disabled'
  createdAt: string
}

export type PayrollSettings = {
  companyId: string
  payFrequency: PayFrequency
  payDay: number
  taxYearStartMonth: number
  payeReference: string
  uifReference: string
  sdlReference: string
  uifExempt: boolean
  sdlExempt: boolean
  updatedAt: string
}

export type PayEmployee = {
  id: string
  companyId: string
  employeeNumber: string
  firstName: string
  lastName: string
  idNumber: string
  passportNumber: string
  dateOfBirth: string | null
  gender: string
  employmentType: EmploymentType
  jobTitle: string
  department: string
  startDate: string | null
  terminationDate: string | null
  employmentStatus: EmploymentStatus
  taxNumber: string
  bankName: string
  bankAccountNumber: string
  bankAccountType: string
  createdAt: string
  updatedAt: string
}
