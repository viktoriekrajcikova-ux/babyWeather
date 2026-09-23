import type { Child } from '../../model/child/child';
import type { ClothesItem } from '../../model/clothesDeterminer/clothesDeterminer';
import styles from './overview.module.scss';

const boyAvatar = 'assets/img/boy.png';
const girlAvatar = 'assets/img/girl.png';

type ChildPackingCardProps = {
  child: Child;
  clothes: ClothesItem[];
};

export default function ChildPackingCard({ child, clothes }: ChildPackingCardProps) {
  const avatar = child.sex === 'male' ? boyAvatar : child.sex === 'female' ? girlAvatar : '';

  return (
    <article className={styles.childCard}>
      <div className={styles.childHead}>
        <img className={styles.avatar} src={avatar} alt="" />
        <div>
          <h3>{child.name}</h3>
          <div className={styles.meta}>
            {child.age} {child.age === 1 ? 'year' : 'years'}
          </div>
        </div>
      </div>
      <p className={styles.planHint}>
        Clothing for the rest of today &mdash; {clothes.length} items to have ready.
      </p>
      <ul className={styles.chips}>
        {clothes.map((item) => (
          <li key={item.name} className={styles.chip}>
            <span className={styles.thumb}>
              <img src={item.imageUrl} alt="" />
            </span>
            {item.name}
          </li>
        ))}
      </ul>
    </article>
  );
}
