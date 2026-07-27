import { NextRequest, NextResponse } from 'next/server';
import { createApiUrl, getDeviceLocationHeaders } from '@/src/server/upstream';
import {
  DEFAULT_HOME_DISTANCE_M,
  MAX_HOME_DISTANCE_M,
} from '@/src/constants/HomeMap';

type JsonObject = Record<string, unknown>;

const FORWARDED_PARAMS = [
  'sortType',
  'filterCertifiedStores',
  'filterOpenStatuses',
  'categoryIds',
  'targetStores',
  'filterConditions',
  'filterMinReviewRating',
  'cursor',
] as const;

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
  const image = selectImage(chip.image);
  const text = selectText(chip.text);
  const additionalText = selectText(chip.additionalText);

  return {
    ...(image ? { image } : {}),
    ...(text ? { text } : {}),
    ...(additionalText ? { additionalText } : {}),
  };
}

function selectBody(value: unknown) {
  const body = asObject(value);
  const text = selectText(body.text);
  if (!text) return null;
  const style = asObject(body.style);

  return {
    text,
    ...(typeof style.backgroundColor === 'string'
      ? { style: { backgroundColor: style.backgroundColor } }
      : {}),
  };
}

function selectLink(value: unknown) {
  const link = asObject(value);
  if (
    (link.type !== 'WEB' && link.type !== 'APP_SCHEME') ||
    typeof link.link !== 'string'
  ) {
    return null;
  }

  return {
    type: link.type,
    link: link.link,
  };
}

function selectCard(value: unknown) {
  const card = asObject(value);
  if (card.type !== 'BASIC_CARD' || typeof card.cardId !== 'string') return null;

  const header = asObject(card.header);
  const metadata = asObject(card.metadata);
  const marker = asObject(card.marker);
  const location = asObject(marker.location);
  const hasMarker =
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number';

  return {
    type: 'BASIC_CARD' as const,
    cardId: card.cardId,
    header: {
      title: selectText(header.title),
      badge: selectImage(header.badge),
    },
    metadata: {
      primary: asArray(metadata.primary).map(selectChip),
      secondary: asArray(metadata.secondary).map(selectChip),
    },
    images: asArray(card.images)
      .map(selectImage)
      .filter((image) => image !== null),
    bodies: asArray(card.bodies)
      .map(selectBody)
      .filter((body) => body !== null),
    marker: hasMarker
      ? {
          focused: selectChip(marker.focused),
          unfocused: selectChip(marker.unfocused),
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : null,
    link: selectLink(card.link),
  };
}

// 홈 리스트 섹션.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mapLatitude = searchParams.get('mapLatitude');
  const mapLongitude = searchParams.get('mapLongitude');

  if (!mapLatitude || !mapLongitude) {
    return NextResponse.json(
      { error: 'mapLatitude and mapLongitude are required' },
      { status: 400 }
    );
  }

  try {
    const query = new URLSearchParams({ mapLatitude, mapLongitude });

    for (const key of FORWARDED_PARAMS) {
      const value = searchParams.get(key);
      if (value) query.set(key, value);
    }

    const requestedDistanceM = Number(searchParams.get('distanceM'));
    const distanceM = Number.isFinite(requestedDistanceM) && requestedDistanceM > 0
      ? Math.min(Math.round(requestedDistanceM), MAX_HOME_DISTANCE_M)
      : DEFAULT_HOME_DISTANCE_M;
    query.set('distanceM', distanceM.toString());

    if (!query.has('sortType')) query.set('sortType', 'DISTANCE_ASC');

    const response = await fetch(
      createApiUrl('/api/v1/screen/home/section/list', query),
      { headers: getDeviceLocationHeaders(request) }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch home list' },
        { status: response.status }
      );
    }

    const payload = asObject(await response.json());
    const data = asObject(payload.data);
    const cursor = asObject(data.cursor);

    return NextResponse.json({
      data: {
        cards: asArray(data.cards)
          .map(selectCard)
          .filter((card) => card !== null),
        cursor: {
          hasMore: cursor.hasMore === true,
          nextCursor: typeof cursor.nextCursor === 'string' ? cursor.nextCursor : null,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch home list' },
      { status: 500 }
    );
  }
}
