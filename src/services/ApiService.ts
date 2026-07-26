import { StoreSimpleWithExtraResponse } from '../models/Store';
import { HomeFilterSection, HomeFilterState, StoreCategory } from '../models/HomeFilter';
import { StorePreviewSection } from '../models/StorePreview';

export class ApiService {
  private static instance: ApiService;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // 주변 가게 조회. 필터 상태를 nearby 쿼리 파라미터로 흘려보낸다.
  async fetchNearbyStores(
    latitude: number,
    longitude: number,
    mapLatitude: number,
    mapLongitude: number,
    filter?: Partial<HomeFilterState>,
    distance: number = 1000
  ): Promise<StoreSimpleWithExtraResponse[]> {
    try {
      const params = new URLSearchParams({
        mapLatitude: mapLatitude.toString(),
        mapLongitude: mapLongitude.toString(),
        distanceM: distance.toString(),
        sortType: filter?.sortType || 'DISTANCE_ASC',
      });

      if (filter?.filterConditions) params.set('filterConditions', filter.filterConditions);
      if (filter?.filterOpenStatuses) params.set('filterOpenStatuses', filter.filterOpenStatuses);
      if (filter?.targetStores) params.set('targetStores', filter.targetStores);
      if (filter?.categoryId) params.set('categoryIds', filter.categoryId);

      const response = await fetch(`/api/nearby?${params.toString()}`, {
        headers: {
          'X-Device-Latitude': latitude.toString(),
          'X-Device-Longitude': longitude.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.contents || [];
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      throw error;
    }
  }

  // SDUI 홈 필터 화면 (필터 칩 구성).
  async fetchHomeFilter(): Promise<HomeFilterSection[]> {
    try {
      const response = await fetch('/api/screen-home');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data?.sections || [];
    } catch (error) {
      console.error('Error fetching home filter:', error);
      return [];
    }
  }

  // SDUI 가게 프리뷰 (마커 탭 상세 시트).
  async fetchStorePreview(
    storeId: string,
    latitude: number,
    longitude: number
  ): Promise<StorePreviewSection | null> {
    try {
      const response = await fetch(`/api/store-preview/${storeId}`, {
        headers: {
          'X-Device-Latitude': latitude.toString(),
          'X-Device-Longitude': longitude.toString(),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const sections = data.data?.sections || [];
      return sections.find((s: StorePreviewSection) => s.type === 'PREVIEW') || null;
    } catch (error) {
      console.error('Error fetching store preview:', error);
      return null;
    }
  }

  // 음식 카테고리 목록 (카테고리 필터용).
  async fetchCategories(): Promise<StoreCategory[]> {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}
