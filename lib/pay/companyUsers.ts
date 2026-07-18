import { supabase } from '@/lib/supabase'
import type { PayCompanyUser, PayUserRole } from './types'

type CompanyUserRow = {
  id: string
  company_id: string
  user_id: string
  email: string
  full_name: string | null
  role: string
  status: string
  created_at: string
}

function mapCompanyUser(row: CompanyUserRow): PayCompanyUser {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role as PayUserRole,
    status: row.status as PayCompanyUser['status'],
    createdAt: row.created_at,
  }
}

export async function listCompanyUsers(companyId: string): Promise<PayCompanyUser[]> {
  const { data, error } = await supabase
    .from('vyron_pay_company_users')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Could not load workspace members: ${error.message}`)
  return (data as CompanyUserRow[]).map(mapCompanyUser)
}

export async function updateCompanyUserRole(id: string, role: PayUserRole): Promise<void> {
  const { error } = await supabase.from('vyron_pay_company_users').update({ role }).eq('id', id)
  if (error) throw new Error(`Could not update member role: ${error.message}`)
}

export async function removeCompanyUser(id: string): Promise<void> {
  const { error } = await supabase.from('vyron_pay_company_users').delete().eq('id', id)
  if (error) throw new Error(`Could not remove member: ${error.message}`)
}
