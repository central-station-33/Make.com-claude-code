export interface Activity {
  id: string;
  contact_id: string | null;
  type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  priority?: 'high' | 'medium' | 'low';
}