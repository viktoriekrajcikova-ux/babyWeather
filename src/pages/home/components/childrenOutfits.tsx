import { useEffect } from 'react';
import { Row } from 'react-bootstrap';
import { useToast } from '../../../components/toast/toastContext';
import { getOutfit } from '../../../modules/clothing/clothesDeterminer';
import { useDeleteChildMutation } from '../../../modules/children/hooks/useDeleteChildMutation';
import { useChildrenQuery } from '../../../modules/children/hooks/useChildrenQuery';
import Child from '../../../modules/children/components/child/child';
import styles from '../home.module.scss';
import { useTranslation } from 'react-i18next';

interface ChildrenOutfitsProps {
  feelsLike: number;
}

export const ChildrenOutfits = ({ feelsLike }: ChildrenOutfitsProps) => {
  const { t } = useTranslation();
  const { showError, dismiss } = useToast();
  const {
    data: kids = [],
    isError: childrenError,
    refetch,
    isFetching,
    isLoadingError,
    isSuccess,
    errorUpdatedAt,
  } = useChildrenQuery();
  const { mutate: onDeleteChild, isError: deleteError, submittedAt } = useDeleteChildMutation();

  useEffect(() => {
    if (deleteError) {
      showError({
        id: 'children-delete',
        title: t('children.deleteError'),
        message: t('common.pleaseRetry'),
      });
    } else {
      dismiss('children-delete');
    }
  }, [deleteError, submittedAt, showError, dismiss, t]);

  useEffect(() => {
    if (childrenError) {
      showError({
        id: 'children-load',
        title: isLoadingError ? t('children.loadError') : t('children.refreshError'),
        message: t('children.retryHint'),
      });
    } else if (isSuccess) {
      dismiss('children-load');
    }
  }, [childrenError, isLoadingError, isSuccess, errorUpdatedAt, showError, dismiss, t]);

  useEffect(
    () => () => {
      dismiss('children-load');
      dismiss('children-delete');
    },
    [dismiss],
  );

  const childrenWithClothes = kids.map((child) => ({
    ...child,
    clothes: getOutfit(feelsLike, child.age, child.sex),
  }));

  return (
    <>
      {childrenError && (
        <div className={styles.alert}>
          <p>{isLoadingError ? t('children.unavailable') : t('children.stale')}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? t('common.retrying') : t('common.tryAgain')}
          </button>
        </div>
      )}

      <Row className="g-3">
        {childrenWithClothes.map((child) => (
          <Child
            id={child.id}
            key={child.id}
            name={child.name}
            onClickDelete={onDeleteChild}
            sex={child.sex}
            allClothes={child.clothes}
          />
        ))}
      </Row>
    </>
  );
};
