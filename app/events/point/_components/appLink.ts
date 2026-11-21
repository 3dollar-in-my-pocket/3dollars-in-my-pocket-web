// 앱 딥링크는 다이나믹 링크(applink)로 보낸다. 앱이 있으면 앱이, 없으면 스토어가 열린다.
const DYNAMIC_LINK_BASE = (
  process.env.NEXT_PUBLIC_DYNAMIC_LINK_URL || 'https://app.threedollars.co.kr'
).replace(/\/+$/, '');

/** 앱 인앱 브라우저로 이 웹 페이지를 연다 (dollars://browser?url=...) */
export function openInAppLink(pageUrl: string): string {
  return `${DYNAMIC_LINK_BASE}/browser?url=${encodeURIComponent(pageUrl)}`;
}

/** 앱 홈 (dollars://home) */
export const APP_HOME_LINK = `${DYNAMIC_LINK_BASE}/home`;
