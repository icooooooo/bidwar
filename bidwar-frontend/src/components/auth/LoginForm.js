import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AuthForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Connexion</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Mot de passe</label>
        <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"/>
      </div>
      <button type="submit" className="button-primary" disabled={loading || auth.isLoading}>
        {loading || auth.isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
      <p className="text-center mt-1">
          Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link>
      </p>
    </form>
  );
};

export default LoginForm;