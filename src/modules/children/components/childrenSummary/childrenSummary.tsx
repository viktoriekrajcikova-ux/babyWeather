import { useTranslation } from 'react-i18next';

import Loader from '../../../../components/loader/loader';
import StatTile from '../../../../components/statTile/statTile';
import { formatNames } from '../../helpers/formatNames';
import { useChildrenQuery } from '../../hooks/useChildrenQuery';

const ChildrenSummary = () => {
  const { t } = useTranslation();
  const { data: kids = [], isError, isPending } = useChildrenQuery();
  return isPending ? (
    <Loader />
  ) : (
    <StatTile
      label={t('overview.kids')}
      value={isError ? '-' : kids.length}
      sub={isError ? t('common.unavailable') : formatNames(kids) || t('overview.noChildren')}
    />
  );
};

export default ChildrenSummary;
