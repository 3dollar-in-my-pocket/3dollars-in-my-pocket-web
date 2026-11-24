import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { POINT_EVENT_MY_PATH, POINT_EVENT_SCHEDULE } from '@/src/config/PointEvent';
import type { MissionGroupMissions, Raffle } from '@/src/models/PointEvent';
import { readPageAuth } from '@/src/server/authorizedApi';
import { fetchMissions, fetchRaffles } from '@/src/server/pointEvent';
import {
  formatDday,
  formatPoint,
  formatShortDate,
  isPast,
  sharedRaffleCost,
} from '@/src/utils/pointEvent';
import EarnTable from './_components/EarnTable';
import SectionHeader from './_components/SectionHeader';
import Skeleton from './_components/Skeleton';
import styles from './point.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '붕어빵 활동하고 붕어빵 굿즈 받자!',
  description:
    '가게를 제보하고 리뷰를 남기면 포인트가 쌓여요. 모은 포인트로 붕어빵 굿즈에 응모해 보세요.',
  robots: { index: false, follow: false },
};

const NOTICES = [
  '활동별 적립 기준과 하루 적립 횟수는 위 적립 표를 따라요.',
  '가게와 관계없는 사진이나 허위 리뷰는 확인 후 포인트를 회수해요.',
  '이벤트 포인트는 이벤트가 끝나면 초기화돼요.',
  '응모에 쓴 포인트는 돌려받을 수 없어요.',
  '받으실 정보는 경품 배송에만 쓰고, 배송이 끝나면 바로 파기해요.',
  '부정한 방법으로 참여하면 당첨이 취소될 수 있어요.',
];

type MissionState =
  | { status: 'ok'; data: MissionGroupMissions }
  | { status: 'no-token' }
  | { status: 'error' };

async function loadMissions(token: string | null, userAgent: string | null): Promise<MissionState> {
  if (!token) return { status: 'no-token' };
  const result = await fetchMissions({ token, userAgent });
  return result.status === 'ok' ? { status: 'ok', data: result.data } : { status: 'error' };
}

/** 경품 카드용 응모 대상 목록 (로그인 없이). 실패하면 null */
async function loadRaffles(userAgent: string | null): Promise<Raffle[] | null> {
  const result = await fetchRaffles({ userAgent });
  return result.status === 'ok' ? result.data.contents : null;
}

/** 일정은 설정 값이 우선. 둘 다 있으면 미션 API 를 기다리지 않는다 */
async function loadSchedule(missionsPromise: Promise<MissionState>) {
  const { startAt, endAt } = POINT_EVENT_SCHEDULE;
  if (startAt && endAt) return { startAt, endAt };
  const missions = await missionsPromise;
  const group = missions.status === 'ok' ? missions.data.group : null;
  return {
    startAt: startAt ?? group?.startDateTime ?? null,
    endAt: endAt ?? group?.endDateTime ?? null,
  };
}

