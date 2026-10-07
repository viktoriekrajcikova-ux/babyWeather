import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, ChartColumn, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useState } from 'react';
import { useToast } from '../../components/toast/toastContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t, i18n } = useTranslation();
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
      showError({
        id: 'auth-signout',
        title: t('auth.signOutError'),
        message: t('common.pleaseRetry'),
      });
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
              <select
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
              </select>
              <button
                type="button"
                onClick={handleSignOut}
                className={styles.logout}
                disabled={isSigningOut}
              >
                <LogOut size={20} strokeWidth={2} />
                {t('navigation.logout')}
              </button>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Header;
