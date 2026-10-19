import { X } from 'lucide-react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import { useTranslation } from 'react-i18next';

import type { ClothesItem } from '../../../clothing/clothing.types';
import type { Child } from '../../children.types';
import { getChildAvatar } from '../../helpers/getChildAvatar';
import styles from './child.module.scss';

interface ChildProps {
  childData: Child;
  allClothes: ClothesItem[];
  onClickDelete: (id: number) => void;
}

const Child = ({ childData, allClothes, onClickDelete }: ChildProps) => {
  const { t } = useTranslation();
  const urlAvatar = getChildAvatar(childData.sex);

  return (
    <Col xs={12} md={6} className={styles.child} id={String(childData.id)}>
      <Button
        type="button"
        variant="outline-danger"
        className={styles.delete}
        aria-label={t('children.remove', { name: childData.name })}
        onClick={() => onClickDelete(childData.id)}
      >
        <X size={20} strokeWidth={2} />
      </Button>
      {urlAvatar && <Image className={styles.img} src={urlAvatar} alt="" roundedCircle />}
      <h2 className={styles.name}>{childData.name}</h2>
      <ul className={styles.clothes}>
        {allClothes.map((clothes, key) => (
          <li key={key}>
            <img src={clothes.imageUrl} alt="" />
            <p>{t(`clothing.${clothes.name}`, { defaultValue: clothes.name })}</p>
          </li>
        ))}
      </ul>
    </Col>
  );
};

export default Child;
