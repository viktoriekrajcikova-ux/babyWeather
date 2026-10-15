import type { Child } from '../../children.types';
import type { ClothesItem } from '../../../clothing/clothing.types';
import styles from './childPackingCard.module.scss';
import { useTranslation } from 'react-i18next';
import { getChildAvatar } from '../../helpers/getChildAvatar';

type ChildPackingCardProps = {
  child: Child;
  clothes: ClothesItem[];
};

export default function ChildPackingCard({ child, clothes }: ChildPackingCardProps) {
  const { t } = useTranslation();
  const urlAvatar = getChildAvatar(child.sex);

  return (
    <article className={styles.childCard}>
      <div className={styles.childHead}>
        <img className={styles.avatar} src={urlAvatar} alt="" />
        <div>
          <h3>{child.name}</h3>
          <div className={styles.meta}>{t('children.ageYears', { count: child.age })}</div>
        </div>
      </div>
      <p className={styles.planHint}>{t('overview.packingHint', { count: clothes.length })}</p>
      <ul className={styles.chips}>
        {clothes.map((item) => (
          <li key={item.name} className={styles.chip}>
            <span className={styles.thumb}>
              <img src={item.imageUrl} alt="" />
            </span>
            {t(`clothing.${item.name}`, { defaultValue: item.name })}
          </li>
        ))}
      </ul>
    </article>
  );
}
