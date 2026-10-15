import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSignInMutation } from '../../hooks/useSignInMutation';
import styles from '../authForm.module.scss';
import { useTranslation } from 'react-i18next';

type SignInFormProps = {
  onSignUp: () => void;
};

const SignInForm = ({ onSignUp }: SignInFormProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { mutate: signIn, isPending } = useSignInMutation();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    signIn({ email, password }, { onSuccess: () => navigate('/') });
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
