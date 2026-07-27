import { NextResponse } from 'next/server';
import { createApiUrl } from '@/src/server/upstream';

type JsonObject = Record<string, unknown>;

const asObject = (value: unknown): JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function selectText(value: unknown) {
  const text = asObject(value);
  if (typeof text.text !== 'string') return null;

  return {
    text: text.text,
    isHtml: text.isHtml === true,
    ...(typeof text.fontColor === 'string' ? { fontColor: text.fontColor } : {}),
  };
}

function selectImage(value: unknown) {
  const image = asObject(value);
  if (typeof image.url !== 'string') return null;
  const style = asObject(image.style);

  return {
    url: image.url,
    ...(
      typeof style.width === 'number' || typeof style.height === 'number'
        ? {
            style: {
              ...(typeof style.width === 'number' ? { width: style.width } : {}),
              ...(typeof style.height === 'number' ? { height: style.height } : {}),
            },
          }
        : {}
    ),
  };
}

function selectChip(value: unknown) {
  const chip = asObject(value);
  const text = selectText(chip.text);
  const image = selectImage(chip.image);
  const style = asObject(chip.style);
  const border = asObject(style.border);
  const hasStyle =
    typeof style.backgroundColor === 'string' ||
    typeof border.color === 'string';

  return {
    ...(text ? { text } : {}),
    ...(image ? { image } : {}),
    ...(hasStyle
      ? {
          style: {
            ...(typeof style.backgroundColor === 'string'
              ? { backgroundColor: style.backgroundColor }
              : {}),
            ...(typeof border.color === 'string'
              ? { border: { color: border.color } }
              : {}),
          },
        }
      : {}),
  };
}

function selectBar(value: unknown) {
  const bar = asObject(value);

  if (bar.type === 'CATEGORY_BAR') {
    return {
      type: 'CATEGORY_BAR' as const,
      categoriesFilter: selectChip(bar.categoriesFilter),
    };
  }

  if (bar.type === 'RADIO_BAR' && typeof bar.paramKey === 'string') {
    return {
      type: 'RADIO_BAR' as const,
      paramKey: bar.paramKey,
      options: asArray(bar.options).map((value) => {
        const option = asObject(value);
        return {
          ...(typeof option.paramValue === 'string'
            ? { paramValue: option.paramValue }
            : {}),
          chip: selectChip(option.chip),
        };
      }),
    };
  }

  return null;
}

// 홈 필터 화면 프록시
export async function GET() {
  try {
    const response = await fetch(createApiUrl('/api/v1/screen/home'), {
      headers: { 'Content-Type': 'application/json' },
      // 필터 구성은 자주 바뀌지 않으므로 짧게 캐시.
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch home filter screen' },
        { status: response.status }
      );
    }

    const payload = asObject(await response.json());
    const data = asObject(payload.data);
    const sections = asArray(data.sections).flatMap((value) => {
      const section = asObject(value);
      if (section.type !== 'HOME_FILTER') return [];

      return [{
        type: 'HOME_FILTER',
        bars: asArray(section.bars)
          .map(selectBar)
          .filter((bar) => bar !== null),
      }];
    });

    return NextResponse.json({ data: { sections } });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch home filter screen' },
      { status: 500 }
    );
  }
}
