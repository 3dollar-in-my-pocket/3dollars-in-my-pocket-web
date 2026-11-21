import styles from '../point.module.css';

type Props = {
  width?: number | string;
  height: number;
  radius?: number;
  tone?: 'gray' | 'onColor' | 'onPink';
  className?: string;
};

/** 로딩 중 자리표시 막대 */
export default function Skeleton({ width = '100%', height, radius, tone = 'gray', className }: Props) {
  const toneClass =
    tone === 'onColor' ? styles.skeletonOnColor : tone === 'onPink' ? styles.skeletonOnPink : '';
  return (
    <span
      className={[styles.skeleton, toneClass, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}
