'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import NaverMap from '../src/components/NaverMap';
import HomeBottomSheet from '../src/components/HomeBottomSheet';
import StoreListItem from '../src/components/StoreListItem';
import StorePreviewSheet from '../src/components/StorePreviewSheet';
import CurrentLocationButton from '../src/components/CurrentLocationButton';
import HomeFilterBar from '../src/components/HomeFilterBar';
import CategoryPickerModal from '../src/components/CategoryPickerModal';
import {
  HomeListBasicCard,
  HomeListSection,
} from '../src/models/HomeList';
import { MapMarker } from '../src/models/Marker';
import {
  DEFAULT_HOME_FILTER,
  HomeFilterSection,
  HomeFilterState,
  StoreCategory,
} from '../src/models/HomeFilter';
import { ApiService } from '../src/services/ApiService';
import {
  LocationCoordinate,
  LocationError,
  LocationService,
} from '../src/services/LocationService';
import { Config } from '../src/config/Environment';
import { sdTextToPlainText } from '../src/components/SDTextContent';

// 상단 주소/필터 영역 높이. 시트 펼침 시 흰 배경이 이 높이까지 덮어 시트와 이어진다.
const TOP_CHROME_HEIGHT = 120;
const MAX_HOME_LIST_CARDS = 100;

// 리스트가 화면에 커밋되기 전에 카드 이미지를 요청해 빠른 스크롤에도 바로 표시한다.
const preloadedImageUrls = new Set<string>();
const preloadStoreCardImages = (cards: HomeListBasicCard[]) => {
  if (typeof window === 'undefined') return;

  cards.forEach((card) => {
    card.images.slice(0, 3).forEach(({ url }) => {
      if (!url || preloadedImageUrls.has(url)) return;
      preloadedImageUrls.add(url);
      const image = new window.Image();
      image.decoding = 'async';
      image.onerror = () => preloadedImageUrls.delete(url);
      image.src = url;
    });
  });
};

// SDUI 라디오 바 paramKey → 로컬 필터 상태 키 매핑.
const RADIO_PARAM_KEYS: Record<string, keyof HomeFilterState> = {
  sortType: 'sortType',
  filterConditions: 'filterConditions',
  filterOpenStatuses: 'filterOpenStatuses',
  targetStores: 'targetStores',
};

const getLocationErrorContent = (error: LocationError) => {
  if (error.reason === 'PERMISSION_DENIED') {
    return {
      title: '내 주변 가게를 찾으려면 위치 권한이 필요해요',
      description: '설정에서 위치 권한을 허용한 뒤 다시 시도해주세요.',
      address: '위치 권한이 필요합니다',
    };
  }

  return {
    title: '현재 위치를 확인하지 못했어요',
    description: error.message,
    address: '현재 위치를 확인할 수 없습니다',
  };
};

const getCardOpenUrl = (card: HomeListBasicCard): string | null => {
  const link = card.link;
  if (!link?.link) return null;
  if (link.type === 'WEB') return link.link;

  const dynamicLinkBase = process.env.NEXT_PUBLIC_DYNAMIC_LINK_URL?.replace(/\/+$/, '');
  if (!dynamicLinkBase) return null;

  try {
    const appSchemeUrl = new URL(link.link);
    const path = [
      appSchemeUrl.hostname ? `/${appSchemeUrl.hostname}` : '',
      appSchemeUrl.pathname,
    ].join('');
    return `${dynamicLinkBase}${path || '/'}${appSchemeUrl.search}${appSchemeUrl.hash}`;
  } catch {
    const path = `/${link.link.replace(/^\/+/, '')}`;
    return `${dynamicLinkBase}${path}`;
  }
};

