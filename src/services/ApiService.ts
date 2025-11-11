import { StoreSimpleWithExtraResponse } from '../models/Store';
import { Config } from '../config/Environment';
import { ApiResponse } from '../models/ApiResonse';

export class ApiService {
  private static instance: ApiService;
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  // Fetch nearby stores
  async fetchNearbyStores(
    latitude: number, 
    longitude: number, 
    mapLatitude: number,
    mapLongitude: number,
    distance: number = 1000
  ): Promise<[StoreSimpleWithExtraResponse]> {
    try {
      const response = await fetch(
        `/api/nearby?mapLatitude=${mapLatitude}&mapLongitude=${mapLongitude}&distanceM=${distance}&sortType=DISTANCE_ASC`,
        {
          headers: {
            'X-Device-Latitude': latitude.toString(),
            'X-Device-Longitude': longitude.toString()
          }
        }
      );
      
      console.log("response", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.contents || [];
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      throw error;
    }
  }
}