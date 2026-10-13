import type { Child } from '../../children.types';
import { formatNames } from '../../helpers/formatNames';
import { useTranslation } from 'react-i18next';
import styles from './childrenSummary.module.scss';

interface ChildrenSummaryProps {
  kids: Child[];
  isError: boolean;
}

const ChildrenSummary = ({ kids, isError }: ChildrenSummaryProps) => {
  const { t } = useTranslation();
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{t('overview.kids')}</span>
      <span className={styles.value}>{isError ? '-' : kids.length}</span>
      <span className={styles.sub}>
        {isError ? t('common.unavailable') : formatNames(kids) || t('overview.noChildren')}
      </span>
    </div>
  );
};

export default ChildrenSummary;
