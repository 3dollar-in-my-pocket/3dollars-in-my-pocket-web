import 'server-only';
import {
  MISSION_GROUP_CODE,
  POINT_TICKET,
  PROMOTION_CODE,
  RAFFLE_TICKET,
} from '@/src/config/PointEvent';
import type {
  DeliveryForm,
  MissionGroupMissions,
  PointHistoryFilterType,
  PointHistoryPage,
  Raffle,
} from '@/src/models/PointEvent';
import { requestWithToken } from '@/src/server/authorizedApi';

type Auth = { token: string; userAgent: string | null };

const ticketPath = `/api/v1/my/points/${encodeURIComponent(POINT_TICKET)}`;

export const HISTORY_PAGE_SIZE = 30;

export function fetchPointBalance({ token, userAgent }: Auth) {
  return requestWithToken<{ balance: number }>(ticketPath, { token, userAgent });
}

/**
 * 내 포인트 내역. 다음 페이지도 첫 페이지와 같은 filterTypes·sortBy 로 불러야 한다.
 * filterTypes 가 비어 있으면 전체.
 */
export function fetchPointHistories(
  { token, userAgent }: Auth,
  { cursor, filterTypes = [] }: { cursor?: string | null; filterTypes?: PointHistoryFilterType[] } = {}
) {
  const searchParams = new URLSearchParams({
    size: String(HISTORY_PAGE_SIZE),
    sortBy: 'LATEST',
  });
  for (const type of filterTypes) searchParams.append('filterTypes', type);
  if (cursor) searchParams.set('cursor', cursor);
  return requestWithToken<PointHistoryPage>(`${ticketPath}/histories`, {
    token,
    userAgent,
    searchParams,
  });
}

export function fetchMissions({ token, userAgent }: Auth) {
  return requestWithToken<MissionGroupMissions>(
    `/api/v1/my/mission-groups/${encodeURIComponent(MISSION_GROUP_CODE)}/missions`,
    { token, userAgent }
  );
}

export function fetchMyPromotionResult({ token, userAgent }: Auth) {
  return requestWithToken<{ isWinner: boolean; prizeCode?: string | null }>(
    `/api/v1/promotion/${encodeURIComponent(PROMOTION_CODE)}/my-result`,
    { token, userAgent }
  );
}

/**
 * 기간별 포인트 순증감 (적립 − 사용·회수). 음수일 수 있다.
 * start 포함, end 미포함, KST LocalDateTime, 최대 7일.
 */
export function fetchPointChange(
  { token, userAgent }: Auth,
  { start, end }: { start: string; end: string }
) {
  return requestWithToken<{ netAmount: number }>(`${ticketPath}/changes`, {
    token,
    userAgent,
    searchParams: new URLSearchParams({ startDateTime: start, endDateTime: end }),
  });
}

const rafflePath = `/api/v1/raffles/${encodeURIComponent(RAFFLE_TICKET)}`;

/** 응모 대상 목록 + 내 응모 횟수 (includeMy=true 라 로그인 필수) */
export function fetchMyRaffles({ token, userAgent }: Auth) {
  return requestWithToken<{ contents: Raffle[] }>(rafflePath, {
    token,
    userAgent,
    searchParams: new URLSearchParams({ includeMy: 'true' }),
  });
}

/**
 * 응모 1회 (포인트 차감). requestKey 는 탭 1번에 UUID 1개.
 * 같은 키로 다시 보내면 서버가 409 already_used_point 로 막는다(추가 차감 없음).
 */
export function enterRaffle({ token, userAgent }: Auth, raffleId: string, requestKey: string) {
  return requestWithToken<string>(`${rafflePath}/${encodeURIComponent(raffleId)}/entries`, {
    method: 'POST',
    token,
    userAgent,
    body: { requestKey },
  });
}

// ---------------------------------------------------------------------------
// 당첨자 수령 정보 API 는 아직 서버 개발 전이라 가정한 계약이다.
// 서버 스펙이 나오면 경로·필드만 여기서 맞추면 된다.
// ---------------------------------------------------------------------------

/** 당첨자 배송 정보 저장 — 가정: POST /v1/promotion/{code}/delivery */
export function submitDelivery(
  { token, userAgent }: Auth,
  form: Omit<DeliveryForm, 'agreedPrivacy'>
) {
  return requestWithToken<Record<string, unknown>>(
    `/api/v1/promotion/${encodeURIComponent(PROMOTION_CODE)}/delivery`,
    { method: 'POST', token, userAgent, body: form }
  );
}
