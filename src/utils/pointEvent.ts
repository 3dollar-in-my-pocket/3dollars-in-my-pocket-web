import { POINT_TICKET } from '@/src/config/PointEvent';
import type {
  DeliveryForm,
  Mission,
  MissionActivityType,
  PointHistory,
  PointHistoryFilterType,
  Raffle,
} from '@/src/models/PointEvent';

const KST = 'Asia/Seoul';
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 서버 일시(오프셋 없는 KST LocalDateTime, 예: 2026-12-03T14:20:11)와
 * 설정 값(오프셋 있는 ISO 8601)을 모두 받아 Date 로 바꾼다.
 * 오프셋이 없으면 KST 로 본다 — 서버 렌더링(UTC)에서도 시각이 밀리지 않게.
 */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasZone || !value.includes('T') ? value : `${value}+09:00`);
}

/** Date → KST LocalDateTime 문자열 (yyyy-MM-ddTHH:mm:ss) */
export function toKstLocalDateTime(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 19);
}

/** 오늘(KST) 00:00 ~ 내일 00:00 — /changes 조회 범위 */
export function kstTodayRange(now = new Date()): { start: string; end: string } {
  const start = `${kstDateKey(now)}T00:00:00`;
  const end = toKstLocalDateTime(new Date(parseDate(start).getTime() + DAY_MS));
  return { start, end };
}

export function formatPoint(value: number, { signed = false } = {}): string {
  const abs = Math.abs(value).toLocaleString('ko-KR');
  if (!signed) return `${value < 0 ? '-' : ''}${abs}P`;
  return `${value < 0 ? '-' : '+'}${abs}P`;
}

/** KST 기준 YYYY-MM-DD */
export function kstDateKey(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parseDate(iso));
}

/** 11월 15일 토요일 */
export function formatDayHeader(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parseDate(iso));
}

/** 오후 2:10 */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: 'numeric',
    minute: '2-digit',
  }).format(parseDate(iso));
}

/** 11월 15일(토) — null 이면 '추후 안내' */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '추후 안내';
  const date = parseDate(iso);
  const monthDay = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    month: 'long',
    day: 'numeric',
  }).format(date);
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    weekday: 'short',
  }).format(date);
  return `${monthDay}(${weekday})`;
}

/** 종료일까지 남은 날짜 (KST 날짜 기준). 지났으면 null */
export function daysUntil(iso: string, now = new Date()): number | null {
  const diff =
    (Date.parse(`${kstDateKey(iso)}T00:00:00Z`) -
      Date.parse(`${kstDateKey(now)}T00:00:00Z`)) /
    DAY_MS;
  return diff < 0 ? null : diff;
}

export function formatDday(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return 'D-?';
  const days = daysUntil(iso, now);
  if (days === null) return '마감';
  return days === 0 ? 'D-DAY' : `D-${days}`;
}

export function isPast(iso: string | null | undefined, now = new Date()): boolean {
  return Boolean(iso) && parseDate(iso as string).getTime() <= now.getTime();
}

// ---------------------------------------------------------------------------
// 미션 → 적립 표
// ---------------------------------------------------------------------------

const ACTIVITY_ICON: Record<string, string> = {
  STORE_REGISTER: '/events/point/icons/store-register.svg',
  STORE_VISIT: '/events/point/icons/visit.svg',
  STORE_REVIEW_REGISTER: '/events/point/icons/review.svg',
};
const DEFAULT_ACTIVITY_ICON = '/events/point/icons/poll-vote.svg';

export function missionIcon(mission: Mission): string {
  const activity: MissionActivityType | undefined = mission.conditions[0]?.activityType;
  return (activity && ACTIVITY_ICON[activity]) || DEFAULT_ACTIVITY_ICON;
}

/** 회차 완료 시 받는 이 이벤트 포인트 합계 (알 수 없는 리워드는 건너뜀) */
export function missionPoint(mission: Mission): number {
  return mission.rewards
    .filter((reward) => reward.type === 'POINT' && reward.ticket === POINT_TICKET)
    .reduce((sum, reward) => sum + reward.amount, 0);
}

/** 조건 줄에 쓰는 활동 이름. 모르는 활동은 '활동' */
const ACTIVITY_NAME: Record<string, string> = {
  STORE_REGISTER: '가게 제보',
  STORE_VISIT: '방문',
  STORE_REVIEW_REGISTER: '리뷰',
  STORE_FAVORITE: '즐겨찾기',
  STORE_IMAGE_REGISTER: '사진 제보',
};

/**
 * 조건 줄. 세는 단위를 '적립(포인트 지급) 횟수'로 통일한다.
 * - 활동 1회마다 지급: '하루 최대 10번 적립 · 오늘 3번 받음'
 * - 활동 N회마다 지급: '방문 5회마다 · 하루 최대 2번 적립 · 오늘 1번 받음 · 다음 적립까지 3/5회'
 */
