import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, ChartColumn, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    if (isSigningOut) return;
    toast.dismiss('auth-signout');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error(`${t('auth.signOutError')} ${t('common.pleaseRetry')}`, { id: 'auth-signout' });
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
                {t('navigation.home')}
              </Link>
              <Link to="/overview">
                <ChartColumn size={20} strokeWidth={2} />
                {t('navigation.overview')}
              </Link>
              <Link to="/settings">
                <Settings size={20} strokeWidth={2} />
                {t('navigation.settings')}
              </Link>
              <span className={styles.divider} aria-hidden="true" />
              <Form.Select
                className={styles.language}
                aria-label={t('navigation.language')}
                value={i18n.resolvedLanguage ?? 'cs'}
                onChange={(event) => {
                  void i18n.changeLanguage(event.target.value);
                }}
              >
                <option value="cs" lang="cs">
                  Čeština
                </option>
                <option value="en" lang="en">
                  English
                </option>
              </Form.Select>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleSignOut}
                className={styles.logout}
                disabled={isSigningOut}
              >
                <LogOut size={20} strokeWidth={2} />
                {t('navigation.logout')}
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Header;
