import 'server-only';
import { requestWithToken } from '@/src/server/authorizedApi';

export { EVENT_TOKEN_COOKIE } from '@/src/server/authorizedApi';

export type PromotionReward = {
  type: string;
  key: string;
};

export function fetchMyPromotionResult(
  code: string,
  token: string,
  userAgent: string | null
) {
  return requestWithToken<{ isWinner: boolean }>(
    `/api/v1/promotion/${encodeURIComponent(code)}/my-result`,
    { token, userAgent }
  );
}

export function claimPromotionReward(
  code: string,
  token: string,
  userAgent: string | null
) {
  return requestWithToken<PromotionReward>(
    `/api/v1/promotion/${encodeURIComponent(code)}/reward/claim`,
    { method: 'POST', token, userAgent }
  );
}
