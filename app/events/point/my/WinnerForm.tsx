'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import type { AddressSearchResult, RecipientForm } from '@/src/models/PointEvent';
import {
  formatPhone,
  formatShortDate,
  isRecipientFormComplete,
  RECIPIENT_LIMITS,
} from '@/src/utils/pointEvent';
import { APP_HOME_LINK } from '../_components/appLink';
import styles from '../point.module.css';
import AddressSearchLayer from './AddressSearchLayer';

const EMPTY_FORM: RecipientForm = {
  name: '',
  phoneNumber: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  agreedPrivacy: false,
};

const CONFETTI = ['confetti1', 'confetti2', 'confetti3', 'confetti4'] as const;

type SubmitResponse =
  | { status: 'ok' }
  | { status: 'unauthorized' }
  | { status: 'already_claimed'; message?: string }
  | { status: 'error'; message?: string };

/** 당첨 경품 — 서버 응모 대상 값 (어떤 경품인지 알 수 없으면 null) */
export type WonPrize = { name: string; imageUrl: string | null };

/**
 * - needsInfo: RECIPIENT_INFO 이고 아직 등록 전 → 입력 폼
 * - claimed: 이미 등록함 → 제출 완료 (수정 불가)
 * - otherMethod: 수령 정보를 받지 않는 지급 방식(REWARD_KEY·모르는 값) → 별도 안내
 */
export type WinnerStatus = 'needsInfo' | 'claimed' | 'otherMethod';

type Phase = 'editing' | 'submitting' | 'done';

/** B-2. 당첨 · 수령 정보 입력 */
export default function WinnerForm({
  prize,
  status,
  claimDeadline,
}: {
  prize: WonPrize | null;
  status: WinnerStatus;
  claimDeadline: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RecipientForm>(EMPTY_FORM);
  const [phase, setPhase] = useState<Phase>('editing');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const detailRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof RecipientForm>(key: K, value: RecipientForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const closeAddress = useCallback(() => setAddressOpen(false), []);
  const selectAddress = useCallback((result: AddressSearchResult) => {
    // 선택한 결과의 zipCode·address 를 그대로 넣고, 상세 주소는 새로 받는다.
    setForm((prev) => ({ ...prev, zipCode: result.zipCode, address: result.address }));
    setAddressOpen(false);
    setTimeout(() => detailRef.current?.focus(), 0);
  }, []);

  const finish = (message: string | null) => {
    setNotice(message);
    setPhase('done');
    window.scrollTo({ top: 0 });
    // 등록 응답에는 상태가 없으므로 my-result 를 다시 불러 claimed 를 반영한다.
    router.refresh();
  };

  const submit = async () => {
    if (!isRecipientFormComplete(form) || phase !== 'editing') return;
    setPhase('submitting');
    setError(null);
    try {
      const response = await fetch('/api/events/point/recipient', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phoneNumber: form.phoneNumber,
          address: {
            zipCode: form.zipCode,
            address: form.address,
            addressDetail: form.addressDetail,
          },
          agreedPrivacy: form.agreedPrivacy,
        }),
      });
      const body = (await response.json()) as SubmitResponse;
      if (body.status === 'ok') return finish(null);
      if (body.status === 'already_claimed') return finish(body.message ?? null);
      setError(
        body.status === 'unauthorized'
          ? '로그인이 만료됐어요. 앱에서 이 페이지를 다시 열어 주세요.'
          : body.message ?? '제출하지 못했어요. 잠시 후 다시 시도해 주세요.'
      );
    } catch {
      setError('인터넷 연결을 확인하고 다시 시도해 주세요.');
    }
    setPhase('editing');
  };

  const done = status === 'claimed' || phase === 'done';
  const showForm = status === 'needsInfo' && !done;
  const prizeName = prize?.name ?? '굿즈';
  const deadline = claimDeadline ? formatShortDate(claimDeadline) : '안내된 기한';

  return (
    <main className={styles.page}>
      <div className={`${styles.content} ${showForm ? styles.withBottomCta : ''}`}>
        <section className={styles.winHero}>
          {CONFETTI.map((piece) => (
            <span key={piece} className={`${styles.confetti} ${styles[piece]}`} aria-hidden />
          ))}
          <div className={styles.winImage}>
            <Image
              src={prize?.imageUrl ?? '/events/point/mascot.png'}
              alt={prizeName}
              fill
              sizes="144px"
              priority
              unoptimized={Boolean(prize?.imageUrl)}
            />
          </div>
          <span className={`${styles.badge} ${styles.badgeDark}`}>
            {done ? '제출 완료' : '당첨'}
          </span>
          <h1 className={styles.winTitle}>
            축하해요!
            <br />
            <span className={styles.pinkText}>{prizeName}</span>에 당첨됐어요
          </h1>
          <p className={styles.winDescription}>
            {done ? (
              <>
                받으실 정보를 잘 받았어요.
                <br />
                배송이 시작되면 앱 푸시로 알려드릴게요.
              </>
            ) : status === 'otherMethod' ? (
              <>
                경품 받는 방법은
                <br />
                앱 공지와 푸시로 따로 안내해 드릴게요.
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

        {(done || status === 'otherMethod') && (
          <section className={styles.doneBox}>
            {notice && (
              <p className={styles.doneNotice} role="status">
                {notice}
              </p>
            )}
            {done && <p className={styles.doneNote}>제출한 정보는 수정할 수 없어요.</p>}
            <a className={`${styles.cta} ${styles.ctaSecondary}`} href={APP_HOME_LINK}>
              홈으로 가기
            </a>
          </section>
        )}

        {showForm && (
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
                maxLength={RECIPIENT_LIMITS.name}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>연락처</span>
              <input
                className={styles.input}
                type="tel"
                inputMode="numeric"
                value={form.phoneNumber}
                onChange={(event) => update('phoneNumber', formatPhone(event.target.value))}
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
                  value={form.address ? `[${form.zipCode}] ${form.address}` : ''}
                  placeholder="주소 검색"
                  readOnly
                  aria-labelledby="address-label"
                  onClick={() => setAddressOpen(true)}
                />
                <button
                  type="button"
                  className={styles.searchButton}
                  onClick={() => setAddressOpen(true)}
                >
                  검색
                </button>
              </div>
              <input
                ref={detailRef}
                className={styles.input}
                value={form.addressDetail}
                onChange={(event) => update('addressDetail', event.target.value)}
                placeholder="상세 주소 (동·호수, 없으면 '없음')"
                aria-label="상세 주소"
                maxLength={RECIPIENT_LIMITS.addressDetail}
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

            <p className={styles.consentNote}>
              제출한 정보는 수정할 수 없어요. 제출 전에 한 번 더 확인해 주세요.
            </p>

            <div className={styles.bottomCta}>
              <div className={styles.bottomCtaInner}>
                {/* 고정 CTA 에 가려지지 않게 버튼 바로 위에 둔다 */}
                {error && (
                  <p className={`${styles.formError} ${styles.ctaError}`} role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className={styles.cta}
                  disabled={!isRecipientFormComplete(form) || phase === 'submitting'}
                >
                  {phase === 'submitting' ? '제출하는 중…' : '제출하기'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {addressOpen && <AddressSearchLayer onSelect={selectAddress} onClose={closeAddress} />}
    </main>
  );
}
