'use client';

// Store List Item — 앱 홈 리스트(HomeListStoreCell) / Figma ver4.0.0 가이드 대응.
// 텍스트 헤더 + 메타 2줄(항상) + 이미지 행(있으면) + 리뷰 박스(있으면). 4가지 케이스 레이아웃.
// 헤더/메타는 nearby 데이터로 즉시 렌더, 이미지/리뷰는 가시 시 preview 엔드포인트로 지연 로드.
import { useEffect, useRef, useState } from 'react';
import { StoreSimpleWithExtraResponse, StoreType } from '../models/Store';
import { StorePreviewSection } from '../models/StorePreview';
import { ApiService } from '../services/ApiService';

interface StoreListItemProps {
  store: StoreSimpleWithExtraResponse;
  deviceLocation: { lat: number; lng: number };
  onClick: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function Dot() {
  return <span style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#B7B7B7', flexShrink: 0 }} />;
}

function Badge({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <span
      className="inline-flex items-center shrink-0"
      style={{
        height: '16px',
        padding: '0 5px',
        borderRadius: '8px',
        backgroundColor: background,
        color,
        fontFamily: 'Pretendard',
        fontWeight: 600,
        fontSize: '10px',
        lineHeight: '16px',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </span>
  );
}

export default function StoreListItem({ store, deviceLocation, onClick }: StoreListItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const [preview, setPreview] = useState<StorePreviewSection | null>(null);

  // 가시 영역에 들어오면 preview 를 한 번만 로드(이미지/리뷰).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true;
          io.disconnect();
          ApiService.getInstance()
            .fetchStorePreview(store.store.storeId, deviceLocation.lat, deviceLocation.lng)
            .then(setPreview);
        }
      },
      { rootMargin: '150px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [store.store.storeId, deviceLocation.lat, deviceLocation.lng]);

  const { tags, visitCounts, rating, reviewsCount } = store.extra;
  const isBoss = store.store.storeType === StoreType.bossStore;
  const category = store.store.categories[0]?.name ?? '';
  const openStatus = store.openStatus.status;
  const distanceText = store.distanceM >= 1000 ? '1km +' : `${Math.round(store.distanceM)}m`;

  const images = (preview?.images ?? []).slice(0, 3);
  const reviewText = preview?.bodies?.find((b) => b.text?.text)?.text.text;

  return (
    <div
      ref={rootRef}
      onClick={onClick}
      className="w-full cursor-pointer active:bg-gray-50"
      style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F4F4F4' }}
    >
      {/* 헤더: 제목 + 뱃지 */}
      <div className="flex items-center gap-1">
        <span
          className="truncate"
          style={{
            fontFamily: 'Pretendard',
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '-0.01em',
            color: '#0F0F0F',
          }}
        >
          {store.store.storeName}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {tags.isNew && <Badge label="NEW" color="#FFFFFF" background="#FF5C43" />}
          {tags.hasIssuableCoupon && <Badge label="쿠폰" color="#FFFFFF" background="#FF9500" />}
          {isBoss && <Badge label="사장님" color="#12923C" background="#E6F7EC" />}
        </div>
      </div>

      {/* 1차 메타: 카테고리 · ★평점 (리뷰수) */}
      <div className="flex items-center" style={{ gap: '6px', marginTop: '4px' }}>
        {category && <span style={metaStyle('#787878')}>{category}</span>}
        {category && <Dot />}
        <span className="flex items-center gap-1">
          <span style={{ fontSize: '12px', color: '#FFB020', lineHeight: 1 }}>★</span>
          <span style={metaStyle('#5A5A5A')}>{rating.toFixed(1)}</span>
          <span style={metaStyle('#B7B7B7')}>({reviewsCount})</span>
        </span>
      </div>

      {/* 2차 메타: 영업상태 · 거리 · 최근 방문 */}
      <div className="flex items-center" style={{ gap: '6px', marginTop: '4px' }}>
        {openStatus === 'OPEN' && <span style={metaStyle('#232323')}>영업 중</span>}
        {openStatus === 'CLOSED' && <span style={metaStyle('#B7B7B7')}>영업 종료</span>}
        {openStatus !== 'UNKNOWN' && <Dot />}
        <span style={metaStyle('#787878')}>{distanceText}</span>
        <Dot />
        <span style={metaStyle('#787878')}>최근 방문 {visitCounts.existsCounts}명</span>
      </div>

      {/* 이미지 (있으면): 3-up */}
      {images.length > 0 && (
        <div className="flex" style={{ gap: '4px', marginTop: '8px', height: '120px' }}>
          {images.map((img, i) => (
            <img
              key={`img-${i}`}
              src={img.url}
              alt=""
              className="rounded-lg"
              style={{ flex: 1, minWidth: 0, height: '120px', objectFit: 'cover' }}
            />
          ))}
        </div>
      )}

      {/* 리뷰 (있으면): 회색 박스 2줄 */}
      {reviewText && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: '#F4F4F4',
            borderRadius: '12px',
            padding: '10px 12px',
            fontFamily: 'Pretendard',
            fontWeight: 500,
            fontSize: '13px',
            lineHeight: '18px',
            letterSpacing: '-0.01em',
            color: '#5A5A5A',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {stripHtml(reviewText)}
        </div>
      )}
    </div>
  );
}

function metaStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'Pretendard',
    fontWeight: 400,
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '-0.01em',
    color,
    flexShrink: 0,
  };
}
