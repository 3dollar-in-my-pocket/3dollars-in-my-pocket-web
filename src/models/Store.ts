export interface StoreSimpleWithExtraResponse {
  store: StoreSimpleResponse;
  marker?: StoreMarkerResponse;
  openStatus: {
    status: "OPEN" | "CLOSED";
    openStartDateTime?: string;
    isOpening: boolean;
  };
  distanceM: number;
  extra: StoreExtraResponse;
}

export interface StoreSimpleResponse {
  storeType: StoreType;
  storeId: string;
  storeName: string;
  rating: number;
  location?: LocationResponse;
  categories: StoreFoodCategoryResponse[];
  activitiesStatus: ActivitiesStatus;
  createdAt?: string;
  updatedAt?: string;
}

export enum StoreType {
  userStore = "USER_STORE",
  bossStore = "BOSS_STORE"
}

export interface LocationResponse {
  latitude: number;
  longitude: number;
}

export interface  StoreFoodCategoryResponse {
  categoryId: string;
  name: string;
  imageUrl: string;
  description: string;
  classification: StoreFoodCategoryClassificationResponse;
  isNew: boolean;
}

export interface StoreFoodCategoryClassificationResponse {
  type: string;
  description: string;
}

export enum ActivitiesStatus {
  recentActivity = "RECENT_ACTIVITY",
  noRecentActivity = "NO_RECENT_ACTIVITY"
}

export interface StoreMarkerResponse {
  selected: ImageResponse;
  unselected: ImageResponse;
}

export interface ImageResponse {
  imageUrl: string;
  width?: number;
  height?: number;
  ratio?: number;
}

export interface StoreExtraResponse {
  reviewsCount: number;
  rating: number;
  visitCounts: {
    existsCounts: number;
    notExistsCounts: number;
    isCertified: boolean;
  };
  tags: {
    isNew: boolean;
    hasIssuableCoupon: boolean;
  }
}