import { Database } from '../database.types';

export interface TaskWithContact {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  contactName?: string | null;
}

export type CRMActivitiesTable = {
  Row: Database['public']['Tables']['crm_activities']['Row'];
  Insert: Database['public']['Tables']['crm_activities']['Insert'];
  Update: Database['public']['Tables']['crm_activities']['Update'];
}

export type CRMContactsTable = {
  Row: Database['public']['Tables']['crm_contacts']['Row'];
  Insert: Database['public']['Tables']['crm_contacts']['Insert'];
  Update: Database['public']['Tables']['crm_contacts']['Update'];
}