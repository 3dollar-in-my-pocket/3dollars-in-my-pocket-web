'use client';

import { useEffect, useRef, useState } from 'react';
import type { AddressSearchResult } from '@/src/models/PointEvent';
import styles from '../point.module.css';

type SearchResponse =
  | {
      status: 'ok';
      data: { contents: AddressSearchResult[]; nextCursor: string | null; hasMore: boolean };
    }
  | { status: 'unauthorized' }
  | { status: 'error'; code?: string; message?: string };

type Phase = 'idle' | 'loading' | 'loadingMore' | 'done' | 'error';

const MAX_QUERY_LENGTH = 80;

/**
 * 주소 검색 (서버 GET /v1/addresses/search).
 * - 입력할 때마다 부르지 않고 검색 버튼·엔터로만 부른다 (유저당 1초 10회 제한).
 * - 다음 페이지 여부는 hasMore 로만 판단한다 (한 페이지가 size 보다 적거나 비어 있어도 hasMore 일 수 있다).
 * - 검색어를 바꾸면 커서를 버리고 첫 페이지부터. invalid_cursor 면 message 없이 첫 페이지부터 다시.
 */
export default function AddressSearchLayer({
  onSelect,
  onClose,
}: {
  onSelect: (result: AddressSearchResult) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const load = async (keyword: string, cursor: string | null, retried = false): Promise<void> => {
    const id = ++requestId.current;
    setPhase(cursor ? 'loadingMore' : 'loading');
    setError(null);
    try {
      const params = new URLSearchParams({ query: keyword });
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`/api/events/point/addresses?${params}`, {
        credentials: 'same-origin',
      });
      const body = (await response.json()) as SearchResponse;
      if (id !== requestId.current) return;

      if (body.status === 'ok') {
        setResults((prev) => (cursor ? [...prev, ...body.data.contents] : body.data.contents));
        if (!cursor) bodyRef.current?.scrollTo({ top: 0 });
        setNextCursor(body.data.nextCursor);
        setHasMore(body.data.hasMore);
        setPhase('done');
        return;
      }
      if (body.status === 'error' && body.code === 'invalid_cursor' && !retried) {
        // 커서가 무효해졌다 → 안내 없이 같은 검색어로 첫 페이지부터 다시
        return load(keyword, null, true);
      }
      setError(
        body.status === 'unauthorized'
          ? '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.'
          : body.message ?? '주소를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.'
      );
    } catch {
      if (id !== requestId.current) return;
      setError('인터넷 연결을 확인하고 다시 시도해 주세요.');
    }
    setPhase('error');
  };

  const search = () => {
    const keyword = input.trim();
    if (!keyword || phase === 'loading') return;
    setQuery(keyword);
    setResults([]);
    setNextCursor(null);
    setHasMore(false);
    void load(keyword, null);
  };

  const loadMore = () => {
    if (!hasMore || !nextCursor || phase === 'loadingMore') return;
    void load(query, nextCursor);
  };

  const busy = phase === 'loading' || phase === 'loadingMore';
  const empty = phase === 'done' && results.length === 0 && !hasMore;

  return (
    <div className={styles.addressLayer} role="dialog" aria-modal="true" aria-label="주소 검색">
      <div className={styles.addressHeader}>
        주소 검색
        <button type="button" className={styles.addressClose} onClick={onClose}>
          닫기
        </button>
      </div>

      <form
        className={styles.addressSearchBar}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          enterKeyHint="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="도로명, 건물명, 지번으로 검색"
          aria-label="주소 검색어"
          maxLength={MAX_QUERY_LENGTH}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={!input.trim() || phase === 'loading'}
        >
          검색
        </button>
      </form>

      <div ref={bodyRef} className={styles.addressBody} aria-live="polite">
        {phase === 'idle' && (
          <p className={styles.addressHint}>
            예) 판교역로 166, 분당 주공, 백현동 532
          </p>
        )}
        {phase === 'loading' && <p className={styles.addressHint}>검색하는 중…</p>}
        {empty && (
          <p className={styles.addressHint}>
            검색 결과가 없어요.
            <br />
            도로명·건물명·지번을 다시 확인해 주세요.
          </p>
        )}

        {results.length > 0 && (
          <ul className={styles.addressList}>
            {results.map((result, index) => (
              <li key={`${result.zipCode}-${result.address}-${index}`}>
                <button
                  type="button"
                  className={styles.addressItem}
                  onClick={() => onSelect(result)}
                >
                  <span className={styles.addressZip}>{result.zipCode}</span>
                  <span className={styles.addressRoad}>
                    {result.address}
                    {result.buildingName ? ` (${result.buildingName})` : ''}
                  </span>
                  {result.jibunAddress && (
                    <span className={styles.addressJibun}>지번 {result.jibunAddress}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className={`${styles.formError} ${styles.addressError}`} role="alert">
            {error}
          </p>
        )}

        {hasMore && phase !== 'loading' && (
          <button
            type="button"
            className={`${styles.moreButton} ${styles.addressMore}`}
            onClick={loadMore}
            disabled={busy}
          >
            {phase === 'loadingMore' ? '불러오는 중…' : '결과 더 보기'}
          </button>
        )}
        {phase === 'done' && !hasMore && results.length > 0 && (
          <p className={styles.addressHint}>찾는 주소가 없으면 더 자세히 검색해 주세요.</p>
        )}
      </div>
    </div>
  );
}
