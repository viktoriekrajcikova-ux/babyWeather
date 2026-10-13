import { useEffect } from 'react';
import { Button, Row } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getOutfit } from '../../../clothing/clothesDeterminer';
import { useDeleteChildMutation } from '../../hooks/useDeleteChildMutation';
import { useChildrenQuery } from '../../hooks/useChildrenQuery';
import Child from '../child/child';
import styles from './childrenOutfits.module.scss';
import { useTranslation } from 'react-i18next';

interface ChildrenOutfitsProps {
  feelsLike: number;
}

export const ChildrenOutfits = ({ feelsLike }: ChildrenOutfitsProps) => {
  const { t } = useTranslation();

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
      toast.error(`${t('children.deleteError')} ${t('common.pleaseRetry')}`, {
        id: 'children-delete',
      });
    } else {
      toast.dismiss('children-delete');
    }
  }, [deleteError, submittedAt, t]);

  useEffect(() => {
    if (childrenError) {
      toast.error(
        `${isLoadingError ? t('children.loadError') : t('children.refreshError')} ${t('children.retryHint')}`,
        { id: 'children-load' },
      );
    } else if (isSuccess) {
      toast.dismiss('children-load');
    }
  }, [childrenError, isLoadingError, isSuccess, errorUpdatedAt, t]);

  useEffect(
    () => () => {
      toast.dismiss('children-load');
      toast.dismiss('children-delete');
    },
    [],
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
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? t('common.retrying') : t('common.tryAgain')}
          </Button>
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
