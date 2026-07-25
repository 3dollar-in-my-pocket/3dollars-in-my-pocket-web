'use client';

// Store Card Component - similar to iOS UICollectionViewCell
import { StoreSimpleWithExtraResponse, StoreType } from '../models/Store';

interface StoreCardProps {
  store: StoreSimpleWithExtraResponse;
  isSelected: boolean;
  onClick: () => void;
}

// 작은 뱃지 칩 (NEW / 쿠폰 / 사장님 직영 / 인증).
function Badge({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{
        height: '18px',
        padding: '0 6px',
        borderRadius: '9px',
        backgroundColor: background,
        color,
        fontFamily: 'Pretendard',
        fontWeight: 600,
        fontSize: '10px',
        lineHeight: '18px',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </span>
  );
}

export default function StoreCard({ store, isSelected, onClick }: StoreCardProps) {
  const { tags, visitCounts, rating, reviewsCount } = store.extra;
  const isBoss = store.store.storeType === StoreType.bossStore;
  const isVerified = tags.isVerifiedStore || visitCounts.isCertified;
  const openStatus = store.openStatus.status;

  return (
    <div
      className="min-w-[280px] w-[280px] h-[140px] p-2 rounded-2xl cursor-pointer transition-all duration-200 text-white"
      style={{
        backgroundColor: '#0F0F0F',
        marginRight: '12px',
        border: isSelected ? '1.5px solid #FF5C43' : '1.5px solid transparent',
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 h-full">
        <img
          src={store.store.categories[0]?.imageUrl || '/default-category.png'}
          alt="category"
          className="w-12 h-12 object-cover rounded-lg shrink-0"
        />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* 카테고리 태그 + 뱃지 */}
          <div className="flex items-center gap-1 overflow-hidden">
            <span
              className="truncate"
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '18px',
                letterSpacing: '-0.01em',
                color: '#B7B7B7',
              }}
            >
              {store.store.categories.slice(0, 2).map((cat) => `#${cat.name}`).join(' ')}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {tags.isNew && <Badge label="NEW" color="#FFFFFF" background="#FF5C43" />}
              {tags.hasIssuableCoupon && <Badge label="쿠폰" color="#FFFFFF" background="#FF9500" />}
              {isBoss && <Badge label="사장님" color="#0F0F0F" background="#4CD964" />}
              {isVerified && <Badge label="인증" color="#FFFFFF" background="#2E2E2E" />}
            </div>
          </div>

          {/* 가게 이름 */}
          <h3
            className="truncate"
            style={{
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
            }}
          >
            {store.store.storeName}
          </h3>

          {/* 영업 상태 + 최근 방문 */}
          <div className="flex items-center gap-1.5" style={{ marginTop: '2px' }}>
            {openStatus === 'OPEN' && (
              <span
                className="inline-flex items-center"
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(76, 217, 100, 0.15)',
                  color: '#4CD964',
                  fontFamily: 'Pretendard',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                영업중
              </span>
            )}
            {openStatus === 'CLOSED' && (
              <span
                className="inline-flex items-center"
                style={{
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '12px',
                  backgroundColor: '#2E2E2E',
                  color: '#8E8E8E',
                  fontFamily: 'Pretendard',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                영업종료
              </span>
            )}
            <span
              className="inline-flex items-center"
              style={{
                height: '24px',
                padding: '0 8px',
                borderRadius: '12px',
                backgroundColor: '#2E2E2E',
                fontFamily: 'Pretendard',
                fontWeight: 500,
                fontSize: '12px',
                color: '#FFFFFF',
              }}
            >
              최근 방문 {reviewsCount}명
            </span>
          </div>

          {/* 별점 · 리뷰 · 거리 */}
          <div className="flex items-center gap-1" style={{ marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#FFCC00' }}>★</span>
            <span
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '18px',
                color: '#B7B7B7',
              }}
            >
              {rating.toFixed(1)}
            </span>
            <Divider />
            <img src="/review.svg" alt="review" className="w-3 h-3" />
            <span
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '18px',
                color: '#B7B7B7',
              }}
            >
              {reviewsCount}개
            </span>
            <Divider />
            <img src="/location_soild.svg" alt="location" className="w-3 h-3" />
            <span
              style={{
                fontFamily: 'Pretendard',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '18px',
                color: '#B7B7B7',
              }}
            >
              {store.distanceM >= 1000 ? '1km +' : `${Math.round(store.distanceM)}m`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="mx-1"
      style={{ width: '1px', height: '8px', backgroundColor: '#5A5A5A' }}
    />
  );
}
