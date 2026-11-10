'use client';

import styles from './page.module.css';

export default function RetryButton() {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles.primary}`}
      onClick={() => window.location.reload()}
    >
      다시 시도
    </button>
  );
}
