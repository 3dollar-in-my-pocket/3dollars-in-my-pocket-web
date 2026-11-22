import { POINT_TICKET } from '@/src/config/PointEvent';
import type {
  DeliveryForm,
  Mission,
  MissionActivityType,
  PointHistory,
} from '@/src/models/PointEvent';

const KST = 'Asia/Seoul';
const DAY_MS = 24 * 60 * 60 * 1000;

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
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

/** 11월 15일 토요일 */
export function formatDayHeader(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(iso));
}

/** 오후 2:10 */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** 11월 15일(토) — null 이면 '추후 안내' */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '추후 안내';
  const date = new Date(iso);
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
  return Boolean(iso) && Date.parse(iso as string) <= now.getTime();
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

/** 조건 줄: '하루 3회까지' (+ 진행도가 있으면 '· 오늘 1회 완료') */
export function missionCondition(mission: Mission): string {
  const daily = mission.periodType === 'DAILY';
  const parts = [`${daily ? '하루' : '기간 중'} ${mission.maxCompletionCount}회까지`];
  if (mission.completedCount > 0) {
    parts.push(`${daily ? '오늘 ' : ''}${mission.completedCount}회 완료`);
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

export type HistoryRowModel = PointHistory & {
  /** 이 내역 직후 잔액 */
  balanceAfter: number;
};

/** 최신순 내역에 현재 잔액부터 거꾸로 계산한 '직후 잔액'을 붙인다. */
export function withRunningBalance(
  histories: PointHistory[],
  currentBalance: number
): HistoryRowModel[] {
  let balance = currentBalance;
  return histories.map((history) => {
    const row = { ...history, balanceAfter: balance };
    balance -= history.amount;
    return row;
  });
}

/**
 * 내역 제목. 미션 적립은 미션 이름(예: '가게 방문')을 쓰고,
 * 출처가 없거나 모르는 출처면 서버 description('미션 완료' 등)을 쓴다.
 */
export function historyTitle(history: PointHistory): string {
  const source = history.source;
  if (source?.reason === 'MISSION_COMPLETED' && source.mission?.title) {
    return source.mission.title;
  }
  return history.description;
}

export function matchesFilter(history: PointHistory, filter: HistoryFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'EARN') return history.type === 'EARN';
  return history.type !== 'EARN';
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

/** 오늘(KST) 적립 합계 */
export function todayEarned(histories: PointHistory[], now = new Date()): number {
  const today = kstDateKey(now);
  return histories
    .filter((history) => history.type === 'EARN' && kstDateKey(history.createdAt) === today)
    .reduce((sum, history) => sum + history.amount, 0);
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
