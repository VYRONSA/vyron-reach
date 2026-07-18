import { supabase } from '@/lib/supabase'
import type { PayCompany, PayrollSettings } from './types'

type CompanyRow = {
  id: string
  company_name: string
  registration_number: string | null
  industry_classification: string | null
  contact_email: string | null
  physical_address: string | null
  postal_address: string | null
  currency: string
  invite_code: string | null
  created_at: string
}

type PayrollSettingsRow = {
  company_id: string
  pay_frequency: string
  pay_day: number
  tax_year_start_month: number
  paye_reference: string | null
  uif_reference: string | null
  sdl_reference: string | null
  uif_exempt: boolean
  sdl_exempt: boolean
  updated_at: string
}

function mapCompany(row: CompanyRow): PayCompany {
  return {
    id: row.id,
    companyName: row.company_name,
    registrationNumber: row.registration_number ?? '',
    industryClassification: row.industry_classification ?? '',
    contactEmail: row.contact_email ?? '',
    physicalAddress: row.physical_address ?? '',
    postalAddress: row.postal_address ?? '',
    currency: row.currency,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  }
}

function mapPayrollSettings(row: PayrollSettingsRow): PayrollSettings {
  return {
    companyId: row.company_id,
    payFrequency: row.pay_frequency as PayrollSettings['payFrequency'],
    payDay: row.pay_day,
    taxYearStartMonth: row.tax_year_start_month,
    payeReference: row.paye_reference ?? '',
    uifReference: row.uif_reference ?? '',
    sdlReference: row.sdl_reference ?? '',
    uifExempt: row.uif_exempt,
    sdlExempt: row.sdl_exempt,
    updatedAt: row.updated_at,
  }
}

export async function getCompany(companyId: string): Promise<PayCompany> {
  const { data, error } = await supabase
    .from('vyron_pay_companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) throw new Error(`Could not load company: ${error.message}`)
  return mapCompany(data as CompanyRow)
}

export async function updateCompany(
  companyId: string,
  patch: Partial<Pick<PayCompany,
    | 'companyName'
    | 'registrationNumber'
    | 'industryClassification'
    | 'contactEmail'
    | 'physicalAddress'
    | 'postalAddress'
  >>,
): Promise<void> {
  const row: Record<string, string> = {}
  if (patch.companyName !== undefined) row.company_name = patch.companyName
  if (patch.registrationNumber !== undefined) row.registration_number = patch.registrationNumber
  if (patch.industryClassification !== undefined) row.industry_classification = patch.industryClassification
  if (patch.contactEmail !== undefined) row.contact_email = patch.contactEmail
  if (patch.physicalAddress !== undefined) row.physical_address = patch.physicalAddress
  if (patch.postalAddress !== undefined) row.postal_address = patch.postalAddress

  const { error } = await supabase.from('vyron_pay_companies').update(row).eq('id', companyId)
  if (error) throw new Error(`Could not update company: ${error.message}`)
}

export async function getPayrollSettings(companyId: string): Promise<PayrollSettings> {
  const { data, error } = await supabase
    .from('vyron_pay_payroll_settings')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (error) throw new Error(`Could not load payroll settings: ${error.message}`)
  return mapPayrollSettings(data as PayrollSettingsRow)
}

export async function updatePayrollSettings(
  companyId: string,
  patch: Partial<Pick<PayrollSettings,
    | 'payFrequency'
    | 'payDay'
    | 'taxYearStartMonth'
    | 'payeReference'
    | 'uifReference'
    | 'sdlReference'
    | 'uifExempt'
    | 'sdlExempt'
  >>,
): Promise<void> {
  const row: Record<string, string | number | boolean> = {}
  if (patch.payFrequency !== undefined) row.pay_frequency = patch.payFrequency
  if (patch.payDay !== undefined) row.pay_day = patch.payDay
  if (patch.taxYearStartMonth !== undefined) row.tax_year_start_month = patch.taxYearStartMonth
  if (patch.payeReference !== undefined) row.paye_reference = patch.payeReference
  if (patch.uifReference !== undefined) row.uif_reference = patch.uifReference
  if (patch.sdlReference !== undefined) row.sdl_reference = patch.sdlReference
  if (patch.uifExempt !== undefined) row.uif_exempt = patch.uifExempt
  if (patch.sdlExempt !== undefined) row.sdl_exempt = patch.sdlExempt

  const { error } = await supabase.from('vyron_pay_payroll_settings').update(row).eq('company_id', companyId)
  if (error) throw new Error(`Could not update payroll settings: ${error.message}`)
}