/** 경품 카드 — 응모 대상 목록이 오면 스트리밍. 못 불러오면 안내 문구, 비어 있으면 영역을 숨긴다 */
async function PrizeSection({ rafflesPromise }: { rafflesPromise: Promise<Raffle[] | null> }) {
  const raffles = await rafflesPromise;
  if (raffles?.length === 0) return null;
  return (
    <section className={styles.section}>
      <SectionHeader kicker="경품" title="붕어빵 킹 경품" />
      {raffles === null ? (
        <p className={styles.prizeFallback}>
          경품 정보를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.
        </p>
      ) : (
        <div className={styles.prizeGrid}>
          {raffles.map((raffle) => (
            <article key={raffle.raffleId} className={styles.prizeCard}>
              <div className={styles.prizeImage}>
                {raffle.image && (
                  <Image
                    src={raffle.image.imageUrl}
                    alt={raffle.title}
                    fill
                    sizes="(max-width: 480px) 40vw, 180px"
                    unoptimized
                  />
                )}
              </div>
              <div className={styles.prizeText}>
                <h3 className={styles.prizeName}>{raffle.title}</h3>
                {raffle.description && (
                  <p className={styles.prizeDescription}>{raffle.description}</p>
                )}
                {raffle.winnerCount !== null && (
                  <span className={styles.pill}>추첨 {raffle.winnerCount}명</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PrizeSectionSkeleton() {
  return (
    <section className={styles.section} aria-busy="true">
      <SectionHeader kicker="경품" title="붕어빵 킹 경품" />
      <div className={styles.prizeGrid}>
        <Skeleton height={240} radius={20} />
        <Skeleton height={240} radius={20} />
      </div>
    </section>
  );
}

const ENTRY_STEP_SUFFIX = '여러 번 응모할수록 당첨 확률이 올라가요.';

/** 참여 방법 2단계 — 응모 비용은 응모 대상 목록이 와야 알 수 있다 */
async function EntryStepDescription({
  rafflesPromise,
}: {
  rafflesPromise: Promise<Raffle[] | null>;
}) {
  const entryCost = sharedRaffleCost(await rafflesPromise);
  return entryCost !== null
    ? `응모 1회에 ${formatPoint(entryCost)}를 써요. ${ENTRY_STEP_SUFFIX}`
    : ENTRY_STEP_SUFFIX;
}

async function EarnSection({ missionsPromise }: { missionsPromise: Promise<MissionState> }) {
  const missionState = await missionsPromise;
  return (
    <EarnTable
      missions={missionState.status === 'ok' ? missionState.data.missions : null}
      unavailable={missionState.status === 'error' ? 'error' : 'no-token'}
    />
  );
}

function currentStep(endAt: string | null): number {
  const { announceAt, shippingFrom } = POINT_EVENT_SCHEDULE;
  if (isPast(shippingFrom)) return 3;
  if (isPast(announceAt)) return 2;
  if (isPast(endAt)) return 1;
  return 0;
}

export default async function PointEventPage() {
  const { token, userAgent } = await readPageAuth();
  // 두 API 는 기다리지 않고 시작만 해 두고, 쓰는 영역만 Suspense 로 스트리밍한다.
  const missionsPromise = loadMissions(token, userAgent);
  const rafflesPromise = loadRaffles(userAgent);
  const { startAt, endAt } = await loadSchedule(missionsPromise);
  const started = !startAt || isPast(startAt);
  const { announceAt, claimDeadline, shippingFrom } = POINT_EVENT_SCHEDULE;
  const period =
    startAt && endAt ? `${formatShortDate(startAt)} ~ ${formatShortDate(endAt)}` : '추후 안내';
  const announce = formatShortDate(announceAt);
  const step = currentStep(endAt);

  const timeline = [
    { title: '포인트 적립 · 응모', description: period },
    { title: '당첨 발표', description: `${announce} · 앱 푸시와 내 포인트 페이지에서` },
    {
      title: '받으실 정보 입력',
      description: claimDeadline
        ? `${formatShortDate(claimDeadline)}까지 · 당첨자만`
        : '추후 안내 · 당첨자만',
    },
    {
      title: '굿즈 배송',
      description: shippingFrom ? `${formatShortDate(shippingFrom)}부터 순차 발송` : '추후 안내',
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>가슴속 3천원 겨울 이벤트</span>
            {endAt && (
              <span className={`${styles.badge} ${styles.badgeDark}`}>
                {started ? formatDday(endAt) : `오픈 ${formatDday(startAt)}`}
              </span>
            )}
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              붕어빵 활동하고
              <br />
              <span className={styles.pinkText}>붕어빵 굿즈</span> 받자!
            </h1>
            <p className={styles.heroDescription}>
              가게를 제보하고 리뷰를 남기면 포인트가 쌓여요.
              <br />
              모은 포인트로 굿즈에 응모해 보세요.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <Image
              src="/events/point/hero.png"
              alt="붕어빵 키링이 달린 하트 마스코트"
              width={219}
              height={256}
              className={styles.heroImage}
              priority
            />
            <span className={`${styles.coin} ${styles.coinLarge}`} aria-hidden>
              P
            </span>
            <span className={`${styles.coin} ${styles.coinMedium}`} aria-hidden>
              P
            </span>
            <span className={`${styles.coin} ${styles.coinSmall}`} aria-hidden />
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span>이벤트 기간</span>
              <span>{period}</span>
            </div>
            <div className={styles.infoRow}>
              <span>당첨 발표</span>
              <span>{announce}</span>
            </div>
          </div>
        </section>

        <Suspense fallback={<PrizeSectionSkeleton />}>
          <PrizeSection rafflesPromise={rafflesPromise} />
        </Suspense>

        <section className={`${styles.section} ${styles.sectionGray}`}>
          <SectionHeader kicker="참여 방법" title="세 단계면 끝나요" />
          <ol className={styles.steps}>
            {[
              {
                title: '앱에서 활동하고 포인트 모으기',
                description: '가게 제보, 리뷰, 방문 인증에 참여하면 포인트가 바로 쌓여요.',
              },
              {
                title: '모은 포인트로 응모하기',
                description: (
                  <Suspense fallback={ENTRY_STEP_SUFFIX}>
                    <EntryStepDescription rafflesPromise={rafflesPromise} />
                  </Suspense>
                ),
              },
              {
                title: '당첨 발표 확인하기',
                description: `${announceAt ? announce : '발표일'}에 앱 푸시로 알려드려요. 내 포인트 페이지에서도 확인할 수 있어요.`,
              },
            ].map((item, index) => (
              <li key={item.title} className={styles.stepCard}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>{item.title}</span>
                  <span className={styles.stepDescription}>{item.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="earn" className={styles.section}>
          <SectionHeader kicker="포인트 모으는 법" title="활동하면 바로 적립돼요" />
          <Suspense fallback={<Skeleton height={280} radius={20} />}>
            <EarnSection missionsPromise={missionsPromise} />
          </Suspense>
        </section>

        <section className={`${styles.section} ${styles.sectionGray}`}>
          <SectionHeader kicker="일정" title="이렇게 진행돼요" />
          <ol className={styles.timeline}>
            {timeline.map((item, index) => (
              <li key={item.title} className={styles.timelineItem}>
                <span className={styles.timelineRail} aria-hidden>
                  <span
                    className={
                      index === step
                        ? `${styles.timelineDot} ${styles.timelineDotCurrent}`
                        : styles.timelineDot
                    }
                  />
                  {index < timeline.length - 1 && <span className={styles.timelineLine} />}
                </span>
                <span className={styles.timelineText}>
                  <span className={styles.timelineTitle}>
                    {item.title}
                    {index === step && <span className="sr-only"> (진행 중)</span>}
                  </span>
                  <span className={styles.timelineDescription}>{item.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.notice}>
          <h2 className={styles.noticeTitle}>유의사항</h2>
          <ul className={styles.noticeList}>
            {NOTICES.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.bottomCta}>
        <div className={styles.bottomCtaInner}>
          <Link className={styles.cta} href={POINT_EVENT_MY_PATH}>
            내 포인트 보러가기
          </Link>
        </div>
      </div>
    </main>
  );
}
