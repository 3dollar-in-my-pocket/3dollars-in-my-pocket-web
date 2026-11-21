'use client';

import Image from 'next/image';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import type { Prize } from '@/src/config/PointEvent';
import type { DeliveryForm } from '@/src/models/PointEvent';
import {
  formatPhone,
  formatShortDate,
  isDeliveryFormComplete,
} from '@/src/utils/pointEvent';
import styles from '../point.module.css';

// 카카오 우편번호 서비스 스크립트 (t1.daumcdn.net 도메인은 2026-11-30 종료되어 kakaocdn 사용)
const POSTCODE_SCRIPT = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

type PostcodeResult = { zonecode: string; roadAddress: string; jibunAddress: string };
type PostcodeConstructor = new (options: {
  oncomplete: (data: PostcodeResult) => void;
  width: string;
  height: string;
}) => { embed: (element: HTMLElement) => void };

declare global {
  interface Window {
    daum?: { Postcode: PostcodeConstructor };
  }
}

const EMPTY_FORM: DeliveryForm = {
  name: '',
  phone: '',
  zonecode: '',
  address: '',
  addressDetail: '',
  agreedPrivacy: false,
};

const CONFETTI = ['confetti1', 'confetti2', 'confetti3', 'confetti4'] as const;

type Phase = 'editing' | 'submitting' | 'done';

/** B-2. 당첨 · 수령 정보 입력 */
export default function WinnerForm({
  prize,
  claimDeadline,
}: {
  prize: Prize | null;
  claimDeadline: string | null;
}) {
  const [form, setForm] = useState<DeliveryForm>(EMPTY_FORM);
  const [phase, setPhase] = useState<Phase>('editing');
  const [error, setError] = useState<string | null>(null);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof DeliveryForm>(key: K, value: DeliveryForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!postcodeOpen || !postcodeReady || !postcodeRef.current || !window.daum) return;
    new window.daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: (data) => {
        setForm((prev) => ({
          ...prev,
          zonecode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        }));
        setPostcodeOpen(false);
        setTimeout(() => detailRef.current?.focus(), 0);
      },
    }).embed(postcodeRef.current);
  }, [postcodeOpen, postcodeReady]);

  const submit = async () => {
    if (!isDeliveryFormComplete(form) || phase !== 'editing') return;
    setPhase('submitting');
    setError(null);
    try {
      const response = await fetch('/api/events/point/delivery', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (body.status === 'ok') {
        setPhase('done');
        return;
      }
      setError(
        body.status === 'unauthorized'
          ? '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.'
          : body.message ?? '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
      );
    } catch {
      setError('인터넷 연결을 확인하고 다시 시도해 주세요.');
    }
    setPhase('editing');
  };

  const prizeName = prize?.name ?? '굿즈';
  const deadline = claimDeadline ? formatShortDate(claimDeadline) : '안내된 기한';

  return (
    <main className={styles.page}>
      <Script src={POSTCODE_SCRIPT} strategy="lazyOnload" onReady={() => setPostcodeReady(true)} />
      <div className={`${styles.content} ${phase === 'done' ? '' : styles.withBottomCta}`}>
        <section className={styles.winHero}>
          {CONFETTI.map((piece) => (
            <span key={piece} className={`${styles.confetti} ${styles[piece]}`} aria-hidden />
          ))}
          <div className={styles.winImage}>
            <Image
              src={prize?.image ?? '/events/point/mascot.png'}
              alt={prizeName}
              fill
              sizes="144px"
              priority
            />
          </div>
          <span className={`${styles.badge} ${styles.badgeDark}`}>당첨</span>
          <h1 className={styles.winTitle}>
            축하해요!
            <br />
            <span className={styles.pinkText}>{prizeName}</span>에 당첨됐어요
          </h1>
          <p className={styles.winDescription}>
            {phase === 'done' ? (
              <>
                받으실 정보를 잘 받았어요.
                <br />
                배송이 시작되면 앱 푸시로 알려드릴게요.
              </>
            ) : (
              <>
                받으실 정보를 <strong>{deadline}</strong>까지 입력해 주세요.
                <br />
                기한이 지나면 당첨이 취소될 수 있어요.
              </>
            )}
          </p>
        </section>

        {phase !== 'done' && (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <h2 className={styles.blockHeading}>받으실 정보</h2>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>이름</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="받는 분 이름"
                autoComplete="name"
                maxLength={30}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>연락처</span>
              <input
                className={styles.input}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(event) => update('phone', formatPhone(event.target.value))}
                placeholder="010-0000-0000"
                autoComplete="tel"
              />
            </label>

            <div className={styles.field}>
              <span className={styles.fieldLabel} id="address-label">
                주소
              </span>
              <div className={styles.fieldRow}>
                <input
                  className={styles.input}
                  value={form.address}
                  placeholder="주소 검색"
                  readOnly
                  aria-labelledby="address-label"
                  onClick={() => setPostcodeOpen(true)}
                />
                <button
                  type="button"
                  className={styles.searchButton}
                  onClick={() => setPostcodeOpen(true)}
                >
                  검색
                </button>
              </div>
              <input
                ref={detailRef}
                className={styles.input}
                value={form.addressDetail}
                onChange={(event) => update('addressDetail', event.target.value)}
                placeholder="상세 주소 (동·호수)"
                aria-label="상세 주소"
                maxLength={100}
              />
            </div>

            <div className={styles.consent}>
              <label className={styles.consentCheck}>
                <input
                  type="checkbox"
                  checked={form.agreedPrivacy}
                  onChange={(event) => update('agreedPrivacy', event.target.checked)}
                />
                <span className={styles.checkbox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/events/point/icons/check.svg" width={16} height={16} alt="" />
                </span>
                [필수] 개인정보 수집·이용 동의
              </label>
              <dl className={styles.consentRow}>
                <dt>수집 항목</dt>
                <dd>이름, 연락처, 주소</dd>
              </dl>
              <dl className={styles.consentRow}>
                <dt>이용 목적</dt>
                <dd>이벤트 경품 배송</dd>
              </dl>
              <dl className={styles.consentRow}>
                <dt>보유 기간</dt>
                <dd>배송 완료 후 즉시 파기</dd>
              </dl>
              <p className={styles.consentNote}>동의하지 않으면 경품을 받을 수 없어요.</p>
            </div>

            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}

            <div className={styles.bottomCta}>
              <div className={styles.bottomCtaInner}>
                <button
                  type="submit"
                  className={styles.cta}
                  disabled={!isDeliveryFormComplete(form) || phase === 'submitting'}
                >
                  {phase === 'submitting' ? '제출하는 중…' : '제출하기'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {postcodeOpen && (
        <div className={styles.postcodeLayer} role="dialog" aria-modal="true" aria-label="주소 검색">
          <div className={styles.postcodeHeader}>
            주소 검색
            <button type="button" className={styles.postcodeClose} onClick={() => setPostcodeOpen(false)}>
              닫기
            </button>
          </div>
          <div ref={postcodeRef} className={styles.postcodeBody} />
        </div>
      )}
    </main>
  );
}