export default function Home() {
  const [cards, setCards] = useState<HomeListBasicCard[]>([]);
  const [listCursor, setListCursor] = useState<HomeListSection['cursor']>({
    nextCursor: null,
    hasMore: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [listResetKey, setListResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [currentAddress, setCurrentAddress] = useState('위치를 확인하는 중...');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [homeListError, setHomeListError] = useState<string | null>(null);

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
  const [previewCard, setPreviewCard] = useState<HomeListBasicCard | null>(null);

  // 헤더용 실제 기기 위치 / 마지막 가게 검색 중심.
  const deviceLocationRef = useRef({ lat: 37.5665, lng: 126.9780 });
  const searchCenterRef = useRef({ lat: 37.5665, lng: 126.9780 });
  const viewportDistanceRef = useRef(1000);
  const searchDistanceRef = useRef(1000);
  const filterRef = useRef<HomeFilterState>(DEFAULT_HOME_FILTER);
  const mapInteractionRef = useRef(false);
  const autoSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMoreRef = useRef(false);
  const listGenerationRef = useRef(0);
  const previewOpenRef = useRef(false);
  filterRef.current = filter;

  // 앱으로 이동 (딥링크).
  const openApp = (card: HomeListBasicCard) => {
    const url = getCardOpenUrl(card);
    if (!url) return;
    window.open(url, '_blank');
  };

  // 필터 상태로 홈 리스트와 지도 마커를 한 번에 다시 불러온다.
  const loadHomeList = async (
    center: { lat: number; lng: number },
    filterState: HomeFilterState,
    distanceM: number = viewportDistanceRef.current
  ) => {
    const generation = ++listGenerationRef.current;
    try {
      setHomeListError(null);
      const device = deviceLocationRef.current;
      const homeList = await ApiService.getInstance().fetchHomeList(
        device.lat,
        device.lng,
        center.lat,
        center.lng,
        filterState,
        distanceM
      );
      if (generation !== listGenerationRef.current) return;
      const limitedCards = homeList.cards.slice(0, MAX_HOME_LIST_CARDS);
      preloadStoreCardImages(limitedCards);
      if (!previewOpenRef.current) {
        setPreviewCard(null);
      }
      setListResetKey((key) => key + 1);
      setCards(limitedCards);
      setListCursor({
        ...homeList.cursor,
        hasMore: limitedCards.length < MAX_HOME_LIST_CARDS && homeList.cursor.hasMore,
      });
      searchCenterRef.current = center;
      searchDistanceRef.current = distanceM;
    } catch (error) {
      console.error('Error loading stores:', error);
      if (generation !== listGenerationRef.current) return;
      setHomeListError('주변 가게를 불러올 수 없습니다');
    }
  };

  const initializeAtLocation = useCallback(async (center: { lat: number; lng: number }) => {
    const generation = ++listGenerationRef.current;
    setHomeListError(null);
    deviceLocationRef.current = center;
    searchCenterRef.current = center;
    setMapCenter(center);

    const [addressResult, homeListResult] = await Promise.allSettled([
      LocationService.getInstance().getAddressFromCoordinates(center.lat, center.lng),
      ApiService.getInstance().fetchHomeList(
        center.lat,
        center.lng,
        center.lat,
        center.lng,
        filterRef.current,
        viewportDistanceRef.current
      ),
    ]);

    if (generation !== listGenerationRef.current) return;

    if (addressResult.status === 'fulfilled') {
      setCurrentAddress(addressResult.value);
    }

    if (homeListResult.status === 'fulfilled') {
      const limitedCards = homeListResult.value.cards.slice(0, MAX_HOME_LIST_CARDS);
      preloadStoreCardImages(limitedCards);
      setListResetKey((key) => key + 1);
      setCards(limitedCards);
      setListCursor({
        ...homeListResult.value.cursor,
        hasMore: limitedCards.length < MAX_HOME_LIST_CARDS && homeListResult.value.cursor.hasMore,
      });
      searchDistanceRef.current = viewportDistanceRef.current;
    } else {
      console.error('Error loading stores:', homeListResult.reason);
      setCards([]);
      setListCursor({ nextCursor: null, hasMore: false });
      setHomeListError('주변 가게를 불러올 수 없습니다');
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (
      loadingMoreRef.current
      || cards.length >= MAX_HOME_LIST_CARDS
      || !listCursor.hasMore
      || !listCursor.nextCursor
    ) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const generation = listGenerationRef.current;
    try {
      const device = deviceLocationRef.current;
      const center = searchCenterRef.current;
      const nextPage = await ApiService.getInstance().fetchHomeList(
        device.lat,
        device.lng,
        center.lat,
        center.lng,
        filter,
        searchDistanceRef.current,
        listCursor.nextCursor
      );

      if (generation !== listGenerationRef.current) return;
      const existingIds = new Set(cards.map((card) => card.cardId));
      const remainingCount = MAX_HOME_LIST_CARDS - cards.length;
      const newCards = nextPage.cards
        .filter((card) => !existingIds.has(card.cardId))
        .slice(0, remainingCount);
      const nextCards = [...cards, ...newCards];
      preloadStoreCardImages(newCards);
      setCards(nextCards);
      setListCursor({
        ...nextPage.cursor,
        hasMore: nextCards.length < MAX_HOME_LIST_CARDS && nextPage.cursor.hasMore,
      });
    } catch (error) {
      console.error('Error loading next home list page:', error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [cards, filter, listCursor]);

  const requestCurrentLocation = useCallback(async () => {
    setLoading(true);
    setLocationError(null);

    try {
      let location: LocationCoordinate;
      try {
        location = await LocationService.getInstance().getCurrentLocation();
      } catch (error) {
        const nextError = error instanceof LocationError
          ? error
          : new LocationError('UNKNOWN', '현재 위치를 가져오지 못했습니다.');
        setLocationError(nextError);
        setCurrentAddress(getLocationErrorContent(nextError).address);
        return;
      }

      try {
        await initializeAtLocation({ lat: location.latitude, lng: location.longitude });
      } catch (error) {
        console.error('Error initializing stores at current location:', error);
        setHomeListError('주변 가게를 불러올 수 없습니다');
      }
    } finally {
      setLoading(false);
    }
  }, [initializeAtLocation]);

  // 초기화: 위치 + 주소 + 필터 화면 + 카테고리 + 가게.
  useEffect(() => {
    ApiService.getInstance().fetchHomeFilter().then(setFilterSections);
    ApiService.getInstance().fetchCategories().then(setCategories);
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  useEffect(() => () => {
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
  }, []);

  const selectedMarkerId = previewCard?.cardId;
  const mapMarkers: MapMarker[] = useMemo(() => cards.flatMap((card) => {
    if (!card.marker) return [];
    return [{
      markerId: card.cardId,
      position: {
        lat: card.marker.location.latitude,
        lng: card.marker.location.longitude,
      },
      title: card.header.title ? sdTextToPlainText(card.header.title) : '',
      isSelected: card.cardId === selectedMarkerId,
      marker: card.marker,
    }];
  }), [cards, selectedMarkerId]);

  const openStorePreview = useCallback((card: HomeListBasicCard) => {
    previewOpenRef.current = true;
    mapInteractionRef.current = false;
    if (autoSearchTimerRef.current) {
      clearTimeout(autoSearchTimerRef.current);
      autoSearchTimerRef.current = null;
    }
    setPreviewCard(card);
    if (card.marker) {
      setMapCenter({
        lat: card.marker.location.latitude,
        lng: card.marker.location.longitude,
      });
    }
  }, []);

  // 마커 탭 → 가게 프리뷰 시트 + 지도 중심 이동.
  const handleMarkerClick = useCallback((markerId: string) => {
    const card = cards.find((candidate) => candidate.cardId === markerId);
    if (!card) return;
    openStorePreview(card);
  }, [cards, openStorePreview]);

  // Handle current location button click
  const handleCurrentLocationClick = async () => {
    mapInteractionRef.current = false;
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    await requestCurrentLocation();
  };

  const handleUseDefaultLocation = async () => {
    mapInteractionRef.current = false;
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    setLoading(true);
    setLocationError(null);
    try {
      await initializeAtLocation(Config.DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  // Handle map movement
  const handleMapMove = () => {
    mapInteractionRef.current = true;
  };

  // 지도 사각 영역 전체를 포함하는 원형 검색 반경.
  const handleViewportChange = (viewport: {
    center: { lat: number; lng: number };
    distanceM: number;
  }) => {
    viewportDistanceRef.current = viewport.distanceM;

    // 초기 지도 생성은 제외하고, 마지막 지도 조작 후 500ms 뒤 자동 재검색한다.
    if (!mapInteractionRef.current) return;
    mapInteractionRef.current = false;
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    autoSearchTimerRef.current = setTimeout(() => {
      loadHomeList(viewport.center, filter, viewport.distanceM);
    }, 500);
  };

  const handleClosePreview = useCallback(() => {
    previewOpenRef.current = false;
    mapInteractionRef.current = false;
    setPreviewCard(null);
  }, []);

  const handleShowMap = () => {
    setSheetExpanded(false);
    setSheetProgress(0);
  };

  const handleOpenCategory = () => {
    setShowCategoryModal(true);
  };

  // 필터 변경 → 마지막 검색 중심에서 재조회.
  const applyFilter = (patch: Partial<HomeFilterState>) => {
    if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
    const next = { ...filter, ...patch };
    setFilter(next);
    loadHomeList(searchCenterRef.current, next, searchDistanceRef.current);
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
    if (previewCard) {
      handleClosePreview();
    }
    setSelectedCategory(category);
    setShowCategoryModal(false);
    applyFilter({ categoryId: category?.categoryId ?? null });
  };

  const handleCloseCategory = () => {
    setShowCategoryModal(false);
  };

  return (
    <div className="relative h-[100dvh] w-full bg-white">
      {/* 리스트 상단까지만 지도의 실제 viewport로 사용한다.
          시트가 움직이면 지도 하단도 같은 진행도로 따라가므로 중심/검색 범위가 리스트 뒤에 가려지지 않는다. */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          bottom: `calc(210px + (100dvh - ${TOP_CHROME_HEIGHT + 210}px) * ${previewCard ? 0 : sheetProgress})`,
        }}
      >
        <NaverMap
          markers={mapMarkers}
          center={mapCenter}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedMarkerId}
          onMapMove={handleMapMove}
          onViewportChange={handleViewportChange}
        />
      </div>

      {/* 시트 펼침 시 상단 영역을 덮는 흰 배경. 시트(z-30)보다 위(z-40)에 있어 시트 상단이 배경 뒤로 들어가
          이음새 없이 전체화면 흰색처럼 보인다. 높이는 상단 크롬보다 10px 더 길어 시트 상단 라운드를 덮는다. */}
      <div
        className="absolute top-0 left-0 right-0 z-40"
        style={{
          height: `${TOP_CHROME_HEIGHT + 10}px`,
          backgroundColor: '#FFFFFF',
          opacity: previewCard ? 0 : sheetProgress,
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
            onOpenCategory={handleOpenCategory}
            onClearCategory={() => handleSelectCategory(null)}
          />
        )}
      </div>

      {/* Current Location Button - above collapsed bottom sheet */}
      <div className="absolute z-20" style={{ bottom: 'calc(210px + 16px)', left: '20px' }}>
        <CurrentLocationButton onClick={handleCurrentLocationClick} />
      </div>

      {/* Bottom Sheet with vertical store list (앱 FloatingPanel 대응) */}
      <HomeBottomSheet
          hidden={Boolean(previewCard)}
          expanded={sheetExpanded}
          onExpandedChange={setSheetExpanded}
          onProgressChange={setSheetProgress}
          onEndReached={loadNextPage}
          hasMore={listCursor.hasMore}
          loadingMore={loadingMore}
          listResetKey={listResetKey}
          collapsedHeight={210}
          expandedTopOffset={TOP_CHROME_HEIGHT}
        >
          {homeListError ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ paddingTop: '48px', paddingBottom: '48px' }}
            >
              <div style={{ fontFamily: 'Pretendard', fontWeight: 700, fontSize: '16px', color: '#4B4B4B' }}>
                {homeListError}
              </div>
              <div style={{ fontFamily: 'Pretendard', fontWeight: 500, fontSize: '13px', color: '#8E8E8E', marginTop: '8px' }}>
                잠시 후 다시 시도해주세요
              </div>
            </div>
          ) : cards.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ paddingTop: '48px', paddingBottom: '48px' }}
            >
              <div style={{ fontFamily: 'Pretendard', fontWeight: 700, fontSize: '16px', color: '#4B4B4B' }}>
                주변에 등록된 가게가 없어요
              </div>
              <div
                style={{ fontFamily: 'Pretendard', fontWeight: 500, fontSize: '13px', color: '#8E8E8E', marginTop: '8px' }}
              >
                지도를 움직여 다른 위치를 살펴보세요
              </div>
            </div>
          ) : (
            <div
              style={{
                paddingBottom: sheetExpanded
                  ? '104px'
                  : `calc(100dvh - ${TOP_CHROME_HEIGHT + 44}px)`,
              }}
            >
              {cards.map((card) => (
                <StoreListItem
                  key={card.cardId}
                  card={card}
                  onClick={() => openStorePreview(card)}
                />
              ))}
              {loadingMore && (
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: 56,
                    fontFamily: 'Pretendard',
                    fontSize: 13,
                    color: '#8E8E8E',
                  }}
                >
                  가게를 더 불러오는 중...
                </div>
              )}
            </div>
          )}
        </HomeBottomSheet>

      {/* 전체 리스트 하단의 지도 복귀 버튼 */}
      {sheetExpanded && !previewCard && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 mx-auto flex justify-center px-5 pt-4"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF 18px)',
          }}
        >
          <button
            type="button"
            onClick={handleShowMap}
            className="flex items-center justify-center gap-1.5 px-5"
            style={{
              height: 44,
              borderRadius: 22,
              backgroundColor: '#FF5C43',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 18L3.8 20.3A.6.6 0 0 1 3 19.75V6.4a1 1 0 0 1 .6-.92L9 3m0 15 6 3m-6-3V3m6 18 5.4-2.48a1 1 0 0 0 .6-.91V4.25a.6.6 0 0 0-.85-.55L15 6m0 15V6m0 0L9 3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            지도 보기
          </button>
        </div>
      )}

      {/* Category Picker Modal */}
      <CategoryPickerModal
        isOpen={showCategoryModal}
        categories={categories}
        selectedCategoryId={selectedCategory?.categoryId ?? null}
        onSelect={handleSelectCategory}
        onClose={handleCloseCategory}
      />

      {/* Store Preview Sheet (마커 탭) */}
      {previewCard && (
        <StorePreviewSheet
          card={previewCard}
          onClose={handleClosePreview}
          onOpenApp={openApp}
        />
      )}

      {/* 위치 권한 안내 */}
      {locationError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div
            className="w-full bg-white"
            style={{ maxWidth: 360, borderRadius: 20, padding: '24px 20px' }}
          >
            <h2
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '26px',
                color: '#0F0F0F',
              }}
            >
              {getLocationErrorContent(locationError).title}
            </h2>
            <p
              style={{
                marginTop: 8,
                fontFamily: 'Pretendard',
                fontSize: 14,
                lineHeight: '20px',
                color: '#787878',
              }}
            >
              {getLocationErrorContent(locationError).description}
            </p>
            <button
              type="button"
              onClick={requestCurrentLocation}
              className="w-full"
              style={{
                marginTop: 20,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#FF5C43',
                color: '#FFFFFF',
                fontFamily: 'Pretendard',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              현재 위치 다시 요청하기
            </button>
            <button
              type="button"
              onClick={handleUseDefaultLocation}
              className="w-full"
              style={{
                marginTop: 8,
                height: 44,
                color: '#787878',
                fontFamily: 'Pretendard',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              서울 기준으로 둘러보기
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-gray-600">주변 가게를 찾는 중...</div>
        </div>
      )}
    </div>
  );
}
