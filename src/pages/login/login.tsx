import { useState } from 'react';
import SignInForm from '../../modules/auth/components/signInForm/signInForm';
import SignUpForm from '../../modules/auth/components/signUpForm/signUpForm';
import styles from './login.module.scss';

const Login = () => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  return (
    <main className={styles.page}>
      <p className={styles.brand}>
        BabyWeather<span aria-hidden="true">.</span>
      </p>
      {mode === 'signIn' ? (
        <SignInForm onSignUp={() => setMode('signUp')} />
      ) : (
        <SignUpForm onSignIn={() => setMode('signIn')} />
      )}
    </main>
  );
};

export default Login;
