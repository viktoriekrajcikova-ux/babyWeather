import { Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import RetryAlert from '../../../../components/retryAlert/retryAlert';
import { getOutfit } from '../../../clothing/clothesDeterminer';
import { useChildrenQuery } from '../../hooks/useChildrenQuery';
import { useDeleteChildMutation } from '../../hooks/useDeleteChildMutation';
import Child from '../child/child';

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
  } = useChildrenQuery();
  const { mutate: onDeleteChild } = useDeleteChildMutation();

  const childrenWithClothes = kids.map((child) => ({
    ...child,
    clothes: getOutfit(feelsLike, child.age, child.sex),
  }));

  return (
    <>
      {childrenError && (
        <RetryAlert
          message={isLoadingError ? t('children.unavailable') : t('children.stale')}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      )}

      <Row className="g-3">
        {childrenWithClothes.map((child) => (
          <Child
            childData={child}
            key={child.id}
            onClickDelete={onDeleteChild}
            allClothes={child.clothes}
          />
        ))}
      </Row>
    </>
  );
};
