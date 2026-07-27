'use client';

// Store Preview Sheet — 앱의 StorePreviewBottomSheet 대응.
// 마커 탭 시 지도 위로 뜨는 별도 가게 상세 시트. home-list의 BASIC_CARD를 렌더.
import { useCallback, useEffect, useRef, useState } from 'react';
import { HomeListBasicCard } from '../models/HomeList';
import { SDChip } from '../models/HomeFilter';
import { SDTextContent } from './SDTextContent';

interface StorePreviewSheetProps {
  card: HomeListBasicCard | null; // non-null 이면 열림
  onClose: () => void;
  onOpenApp: (card: HomeListBasicCard) => void;
}

function MetaChip({ chip }: { chip: SDChip }) {
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
        {chip.text && <SDTextContent value={chip.text} />}
      </span>
    </span>
  );
}

function Dot() {
  return <span style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#C4C4C4' }} />;
}

export default function StorePreviewSheet({
  card,
  onClose,
  onOpenApp,
}: StorePreviewSheetProps) {
  const images = card?.images ?? [];
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const showPreviousImage = useCallback(() => {
    setViewerIndex((index) => (
      index === null ? null : (index - 1 + images.length) % images.length
    ));
  }, [images.length]);
  const showNextImage = useCallback(() => {
    setViewerIndex((index) => (
      index === null ? null : (index + 1) % images.length
    ));
  }, [images.length]);

  useEffect(() => {
    if (!card) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewerIndex !== null) closeViewer();
        else onClose();
      } else if (viewerIndex !== null && event.key === 'ArrowLeft') {
        showPreviousImage();
      } else if (viewerIndex !== null && event.key === 'ArrowRight') {
        showNextImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, closeViewer, onClose, showNextImage, showPreviousImage, viewerIndex]);

  if (!card) return null;

  const title = card.header?.title;
  const primary = card.metadata?.primary ?? [];
  const secondary = card.metadata?.secondary ?? [];
  const bodies = (card.bodies ?? []).filter((body) => body.text?.text);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
      {/* Sheet */}
      <div
        className="pointer-events-auto relative w-full overflow-y-auto bg-white"
        style={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '100dvh',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        }}
      >
        <div className="px-5 pt-5">
          {/* 제목 + 닫기 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {primary[0]?.image?.url && (
                <img
                  src={primary[0].image.url}
                  alt=""
                  className="rounded-lg shrink-0"
                  style={{ width: 32, height: 32, objectFit: 'cover' }}
                />
              )}
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
                {title && <SDTextContent value={title} />}
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
            {primary.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {primary.map((chip, i) => (
                  <div key={`p-${i}`} className="flex items-center gap-2">
                    {i > 0 && <Dot />}
                    <MetaChip chip={chip} />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {secondary.map((chip, i) => (
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
                <button
                  key={`img-${i}`}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  className="relative rounded-xl shrink-0 overflow-hidden"
                  style={{ width: 120, height: 120 }}
                  aria-label={`${i + 1}번째 가게 이미지 크게 보기`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* 리뷰 스니펫 */}
          {bodies.length > 0 && (
            <div
              className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ marginTop: '14px', scrollbarWidth: 'none' }}
            >
              {bodies.map((body, i) => (
                <div
                  key={`b-${i}`}
                  className="rounded-xl shrink-0 snap-start"
                  style={{
                    width: bodies.length > 1 ? '85%' : '100%',
                    backgroundColor: '#F7F7F7',
                    padding: '10px 12px',
                    fontFamily: 'Pretendard',
                    fontWeight: 500,
                    fontSize: '13px',
                    lineHeight: '18px',
                    letterSpacing: '-0.01em',
                    color: '#4B4B4B',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  <SDTextContent value={body.text} />
                </div>
              ))}
            </div>
          )}

          {/* CTA: 앱에서 자세히 보기 */}
          <button
            onClick={() => onOpenApp(card)}
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

      {viewerIndex !== null && images[viewerIndex] && (
        <div
          className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="가게 이미지 확대 보기"
          onClick={closeViewer}
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartXRef.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartXRef.current = null;
            if (startX === null || endX === undefined || images.length < 2) return;
            const distance = endX - startX;
            if (Math.abs(distance) < 48) return;
            if (distance > 0) showPreviousImage();
            else showNextImage();
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeViewer();
            }}
            className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full bg-black/45 text-white"
            style={{
              width: 44,
              height: 44,
              fontSize: 28,
              top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            }}
            aria-label="이미지 확대 보기 닫기"
          >
            ×
          </button>

          <img
            src={images[viewerIndex].url}
            alt={`${viewerIndex + 1}번째 가게 이미지`}
            className="max-h-full max-w-full select-none"
            style={{ objectFit: 'contain' }}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                className="absolute left-3 flex items-center justify-center rounded-full bg-black/45 text-white"
                style={{ width: 44, height: 44, fontSize: 30 }}
                aria-label="이전 이미지"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                className="absolute right-3 flex items-center justify-center rounded-full bg-black/45 text-white"
                style={{ width: 44, height: 44, fontSize: 30 }}
                aria-label="다음 이미지"
              >
                ›
              </button>
              <div
                className="absolute bottom-5 rounded-full bg-black/55 px-3 py-1 text-white"
                style={{
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
                  fontFamily: 'Pretendard',
                  fontSize: 13,
                }}
              >
                {viewerIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
