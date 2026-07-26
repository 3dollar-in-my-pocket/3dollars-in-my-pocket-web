'use client';

import { useState, useEffect, useRef } from 'react';
import NaverMap from '../src/components/NaverMap';
import HomeBottomSheet from '../src/components/HomeBottomSheet';
import StoreListItem from '../src/components/StoreListItem';
import StorePreviewSheet from '../src/components/StorePreviewSheet';
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

// 상단 주소/필터 영역 높이. 시트 펼침 시 흰 배경이 이 높이까지 덮어 시트와 이어진다.
const TOP_CHROME_HEIGHT = 120;

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
  const [loading, setLoading] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(false);

  // 필터 상태
  const [filterSections, setFilterSections] = useState<HomeFilterSection[]>([]);
  const [filter, setFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 바텀시트 (진행도 0=접힘 ~ 1=펼침)
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetProgress, setSheetProgress] = useState(0);

  // 마커 탭 시 뜨는 가게 프리뷰
  const [previewStore, setPreviewStore] = useState<StoreSimpleWithExtraResponse | null>(null);

  // 헤더용 실제 기기 위치 / 마지막 가게 검색 중심.
  const deviceLocationRef = useRef({ lat: 37.5665, lng: 126.9780 });
  const searchCenterRef = useRef({ lat: 37.5665, lng: 126.9780 });

  // 앱으로 이동 (딥링크).
  const openApp = (store: StoreSimpleWithExtraResponse) => {
    const url = `${process.env.NEXT_PUBLIC_DYNAMIC_LINK_URL}/store?storeType=${store.store.storeType}&storeId=${store.store.storeId}`;
    window.open(url, '_blank');
  };

  // 필터 상태로 주변 가게를 다시 불러온다.
  const loadStores = async (center: { lat: number; lng: number }, filterState: HomeFilterState) => {
    try {
      setLoading(true);
      setPreviewStore(null);
      const device = deviceLocationRef.current;
      const nearbyStores = await ApiService.getInstance().fetchNearbyStores(
        device.lat,
        device.lng,
        center.lat,
        center.lng,
        filterState
      );
      setStores(nearbyStores);
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
    isSelected: store.store.storeId === previewStore?.store.storeId,
    marker: store.marker
  }));

  // 마커 탭 → 가게 프리뷰 시트 + 지도 중심 이동.
  const handleMarkerClick = (markerId: string) => {
    const store = stores.find((s) => s.store.storeId === markerId);
    if (!store) return;
    setPreviewStore(store);
    setMapCenter({
      lat: store.store.location?.latitude || mapCenter.lat,
      lng: store.store.location?.longitude || mapCenter.lng,
    });
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
          selectedMarkerId={previewStore?.store.storeId}
          onMapMove={handleMapMove}
          onCenterChange={handleMapCenterChange}
        />
      </div>

      {/* 시트 펼침 시 상단 영역을 덮는 흰 배경. 시트(z-30)보다 위(z-40)에 있어 시트 상단이 배경 뒤로 들어가
          이음새 없이 전체화면 흰색처럼 보인다. 높이는 상단 크롬보다 10px 더 길어 시트 상단 라운드를 덮는다. */}
      <div
        className="absolute top-0 left-0 right-0 z-40"
        style={{
          height: `${TOP_CHROME_HEIGHT + 10}px`,
          backgroundColor: '#FFFFFF',
          opacity: sheetProgress,
          transition: 'opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
        }}
      />

      {/* Top chrome: Address + Filter bar. 흰 배경(z-40) 위에 올려 항상 보이도록 z-[45]. */}
      <div className="absolute top-0 left-0 right-0 z-[45] pt-4 flex flex-col gap-2">
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
          <HomeFilterBar
            sections={filterSections}
            filter={filter}
            selectedCategory={selectedCategory}
            onChangeRadio={handleChangeRadio}
            onOpenCategory={() => setShowCategoryModal(true)}
            onClearCategory={() => handleSelectCategory(null)}
          />
        )}
      </div>

      {/* Search Button - below filter bar */}
      <div className="absolute left-0 right-0 z-[45] flex justify-center" style={{ top: '116px' }}>
        <SearchButton
          isVisible={showSearchButton}
          onClick={handleSearchButtonClick}
        />
      </div>

      {/* Current Location Button - above collapsed bottom sheet */}
      <div className="absolute z-20" style={{ bottom: 'calc(210px + 16px)', left: '20px' }}>
        <CurrentLocationButton onClick={handleCurrentLocationClick} />
      </div>

      {/* Bottom Sheet with vertical store list (앱 FloatingPanel 대응) */}
      <HomeBottomSheet
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        onProgressChange={setSheetProgress}
        collapsedHeight={210}
        expandedTopOffset={TOP_CHROME_HEIGHT}
      >
        {stores.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ paddingTop: '48px', paddingBottom: '48px' }}
          >
            <div style={{ fontFamily: 'Pretendard', fontWeight: 700, fontSize: '16px', color: '#4B4B4B' }}>
              주변에 등록된 가게가 없어요
            </div>
            <div style={{ fontFamily: 'Pretendard', fontWeight: 500, fontSize: '13px', color: '#8E8E8E', marginTop: '8px' }}>
              지도를 움직여 다른 위치를 살펴보세요
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: '24px' }}>
            {stores.map((store) => (
              <StoreListItem
                key={store.store.storeId}
                store={store}
                deviceLocation={deviceLocationRef.current}
                onClick={() => openApp(store)}
              />
            ))}
          </div>
        )}
      </HomeBottomSheet>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        isOpen={showCategoryModal}
        categories={categories}
        selectedCategoryId={selectedCategory?.categoryId ?? null}
        onSelect={handleSelectCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Store Preview Sheet (마커 탭) */}
      <StorePreviewSheet
        store={previewStore}
        deviceLocation={deviceLocationRef.current}
        onClose={() => setPreviewStore(null)}
        onOpenApp={openApp}
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
