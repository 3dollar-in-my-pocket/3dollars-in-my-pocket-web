'use client';

// Category Picker — 앱의 CategoryFilterViewController 대응. 카테고리 선택 바텀시트.
import { StoreCategory } from '../models/HomeFilter';

interface CategoryPickerModalProps {
  isOpen: boolean;
  categories: StoreCategory[];
  selectedCategoryId: string | null;
  onSelect: (category: StoreCategory | null) => void;
  onClose: () => void;
}

export default function CategoryPickerModal({
  isOpen,
  categories,
  selectedCategoryId,
  onSelect,
  onClose,
}: CategoryPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-[520px] bg-white"
        style={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '70vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span
            style={{
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: '18px',
              color: '#171717',
            }}
          >
            음식 종류
          </span>
          <button
            onClick={onClose}
            style={{ fontSize: '20px', lineHeight: 1, color: '#8E8E8E' }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div
          className="overflow-y-auto px-5 pb-6"
          style={{ maxHeight: 'calc(70vh - 64px)' }}
        >
          <div className="grid grid-cols-4 gap-3">
            {/* 전체 (필터 해제) */}
            <button
              onClick={() => onSelect(null)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl"
              style={{
                border: selectedCategoryId === null ? '1px solid #FF5C43' : '1px solid transparent',
                backgroundColor: selectedCategoryId === null ? '#FFF3F4' : 'transparent',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: 40, height: 40, fontSize: '22px' }}
              >
                🍽️
              </div>
              <span
                style={{
                  fontFamily: 'Pretendard',
                  fontWeight: 500,
                  fontSize: '12px',
                  color: selectedCategoryId === null ? '#FF5C43' : '#5A5A5A',
                }}
              >
                전체
              </span>
            </button>

            {categories.map((category) => {
              const isSelected = category.categoryId === selectedCategoryId;
              return (
                <button
                  key={category.categoryId}
                  onClick={() => onSelect(category)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl"
                  style={{
                    border: isSelected ? '1px solid #FF5C43' : '1px solid transparent',
                    backgroundColor: isSelected ? '#FFF3F4' : 'transparent',
                  }}
                >
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    style={{ width: 40, height: 40, objectFit: 'contain' }}
                  />
                  <span
                    className="text-center truncate w-full"
                    style={{
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '12px',
                      color: isSelected ? '#FF5C43' : '#5A5A5A',
                    }}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
