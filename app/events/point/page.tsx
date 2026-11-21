import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ENTRY_COST,
  POINT_EVENT_MY_PATH,
  POINT_EVENT_SCHEDULE,
  PRIZES,
} from '@/src/config/PointEvent';
import type { MissionGroupMissions } from '@/src/models/PointEvent';
import { readPageAuth } from '@/src/server/authorizedApi';
import { fetchMissions } from '@/src/server/pointEvent';
import { formatDday, formatShortDate, isPast } from '@/src/utils/pointEvent';
import EarnTable from './_components/EarnTable';
import SectionHeader from './_components/SectionHeader';
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

async function loadMissions(): Promise<MissionState> {
  const { token, userAgent } = await readPageAuth();
  if (!token) return { status: 'no-token' };
  const result = await fetchMissions({ token, userAgent });
  return result.status === 'ok' ? { status: 'ok', data: result.data } : { status: 'error' };
}

function currentStep(endAt: string | null): number {
  const { announceAt, shippingFrom } = POINT_EVENT_SCHEDULE;
  if (isPast(shippingFrom)) return 3;
  if (isPast(announceAt)) return 2;
  if (isPast(endAt)) return 1;
  return 0;
}

export default async function PointEventPage() {
  const missionState = await loadMissions();
  const missionGroup = missionState.status === 'ok' ? missionState.data : null;
  const startAt = POINT_EVENT_SCHEDULE.startAt ?? missionGroup?.group.startDateTime ?? null;
  const endAt = POINT_EVENT_SCHEDULE.endAt ?? missionGroup?.group.endDateTime ?? null;
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

        <section className={styles.section}>
          <SectionHeader kicker="경품" title="붕어빵 킹 경품" />
          <div className={styles.prizeGrid}>
            {PRIZES.map((prize) => (
              <article key={prize.code} className={styles.prizeCard}>
                <div className={styles.prizeImage}>
                  <Image src={prize.image} alt={prize.name} fill sizes="(max-width: 480px) 40vw, 180px" />
                </div>
                <div className={styles.prizeText}>
                  <h3 className={styles.prizeName}>{prize.name}</h3>
                  <p className={styles.prizeDescription}>{prize.description}</p>
                  <span className={styles.pill}>추첨 {prize.winnerCount}명</span>
                </div>
              </article>
            ))}
          </div>
        </section>

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
                description: `응모 1회에 ${ENTRY_COST}P를 써요. 여러 번 응모할수록 당첨 확률이 올라가요.`,
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
          <EarnTable
            missions={missionGroup?.missions ?? null}
            unavailable={missionState.status === 'error' ? 'error' : 'no-token'}
          />
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
