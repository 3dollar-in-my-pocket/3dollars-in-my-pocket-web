'use client';

// Store Card Component - similar to iOS UICollectionViewCell
import { StoreSimpleWithExtraResponse } from '../models/Store';

interface StoreCardProps {
  store: StoreSimpleWithExtraResponse;
  isSelected: boolean;
  onClick: () => void;
}

export default function StoreCard({ store, isSelected, onClick }: StoreCardProps) {
  return (
    <div
      className="min-w-[280px] w-[280px] h-[140px] p-2 rounded-2xl cursor-pointer transition-all duration-200 text-white"
      style={{ backgroundColor: '#0F0F0F', marginRight: '12px' }}
      onClick={onClick}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Store info */}
        <div>
          <div className="flex items-start gap-2 mb-3">
            <img 
              src={store.store.categories[0]?.imageUrl || '/default-category.png'} 
              alt="category" 
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div className="flex flex-col gap-1">
              <span 
                className="text-sm"
                style={{
                  fontFamily: 'Pretendard',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '18px',
                  letterSpacing: '-0.01em',
                  color: '#B7B7B7'
                }}
              >
                {store.store.categories.slice(0, 2).map(cat => `#${cat.name}`).join(' ')}
              </span>
              
              <h3 
                className="text-lg font-bold truncate"
                style={{
                  fontFamily: 'Pretendard',
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: '24px',
                  letterSpacing: '-0.01em',
                  color: '#FFFFFF',
                  maxWidth: '200px'
                }}
              >
                {store.store.storeName}
              </h3>
              
              <div className="flex flex-col gap-2" style={{ marginTop: '4px' }}>
                <p 
                  className="text-sm inline-block w-fit px-3 py-1"
                  style={{
                    backgroundColor: '#2E2E2E',
                    borderRadius: '12px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'Pretendard',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '18px',
                    letterSpacing: '-0.01em',
                    textAlign: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  최근 방문 {store.extra.reviewsCount}명
                </p>
                
                <div className="flex items-center gap-1" style={{ marginBottom: '12px' }}>
                  <img src="/review.svg" alt="review" className="w-3 h-3" />
                  <span 
                    className="text-sm"
                    style={{
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '12px',
                      lineHeight: '18px',
                      letterSpacing: '-0.01em',
                      color: '#B7B7B7'
                    }}
                  >
                    {store.extra.reviewsCount}개
                  </span>
                  <div 
                    className="mx-1"
                    style={{
                      width: '1px',
                      height: '8px',
                      backgroundColor: '#5A5A5A'
                    }}
                  ></div>
                  <img src="/location_soild.svg" alt="location" className="w-3 h-3" />
                  <span 
                    className="text-sm"
                    style={{
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '12px',
                      lineHeight: '18px',
                      letterSpacing: '-0.01em',
                      color: '#B7B7B7'
                    }}
                  >
                    {store.distanceM >= 1000 ? '1km +' : `${Math.round(store.distanceM)}m`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}