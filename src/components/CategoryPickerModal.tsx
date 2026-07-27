'use client';

// Category Picker — 앱의 CategoryFilterViewController 대응. 카테고리 선택 바텀시트.
// classification 으로 섹션 그룹핑, 4열 그리드, 이름 최대 2줄. "전체" 항목 없음(재선택 시 해제=전체).
import { useEffect, useMemo, useRef } from 'react';
import { StoreCategory } from '../models/HomeFilter';

interface CategoryPickerModalProps {
  isOpen: boolean;
  categories: StoreCategory[];
  selectedCategoryId: string | null;
  onSelect: (category: StoreCategory | null) => void;
  onClose: () => void;
}

const CATEGORY_FILTER_TITLE = '이 안에 네 최애 하나쯤은 있겠지!';

interface CategorySection {
  key: string;
  title: string;
  priority: number;
  items: StoreCategory[];
}

export default function CategoryPickerModal({
  isOpen,
  categories,
  selectedCategoryId,
  onSelect,
  onClose,
}: CategoryPickerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusableElements = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );

    const focusableElements = getFocusableElements();
    (focusableElements[0] ?? dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const elements = getFocusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  // classification 으로 그룹핑 후 priority 오름차순 정렬. 섹션 제목 = classification.description.
  const sections = useMemo<CategorySection[]>(() => {
    const groups = new Map<string, CategorySection>();
    for (const category of categories) {
      const cls = category.classification;
      const key = cls?.type ?? 'ETC';
      if (!groups.has(key)) {
        groups.set(key, { key, title: cls?.description ?? '기타', priority: cls?.priority ?? 999, items: [] });
      }
      groups.get(key)!.items.push(category);
    }
    return Array.from(groups.values()).sort((a, b) => a.priority - b.priority);
  }, [categories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Bottom sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-filter-title"
        tabIndex={-1}
        className="relative w-full max-w-[520px] bg-white flex flex-col"
        style={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* 헤더 (타이틀) */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <span
            id="category-filter-title"
            style={{
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: '26px',
              letterSpacing: '-0.01em',
              color: '#0F0F0F',
            }}
          >
            {CATEGORY_FILTER_TITLE}
          </span>
          <button
            onClick={onClose}
            className="shrink-0"
            style={{ fontSize: '20px', lineHeight: 1, color: '#8E8E8E' }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 섹션별 카테고리 그리드 */}
        <div className="overflow-y-auto px-5 pb-6 scrollbar-hide">
          {sections.map((section) => (
            <div key={section.key} style={{ marginTop: '16px' }}>
              <div
                style={{
                  fontFamily: 'Pretendard',
                  fontWeight: 600,
                  fontSize: '15px',
                  lineHeight: '22px',
                  letterSpacing: '-0.01em',
                  color: '#232323',
                  marginBottom: '12px',
                }}
              >
                {section.title}
              </div>
              <div className="grid grid-cols-4" style={{ columnGap: '12px', rowGap: '16px' }}>
                {section.items.map((category) => {
                  const isSelected = category.categoryId === selectedCategoryId;
                  return (
                    <button
                      key={category.categoryId}
                      // 이미 선택된 카테고리를 다시 누르면 해제(=전체).
                      onClick={() => onSelect(isSelected ? null : category)}
                      className="flex flex-col items-center gap-1.5"
                    >
                      {/* 아이콘 영역: 선택 시 원형 border + 옅은 배경, NEW 뱃지(좌측 상단) */}
                      <div className="relative flex items-center justify-center" style={{ width: 58, height: 58 }}>
                        {isSelected && (
                          <div
                            className="absolute inset-0"
                            style={{ borderRadius: '50%', backgroundColor: '#FFF3F4', border: '1px solid #FF858F' }}
                          />
                        )}
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="relative"
                          style={{ width: 56, height: 56, objectFit: 'contain', zIndex: 1 }}
                        />
                        {category.isNew && (
                          <span
                            className="absolute"
                            style={{
                              top: 0,
                              left: 0,
                              zIndex: 2,
                              height: '15px',
                              padding: '0 5px',
                              borderRadius: '7px',
                              backgroundColor: '#FF5C43',
                              color: '#FFFFFF',
                              fontFamily: 'Pretendard',
                              fontWeight: 700,
                              fontSize: '9px',
                              lineHeight: '15px',
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <span
                        className="text-center"
                        style={{
                          fontFamily: 'Pretendard',
                          fontWeight: 500,
                          fontSize: '12px',
                          lineHeight: '16px',
                          letterSpacing: '-0.01em',
                          color: '#5A5A5A',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'keep-all',
                        }}
                      >
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
