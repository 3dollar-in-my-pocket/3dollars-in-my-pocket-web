'use client';

// Naver Map Component - similar to iOS MapKit
import { useEffect, useRef, useState } from 'react';
import { MapMarker } from '../models/Marker';
import { Config } from '../config/Environment';

interface NaverMapProps {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  onMarkerClick?: (markerId: string) => void;
  selectedMarkerId?: string;
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
        };
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
      };
    };
  }
}

export default function NaverMap({ markers, center, onMarkerClick, selectedMarkerId }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<unknown>(null);
  const naverMarkersRef = useRef<unknown[]>([]);

  // Initialize map when Naver Maps API is loaded
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.naver) return;

      const mapInstance = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: Config.MAP_ZOOM_LEVEL,
        mapTypeControl: false,
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
        tileDuration: 200,
      });

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
  }, [center.lat, center.lng]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !window.naver) return;

    // Clear existing markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naverMarkersRef.current.forEach((marker: any) => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });

    // Create new markers
    const newMarkers = markers.map((markerData) => {
      const isSelected = markerData.storeId === selectedMarkerId?.toString();
      
      // Use marker images if available, otherwise fall back to default
      let iconContent: string;
      let iconSize = { width: 32, height: 32 };
      
      if (markerData.marker) {
        const imageData = isSelected ? markerData.marker.selected : markerData.marker.unselected;
        const width = imageData.width || 32;
        const height = imageData.height || 32;
        
        iconContent = `<img src="${imageData.imageUrl}" style="width: ${width}px; height: ${height}px;" />`;
        iconSize = { width, height };
      } else {
        // Default marker style using SVG files
        if (isSelected) {
          iconContent = `<img src="/mappin_focused.svg" style="width: 32px; height: 40px;" />`;
          iconSize = { width: 32, height: 40 };
        } else {
          iconContent = `<img src="/mappin_unfocused.svg" style="width: 24px; height: 24px;" />`;
          iconSize = { width: 24, height: 24 };
        }
      }

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(markerData.position.lat, markerData.position.lng),
        map: map,
        title: markerData.title,
        icon: {
          content: iconContent,
          size: new window.naver.maps.Size(iconSize.width, iconSize.height),
          anchor: new window.naver.maps.Point(iconSize.width / 2, iconSize.height / 2),
        },
      });

      // Add click event listener
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick?.(markerData.storeId);
      });

      return marker;
    });

    naverMarkersRef.current = newMarkers;
  }, [map, markers, selectedMarkerId, onMarkerClick]);

  // Update map center when center prop changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (map && typeof (map as any).setCenter === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).setCenter(new window.naver.maps.LatLng(center.lat, center.lng));
    }
  }, [map, center]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}