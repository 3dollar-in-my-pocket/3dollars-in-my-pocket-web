export interface ApiResponse<T> {
    ok: boolean;
    error?: string;
    message?: string;
    debugMessage?: string;
    data?: ContentListWithCursor<T>;
  }
  
  export interface ContentListWithCursor<T> {
    contents: T[];
    cursor: CursorString;
  }
  
  export interface CursorString {
    nextCursor?: string;
    hasMore: boolean;
  }