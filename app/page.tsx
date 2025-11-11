'use client';

import { useState, useEffect } from 'react';
import NaverMap from '../src/components/NaverMap';
import StoreCarousel from '../src/components/StoreCarousel';
import { StoreSimpleWithExtraResponse } from '../src/models/Store';
import { MapMarker } from '../src/models/Marker';
import { ApiService } from '../src/services/ApiService';
import { LocationService } from '../src/services/LocationService';

export default function Home() {
  const [stores, setStores] = useState<StoreSimpleWithExtraResponse[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [currentAddress, setCurrentAddress] = useState('위치를 확인하는 중...');
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  // Initialize location and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Get current location
        const location = await LocationService.getInstance().getCurrentLocation();
        setMapCenter({ lat: location.latitude, lng: location.longitude });
        
        // Get address for current location
        const address = await LocationService.getInstance().getAddressFromCoordinates(
          location.latitude, 
          location.longitude
        );
        setCurrentAddress(address);
        
        // Fetch nearby stores
        const nearbyStores = await ApiService.getInstance().fetchNearbyStores(
          location.latitude,
          location.longitude,
          location.latitude,
          location.longitude
        );

        setStores(nearbyStores);
        
        // Select first store if available
        if (stores.length > 0) {
          setSelectedStoreId(stores[0].store.storeId);
        }
        
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

  return (
    <div className="w-full h-screen relative bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Map Container - Full screen */}
      <div className="absolute inset-0">
        <NaverMap
          markers={mapMarkers}
          center={mapCenter}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={selectedStoreId}
        />
      </div>
        
      {/* Address Header - Floating on top of map */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-4">
        <div className="bg-white px-4 py-3 shadow-sm" style={{borderRadius: '9px'}}>
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

      {/* Store Carousel at Bottom - Floating over map */}
      <div className="absolute left-0 right-0 z-20" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <StoreCarousel
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
        />
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-30">
          <div className="text-gray-600">주변 가게를 찾는 중...</div>
        </div>
      )}
    </div>
  );
}
