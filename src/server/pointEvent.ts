import 'server-only';
import {
  MISSION_GROUP_CODE,
  POINT_TICKET,
  PROMOTION_CODE,
} from '@/src/config/PointEvent';
import type {
  DeliveryForm,
  MissionGroupMissions,
  PointHistoryPage,
  PrizeEntryCount,
} from '@/src/models/PointEvent';
import { requestWithToken } from '@/src/server/authorizedApi';

type Auth = { token: string; userAgent: string | null };

const ticketPath = `/api/v1/my/points/${encodeURIComponent(POINT_TICKET)}`;

export const HISTORY_PAGE_SIZE = 30;

export function fetchPointBalance({ token, userAgent }: Auth) {
  return requestWithToken<{ balance: number }>(ticketPath, { token, userAgent });
}

export function fetchPointHistories(
  { token, userAgent }: Auth,
  cursor?: string | null
) {
  const searchParams = new URLSearchParams({
    size: String(HISTORY_PAGE_SIZE),
    sortBy: 'LATEST',
  });
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

// ---------------------------------------------------------------------------
// TH-1610 (서버 경품 응모) 이 아직 개발 전이라 아래 3개는 가정한 계약이다.
// 서버 스펙이 나오면 경로·필드만 여기서 맞추면 된다.
// ---------------------------------------------------------------------------

/** 경품별 내 응모 횟수 — 가정: GET /v1/my/points/{ticket}/entries */
export function fetchMyEntries({ token, userAgent }: Auth) {
  return requestWithToken<{ entries: PrizeEntryCount[] }>(`${ticketPath}/entries`, {
    token,
    userAgent,
  });
}

/** 응모(포인트 사용) — 가정: POST /v1/my/points/{ticket}/entries { prizeCode } */
export function enterPrize({ token, userAgent }: Auth, prizeCode: string) {
  return requestWithToken<{ prizeCode: string; count: number; balance: number }>(
    `${ticketPath}/entries`,
    { method: 'POST', token, userAgent, body: { prizeCode } }
  );
}

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
