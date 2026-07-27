// Location Service - similar to iOS CoreLocation

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export type LocationErrorReason =
  | 'UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class LocationError extends Error {
  constructor(public readonly reason: LocationErrorReason, message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

export class LocationService {
  private static instance: LocationService;
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async getPermissionState(): Promise<PermissionState | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return 'unsupported';
    }

    if (!navigator.permissions?.query) {
      return 'prompt';
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    } catch {
      // Safari 등 Permissions API 지원이 제한적인 브라우저에서는
      // 사용자 클릭 뒤 geolocation API가 권한 창을 직접 띄우도록 한다.
      return 'prompt';
    }
  }
  
  // Get current user location
  async getCurrentLocation(): Promise<LocationCoordinate> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new LocationError('UNSUPPORTED', '이 브라우저는 위치 정보를 지원하지 않습니다.'));
        return;
      }

      // Check if we're on HTTPS (required for location on mobile)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        reject(new LocationError('INSECURE_CONTEXT', '위치 정보는 HTTPS 환경에서만 사용할 수 있습니다.'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location obtained:', position.coords.latitude, position.coords.longitude);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);

          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new LocationError('PERMISSION_DENIED', '위치 권한이 거부되었습니다.'));
              return;
            case error.POSITION_UNAVAILABLE:
              reject(new LocationError('POSITION_UNAVAILABLE', '현재 위치를 확인할 수 없습니다.'));
              return;
            case error.TIMEOUT:
              reject(new LocationError('TIMEOUT', '현재 위치 확인 시간이 초과되었습니다.'));
              return;
            default:
              reject(new LocationError('UNKNOWN', error.message || '현재 위치를 가져오지 못했습니다.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout for mobile
          maximumAge: 60000,
        }
      );
    });
  }
  
  // Reverse geocoding using internal API Route
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `/api/reverse-geocoding?lat=${latitude}&lng=${longitude}`
      );
      
      console.log('Response:', response);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Route error:', errorData);
        throw new Error(`Failed to get address: ${errorData.details || errorData.error}`);
      }
      
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        if (result.region) {
          const { area1, area2, area3 } = result.region;
          return `${area1.name} ${area2.name} ${area3.name}`;
        }
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown Location';
    }
  }
}
