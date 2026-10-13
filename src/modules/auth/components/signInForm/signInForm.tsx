import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../authForm.module.scss';
import { useTranslation } from 'react-i18next';

type SignInFormProps = {
  onSignUp: () => void;
};

const SignInForm = ({ onSignUp }: SignInFormProps) => {
  const { t } = useTranslation();
  useEffect(() => () => toast.dismiss('auth-submit'), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isPending, setIsPending] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    toast.dismiss('auth-submit');
    setIsPending(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch {
      toast.error(`${t('auth.signInError')} ${t('auth.retryHint')}`, { id: 'auth-submit' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className={styles.card} aria-labelledby="signInTitle">
      <div className={styles.pageHead}>
        <h1 id="signInTitle">{t('auth.login')}</h1>
        <p>{t('auth.loginDescription')}</p>
      </div>
      <Form.Group className={styles.field} controlId="signInEmail">
        <Form.Label>{t('auth.email')}</Form.Label>
        <Form.Control
          required
          name="email"
          autoComplete="username"
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Form.Group>
      <Form.Group className={styles.field} controlId="signInPassword">
        <Form.Label>{t('auth.password')}</Form.Label>
        <Form.Control
          required
          autoComplete={'current-password'}
          name="password"
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Group>

      {isPending && (
        <div className={styles.status} role="status">
          {t('common.pleaseWait')}
        </div>
      )}
      <Button variant="primary" type="submit" disabled={isPending}>
        {t('auth.signIn')}
      </Button>
      <div className={styles.switchMode}>
        <p>{t('auth.newUser')}</p>
        <Button variant="link" onClick={onSignUp} type="button" disabled={isPending}>
          {t('auth.registerLink')}
        </Button>
      </div>
    </Form>
  );
};

export default SignInForm;
