import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, ChartColumn, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useState } from 'react';
import { useToast } from '../../components/toast/toastContext';

const Header = () => {
  const { signOut } = useAuth();
  const { showError, dismiss } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    if (isSigningOut) return;
    dismiss('auth-signout');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      showError({ id: 'auth-signout', title: 'Could not sign out', message: 'Please try again.' });
    } finally {
      setIsSigningOut(false);
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
              <button
                type="button"
                onClick={handleSignOut}
                className={styles.logout}
                disabled={isSigningOut}
              >
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
