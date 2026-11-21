'use client';

import styles from '../point.module.css';

export default function RetryButton() {
  return (
    <button type="button" className={styles.cta} onClick={() => window.location.reload()}>
      다시 시도
    </button>
  );
}
