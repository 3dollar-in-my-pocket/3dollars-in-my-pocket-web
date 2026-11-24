// 포인트 · 미션 API 응답 모델 (dev swagger [포인트] · [미션] 기준)

export type PointHistoryType = 'EARN' | 'REVOKE' | 'USE' | (string & {});

/**
 * 내역 출처. reason 으로 구조가 갈린다.
 * 모르는 reason 이 올 수 있으므로 화면은 description 으로 대신 표시한다.
 */
export type PointHistorySource = {
  reason: 'MISSION_COMPLETED' | 'RAFFLE_ENTERED' | (string & {});
  /** reason = MISSION_COMPLETED 일 때 */
  mission?: { missionId: string; title: string };
  /** reason = RAFFLE_ENTERED 일 때 */
  raffle?: { raffleId: string; title: string };
};

export type PointHistory = {
  /** 문자열 ID (숫자로 바꾸지 말 것) */
  pointHistoryId: string;
  /** EARN: 적립, REVOKE: 회수, USE: 사용(응모). 모르는 값은 description 으로 표시 */
  type: PointHistoryType;
  description: string;
  /** 부호 있는 변동량 (EARN 양수, REVOKE·USE 음수) */
  amount: number;
  /** 출처를 찾지 못하면 null */
  source?: PointHistorySource | null;
  /** KST LocalDateTime (yyyy-MM-ddTHH:mm:ss, 오프셋 없음) */
  createdAt: string;
};

/** 내역 조회 filterTypes 값 */
export type PointHistoryFilterType = 'EARN' | 'USE' | 'REVOKE';

/** 기간 내 포인트 증감 (/changes) */
export type PointChange = {
  netAmount: number;
  increaseAmount: number;
  decreaseAmount: number;
};

export type PointHistoryPage = {
  contents: PointHistory[];
  cursor: { nextCursor: string | null; hasMore: boolean };
};

export type MissionActivityType =
  | 'STORE_VISIT'
  | 'STORE_REVIEW_REGISTER'
  | 'STORE_REGISTER'
  | (string & {});

export type MissionCondition = {
  activityType: MissionActivityType;
  targetCount: number;
  progressCount: number;
};

export type MissionReward = {
  type: 'POINT' | (string & {});
  ticket: string;
  amount: number;
};

export type Mission = {
  missionId: string;
  title: string;
  /** DAILY: 매일 자정(KST) 초기화 */
  periodType: 'DAILY' | (string & {});
  conditions: MissionCondition[];
  rewards: MissionReward[];
  completedCount: number;
  maxCompletionCount: number;
};

export type MissionGroup = {
  code: string;
  name: string;
  startDateTime: string;
  endDateTime: string;
};

export type MissionGroupMissions = {
  group: MissionGroup;
  missions: Mission[];
};

// ---------------------------------------------------------------------------
// 응모 (GET /v1/raffles/{raffleTicket}, POST /v1/raffles/{raffleTicket}/{raffleId}/entries)
// ---------------------------------------------------------------------------

/** 응모 1회 비용. 비용 타입은 늘어날 수 있다. 모르는 타입이면 비용 표시만 비운다. */
export type RaffleCost =
  | { type: 'POINT'; pointTicket: string; amount: number }
  | { type: string & {} };

export type Raffle = {
  /** 문자열 ID (숫자로 바꾸지 말 것) */
  raffleId: string;
  title: string;
  description: string | null;
  image: { imageUrl: string; width: number | null; height: number | null } | null;
  /** null 이면 미정 → 추첨 인원 문구를 숨긴다 */
  winnerCount: number | null;
  cost: RaffleCost;
  entry: {
    enterable: boolean;
    /** includeMy=true 일 때만 내려온다 (키 없음 = 미포함, 0 = 응모 없음) */
    myEntryCount?: number;
  };
  /** KST LocalDateTime, 포함 */
  startDateTime: string;
  /** KST LocalDateTime, 미포함 */
  endDateTime: string;
};

export type DeliveryForm = {
  name: string;
  phone: string;
  zonecode: string;
  address: string;
  addressDetail: string;
  agreedPrivacy: boolean;
};
