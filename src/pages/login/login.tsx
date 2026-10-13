import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import styles from './login.module.scss';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  useEffect(() => () => toast.dismiss('auth-submit'), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    toast.dismiss('auth-submit');
    setMessage(null);
    setIsPending(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
        navigate('/');
      } else {
        const session = await signUp(email, password);
        if (session) return navigate('/');
        setMessage('auth.confirmEmail');
      }
    } catch {
      toast.error(
        `${mode === 'signIn' ? t('auth.signInError') : t('auth.signUpError')} ${t('auth.retryHint')}`,
        { id: 'auth-submit' },
      );
    } finally {
      setIsPending(false);
    }
  };

  const handleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    toast.dismiss('auth-submit');
    setMessage(null);
  };

  return (
    <main className={styles.page}>
      <p className={styles.brand}>
        BabyWeather<span aria-hidden="true">.</span>
      </p>
      <Form onSubmit={handleSubmit} className={styles.card} aria-labelledby="loginTitle">
        <div className={styles.pageHead}>
          <h1 id="loginTitle">{mode === 'signIn' ? t('auth.login') : t('auth.createAccount')}</h1>
          <p>{mode === 'signIn' ? t('auth.loginDescription') : t('auth.registerDescription')}</p>
        </div>
        <Form.Group className={styles.field} controlId="loginEmail">
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
        <Form.Group className={styles.field} controlId="loginPassword">
          <Form.Label>{t('auth.password')}</Form.Label>
          <Form.Control
            required
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            name="password"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        {message && (
          <div className={styles.status} role="status">
            {t(message)}
          </div>
        )}
        {isPending && (
          <div className={styles.status} role="status">
            {t('common.pleaseWait')}
          </div>
        )}
        <Button variant="primary" type="submit" disabled={isPending}>
          {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
        </Button>
        <div className={styles.switchMode}>
          <p>{mode === 'signIn' ? t('auth.newUser') : t('auth.existingUser')}</p>
          <Button variant="link" onClick={handleMode} type="button" disabled={isPending}>
            {mode === 'signIn' ? t('auth.registerLink') : t('auth.loginLink')}
          </Button>
        </div>
      </Form>
    </main>
  );
};

export default Login;
