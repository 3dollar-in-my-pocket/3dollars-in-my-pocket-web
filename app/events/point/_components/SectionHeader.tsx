import styles from '../point.module.css';

export default function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <p className={styles.kicker}>{kicker}</p>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}
