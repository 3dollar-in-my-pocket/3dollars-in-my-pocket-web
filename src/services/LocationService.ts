// Location Service - similar to iOS CoreLocation
import { Config } from '../config/Environment';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

export class LocationService {
  private static instance: LocationService;
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }
  
  // Get current user location
  async getCurrentLocation(): Promise<LocationCoordinate> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported');
        resolve({
          latitude: Config.DEFAULT_LOCATION.lat,
          longitude: Config.DEFAULT_LOCATION.lng,
        });
        return;
      }

      // Check if we're on HTTPS (required for location on mobile)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('Geolocation requires HTTPS in production');
        resolve({
          latitude: Config.DEFAULT_LOCATION.lat,
          longitude: Config.DEFAULT_LOCATION.lng,
        });
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
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          let errorMessage = 'Unknown location error';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              break;
          }
          console.log('Location error details:', errorMessage);
          
          // Fallback to Seoul default location
          resolve({
            latitude: Config.DEFAULT_LOCATION.lat,
            longitude: Config.DEFAULT_LOCATION.lng,
          });
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