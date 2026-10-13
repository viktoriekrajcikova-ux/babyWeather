import { Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const Loader = () => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center justify-content-center gap-2 my-4" role="status">
      <Spinner animation="border" size="sm" aria-hidden="true" />
      <span>{t('common.loading')}</span>
    </div>
  );
};

export default Loader;
