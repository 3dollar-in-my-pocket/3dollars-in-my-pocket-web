'use client';

// Store Preview Sheet — 앱의 StorePreviewBottomSheet 대응.
// 마커 탭 시 지도 위로 뜨는 별도 가게 상세 시트. SDUI 프리뷰(/screen/store/{id}/preview)를 렌더.
import { useEffect, useState } from 'react';
import { StoreSimpleWithExtraResponse } from '../models/Store';
import { SDChip } from '../models/HomeFilter';
import { StorePreviewSection } from '../models/StorePreview';
import { ApiService } from '../services/ApiService';

interface StorePreviewSheetProps {
  store: StoreSimpleWithExtraResponse | null; // non-null 이면 열림
  deviceLocation: { lat: number; lng: number };
  onClose: () => void;
  onOpenApp: (store: StoreSimpleWithExtraResponse) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

function MetaChip({ chip }: { chip: SDChip }) {
  const label = chip.text ? stripHtml(chip.text.text) : '';
  const color = chip.text?.fontColor || '#787878';
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      {chip.image?.url && (
        <img
          src={chip.image.url}
          alt=""
          style={{ width: chip.image.style?.width || 14, height: chip.image.style?.height || 14 }}
        />
      )}
      <span
        style={{
          fontFamily: 'Pretendard',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
          letterSpacing: '-0.01em',
          color,
        }}
      >
        {label}
      </span>
    </span>
  );
}

function Dot() {
  return <span style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#C4C4C4' }} />;
}

export default function StorePreviewSheet({
  store,
  deviceLocation,
  onClose,
  onOpenApp,
}: StorePreviewSheetProps) {
  // 프리뷰를 storeId 로 태깅해, 현재 store 와 일치할 때만 사용(스테일 방지, 이펙트 내 동기 setState 회피).
  const [preview, setPreview] = useState<{ storeId: string; data: StorePreviewSection | null } | null>(null);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    const storeId = store.store.storeId;
    ApiService.getInstance()
      .fetchStorePreview(storeId, deviceLocation.lat, deviceLocation.lng)
      .then((result) => {
        if (!cancelled) setPreview({ storeId, data: result });
      });
    return () => {
      cancelled = true;
    };
  }, [store, deviceLocation.lat, deviceLocation.lng]);

  if (!store) return null;

  const preview_ = preview?.storeId === store.store.storeId ? preview.data : null;
  const title = preview_?.header?.title ? stripHtml(preview_.header.title.text) : store.store.storeName;
  const primary = preview_?.metadata?.primary ?? [];
  const secondary = preview_?.metadata?.secondary ?? [];
  const images = preview_?.images ?? [];
  const bodies = (preview_?.bodies ?? []).filter((b) => b.text?.text);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full bg-white"
        style={{
          maxWidth: '520px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        }}
      >
        <div className="px-5 pt-5">
          {/* 제목 + 닫기 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={store.store.categories[0]?.imageUrl || '/default-category.png'}
                alt=""
                className="rounded-lg shrink-0"
                style={{ width: 32, height: 32, objectFit: 'cover' }}
              />
              <h2
                className="truncate"
                style={{
                  fontFamily: 'Pretendard',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  color: '#0F0F0F',
                }}
              >
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 flex items-center justify-center"
              style={{ width: 28, height: 28, fontSize: '20px', color: '#8E8E8E' }}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* 메타데이터 */}
          <div className="flex flex-col gap-1" style={{ marginTop: '10px' }}>
            {primary.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {primary.map((chip, i) => (
                  <div key={`p-${i}`} className="flex items-center gap-2">
                    {i > 0 && <Dot />}
                    <MetaChip chip={chip} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex items-center gap-2"
                style={{ fontFamily: 'Pretendard', fontWeight: 400, fontSize: '14px', color: '#787878' }}
              >
                <span>{store.store.categories.map((c) => c.name).join(', ')}</span>
                <Dot />
                <span>★ {store.extra.rating.toFixed(1)} ({store.extra.reviewsCount})</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {(secondary.length > 0
                ? secondary
                : ([
                    { text: { text: store.distanceM >= 1000 ? '1km +' : `${Math.round(store.distanceM)}m`, isHtml: false } },
                    { text: { text: `최근 방문 ${store.extra.reviewsCount}명`, isHtml: false } },
                  ] as SDChip[])
              ).map((chip, i) => (
                <div key={`s-${i}`} className="flex items-center gap-2">
                  {i > 0 && <Dot />}
                  <MetaChip chip={chip} />
                </div>
              ))}
            </div>
          </div>

          {/* 이미지 */}
          {images.length > 0 && (
            <div
              className="flex gap-2 overflow-x-auto scrollbar-hide"
              style={{ marginTop: '14px', scrollbarWidth: 'none' }}
            >
              {images.map((img, i) => (
                <img
                  key={`img-${i}`}
                  src={img.url}
                  alt=""
                  className="rounded-xl shrink-0"
                  style={{ width: 120, height: 120, objectFit: 'cover' }}
                />
              ))}
            </div>
          )}

          {/* 리뷰 스니펫 */}
          {bodies.length > 0 && (
            <div className="flex flex-col gap-1.5" style={{ marginTop: '14px' }}>
              {bodies.slice(0, 2).map((body, i) => (
                <div
                  key={`b-${i}`}
                  className="rounded-xl"
                  style={{
                    backgroundColor: '#F7F7F7',
                    padding: '10px 12px',
                    fontFamily: 'Pretendard',
                    fontWeight: 500,
                    fontSize: '13px',
                    lineHeight: '19px',
                    color: '#4B4B4B',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {stripHtml(body.text.text)}
                </div>
              ))}
            </div>
          )}

          {/* CTA: 앱에서 자세히 보기 */}
          <button
            onClick={() => onOpenApp(store)}
            className="w-full flex items-center justify-center"
            style={{
              marginTop: '18px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#FF5C43',
              color: '#FFFFFF',
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            앱에서 자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
}
