'use client';

import { useState } from 'react';
import styles from './page.module.css';

type Reward = { type: string; key: string };

type ClaimState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'claimed'; reward: Reward }
  | { phase: 'failed'; message: string };

const WAVVE_URL = 'https://www.wavve.com';

export default function ClaimReward({ code }: { code: string }) {
  const [state, setState] = useState<ClaimState>({ phase: 'idle' });
  const [copied, setCopied] = useState(false);

  const claim = async () => {
    setState({ phase: 'loading' });
    try {
      const response = await fetch(`/api/events/${code}/claim`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await response.json();

      if (body.status === 'ok') {
        setState({ phase: 'claimed', reward: body.reward });
      } else if (body.status === 'unauthorized') {
        setState({
          phase: 'failed',
          message: '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.',
        });
      } else {
        setState({
          phase: 'failed',
          message: body.message ?? '이용권을 받지 못했어요. 잠시 후 다시 시도해 주세요.',
        });
      }
    } catch {
      setState({
        phase: 'failed',
        message: '인터넷 연결을 확인하고 다시 시도해 주세요.',
      });
    }
  };

  const copy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (state.phase === 'claimed') {
    return (
      <>
        <span className={styles.chip}>수령 완료</span>
        <h1 className={styles.title}>이용권 번호가 발급됐어요</h1>
        <p className={styles.description}>
          웨이브 앱·웹의 쿠폰 등록 메뉴에서 아래 번호를 입력해 주세요.
        </p>
        <div className={`${styles.card} ${styles.keyCard}`}>
          <span className={styles.key}>{state.reward.key}</span>
          <span className={styles.copied} aria-live="polite">
            {copied ? '복사됐어요' : ''}
          </span>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.ghost}`}
          onClick={() => copy(state.reward.key)}
        >
          번호 복사
        </button>
        <div className={styles.spacer} />
        <a
          className={`${styles.button} ${styles.primary}`}
          href={WAVVE_URL}
          target="_blank"
          rel="noreferrer"
        >
          웨이브 바로가기
        </a>
      </>
    );
  }

  return (
    <>
      <span className={styles.chip}>당첨</span>
      <h1 className={styles.title}>
        축하해요!
        <br />
        웨이브 이용권에 당첨됐어요
      </h1>
      <div className={styles.card}>
        <div className={styles.row}>
          <span>경품</span>
          <span>웨이브 광고형 스탠다드 1개월</span>
        </div>
        <div className={styles.row}>
          <span>이벤트</span>
          <span>연애남매2 투표</span>
        </div>
      </div>
      {state.phase === 'failed' && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
      <div className={styles.spacer} />
      <button
        type="button"
        className={`${styles.button} ${styles.primary}`}
        onClick={claim}
        disabled={state.phase === 'loading'}
      >
        {state.phase === 'loading' ? '받는 중…' : '이용권 받기'}
      </button>
    </>
  );
}
