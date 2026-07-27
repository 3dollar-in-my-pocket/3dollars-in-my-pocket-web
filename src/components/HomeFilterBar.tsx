'use client';

// Home Filter Bar — 앱의 HomeFilterCollectionView(SDUI) 대응.
// 서버(/api/v1/screen/home)가 내려주는 칩을 그대로 렌더링한다.
import {
  HomeFilterBar as HomeFilterBarType,
  HomeFilterRadioBar,
  HomeFilterRadioOption,
  HomeFilterSection,
  HomeFilterState,
  SDChip,
  StoreCategory,
} from '../models/HomeFilter';
import { SDTextContent } from './SDTextContent';

interface HomeFilterBarProps {
  sections: HomeFilterSection[];
  filter: HomeFilterState;
  selectedCategory: StoreCategory | null;
  onChangeRadio: (paramKey: string, paramValue: string | null) => void;
  onOpenCategory: () => void;
  onClearCategory: () => void;
}

// 현재 필터 상태에서 해당 라디오 바의 선택된 값.
function currentValueFor(paramKey: string, filter: HomeFilterState): string | null {
  switch (paramKey) {
    case 'sortType':
      return filter.sortType;
    case 'filterConditions':
      return filter.filterConditions;
    case 'filterOpenStatuses':
      return filter.filterOpenStatuses;
    case 'targetStores':
      return filter.targetStores;
    default:
      return null;
  }
}

function normalize(value: string | null | undefined): string | null {
  return value ?? null;
}

function ChipView({
  chip,
  fallbackText,
  onClick,
}: {
  chip: SDChip;
  fallbackText?: string;
  onClick: () => void;
}) {
  const textColor = chip.text?.fontColor || '#5A5A5A';
  const backgroundColor = chip.style?.backgroundColor || '#FFFFFF';
  const borderColor = chip.style?.border?.color || '#E2E2E2';

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 whitespace-nowrap shrink-0"
      style={{
        height: '34px',
        padding: '0 12px',
        borderRadius: '17px',
        backgroundColor,
        border: `1px solid ${borderColor}`,
        fontFamily: 'Pretendard',
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '18px',
        letterSpacing: '-0.01em',
        color: textColor,
      }}
    >
      {chip.image?.url && (
        <img
          src={chip.image.url}
          alt=""
          style={{
            width: chip.image.style?.width || 16,
            height: chip.image.style?.height || 16,
          }}
        />
      )}
      {chip.text ? <SDTextContent value={chip.text} /> : fallbackText}
    </button>
  );
}

export default function HomeFilterBar({
  sections,
  filter,
  selectedCategory,
  onChangeRadio,
  onOpenCategory,
  onClearCategory,
}: HomeFilterBarProps) {
  const bars: HomeFilterBarType[] = sections.flatMap((section) =>
    'bars' in section ? (section.bars as HomeFilterBarType[]) : []
  );

  if (bars.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
      // 좌우 패딩 없이 화면 끝까지 스크롤되되, 내부 패딩으로 첫 칩 시작 위치는 유지.
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingLeft: '20px', paddingRight: '20px' }}
    >
      {bars.map((bar, index) => {
        if (bar.type === 'CATEGORY_BAR') {
          const categoryBar = bar as { categoriesFilter: SDChip };
          return (
            <div key={`category-${index}`} className="flex items-center gap-2 shrink-0">
              <ChipView
                chip={categoryBar.categoriesFilter}
                fallbackText="음식 종류"
                onClick={onOpenCategory}
              />
              {selectedCategory && (
                <button
                  onClick={onClearCategory}
                  className="flex items-center gap-1 whitespace-nowrap shrink-0"
                  style={{
                    height: '34px',
                    padding: '0 10px 0 12px',
                    borderRadius: '17px',
                    backgroundColor: '#FFF3F4',
                    border: '1px solid #FF858F',
                    fontFamily: 'Pretendard',
                    fontWeight: 500,
                    fontSize: '12px',
                    color: '#FF5C43',
                  }}
                >
                  {selectedCategory.imageUrl && (
                    <img src={selectedCategory.imageUrl} alt="" style={{ width: 16, height: 16 }} />
                  )}
                  {selectedCategory.name}
                  <span style={{ fontSize: '14px', lineHeight: 1, marginLeft: '2px' }}>×</span>
                </button>
              )}
            </div>
          );
        }

        if (bar.type === 'RADIO_BAR') {
          const radioBar = bar as HomeFilterRadioBar;
          const options = radioBar.options || [];
          if (options.length === 0) return null;

          const currentValue = currentValueFor(radioBar.paramKey, filter);
          let selectedIndex = options.findIndex(
            (opt: HomeFilterRadioOption) => normalize(opt.paramValue) === currentValue
          );
          if (selectedIndex === -1) selectedIndex = 0;

          const currentOption = options[selectedIndex];
          const nextIndex = (selectedIndex + 1) % options.length;
          const nextValue = normalize(options[nextIndex].paramValue);
          return (
            <ChipView
              key={`${radioBar.paramKey}-${index}`}
              chip={currentOption.chip}
              onClick={() => onChangeRadio(radioBar.paramKey, nextValue)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
