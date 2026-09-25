import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import styles from './login.module.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);
    setMessage(null);
    setIsPending(true);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
        navigate('/');
      } else {
        const session = await signUp(email, password);
        if (session) return navigate('/');
        setMessage('Check your email to confirm your registration.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  const handleMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
    setMessage(null);
  };

  return (
    <main className={styles.page}>
      <p className={styles.brand}>
        BabyWeather<span aria-hidden="true">.</span>
      </p>
      <form onSubmit={handleSubmit} className={styles.card} aria-labelledby="loginTitle">
        <div className={styles.pageHead}>
          <h1 id="loginTitle">{mode === 'signIn' ? 'Login' : 'Create account'}</h1>
          <p>
            {mode === 'signIn'
              ? 'Sign in to plan what your kids wear today.'
              : 'Get started with weather and outfits for your kids.'}
          </p>
        </div>
        <div className={styles.field}>
          <label htmlFor="loginEmail">Email</label>
          <input
            required
            id="loginEmail"
            name="email"
            autoComplete="username"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="loginPassword">Password</label>
          <input
            required
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            id="loginPassword"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className={styles.alert} role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className={styles.status} role="status">
            {message}
          </div>
        )}
        {isPending && (
          <div className={styles.status} role="status">
            Please wait…
          </div>
        )}
        <button className={styles.submit} type="submit" disabled={isPending}>
          {mode === 'signIn' ? 'Sign In' : 'Sign Up'}
        </button>
        <div className={styles.switchMode}>
          <p>{mode === 'signIn' ? 'New to BabyWeather?' : 'Already have an account?'}</p>
          <button onClick={handleMode} type="button" disabled={isPending}>
            {mode === 'signIn' ? 'Create an account' : 'Back to login'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default Login;
