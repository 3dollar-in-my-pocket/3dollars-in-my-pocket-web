// Environment configuration - similar to iOS Info.plist or Config
export const Config = {
  // API Keys - you'll need to add these
  NAVER_MAP_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '',
  NAVER_MAP_CLIENT_SECRET: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_SECRET || '',
  
  // API Endpoints
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  
  // Map settings
  DEFAULT_LOCATION: {
    lat: 37.5665, // Seoul default
    lng: 126.9780
  },
  
  // UI settings
  CARD_SCROLL_THRESHOLD: 50,
  MAP_ZOOM_LEVEL: 17
};