'use client';

// Naver Map Component - similar to iOS MapKit
import { useEffect, useRef, useState } from 'react';
import { MapMarker } from '../models/Marker';
import { SDChip } from '../models/HomeFilter';
import { Config } from '../config/Environment';
import { MAX_HOME_DISTANCE_M } from '../constants/HomeMap';

interface NaverMapProps {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  onMarkerClick?: (markerId: string) => void;
  selectedMarkerId?: string;
  onMapMove?: () => void;
  onViewportChange?: (viewport: {
    center: { lat: number; lng: number };
    distanceM: number;
  }) => void;
}

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: unknown) => unknown;
        Event: {
          addListener: (marker: unknown, event: string, callback: () => void) => void;
          trigger: (target: unknown, event: string) => void;
        };
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
      };
    };
  }
}

function getDistanceM(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const earthRadiusM = 6_371_000;
  const toRadians = (degree: number) => degree * Math.PI / 180;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusM * Math.asin(Math.sqrt(haversine));
}

function createHomeListMarkerIcon(chip: SDChip) {
  const image = chip.image;
  const width = image?.style?.width || 0;
  const height = image?.style?.height || 0;
  const size = Math.max(width, height, 24);

  return {
    url: image?.url,
    width: size,
    height: size,
  };
}

export default function NaverMap({ markers, center, onMarkerClick, selectedMarkerId, onMapMove, onViewportChange }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const naverMarkersRef = useRef<unknown[]>([]);
  const onMapMoveRef = useRef(onMapMove);
  const onViewportChangeRef = useRef(onViewportChange);
  const userInteractionRef = useRef(false);
  const initialCenterRef = useRef(center);

  useEffect(() => {
    onMapMoveRef.current = onMapMove;
  }, [onMapMove]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  const notifyViewportChange = (mapInstance: unknown) => {
    const callback = onViewportChangeRef.current;
    if (!callback) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentCenter = (mapInstance as any).getCenter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bounds = (mapInstance as any).getBounds();
    const northEast = bounds.getNE();
    const southWest = bounds.getSW();
    const viewportCenter = {
      lat: currentCenter.lat(),
      lng: currentCenter.lng(),
    };
    const corners = [
      { lat: northEast.lat(), lng: northEast.lng() },
      { lat: northEast.lat(), lng: southWest.lng() },
      { lat: southWest.lat(), lng: northEast.lng() },
      { lat: southWest.lat(), lng: southWest.lng() },
    ];
    const distanceM = Math.ceil(Math.max(
      ...corners.map((corner) => getDistanceM(viewportCenter, corner))
    ));

    // 현재 viewport 크기에서 최대 검색 반경을 넘지 않는 최소 줌 레벨을 SDK에 설정한다.
    // minZoom이 줌 아웃 제스처 자체를 제한하며, ResizeObserver 호출 시 다시 계산된다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentZoom = (mapInstance as any).getZoom();
    const minimumZoom = Math.max(
      0,
      currentZoom + Math.ceil(Math.log2(distanceM / MAX_HOME_DISTANCE_M))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance as any).setOptions({ minZoom: minimumZoom });

    // 화면의 가장 먼 모서리가 최대 검색 반경을 넘으면 필요한 만큼 다시 확대한다.
    // 지도 거리는 줌 레벨이 1 증가할 때 대략 절반이 된다.
    if (distanceM > MAX_HOME_DISTANCE_M) {
      const zoomIncrease = Math.max(
        1,
        Math.ceil(Math.log2(distanceM / MAX_HOME_DISTANCE_M))
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstance as any).setZoom(currentZoom + zoomIncrease);
      return;
    }

    callback({ center: viewportCenter, distanceM });
  };

  // Initialize map when Naver Maps API is loaded
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.naver) return;

      const mapInstance = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(
          initialCenterRef.current.lat,
          initialCenterRef.current.lng
        ),
        zoom: Config.MAP_ZOOM_LEVEL,
        mapTypeControl: false,
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
        tileDuration: 200,
      });
      // 회색 지도 데이터 저작권 문구와 NAVER 로고 컨트롤을 제거한다.
      // SDK가 비동기로 초기화되며 기본 컨트롤을 다시 붙일 수 있어 init 전후 모두 적용한다.
      const hideMapAttributionControls = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstance as any).setOptions({
          logoControl: false,
          mapDataControl: false,
          scaleControl: false,
        });
      };
      hideMapAttributionControls();
      window.naver.maps.Event.addListener(mapInstance, 'init', hideMapAttributionControls);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstance as any).setOptions('logoControl', false);

      // 드래그/줌이 실제로 반영된 뒤의 중심과 bounds를 전달한다.
      // dragend 시점에는 SDK의 viewport가 아직 이전 중심을 가리키는 경우가 있어,
      // 렌더링이 끝난 뒤 발생하는 idle에서 조회를 트리거한다.
      const markUserInteraction = () => {
        userInteractionRef.current = true;
      };
      const handleMapIdle = () => {
        if (!userInteractionRef.current) return;
        userInteractionRef.current = false;
        onMapMoveRef.current?.();
        notifyViewportChange(mapInstance);
      };

      window.naver.maps.Event.addListener(mapInstance, 'dragstart', markUserInteraction);
      window.naver.maps.Event.addListener(mapInstance, 'zoom_changed', markUserInteraction);
      window.naver.maps.Event.addListener(mapInstance, 'idle', handleMapIdle);
      notifyViewportChange(mapInstance);

      setMap(mapInstance);
    };

    // Load Naver Maps API if not already loaded
    if (!window.naver) {
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${Config.NAVER_MAP_CLIENT_ID}`;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  // 바텀시트 이동으로 지도 컨테이너 높이가 바뀌면 SDK viewport도 함께 갱신한다.
  useEffect(() => {
    const element = mapRef.current;
    if (!element || !map || !window.naver || typeof ResizeObserver === 'undefined') return;

    let animationFrame: number | null = null;
    let redrawFrame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      if (redrawFrame !== null) cancelAnimationFrame(redrawFrame);
      animationFrame = requestAnimationFrame(() => {
        window.naver.maps.Event.trigger(map, 'resize');
        // 시트 전환으로 지도가 한 번에 크게 늘어날 때 SDK가 이전 projection의
        // 타일만 남겨 흰 영역이 보일 수 있다. 다음 프레임에 현재 중심을 다시
        // 적용해 새 viewport의 타일을 확실히 요청한다.
        redrawFrame = requestAnimationFrame(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentCenter = (map as any).getCenter();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).setCenter(currentCenter);
          window.naver.maps.Event.trigger(map, 'resize');
          notifyViewportChange(map);
        });
      });
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      if (redrawFrame !== null) cancelAnimationFrame(redrawFrame);
    };
  }, [map]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !window.naver) return;
    let redrawFrame: number | null = null;

    // Clear existing markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naverMarkersRef.current.forEach((marker: any) => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });

    // Create new markers
    const newMarkers = markers.map((markerData) => {
      const isFocused =
        markerData.isSelected ||
        (selectedMarkerId !== undefined && markerData.markerId === selectedMarkerId);
      const chip = isFocused ? markerData.marker.focused : markerData.marker.unfocused;
      const icon = createHomeListMarkerIcon(chip);

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(markerData.position.lat, markerData.position.lng),
        title: markerData.title,
        zIndex: isFocused ? 100 : 0,
        icon: icon.url ? {
          url: icon.url,
          size: new window.naver.maps.Size(icon.width, icon.height),
          scaledSize: new window.naver.maps.Size(icon.width, icon.height),
          anchor: new window.naver.maps.Point(icon.width / 2, icon.height),
        } : undefined,
      });

      // Add click event listener
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick?.(markerData.markerId);
      });

      return marker;
    });

    naverMarkersRef.current = newMarkers;

    // 생성자에서 바로 map을 주면 드래그로 이동한 직후 이전 projection의
    // overlay pane에 마커가 붙는 경우가 있다. 모든 마커를 만든 다음 현재
    // viewport에 명시적으로 연결하고 resize로 projection을 다시 계산한다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newMarkers.forEach((marker: any) => marker.setMap(map));
    redrawFrame = requestAnimationFrame(() => {
      window.naver.maps.Event.trigger(map, 'resize');
    });

    return () => {
      if (redrawFrame !== null) cancelAnimationFrame(redrawFrame);
      // effect가 다시 실행되거나 컴포넌트가 해제될 때 현재 세대 마커를 제거한다.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newMarkers.forEach((marker: any) => marker.setMap(null));
    };
  }, [map, markers, selectedMarkerId, onMarkerClick]);

  // Update map center when center prop changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (map && typeof (map as any).panTo === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).panTo(new window.naver.maps.LatLng(center.lat, center.lng));
    }
  }, [map, center]);

  return (
    <div 
      ref={mapRef} 
      className="naver-map-container w-full h-full"
    />
  );
}
