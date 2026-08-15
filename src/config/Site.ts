export const PRODUCTION_SITE_URL = "https://web.threedollars.co.kr";

const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    PRODUCTION_SITE_URL;

const siteUrlWithProtocol = /^https?:\/\//.test(configuredSiteUrl)
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`;

export const SITE_URL = siteUrlWithProtocol.replace(/\/+$/, "");
export const IS_INDEXABLE_SITE =
    process.env.NODE_ENV === "production" && SITE_URL === PRODUCTION_SITE_URL;
export const SITE_NAME = "가슴속 3천원";
export const SITE_TITLE = "가슴속 3천원 - 내 주변 길거리 간식 찾기";
export const SITE_DESCRIPTION =
    "내 주변 붕어빵, 두쫀쿠, 호떡, 타코야끼, 후르츠산도, 왁뿌소금빵 판매점을 지도에서 찾아보세요. 사용자 제보로 함께 만드는 전국 간식 지도입니다.";
export const THEME_COLOR = "#FF5C43";
