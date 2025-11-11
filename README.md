# 가슴속 3천원 - 모바일 웹 버전

내 주변의 길거리 음식점을 지도에서 찾아볼 수 있는 모바일 웹 애플리케이션입니다.

## 주요 기능

- 📍 **현재 위치 기반 서비스**: 사용자의 현재 위치를 기반으로 주변 가게를 표시
- 🗺️ **네이버 지도 연동**: 네이버 지도 API를 사용한 인터랙티브 지도
- 🏪 **가게 정보 표시**: API에서 가져온 실제 가게 데이터를 마커로 표시
- 📱 **모바일 최적화**: 터치 친화적인 UI와 가로 스크롤 카드
- 🔄 **실시간 동기화**: 카드와 지도 마커가 실시간으로 동기화

## 프로젝트 구조 (iOS 개발자 친화적)

```
src/
├── models/          # 데이터 모델 (Swift struct와 유사)
│   └── Store.ts     # 가게 정보 모델
├── services/        # 비즈니스 로직 (iOS Service 클래스와 유사)
│   ├── ApiService.ts      # API 통신 (NetworkManager와 유사)
│   └── LocationService.ts # 위치 서비스 (CoreLocation과 유사)
├── components/      # UI 컴포넌트 (UIView와 유사)
│   ├── NaverMap.tsx       # 지도 컴포넌트
│   ├── StoreCard.tsx      # 가게 카드 컴포넌트
│   └── StoreCarousel.tsx  # 가로 스크롤 카드 목록
└── config/          # 설정 파일 (Info.plist와 유사)
    └── Environment.ts     # 환경 변수 및 설정
```

## 설정 방법

### 1. 네이버 지도 API 키 설정

1. [네이버 클라우드 플랫폼](https://console.ncloud.com/naver-service/application)에서 애플리케이션 등록
2. Maps API 서비스 추가
3. `.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

4. `.env.local` 파일에 API 키 입력:

```env
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET=your_client_secret_here
```

### 2. 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 사용된 기술 스택

- **Next.js 16**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안정성을 위한 정적 타입 시스템
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **네이버 지도 API**: 지도 및 위치 서비스

## API 연동

- **가게 정보 API**: `https://dev.threedollars.co.kr/api/v2/store/around`
- **네이버 리버스 지오코딩**: 좌표를 주소로 변환

## 모바일 최적화 특징

- 터치 친화적인 UI 디자인
- 가로 스크롤 가능한 카드 인터페이스
- 반응형 디자인으로 다양한 화면 크기 지원
- iOS Safari 및 Android Chrome 최적화

## 개발 가이드

### 새로운 컴포넌트 추가
1. `src/components/` 디렉토리에 새 파일 생성
2. TypeScript interface로 props 정의
3. 기존 디자인 시스템에 맞춰 스타일링

### 새로운 API 서비스 추가
1. `src/services/` 디렉토리에 새 서비스 클래스 생성
2. Singleton 패턴 사용 (iOS의 shared instance와 유사)
3. `src/models/`에 관련 타입 정의

### 환경 설정 변경
`src/config/Environment.ts` 파일에서 앱 전반의 설정을 관리할 수 있습니다.
