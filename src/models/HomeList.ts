import { SDChip, SDImage, SDSurfaceStyle, SDText } from './HomeFilter';

export interface HomeListBody {
  text: SDText;
  style?: SDSurfaceStyle;
}

export interface HomeListMarker {
  focused: SDChip;
  unfocused: SDChip;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface HomeListBasicCard {
  type: 'BASIC_CARD';
  cardId: string;
  header: {
    title?: SDText | null;
    badge?: SDImage | null;
  };
  metadata: {
    primary: SDChip[];
    secondary: SDChip[];
  };
  images: SDImage[];
  bodies: HomeListBody[];
  marker?: HomeListMarker | null;
  link?: {
    type: 'WEB' | 'APP_SCHEME';
    link: string;
  } | null;
}

export interface HomeListSection {
  cards: HomeListBasicCard[];
  cursor: {
    nextCursor?: string | null;
    hasMore: boolean;
  };
}
