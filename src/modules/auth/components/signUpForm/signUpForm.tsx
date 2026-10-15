import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styles from '../authForm.module.scss';
import { useTranslation } from 'react-i18next';
import { useSignUpMutation } from '../../hooks/useSignUpMutation';

type SignUpFormProps = {
  onSignIn: () => void;
};

const SignUpForm = ({ onSignIn }: SignUpFormProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: signUp, isPending } = useSignUpMutation();
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setMessage(null);
    signUp(
      { email, password },
      {
        onSuccess: (session) => {
          if (session) navigate('/');
          else setMessage('auth.confirmEmail');
        },
      },
    );
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
