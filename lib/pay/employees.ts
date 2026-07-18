import { supabase } from '@/lib/supabase'
import type { EmploymentStatus, EmploymentType, PayEmployee } from './types'

type EmployeeRow = {
  id: string
  company_id: string
  employee_number: string | null
  first_name: string
  last_name: string
  id_number: string | null
  passport_number: string | null
  date_of_birth: string | null
  gender: string | null
  employment_type: string
  job_title: string | null
  department: string | null
  start_date: string | null
  termination_date: string | null
  employment_status: string
  tax_number: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_type: string | null
  created_at: string
  updated_at: string
}

function mapEmployee(row: EmployeeRow): PayEmployee {
  return {
    id: row.id,
    companyId: row.company_id,
    employeeNumber: row.employee_number ?? '',
    firstName: row.first_name,
    lastName: row.last_name,
    idNumber: row.id_number ?? '',
    passportNumber: row.passport_number ?? '',
    dateOfBirth: row.date_of_birth,
    gender: row.gender ?? '',
    employmentType: row.employment_type as EmploymentType,
    jobTitle: row.job_title ?? '',
    department: row.department ?? '',
    startDate: row.start_date,
    terminationDate: row.termination_date,
    employmentStatus: row.employment_status as EmploymentStatus,
    taxNumber: row.tax_number ?? '',
    bankName: row.bank_name ?? '',
    bankAccountNumber: row.bank_account_number ?? '',
    bankAccountType: row.bank_account_type ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type EmployeeInput = Omit<PayEmployee, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>

function toRow(input: Partial<EmployeeInput>): Record<string, string | null> {
  const row: Record<string, string | null> = {}
  if (input.employeeNumber !== undefined) row.employee_number = input.employeeNumber
  if (input.firstName !== undefined) row.first_name = input.firstName
  if (input.lastName !== undefined) row.last_name = input.lastName
  if (input.idNumber !== undefined) row.id_number = input.idNumber
  if (input.passportNumber !== undefined) row.passport_number = input.passportNumber
  if (input.dateOfBirth !== undefined) row.date_of_birth = input.dateOfBirth
  if (input.gender !== undefined) row.gender = input.gender
  if (input.employmentType !== undefined) row.employment_type = input.employmentType
  if (input.jobTitle !== undefined) row.job_title = input.jobTitle
  if (input.department !== undefined) row.department = input.department
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.terminationDate !== undefined) row.termination_date = input.terminationDate
  if (input.employmentStatus !== undefined) row.employment_status = input.employmentStatus
  if (input.taxNumber !== undefined) row.tax_number = input.taxNumber
  if (input.bankName !== undefined) row.bank_name = input.bankName
  if (input.bankAccountNumber !== undefined) row.bank_account_number = input.bankAccountNumber
  if (input.bankAccountType !== undefined) row.bank_account_type = input.bankAccountType
  return row
}

export async function listEmployees(companyId: string): Promise<PayEmployee[]> {
  const { data, error } = await supabase
    .from('vyron_pay_employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load employees: ${error.message}`)
  return (data as EmployeeRow[]).map(mapEmployee)
}

export async function createEmployee(companyId: string, input: EmployeeInput): Promise<PayEmployee> {
  const { data, error } = await supabase
    .from('vyron_pay_employees')
    .insert({ company_id: companyId, ...toRow(input) })
    .select('*')
    .single()

  if (error) throw new Error(`Could not create employee: ${error.message}`)
  return mapEmployee(data as EmployeeRow)
}

export async function updateEmployee(id: string, patch: Partial<EmployeeInput>): Promise<void> {
  const { error } = await supabase
    .from('vyron_pay_employees')
    .update(toRow(patch))
    .eq('id', id)

  if (error) throw new Error(`Could not update employee: ${error.message}`)
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('vyron_pay_employees').delete().eq('id', id)
  if (error) throw new Error(`Could not delete employee: ${error.message}`)
}
