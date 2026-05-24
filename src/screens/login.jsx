import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
  
  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
      e.preventDefault();
      setError(null);
      try { await signIn(email, password);
        navigate('/');
      } catch (error) {
        setError(error.message);
      }
    };

    const handleSignUp = async () => {
        setError(null);
        try { await signUp(email, password);
          navigate('/');
        } catch (error) {
          setError(error.message);
        }
    };

    return (
        <form onSubmit={handleSignIn} className="login-form">
            <h2>Login</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Sign In</button>
            <button type="button" onClick={handleSignUp}>
                Sign Up
            </button>
            {error && <div>{error}</div>}
        </form>
    );
  };

  export default Login;