import type { Child } from '../../children.types';
import { formatNames } from '../../helpers/formatNames';
import { useTranslation } from 'react-i18next';
import StatTile from '../../../../components/statTile/statTile';

interface ChildrenSummaryProps {
  kids: Child[];
  isError: boolean;
}

const ChildrenSummary = ({ kids, isError }: ChildrenSummaryProps) => {
  const { t } = useTranslation();
  return (
    <StatTile
      label={t('overview.kids')}
      value={isError ? '-' : kids.length}
      sub={isError ? t('common.unavailable') : formatNames(kids) || t('overview.noChildren')}
    />
  );
};

export default ChildrenSummary;
