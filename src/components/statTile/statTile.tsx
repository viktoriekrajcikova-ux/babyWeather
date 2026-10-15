import styles from './statTile.module.scss';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  sub: string;
  accent?: boolean;
}

const StatTile = ({ label, value, unit, sub, accent = false }: StatTileProps) => (
  <div className={accent ? `${styles.tile} ${styles.accent}` : styles.tile}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>
      {value}
      {unit && <span className={styles.unit}>{unit}</span>}
    </span>
    <span className={styles.sub}>{sub}</span>
  </div>
);

export default StatTile;
