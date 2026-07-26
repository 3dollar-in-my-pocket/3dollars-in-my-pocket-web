// SDUI 가게 프리뷰 (마커 탭 시 뜨는 상세 시트).
// Source: GET /api/v1/screen/store/{storeId}/preview → { data: { sections: [{ type: "PREVIEW", ... }] } }
import { SDChip, SDImage, SDText } from './HomeFilter';

export interface StorePreviewBody {
  text: SDText;
  style?: unknown;
}

export interface StorePreviewSection {
  type: string; // "PREVIEW"
  header: { title?: SDText | null };
  metadata: {
    primary: SDChip[];
    secondary: SDChip[];
    separator?: SDImage;
  };
  images: SDImage[];
  bodies: StorePreviewBody[];
}
