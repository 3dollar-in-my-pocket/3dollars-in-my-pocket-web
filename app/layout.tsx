import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "../src/components/GoogleAnalytics";
import {
  IS_INDEXABLE_SITE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
} from "../src/config/Site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "붕어빵 지도",
    "간식 지도",
    "겨울철 간식 지도",
    "내 주변 붕어빵",
    "붕어빵",
    "호떡",
    "군고구마",
    "타코야끼",
    "어묵",
    "길거리 음식 지도",
    "푸드트럭",
    "가슴속 3천원",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 내 주변 길거리 음식 찾기`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: IS_INDEXABLE_SITE,
    follow: IS_INDEXABLE_SITE,
    googleBot: {
      index: IS_INDEXABLE_SITE,
      follow: IS_INDEXABLE_SITE,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  verification: IS_INDEXABLE_SITE ? {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  } : undefined,
  // iOS Safari Smart App Banner (TH-892)
  // 앱 미설치 상태로 유니버설 링크 진입 시 상단 앱 미리보기 영역이 비어 보이는 문제 방지
  // app-id: 가슴속 3천원 유저앱 App Store ID
  itunes: {
    appId: "1496099467",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const enableGoogleAnalytics =
    process.env.NODE_ENV === "production" && Boolean(gaMeasurementId);

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css"
        />
        <style>{`
          :root {
            --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
          }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: `${SITE_URL}/`,
                  name: SITE_NAME,
                  description: SITE_DESCRIPTION,
                  inLanguage: "ko-KR",
                  publisher: {
                    "@id": `${SITE_URL}/#organization`,
                  },
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: SITE_NAME,
                  url: `${SITE_URL}/`,
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}/icon-512.png`,
                  },
                },
                {
                  "@type": "MobileApplication",
                  "@id": `${SITE_URL}/#application`,
                  name: SITE_NAME,
                  description: SITE_DESCRIPTION,
                  operatingSystem: "iOS",
                  applicationCategory: "LifestyleApplication",
                  url: `${SITE_URL}/`,
                  installUrl: "https://apps.apple.com/app/id1496099467",
                  publisher: {
                    "@id": `${SITE_URL}/#organization`,
                  },
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {enableGoogleAnalytics && gaMeasurementId && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}
      </body>
    </html>
  );
}