export function missionCondition(mission: Mission): string {
  const daily = mission.periodType === 'DAILY';
  const condition = mission.conditions[0];
  const target = condition?.targetCount ?? 1;
  const parts: string[] = [];

  if (target > 1) {
    parts.push(`${ACTIVITY_NAME[condition.activityType] ?? '활동'} ${target}회마다`);
  }
  parts.push(`${daily ? '하루' : '기간 중'} 최대 ${mission.maxCompletionCount}번 적립`);
  if (mission.completedCount > 0) {
    parts.push(`${daily ? '오늘 ' : ''}${mission.completedCount}번 받음`);
  }
  // 진행도가 회차 누적이어도 이번 회차 몫만 보이게 target 으로 나눈 나머지를 쓴다.
  const progress = target > 1 ? condition.progressCount % target : 0;
  if (progress > 0 && !isMissionDone(mission)) {
    parts.push(`다음 적립까지 ${progress}/${target}회`);
  }
  return parts.join(' · ');
}

export function isMissionDone(mission: Mission): boolean {
  return mission.maxCompletionCount > 0 && mission.completedCount >= mission.maxCompletionCount;
}

// ---------------------------------------------------------------------------
// 포인트 내역
// ---------------------------------------------------------------------------

export type HistoryFilter = 'ALL' | 'EARN' | 'SPEND';

/** 필터 탭 → 서버 filterTypes. 서버에는 '사용·회수' 같은 묶음 값이 없어 클라이언트가 조합한다. */
export const HISTORY_FILTER_TYPES: Record<HistoryFilter, PointHistoryFilterType[]> = {
  ALL: [],
  EARN: ['EARN'],
  SPEND: ['USE', 'REVOKE'],
};

export function parseHistoryFilter(value: string | null): HistoryFilter {
  return value === 'EARN' || value === 'SPEND' ? value : 'ALL';
}

/**
 * 내역 제목.
 * - 미션 적립: 미션 이름 (예: '가게 방문')
 * - 응모: '{응모 대상} 응모'
 * - 출처가 없거나 모르는 출처: 서버 description ('미션 완료', '응모' 등)
 */
export function historyTitle(history: PointHistory): string {
  const source = history.source;
  if (source?.reason === 'MISSION_COMPLETED' && source.mission?.title) {
    return source.mission.title;
  }
  if (source?.reason === 'RAFFLE_ENTERED' && source.raffle?.title) {
    return `${source.raffle.title} 응모`;
  }
  return history.description;
}

export function groupByDay<T extends PointHistory>(rows: T[]): { day: string; rows: T[] }[] {
  const groups: { day: string; rows: T[] }[] = [];
  for (const row of rows) {
    const key = kstDateKey(row.createdAt);
    const last = groups[groups.length - 1];
    if (last && kstDateKey(last.rows[0].createdAt) === key) last.rows.push(row);
    else groups.push({ day: row.createdAt, rows: [row] });
  }
  return groups;
}

// ---------------------------------------------------------------------------
// 응모
// ---------------------------------------------------------------------------

/** 응모 1회 포인트. 모르는 비용 타입이면 null (비용 표시만 비운다) */
export function raffleCost(raffle: Raffle): number | null {
  return raffle.cost.type === 'POINT' && 'amount' in raffle.cost ? raffle.cost.amount : null;
}

/** 모든 응모 대상의 응모 비용이 같으면 그 값, 다르거나 모르면 null (안내 문구용) */
export function sharedRaffleCost(raffles: Raffle[] | null): number | null {
  const costs = new Set((raffles ?? []).map(raffleCost));
  const [only] = [...costs];
  return costs.size === 1 && typeof only === 'number' ? only : null;
}

export function myEntryCount(raffle: Raffle): number {
  return raffle.entry.myEntryCount ?? 0;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/** 응모 requestKey 용 UUID v4 */
export function createRequestKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// 배송 정보
// ---------------------------------------------------------------------------

/** 숫자만 받아 010-0000-0000 형태로 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const PHONE_PATTERN = /^01\d-\d{3,4}-\d{4}$/;

export function isDeliveryFormComplete(form: DeliveryForm): boolean {
  return (
    form.name.trim().length > 0 &&
    PHONE_PATTERN.test(form.phone) &&
    form.address.trim().length > 0 &&
    form.addressDetail.trim().length > 0 &&
    form.agreedPrivacy
  );
}

export function validateDeliveryForm(value: unknown): DeliveryForm | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === 'string' ? (input[key] as string).trim() : '');
  const form: DeliveryForm = {
    name: text('name').slice(0, 30),
    phone: formatPhone(text('phone')),
    zonecode: text('zonecode').slice(0, 10),
    address: text('address').slice(0, 200),
    addressDetail: text('addressDetail').slice(0, 100),
    agreedPrivacy: input.agreedPrivacy === true,
  };
  return isDeliveryFormComplete(form) ? form : null;
}
