import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, ChartColumn, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/api/useAuth';

const Header = () => {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <Container>
          <Row>
            <Col className={styles.wrapper}>
              <Link to="/">
                <House size={20} strokeWidth={2} />
                HOME
              </Link>
              <Link to="/overview">
                <ChartColumn size={20} strokeWidth={2} />
                OVERVIEW
              </Link>
              <Link to="/settings">
                <Settings size={20} strokeWidth={2} />
                SETTINGS
              </Link>
              <span className={styles.divider} aria-hidden="true" />
              <button type="button" onClick={handleSignOut} className={styles.logout}>
                <LogOut size={20} strokeWidth={2} />
                LOGOUT
              </button>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Header;
