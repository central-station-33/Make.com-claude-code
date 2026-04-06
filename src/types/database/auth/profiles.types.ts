import { Database } from "@/integrations/supabase/types";

export type ProfilesTable = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface Profile extends ProfilesTable {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  license_number: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}