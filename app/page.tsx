'use client';

import { useState, useEffect, useRef } from 'react';
import NaverMap from '../src/components/NaverMap';
import StoreCarousel from '../src/components/StoreCarousel';
import CurrentLocationButton from '../src/components/CurrentLocationButton';
import SearchButton from '../src/components/SearchButton';
import HomeFilterBar from '../src/components/HomeFilterBar';
import CategoryPickerModal from '../src/components/CategoryPickerModal';
import { StoreSimpleWithExtraResponse } from '../src/models/Store';
import { MapMarker } from '../src/models/Marker';
import {
  DEFAULT_HOME_FILTER,
  HomeFilterSection,
  HomeFilterState,
  StoreCategory,
} from '../src/models/HomeFilter';
import { ApiService } from '../src/services/ApiService';
import { LocationService } from '../src/services/LocationService';

// SDUI 라디오 바 paramKey → 로컬 필터 상태 키 매핑.
const RADIO_PARAM_KEYS: Record<string, keyof HomeFilterState> = {
  sortType: 'sortType',
  filterConditions: 'filterConditions',
  filterOpenStatuses: 'filterOpenStatuses',
  targetStores: 'targetStores',
};

export default function Home() {
  const [stores, setStores] = useState<StoreSimpleWithExtraResponse[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [currentMapCenter, setCurrentMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [currentAddress, setCurrentAddress] = useState('위치를 확인하는 중...');
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(false);

  // 필터 상태
  const [filterSections, setFilterSections] = useState<HomeFilterSection[]>([]);
  const [filter, setFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 헤더용 실제 기기 위치 / 마지막 가게 검색 중심.
  const deviceLocationRef = useRef({ lat: 37.5665, lng: 126.9780 });
  const searchCenterRef = useRef({ lat: 37.5665, lng: 126.9780 });

  // 필터 상태로 주변 가게를 다시 불러온다.
  const loadStores = async (center: { lat: number; lng: number }, filterState: HomeFilterState) => {
    try {
      setLoading(true);
      const device = deviceLocationRef.current;
      const nearbyStores = await ApiService.getInstance().fetchNearbyStores(
        device.lat,
        device.lng,
        center.lat,
        center.lng,
        filterState
      );
      setStores(nearbyStores);
      setSelectedStoreId(undefined);
      searchCenterRef.current = center;
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기화: 위치 + 주소 + 필터 화면 + 카테고리 + 가게.
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);

        // 필터 화면 / 카테고리는 위치와 독립적으로 병렬 로드.
        ApiService.getInstance().fetchHomeFilter().then(setFilterSections);
        ApiService.getInstance().fetchCategories().then(setCategories);

        const location = await LocationService.getInstance().getCurrentLocation();
        const center = { lat: location.latitude, lng: location.longitude };
        deviceLocationRef.current = center;
        searchCenterRef.current = center;
        setMapCenter(center);
        setCurrentMapCenter(center);

        const address = await LocationService.getInstance().getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        setCurrentAddress(address);

        const nearbyStores = await ApiService.getInstance().fetchNearbyStores(
          center.lat,
          center.lng,
          center.lat,
          center.lng,
          DEFAULT_HOME_FILTER
        );
        setStores(nearbyStores);
      } catch (error) {
        console.error('Error initializing app:', error);
        setCurrentAddress('위치를 가져올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Convert stores to map markers
  const mapMarkers: MapMarker[] = stores.map(store => ({
    storeId: store.store.storeId,
    position: { lat: store.store.location?.latitude || 0, lng: store.store.location?.longitude || 0 },
    title: store.store.storeName,
    isSelected: store.store.storeId === selectedStoreId,
    marker: store.marker
  }));

  // Handle store selection from carousel
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    const selectedStore = stores.find(store => store.store.storeId === storeId);
    if (selectedStore) {
      setMapCenter({ lat: selectedStore.store.location?.latitude || 0, lng: selectedStore.store.location?.longitude || 0 });
    }
  };

  // Handle marker click from map
  const handleMarkerClick = (markerId: string) => {
    setSelectedStoreId(markerId.toString());
  };

  // Handle current location button click
  const handleCurrentLocationClick = async () => {
    try {
      const location = await LocationService.getInstance().getCurrentLocation();
      const newCenter = { lat: location.latitude, lng: location.longitude };
      deviceLocationRef.current = newCenter;

      setMapCenter(newCenter);
      setCurrentMapCenter(newCenter);
      setShowSearchButton(true);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Handle map movement
  const handleMapMove = () => {
    setShowSearchButton(true);
  };

  // Handle map center change
  const handleMapCenterChange = (center: { lat: number; lng: number }) => {
    setCurrentMapCenter(center);
  };

  // Handle search button click ("현재 지도에서 가게 재검색")
  const handleSearchButtonClick = async () => {
    setShowSearchButton(false);
    await loadStores(currentMapCenter, filter);
  };

  // 필터 변경 → 마지막 검색 중심에서 재조회.
  const applyFilter = (patch: Partial<HomeFilterState>) => {
    const next = { ...filter, ...patch };
    setFilter(next);
    loadStores(searchCenterRef.current, next);
  };

  const handleChangeRadio = (paramKey: string, paramValue: string | null) => {
    const stateKey = RADIO_PARAM_KEYS[paramKey];
    if (!stateKey) return;
    if (stateKey === 'sortType') {
      applyFilter({ sortType: paramValue ?? 'DISTANCE_ASC' });
    } else {
      applyFilter({ [stateKey]: paramValue } as Partial<HomeFilterState>);
    }
  };

  const handleSelectCategory = (category: StoreCategory | null) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
    applyFilter({ categoryId: category?.categoryId ?? null });
  };

  return (
    <div className="w-full h-screen relative bg-white">
      {/* Map Container - Full screen */}
      <div className="absolute inset-0">
        <NaverMap
          markers={mapMarkers}
          center={mapCenter}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedStoreId}
          onMapMove={handleMapMove}
          onCenterChange={handleMapCenterChange}
        />
      </div>

      {/* Top chrome: Address + Filter bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-4 flex flex-col gap-2">
        <div className="px-5">
          <div className="bg-white px-4 py-3 shadow-sm" style={{ borderRadius: '9px' }}>
            <div className="flex items-center justify-between">
              <span className="text-address text-gray-900">
                {currentAddress}
              </span>
              <div>
                <img
                  src="/chevron_right.svg"
                  alt="chevron right"
                  width={16}
                  height={16}
                />
              </div>
            </div>
          </div>
        </div>

        {filterSections.length > 0 && (
          <div className="px-5">
            <HomeFilterBar
              sections={filterSections}
              filter={filter}
              selectedCategory={selectedCategory}
              onChangeRadio={handleChangeRadio}
              onOpenCategory={() => setShowCategoryModal(true)}
              onClearCategory={() => handleSelectCategory(null)}
            />
          </div>
        )}
      </div>

      {/* Search Button - below filter bar */}
      <div className="absolute left-0 right-0 z-10 flex justify-center" style={{ top: '116px' }}>
        <SearchButton
          isVisible={showSearchButton}
          onClick={handleSearchButtonClick}
        />
      </div>

      {/* Current Location Button - Fixed position above StoreCarousel */}
      <div className="absolute z-30" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px + 140px + 16px + 24px)', left: '20px' }}>
        <CurrentLocationButton onClick={handleCurrentLocationClick} />
      </div>

      {/* Store Carousel at Bottom - Floating over map */}
      <div className="absolute left-0 right-0 z-20" style={{ bottom: '36px' }}>
        <StoreCarousel
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
        />
      </div>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        isOpen={showCategoryModal}
        categories={categories}
        selectedCategoryId={selectedCategory?.categoryId ?? null}
        onSelect={handleSelectCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-gray-600">주변 가게를 찾는 중...</div>
        </div>
      )}
    </div>
  );
}
