// 포인트 이벤트(2026 굿즈 프로모션) 운영 값 — TH-1617
// 화면에 보이는 운영 값. 확정되면 여기만 바꾸면 된다.
// 이벤트 기간은 여기 값을 먼저 쓰고, 비어 있으면 서버 미션 그룹(startDateTime/endDateTime)을 쓴다.
// 실제 적립 기간은 서버 미션 그룹이 정하므로 어드민 값과 맞춰 둘 것.

/** 포인트 티켓 (GET /v1/my/points/{ticket}) */
export const POINT_TICKET = 'GOODS_PROMOTION_2026';

/** 미션 그룹 코드 (GET /v1/my/mission-groups/{groupCode}/missions) */
export const MISSION_GROUP_CODE = 'goods-promotion';

/** 당첨 결과 조회용 프로모션 코드 (GET /v1/promotion/{code}/my-result) */
export const PROMOTION_CODE = 'GOODS_PROMOTION_2026';

/** 응모 티켓 (GET /v1/raffles/{raffleTicket}) */
export const RAFFLE_TICKET = 'GOODS_PROMOTION_2026';

/**
 * 운영 일정 (KST ISO 8601, 예: '2026-12-01T00:00:00+09:00').
 * 정해지지 않은 값은 null 이고 화면에는 '추후 안내'로 보인다.
 */
export const POINT_EVENT_SCHEDULE: {
  startAt: string | null;
  endAt: string | null;
  announceAt: string | null;
  claimDeadline: string | null;
  shippingFrom: string | null;
} = {
  startAt: '2026-11-30T00:00:00+09:00',
  endAt: '2026-12-13T23:59:59+09:00',
  announceAt: null,
  claimDeadline: null,
  shippingFrom: null,
};

export const POINT_EVENT_PATH = '/events/point';
export const POINT_EVENT_MY_PATH = '/events/point/my';
