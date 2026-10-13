import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../authForm.module.scss';
import { useTranslation } from 'react-i18next';

type SignUpFormProps = {
  onSignIn: () => void;
};

const SignUpForm = ({ onSignIn }: SignUpFormProps) => {
  const { t } = useTranslation();
  useEffect(() => () => toast.dismiss('auth-submit'), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    toast.dismiss('auth-submit');
    setMessage(null);
    setIsPending(true);
    try {
      const session = await signUp(email, password);
      if (session) return navigate('/');
      setMessage('auth.confirmEmail');
    } catch {
      toast.error(`${t('auth.signUpError')} ${t('auth.retryHint')}`, { id: 'auth-submit' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className={styles.card} aria-labelledby="signUpTitle">
      <div className={styles.pageHead}>
        <h1 id="signUpTitle">{t('auth.createAccount')}</h1>
        <p>{t('auth.registerDescription')}</p>
      </div>
      <Form.Group className={styles.field} controlId="signUpEmail">
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
      <Form.Group className={styles.field} controlId="signUpPassword">
        <Form.Label>{t('auth.password')}</Form.Label>
        <Form.Control
          required
          autoComplete={'new-password'}
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
        {t('auth.signUp')}
      </Button>
      <div className={styles.switchMode}>
        <p>{t('auth.existingUser')}</p>
        <Button variant="link" onClick={onSignIn} type="button" disabled={isPending}>
          {t('auth.loginLink')}
        </Button>
      </div>
    </Form>
  );
};

export default SignUpForm;
