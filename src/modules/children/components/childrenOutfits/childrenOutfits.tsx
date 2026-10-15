import { Row } from 'react-bootstrap';
import { getOutfit } from '../../../clothing/clothesDeterminer';
import { useDeleteChildMutation } from '../../hooks/useDeleteChildMutation';
import { useChildrenQuery } from '../../hooks/useChildrenQuery';
import Child from '../child/child';
import { useTranslation } from 'react-i18next';
import RetryAlert from '../../../../components/retryAlert/retryAlert';

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
