import type { Child } from '../../../modules/children/children.types';
import type { ClothesItem } from '../../../modules/clothing/clothing.types';
import styles from '../overview.module.scss';
import { useTranslation } from 'react-i18next';

const boyAvatar = 'assets/img/boy.png';
const girlAvatar = 'assets/img/girl.png';

type ChildPackingCardProps = {
  child: Child;
  clothes: ClothesItem[];
};

export default function ChildPackingCard({ child, clothes }: ChildPackingCardProps) {
  const { t } = useTranslation();
  const avatar = child.sex === 'male' ? boyAvatar : child.sex === 'female' ? girlAvatar : '';

  return (
    <article className={styles.childCard}>
      <div className={styles.childHead}>
        <img className={styles.avatar} src={avatar} alt="" />
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
