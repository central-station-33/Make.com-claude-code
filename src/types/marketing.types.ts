
export interface MarketingMaterialFormData {
  title: string;
  description: string;
  category: string;
  type: string;
  is_premium: boolean;
  template_url?: string;
  thumbnail_url?: string;
  brand_logo_url?: string;
}

export interface FilterState {
  category: string | null;
  isPremium: boolean;
  search: string;
  sort: 'newest' | 'oldest' | 'popular';
  viewMode: "grid" | "list";
}

export interface MaterialStats {
  downloads: number;
  views: number;
  favorites: number;
}

export interface MarketingMaterial {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  template_url?: string | null;
  thumbnail_url?: string | null;
  brand_logo_url?: string | null;
  is_premium: boolean;
  download_count: number;
  view_count: number;
  search_keywords?: string[];
  created_at?: string;
  updated_at?: string;
}
