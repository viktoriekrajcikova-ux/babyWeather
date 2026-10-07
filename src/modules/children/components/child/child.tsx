import type { Sex } from '../../children.types';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import styles from './child.module.scss';
import { X } from 'lucide-react';
import type { ClothesItem } from '../../../clothing/clothing.types';
import { useTranslation } from 'react-i18next';

const imgUrlGirl = 'assets/img/girl.png';
const imgUrlBoy = 'assets/img/boy.png';

interface ChildProps {
  name: string;
  sex: Sex | null;
  allClothes: ClothesItem[];
  id: number;
  onClickDelete: (id: number) => void;
}

const Child = ({ name, sex, allClothes, id, onClickDelete }: ChildProps) => {
  const { t } = useTranslation();
  const urlAvatar = sex === 'male' ? imgUrlBoy : sex === 'female' ? imgUrlGirl : '';

  return (
    <>
      <Col xs={12} md={6} className={styles.child} id={String(id)}>
        <button
          type="button"
          className={styles.delete}
          aria-label={t('children.remove', { name })}
          onClick={() => onClickDelete(id)}
        >
          <X size={20} strokeWidth={2} />
        </button>
        {urlAvatar && <Image className={styles.img} src={urlAvatar} alt="" roundedCircle />}
        <h2 className={styles.name}>{name}</h2>
        <ul className={styles.clothes}>
          {allClothes.map((clothes, key) => (
            <li key={key}>
              <img src={clothes.imageUrl} alt="" />
              <p>{t(`clothing.${clothes.name}`, { defaultValue: clothes.name })}</p>
            </li>
          ))}
        </ul>
      </Col>
    </>
  );
};

export default Child;
