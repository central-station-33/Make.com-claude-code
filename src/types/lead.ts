
import type { Profile } from './profiles.types';
import { CRMContact } from './crm.types';

export enum LeadType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  INVESTOR = 'INVESTOR',
  CONTRACTOR = 'CONTRACTOR'
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  NEGOTIATING = 'Negotiating',
  CLOSED = 'Closed',
  LOST = 'Lost'
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  type: LeadType;
  status: LeadStatus;
  property_type: string | null;
  budget: number | null;
  location: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  agent_id: string | null;
  follow_up_date: string | null;
  last_contact_date: string | null;
  source: string | null;
  source_details: Record<string, any> | null;
  email_source: string | null;
  email_metadata: Record<string, any> | null;
  source_referral_fee: number | null;
  source_referral_notes: string | null;
  team_id: string | null;
  distribution_status: string;
  distribution_date: string | null;
  import_id: string | null;
  import_row_number: number | null;
  import_errors: string[] | null;
}

export interface LeadWithProfile extends Lead {
  profiles: Profile | null;
  crm_contacts?: CRMContact[];
  lead_imports?: {
    filename: string;
    file_path: string;
    status: string;
  };
}

export interface LeadsQueryResult {
  leads: LeadWithProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  type: LeadType;
}

export interface LeadFormFieldsProps {
  register: any; // Replace with proper type from react-hook-form
  errors: any; // Replace with proper type from react-hook-form
  email?: string;
  phone?: string;
}

export interface LeadImportHookReturn {
  loading: boolean;
  progress?: number;
  handleFileUpload: (file: File) => Promise<void>;
}

export interface ImportFileInputProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
}

export interface LeadImportSectionProps {
  onSuccess: () => void;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  template_id: string | null;
  scheduled_for: string;
  completed_at: string | null;
  notes: string | null;
  status: string;
  template?: {
    name: string;
    description: string | null;
  };
}
