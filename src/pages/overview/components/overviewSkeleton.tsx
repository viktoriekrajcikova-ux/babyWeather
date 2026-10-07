import styles from '../overview.module.scss';
import { useTranslation } from 'react-i18next';

const OverviewSkeleton = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className={styles.tiles} aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.skeletonTile}`} />
        ))}
      </div>
      <div className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%' }} />
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </div>
      <p className={styles.visuallyHidden} role="status">
        {t('overview.loading')}
      </p>
    </>
  );
};

export default OverviewSkeleton;
