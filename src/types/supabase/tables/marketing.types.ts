import { Json } from '../base.types';

export interface MarketingMaterialRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  template_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  download_count: number | null;
  view_count: number | null;
  search_keywords: string[] | null;
}

export interface MarketingTemplateRow {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: string;
  tags: string[] | null;
  is_customizable: boolean | null;
  is_premium: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MaterialDownloadRow {
  id: string;
  user_id: string | null;
  material_id: string | null;
  downloaded_at: string | null;
}

export interface MaterialFavoriteRow {
  id: string;
  user_id: string | null;
  material_id: string | null;
  created_at: string | null;
}

export interface MarketingTables {
  marketing_materials: {
    Row: MarketingMaterialRow;
    Insert: Omit<MarketingMaterialRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<MarketingMaterialRow, 'id'>>;
  };
  marketing_templates: {
    Row: MarketingTemplateRow;
    Insert: Omit<MarketingTemplateRow, 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<MarketingTemplateRow, 'id'>>;
  };
  material_downloads: {
    Row: MaterialDownloadRow;
    Insert: Omit<MaterialDownloadRow, 'id'>;
    Update: Partial<Omit<MaterialDownloadRow, 'id'>>;
  };
  material_favorites: {
    Row: MaterialFavoriteRow;
    Insert: Omit<MaterialFavoriteRow, 'id' | 'created_at'>;
    Update: Partial<Omit<MaterialFavoriteRow, 'id'>>;
  };
}