import { BaseEntity } from './base';

export interface MarketingTables {
  marketing_materials: {
    Row: MarketingMaterialRow;
    Insert: MarketingMaterialInsert;
    Update: MarketingMaterialUpdate;
  };
  marketing_templates: {
    Row: MarketingTemplateRow;
    Insert: MarketingTemplateInsert;
    Update: MarketingTemplateUpdate;
  };
}

export interface MarketingMaterialRow extends BaseEntity {
  title: string;
  description: string | null;
  type: string;
  category: string;
  template_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  download_count: number;
  view_count: number;
  search_keywords: string[] | null;
}

export type MarketingMaterialInsert = Partial<MarketingMaterialRow>;
export type MarketingMaterialUpdate = Partial<MarketingMaterialRow>;

export interface MarketingTemplateRow extends BaseEntity {
  title: string;
  description: string | null;
  content: string;
  category: string;
  tags: string[] | null;
  is_customizable: boolean;
  is_premium: boolean;
}

export type MarketingTemplateInsert = Partial<MarketingTemplateRow>;
export type MarketingTemplateUpdate = Partial<MarketingTemplateRow>;