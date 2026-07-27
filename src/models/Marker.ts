import { HomeListMarker } from './HomeList';

export interface MapMarker {
    markerId: string;
    position: {
      lat: number;
      lng: number;
    };
    title: string;
    isSelected: boolean;
    marker: HomeListMarker;
  }
