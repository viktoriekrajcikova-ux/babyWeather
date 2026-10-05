import { Row, Toast, ToastContainer } from 'react-bootstrap';
import { getOutfit } from '../../../modules/clothing/clothesDeterminer';
import { useDeleteChildMutation } from '../../../modules/children/hooks/useDeleteChildMutation';
import { useChildrenQuery } from '../../../modules/children/hooks/useChildrenQuery';
import Child from '../../../modules/children/components/child/child';
import styles from '../home.module.scss';

interface ChildrenOutfitsProps {
  feelsLike: number;
}

export const ChildrenOutfits = ({ feelsLike }: ChildrenOutfitsProps) => {
  const {
    data: kids = [],
    isError: childrenError,
    refetch,
    isFetching,
    isLoadingError,
  } = useChildrenQuery();
  const {
    mutate: onDeleteChild,
    isError: deleteError,
    reset: resetDeleteError,
  } = useDeleteChildMutation();

  const childrenWithClothes = kids.map((child) => ({
    ...child,
    clothes: getOutfit(feelsLike, child.age, child.sex),
  }));

  return (
    <>
      {childrenError && (
        <div className={styles.alert} role="alert">
          <p>{isLoadingError ? 'Could not load children' : 'Could not refresh children'}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      )}
      <ToastContainer position="top-end" containerPosition="fixed" className="p-3">
        <Toast show={deleteError} onClose={resetDeleteError} autohide={false}>
          <Toast.Header>Could not delete child</Toast.Header>
          <Toast.Body>Please try again.</Toast.Body>
        </Toast>
      </ToastContainer>
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
