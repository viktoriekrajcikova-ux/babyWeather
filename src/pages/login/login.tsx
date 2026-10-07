import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '../../components/toast/toastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import styles from './login.module.scss';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const { showError, dismiss } = useToast();
  useEffect(() => () => dismiss('auth-submit'), [dismiss]);
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
    dismiss('auth-submit');
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
      showError({
        id: 'auth-submit',
        title: mode === 'signIn' ? t('auth.signInError') : t('auth.signUpError'),
        message: t('auth.retryHint'),
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    dismiss('auth-submit');
    setMessage(null);
  };

  return (
    <main className={styles.page}>
      <p className={styles.brand}>
        BabyWeather<span aria-hidden="true">.</span>
      </p>
      <form onSubmit={handleSubmit} className={styles.card} aria-labelledby="loginTitle">
        <div className={styles.pageHead}>
          <h1 id="loginTitle">{mode === 'signIn' ? t('auth.login') : t('auth.createAccount')}</h1>
          <p>{mode === 'signIn' ? t('auth.loginDescription') : t('auth.registerDescription')}</p>
        </div>
        <div className={styles.field}>
          <label htmlFor="loginEmail">{t('auth.email')}</label>
          <input
            required
            id="loginEmail"
            name="email"
            autoComplete="username"
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="loginPassword">{t('auth.password')}</label>
          <input
            required
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            id="loginPassword"
            name="password"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

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
        <button className={styles.submit} type="submit" disabled={isPending}>
          {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
        </button>
        <div className={styles.switchMode}>
          <p>{mode === 'signIn' ? t('auth.newUser') : t('auth.existingUser')}</p>
          <button onClick={handleMode} type="button" disabled={isPending}>
            {mode === 'signIn' ? t('auth.registerLink') : t('auth.loginLink')}
          </button>
        </div>
      </form>
    </main>
  );
};

export default Login;
