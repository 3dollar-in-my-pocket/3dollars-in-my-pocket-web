// 포인트 · 미션 API 응답 모델 (dev swagger [포인트] · [미션] 기준)

export type PointHistoryType = 'EARN' | 'REVOKE' | 'USE' | (string & {});

export type PointHistory = {
  pointHistoryId: number;
  /** EARN: 적립, REVOKE: 회수, USE: 사용(응모). 모르는 값은 description 으로 표시 */
  type: PointHistoryType;
  description: string;
  /** 부호 있는 변동량 (EARN 양수, REVOKE·USE 음수) */
  amount: number;
  createdAt: string;
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

/** 경품별 내 응모 횟수 (TH-1610 응모 API) */
export type PrizeEntryCount = {
  prizeCode: string;
  count: number;
};

export type DeliveryForm = {
  name: string;
  phone: string;
  zonecode: string;
  address: string;
  addressDetail: string;
  agreedPrivacy: boolean;
};
