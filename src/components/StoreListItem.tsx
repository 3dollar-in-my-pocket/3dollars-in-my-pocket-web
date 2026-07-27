'use client';

// Store List Item — 홈 리스트 SDUI BASIC_CARD를 추가 API 호출 없이 렌더링한다.
import { useState } from 'react';
import { HomeListBasicCard } from '../models/HomeList';
import { SDChip } from '../models/HomeFilter';
import { SDTextContent } from './SDTextContent';

interface StoreListItemProps {
  card: HomeListBasicCard;
  onClick: () => void;
}

function Dot() {
  return <span style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: '#B7B7B7', flexShrink: 0 }} />;
}

function MetaChip({ chip }: { chip: SDChip }) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      {chip.image?.url && (
        <img
          src={chip.image.url}
          alt=""
          className="shrink-0"
          style={{ width: chip.image.style?.width || 14, height: chip.image.style?.height || 14 }}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      {chip.text?.text && (
        <span
          className="min-w-0 truncate"
          style={metaStyle(chip.text?.fontColor || '#787878')}
        >
          <SDTextContent value={chip.text} />
        </span>
      )}
      {chip.additionalText?.text && (
        <span className="shrink-0" style={metaStyle(chip.additionalText.fontColor || '#B7B7B7')}>
          <SDTextContent value={chip.additionalText} />
        </span>
      )}
    </span>
  );
}

export default function StoreListItem({ card, onClick }: StoreListItemProps) {
  const [images, setImages] = useState(() => card.images.slice(0, 3));
  const review = card.bodies.find((body) => body.text?.text);

  return (
    <div
      data-sheet-list-item
      onClick={onClick}
      className="w-full cursor-pointer active:bg-gray-50"
      style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F4F4F4' }}
    >
      {/* 헤더: 제목 + 뱃지 */}
      <div className="flex min-w-0 items-center gap-1">
        <span
          className="min-w-0 flex-1 truncate"
          style={{
            fontFamily: 'Pretendard',
            fontWeight: 700,
            fontSize: '16px',
            lineHeight: '24px',
            letterSpacing: '-0.01em',
            color: '#0F0F0F',
          }}
        >
          {card.header.title && <SDTextContent value={card.header.title} />}
        </span>
        {card.header.badge?.url && (
          <img
            src={card.header.badge.url}
            alt=""
            className="shrink-0"
            style={{
              width: card.header.badge.style?.width || 'auto',
              height: card.header.badge.style?.height || 16,
            }}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="flex min-w-0 items-center overflow-hidden" style={{ gap: '6px', marginTop: '4px' }}>
        {card.metadata.primary.map((chip, index) => (
          <span
            key={`primary-${index}`}
            className={`inline-flex min-w-0 items-center gap-1.5 ${index === 0 ? 'overflow-hidden' : 'shrink-0'}`}
          >
            {index > 0 && <Dot />}
            <MetaChip chip={chip} />
          </span>
        ))}
      </div>

      <div className="flex min-w-0 items-center overflow-hidden" style={{ gap: '6px', marginTop: '4px' }}>
        {card.metadata.secondary.map((chip, index) => (
          <span key={`secondary-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
            {index > 0 && <Dot />}
            <MetaChip chip={chip} />
          </span>
        ))}
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
              style={{
                flex: '1 1 0',
                minWidth: 0,
                height: '120px',
                objectFit: 'cover',
              }}
              onError={() => {
                setImages((currentImages) => currentImages.filter((image) => image.url !== img.url));
              }}
            />
          ))}
        </div>
      )}

      {/* 리뷰 (있으면): 회색 박스 2줄 */}
      {review && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: review.style?.backgroundColor,
            borderRadius: '12px',
            padding: '10px 12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontFamily: 'Pretendard',
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '18px',
              letterSpacing: '-0.01em',
              color: review.text.fontColor,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            <SDTextContent value={review.text} />
          </div>
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
