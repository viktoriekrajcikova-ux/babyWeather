import styles from './pageHead.module.scss';

interface PageHeadProps {
  title: string;
  description: string;
}

const PageHead = ({ title, description }: PageHeadProps) => (
  <div className={styles.pageHead}>
    <h1>{title}</h1>
    <p>{description}</p>
  </div>
);

export default PageHead;
