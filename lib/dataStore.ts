import { defaultAppData } from "./demoData";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { AppData } from "./types";

const LOCAL_KEY = "vyron-reach-app-data-v1";

export function loadLocalData(): AppData {
  if (typeof window === "undefined") return defaultAppData;

  const saved = window.localStorage.getItem(LOCAL_KEY);
  if (!saved) return defaultAppData;

  try {
    return JSON.parse(saved) as AppData;
  } catch {
    return defaultAppData;
  }
}

export function saveLocalData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

export async function getOrCreateCompany(userId: string, email: string) {
  if (!supabase || !isSupabaseConfigured) {
    return { companyId: null, error: "Supabase is not configured." };
  }

  const { data: existingUser } = await supabase
    .from("vyron_reach_company_users")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingUser?.company_id) {
    return { companyId: existingUser.company_id as string, error: null };
  }

  const { data: company, error: companyError } = await supabase
    .from("vyron_reach_companies")
    .insert({
      company_name: "New VYRON REACH Company",
      contact_email: email,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return { companyId: null, error: companyError?.message || "Could not create company." };
  }

  const { error: userError } = await supabase.from("vyron_reach_company_users").insert({
    company_id: company.id,
    user_id: userId,
    email,
    full_name: email,
    role: "Owner",
    status: "Active",
  });

  if (userError) {
    return { companyId: null, error: userError.message };
  }

  return { companyId: company.id as string, error: null };
}

export async function loadCompanyAppData(companyId: string): Promise<AppData> {
  if (!supabase || !isSupabaseConfigured) return loadLocalData();

  const { data, error } = await supabase
    .from("vyron_reach_app_data")
    .select("payload")
    .eq("company_id", companyId)
    .maybeSingle();

  if (!error && data?.payload) {
    return data.payload as AppData;
  }

  await saveCompanyAppData(companyId, defaultAppData);
  return defaultAppData;
}

export async function saveCompanyAppData(companyId: string, data: AppData) {
  saveLocalData(data);

  if (!supabase || !isSupabaseConfigured) return;

  await supabase.from("vyron_reach_app_data").upsert({
    company_id: companyId,
    payload: data,
    updated_at: new Date().toISOString(),
  });
}