import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "../src/components/GoogleAnalytics";
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
  title: "가슴속 3천원 - 내 주변 길거리 음식",
  description: "내 주변의 길거리 음식점을 찾아보세요",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  // iOS Safari Smart App Banner (TH-892)
  // 앱 미설치 상태로 유니버설 링크 진입 시 상단 앱 미리보기 영역이 비어 보이는 문제 방지
  // app-id: 가슴속 3천원 유저앱 App Store ID
  itunes: {
    appId: "1496099467",
  },
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
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
