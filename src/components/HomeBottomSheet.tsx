'use client';

// Home Bottom Sheet — 앱의 FloatingPanel(tip ↔ full) 대응.
// 핸들 드래그 + 리스트 스크롤에 연동해 시트가 스크롤을 따라 연속적으로 오르내린다.
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface HomeBottomSheetProps {
  children: ReactNode;
  collapsedHeight?: number;
  expandedTopOffset?: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onProgressChange?: (progress: number) => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  listResetKey?: number;
  hidden?: boolean;
}

const DRAG_TAP_THRESHOLD = 8;
const GESTURE_INTENT = 3;
const DIRECTIONAL_SNAP_DISTANCE = 24;
const TOP_EDGE_TOLERANCE = 8;
const NEXT_PAGE_PREFETCH_VIEWPORTS = 1.5;
const DRAG_HANDLE_HEIGHT = 44;

export default function HomeBottomSheet({
  children,
  collapsedHeight = 210,
  expandedTopOffset = 120,
  expanded,
  onExpandedChange,
  onProgressChange,
  onEndReached,
  hasMore = false,
  loadingMore = false,
  listResetKey = 0,
  hidden = false,
}: HomeBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const dragOffsetRef = useRef<number | null>(null);
  const previousExpandedRef = useRef(expanded);

  const setOffset = useCallback((v: number | null) => {
    dragOffsetRef.current = v;
    setDragOffset(v);
  }, []);

  // 시트 높이 측정 (translate 계산에 필요).
  useEffect(() => {
    const measure = () => setSheetHeight(sheetRef.current?.offsetHeight ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const collapsedTranslate = Math.max(sheetHeight - collapsedHeight, 0);
  const committedTranslate = expanded ? 0 : collapsedTranslate;
  const translateY = dragOffset ?? committedTranslate;

  // 위치/필터 변경으로 첫 페이지를 다시 받은 경우 이전 목록의 스크롤 위치를 버린다.
  // 다음 페이지 감지 effect보다 먼저 실행되어, 기존 위치를 기준으로 여러 페이지가
  // 연속 요청되는 것도 막는다.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [listResetKey]);

  // 전체 리스트를 접을 때 현재 보던 첫 카드를 카드 시작점에 맞춰 잘림을 방지한다.
  useLayoutEffect(() => {
    const wasExpanded = previousExpandedRef.current;
    previousExpandedRef.current = expanded;
    if (!wasExpanded || expanded) return;

    const el = scrollRef.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-sheet-list-item]'));
    const scrollTop = el.getBoundingClientRect().top;
    const currentItem = items.find((item) => item.getBoundingClientRect().bottom > scrollTop + 1);
    if (currentItem) {
      const itemTop = currentItem.getBoundingClientRect().top;
      el.scrollTop += itemTop - scrollTop;
    }
  }, [expanded]);

  // 접힘 비율 (1=접힘, 0=펼침). 펼칠수록 상단 라운드/핸들을 없애 배경과 이음새 없이 보이게 한다.
  const collapseFraction = collapsedTranslate > 0 ? translateY / collapsedTranslate : expanded ? 0 : 1;
  const cornerRadius = 20 * collapseFraction;

  const reportProgress = useCallback(
    (ty: number) => {
      if (!onProgressChange) return;
      const p = collapsedTranslate > 0 ? 1 - ty / collapsedTranslate : expanded ? 1 : 0;
      onProgressChange(Math.max(0, Math.min(1, p)));
    },
    [collapsedTranslate, expanded, onProgressChange]
  );

  // 현재 오프셋 기준 가까운 스냅 포인트로 커밋.
  const snap = useCallback((direction?: 'expand' | 'collapse') => {
    const ty = dragOffsetRef.current ?? committedTranslate;
    const willExpand = direction ? direction === 'expand' : ty < collapsedTranslate / 2;
    setOffset(null);
    onExpandedChange(willExpand);
    onProgressChange?.(willExpand ? 1 : 0);
  }, [committedTranslate, collapsedTranslate, onExpandedChange, onProgressChange, setOffset]);

  // ---- 핸들 드래그 (window 포인터 리스너) ----
  const dragState = useRef<{ startY: number; currentY: number; base: number; moved: boolean } | null>(null);

  const onHandleMove = useCallback(
    (e: PointerEvent) => {
      const st = dragState.current;
      if (!st) return;
      const delta = e.clientY - st.startY;
      st.currentY = e.clientY;
      if (Math.abs(delta) > DRAG_TAP_THRESHOLD) st.moved = true;
      const next = Math.min(Math.max(st.base + delta, 0), collapsedTranslate);
      setOffset(next);
      reportProgress(next);
    },
    [collapsedTranslate, reportProgress, setOffset]
  );

  const onHandleUp = useCallback(() => {
    window.removeEventListener('pointermove', onHandleMove);
    const st = dragState.current;
    dragState.current = null;
    if (!st) {
      setOffset(null);
      return;
    }
    if (!st.moved) {
      const willExpand = !expanded;
      setOffset(null);
      onExpandedChange(willExpand);
      onProgressChange?.(willExpand ? 1 : 0);
      return;
    }
    const distance = st.currentY - st.startY;
    snap(
      Math.abs(distance) >= DIRECTIONAL_SNAP_DISTANCE
        ? distance < 0 ? 'expand' : 'collapse'
        : undefined
    );
  }, [onHandleMove, expanded, onExpandedChange, onProgressChange, snap, setOffset]);

  const onHandleDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragState.current = {
        startY: e.clientY,
        currentY: e.clientY,
        base: committedTranslate,
        moved: false,
      };
      setOffset(committedTranslate);
      window.addEventListener('pointermove', onHandleMove);
      window.addEventListener('pointerup', onHandleUp, { once: true });
    },
    [committedTranslate, onHandleMove, onHandleUp, setOffset]
  );

  // ---- 리스트 스크롤 연동 (연속) ----
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 터치: 접힘+위로스와이프 또는 펼침+최상단+아래로스와이프 시 시트를 손가락 따라 이동.
    let touch: { startY: number; currentY: number; base: number; mode: 'sheet' | 'list' | null } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      touch = { startY: y, currentY: y, base: committedTranslate, mode: null };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      touch.currentY = e.touches[0].clientY;
      const dy = touch.currentY - touch.startY;
      if (touch.mode === null) {
        if (Math.abs(dy) < GESTURE_INTENT) return;
        if (touch.base >= collapsedTranslate) {
          touch.mode = dy < 0 ? 'sheet' : 'list'; // 접힘: 위로 스와이프 → 시트
        } else {
          touch.mode = el.scrollTop <= TOP_EDGE_TOLERANCE && dy > 0 ? 'sheet' : 'list'; // 펼침: 최상단+아래로 → 시트
        }
      }
      if (touch.mode === 'sheet') {
        const target = Math.min(Math.max(touch.base + dy, 0), collapsedTranslate);
        setOffset(target);
        reportProgress(target);
        e.preventDefault();
      }
    };
    const onTouchEnd = () => {
      if (touch && touch.mode === 'sheet') {
        const distance = touch.currentY - touch.startY;
        snap(
          Math.abs(distance) >= DIRECTIONAL_SNAP_DISTANCE
            ? distance < 0 ? 'expand' : 'collapse'
            : undefined
        );
      }
      touch = null;
    };

    // 휠(데스크톱): 스크롤 델타만큼 시트를 이동, 멈추면 스냅.
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      const base = dragOffsetRef.current ?? committedTranslate;
      const atTop = el.scrollTop <= 0;
      let drive = false;
      if (e.deltaY > 0 && base > 0) drive = true; // 아래로 스크롤 → 펼침 방향
      else if (e.deltaY < 0 && atTop && base < collapsedTranslate) drive = true; // 최상단 위로 → 접힘 방향
      if (!drive) return;
      e.preventDefault();
      const target = Math.min(Math.max(base - e.deltaY, 0), collapsedTranslate);
      setOffset(target);
      reportProgress(target);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => snap(), 90);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [committedTranslate, collapsedTranslate, reportProgress, setOffset, snap]);

  // 리스트 하단이 약 1.5 화면 이내로 들어오면 다음 페이지를 미리 요청한다.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onEndReached) return;

    const handleScroll = () => {
      if (!expanded || !hasMore || loadingMore) return;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      const prefetchDistance = el.clientHeight * NEXT_PAGE_PREFETCH_VIEWPORTS;
      if (remaining <= prefetchDistance) onEndReached();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, [expanded, hasMore, loadingMore, onEndReached]);

  // 언마운트 시 핸들 리스너 정리.
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onHandleMove);
      window.removeEventListener('pointerup', onHandleUp);
    };
  }, [onHandleMove, onHandleUp]);

  return (
    <div
      ref={sheetRef}
      className="fixed left-0 right-0 bottom-0 z-30 flex flex-col bg-white"
      style={{
        height: `calc(100dvh - ${expandedTopOffset}px)`,
        borderTopLeftRadius: `${cornerRadius}px`,
        borderTopRightRadius: `${cornerRadius}px`,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        transform: `translateY(${translateY}px)`,
        transition: dragOffset === null
          ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        opacity: sheetHeight === 0 ? 0 : 1,
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      {/* 드래그 핸들 (넉넉한 히트 영역). 펼칠수록 사라진다. */}
      <div
        className="flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing"
        role="button"
        tabIndex={0}
        aria-label={expanded ? '리스트 내리기' : '리스트 올리기'}
        aria-expanded={expanded}
        style={{
          height: `${DRAG_HANDLE_HEIGHT}px`,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onPointerDown={onHandleDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            snap('expand');
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            snap('collapse');
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            snap(expanded ? 'collapse' : 'expand');
          }
        }}
      >
        <div
          style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0', opacity: collapseFraction }}
        />
      </div>

      {/* 스크롤 컨텐츠 */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 scrollbar-hide"
        style={{ overflowY: expanded ? 'auto' : 'hidden', overscrollBehavior: 'contain' }}
      >
        {children}
      </div>
    </div>
  );
}
