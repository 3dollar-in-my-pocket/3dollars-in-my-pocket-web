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
        const cardWidth = 280 + 32; // card width + gap
        const scrollPosition = selectedIndex * cardWidth - (scrollRef.current.clientWidth / 2) + (cardWidth / 2);
        
        scrollRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedStoreId, stores]);

  if (stores.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-transparent">
      {/* 이 동네 가게 소식 header - removed as per requirements */}
      
      {/* Horizontally scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto overflow-y-hidden scrollbar-hide px-4 py-9"
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
            onClick={() => onStoreSelect(store.store.storeId)}
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