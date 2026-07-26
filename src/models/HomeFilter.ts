// SDUI Home filter screen types (subset used by web)
// Source: GET /api/v1/screen/home  → { data: { sections: [{ type: "HOME_FILTER", bars: [...] }] } }

export interface SDBorder {
  color?: string;
  width?: number;
}

export interface SDSurfaceStyle {
  backgroundColor?: string;
  border?: SDBorder;
}

export interface SDImageStyle {
  width?: number;
  height?: number;
}

export interface SDImage {
  url: string;
  style?: SDImageStyle;
}

export interface SDText {
  text: string;
  isHtml: boolean;
  fontColor?: string;
}

export interface SDChip {
  image?: SDImage | null;
  text?: SDText | null;
  style?: SDSurfaceStyle | null;
}

export interface HomeFilterRadioOption {
  // `paramValue` is absent for the "no filter" option — treat undefined as null.
  paramValue?: string | null;
  chip: SDChip;
}

export interface HomeFilterCategoryBar {
  type: 'CATEGORY_BAR';
  categoriesFilter: SDChip;
}

export interface HomeFilterRadioBar {
  type: 'RADIO_BAR';
  paramKey: string;
  options: HomeFilterRadioOption[];
}

export type HomeFilterBar =
  | HomeFilterCategoryBar
  | HomeFilterRadioBar
  | { type: string; [key: string]: unknown };

export interface HomeFilterSection {
  type: string; // "HOME_FILTER"
  bars: HomeFilterBar[];
}

// Selected filter state — maps directly to /stores/nearby query params.
export interface HomeFilterState {
  sortType: string; // "DISTANCE_ASC" | "LATEST"
  filterConditions: string | null; // "RECENT_ACTIVITY" | null
  filterOpenStatuses: string | null; // "OPEN" | null
  targetStores: string | null; // "BOSS_STORE" | null
  categoryId: string | null;
}

export const DEFAULT_HOME_FILTER: HomeFilterState = {
  sortType: 'DISTANCE_ASC',
  filterConditions: null,
  filterOpenStatuses: null,
  targetStores: null,
  categoryId: null,
};

// Store food category — GET /api/v4/store/categories → { data: [...] }
export interface StoreCategory {
  category: string;
  categoryId: string;
  name: string;
  imageUrl: string;
  disableImageUrl?: string;
  description?: string;
  classification?: {
    type: string;
    description: string;
    priority: number;
  };
  isNew: boolean;
}
