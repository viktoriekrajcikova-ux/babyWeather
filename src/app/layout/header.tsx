import { Button, Container, Row, Col, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './header.module.scss';
import { House, ChartColumn, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSignOutMutation } from '../../modules/auth/hooks/useSignOutMutation';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { mutate: signOut, isPending: isSigningOut } = useSignOutMutation();

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
                onClick={() => signOut()}
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
