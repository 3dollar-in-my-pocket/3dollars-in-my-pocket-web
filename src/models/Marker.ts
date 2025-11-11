import { StoreMarkerResponse } from './Store';

export interface MapMarker {
    storeId: string;
    position: {
      lat: number;
      lng: number;
    };
    title: string;
    isSelected: boolean;
    marker?: StoreMarkerResponse;
  }