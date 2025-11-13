'use client';

// Store Carousel Component - similar to iOS UIScrollView horizontal
import { useRef, useEffect } from 'react';
import { StoreSimpleWithExtraResponse } from '../models/Store';
import StoreCard from './StoreCard';

interface StoreCarouselProps {
  stores: StoreSimpleWithExtraResponse[];
  selectedStoreId?: string;
  onStoreSelect: (storeId: string) => void;
}

export default function StoreCarousel({ stores, selectedStoreId, onStoreSelect }: StoreCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected card
  useEffect(() => {
    if (selectedStoreId && scrollRef.current) {
      const selectedIndex = stores.findIndex(store => store.store.storeId === selectedStoreId);
      if (selectedIndex !== -1) {
        const cardWidth = 280 + 12; // card width + gap
        const scrollPosition = selectedIndex * cardWidth - (scrollRef.current.clientWidth / 2) + (cardWidth / 2);
        
        scrollRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedStoreId, stores]);

  // Handle store card click - select first, navigate on second click
  const handleStoreCardClick = (store: StoreSimpleWithExtraResponse) => {
    const isCurrentlySelected = store.store.storeId === selectedStoreId;
    
    if (isCurrentlySelected) {
      // Already selected - navigate to external URL
      const storeType = store.store.storeType;
      const storeId = store.store.storeId;
      const url = `https://app.threedollars.co.kr/store?storeType=${storeType}&storeId=${storeId}`;
      window.open(url, '_blank');
    } else {
      // Not selected - just select the card
      onStoreSelect(store.store.storeId);
    }
  };

  if (stores.length === 0) {
    return (
      <div className="w-full bg-transparent px-6 py-9">
        <div className="bg-white rounded-2xl h-26 flex items-center px-4" style={{ height: '104px' }}>
          <div className="flex items-center">
            <img 
              src="/image_empty.svg" 
              alt="주변에 가게가 없어요" 
              width={80} 
              height={80}
              className="mr-4"
            />
            <div>
              <div className="text-gray-900 text-lg font-medium mb-1">
                주변 2km 이내에 가게가 없어요
              </div>
              <div className="text-gray-600 text-sm">
                다른 주소로 검색하거나 직접 제보해보세요!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent">
      {/* 이 동네 가게 소식 header - removed as per requirements */}
      
      {/* Horizontally scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 py-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {stores.map((store) => (
          <StoreCard
            key={store.store.storeId}
            store={store}
            isSelected={store.store.storeId === selectedStoreId}
            onClick={() => handleStoreCardClick(store)}
          />
        ))}
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}