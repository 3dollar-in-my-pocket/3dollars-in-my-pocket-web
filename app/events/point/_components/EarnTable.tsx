import type { Mission } from '@/src/models/PointEvent';
import {
  formatPoint,
  isMissionDone,
  missionCondition,
  missionIcon,
  missionPoint,
} from '@/src/utils/pointEvent';
import styles from '../point.module.css';

/**
 * 적립 표 — 서버 미션 그룹(goods-promotion)의 노출 미션을 그대로 보여준다.
 * 미션 API 는 로그인이 필요해서, 앱 밖(토큰 없음)에서는 앱에서 열도록 안내한다.
 */
export default function EarnTable({
  missions,
  unavailable,
}: {
  missions: Mission[] | null;
  unavailable: 'no-token' | 'error';
}) {
  if (!missions) {
    return (
      <div className={styles.earnTable}>
        <p className={styles.earnEmpty}>
          {unavailable === 'error' ? (
            <>
              적립 방법을 불러오지 못했어요.
              <br />
              잠시 후 다시 열어 주세요.
            </>
          ) : (
            <>
              앱에서 이 페이지를 열면
              <br />
              적립 방법과 오늘 진행 상황을 볼 수 있어요.
            </>
          )}
        </p>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className={styles.earnTable}>
        <p className={styles.earnEmpty}>적립 방법을 준비하고 있어요.</p>
      </div>
    );
  }

  return (
    <ul className={styles.earnTable}>
      {missions.map((mission) => {
        const done = isMissionDone(mission);
        return (
          <li
            key={mission.missionId}
            className={done ? `${styles.earnRow} ${styles.earnDone}` : styles.earnRow}
          >
            <span className={styles.earnIcon}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={missionIcon(mission)} width={22} height={22} alt="" />
            </span>
            <span className={styles.earnText}>
              <span className={styles.earnTitle}>{mission.title}</span>
              <span className={styles.earnCondition}>
                {missionCondition(mission)}
              </span>
            </span>
            <span className={styles.earnPoint}>
              {done ? '완료' : formatPoint(missionPoint(mission))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
