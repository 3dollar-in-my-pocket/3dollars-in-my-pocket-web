import { HomeListBasicCard, HomeListSection } from '../models/HomeList';
import { HomeFilterSection, HomeFilterState, StoreCategory } from '../models/HomeFilter';
import {
  DEFAULT_HOME_DISTANCE_M,
  MAX_HOME_DISTANCE_M,
} from '../constants/HomeMap';

export class ApiService {
  private static instance: ApiService;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // SDUI 홈 리스트. 한 응답으로 리스트 카드와 지도 마커를 함께 구성한다.
  async fetchHomeList(
    latitude: number,
    longitude: number,
    mapLatitude: number,
    mapLongitude: number,
    filter?: Partial<HomeFilterState>,
    distance: number = 1000,
    cursor?: string
  ): Promise<HomeListSection> {
    try {
      const normalizedDistance = Number.isFinite(distance) && distance > 0
        ? Math.min(Math.round(distance), MAX_HOME_DISTANCE_M)
        : DEFAULT_HOME_DISTANCE_M;
      const params = new URLSearchParams({
        mapLatitude: mapLatitude.toString(),
        mapLongitude: mapLongitude.toString(),
        distanceM: normalizedDistance.toString(),
        sortType: filter?.sortType || 'DISTANCE_ASC',
      });

      if (filter?.filterConditions) params.set('filterConditions', filter.filterConditions);
      if (filter?.filterOpenStatuses) params.set('filterOpenStatuses', filter.filterOpenStatuses);
      if (filter?.targetStores) params.set('targetStores', filter.targetStores);
      if (filter?.categoryId) params.set('categoryIds', filter.categoryId);
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(`/api/home-list?${params.toString()}`, {
        headers: {
          'X-Device-Latitude': latitude.toString(),
          'X-Device-Longitude': longitude.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const section = data.data as HomeListSection | undefined;
      return {
        cards: (section?.cards || []).filter(
          (card): card is HomeListBasicCard => card.type === 'BASIC_CARD'
        ),
        cursor: section?.cursor || { hasMore: false, nextCursor: null },
      };
    } catch (error) {
      console.error('Error fetching home list:', error);
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
