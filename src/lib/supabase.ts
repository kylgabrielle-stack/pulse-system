import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://quyfcicpaqhzdnszpwts.supabase.co",
  "sb_publishable_w9WqQoZGMnswVJGdsfwUIg_mo1ZdMuh"
);

// ── Row types from DB ─────────────────────────────────────────────────────────

export interface DbReport {
  id: string;
  type: string;
  code: string | null;
  date_conducted: string | null;
  session: string | null;
  conduct_subtype: string | null;
  municipality: string | null;
  barangay: string | null;
  district: string | null;
  venue: string | null;
  target: number | null;
  actual: number | null;
  male: number | null;
  female: number | null;
  bracket_1: number | null;
  bracket_2: number | null;
  bracket_3: number | null;
  documented_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  date_documented: string | null;
  report_month: string | null;
  report_year: string | null;
  num_speakers: string | null;
  speakers: unknown;
  activities: unknown;
  persons_responsible: unknown;
  remarks: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRoster {
  id: string;
  parent_report_id: string | null;
  class_no: string | null;
  municipality: string | null;
  barangay: string | null;
  date_conduct: string | null;
  activity_type: string | null;
  data_collection_method: string | null;
  data_collection_other: string | null;
  prepared_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  created_by: string | null;
  created_at: string;
  rpfp_form1_participants?: DbParticipant[];
}

export interface DbParticipant {
  id: string;
  roster_id: string;
  row_number: number | null;
  name: string | null;
  sex: string | null;
  civil_status: string | null;
  birthdate: string | null;
  address_household_id: string | null;
  educational_attainment: string | null;
  no_of_children: string | null;
  method_used: string | null;
  intention_to_shift: boolean | null;
  traditional_fp_type: string | null;
  traditional_fp_status: string | null;
  reason_for_using_fp: string | null;
  signature_data: string | null;
  is_partner_row: boolean;
  parent_participant_id: string | null;
  created_at: string;
}

export interface DbUser {
  id: string;
  full_name: string | null;
  office: string | null;
}

// ── Seed municipalities (runs once if table is empty) ─────────────────────────

export async function seedMunicipalitiesIfEmpty(
  data: Record<string, { type: string; district: string; barangays: string[] }>
) {
  const { count } = await supabase
    .from("municipalities")
    .select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  const rows: { name: string; type: string; district: string; barangay: string }[] = [];
  for (const [name, info] of Object.entries(data)) {
    for (const barangay of info.barangays) {
      rows.push({ name, type: info.type, district: info.district, barangay });
    }
  }
  for (let i = 0; i < rows.length; i += 500) {
    await supabase.from("municipalities").insert(rows.slice(i, i + 500));
  }
}

// ── Ensure user profile exists ────────────────────────────────────────────────

export async function ensureUserProfile(uid: string, email: string): Promise<DbUser> {
  const { data } = await supabase.from("users").select("*").eq("id", uid).single();
  if (!data) {
    const newProfile: DbUser = {
      id: uid,
      full_name: email.split("@")[0],
      office: "Office of the Provincial Population Officer, Province of Cavite",
    };
    await supabase.from("users").insert(newProfile);
    return newProfile;
  }
  return data as DbUser;
}
