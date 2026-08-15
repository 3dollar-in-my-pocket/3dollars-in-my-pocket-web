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
export const SITE_TITLE = "가슴속 3천원 - 내 주변 길거리 음식";
export const SITE_DESCRIPTION =
  "붕어빵, 타코야끼, 어묵 등 내 주변 길거리 음식점을 찾아보세요.";
export const THEME_COLOR = "#FF5C43";
