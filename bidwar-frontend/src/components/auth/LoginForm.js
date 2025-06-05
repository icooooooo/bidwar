import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Correct
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AuthForm.css';
// PAS BESOIN d'importer 'apiLogin' ici si AuthProvider le fait

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // const [loading, setLoading] = useState(false); // Peut être géré par auth.isLoading
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    console.log("LOGINFORM: handleSubmit triggered!");
    e.preventDefault();
    setError('');
    // setLoading(true); // Sera géré par auth.isLoading

    try {
      console.log("LOGINFORM: Calling auth.login with:", { email, password });
      // Utiliser la fonction login du contexte, qui fait l'appel API et gère l'état
      await auth.login(email, password); // Cette fonction devrait gérer le stockage du token et setUser

      console.log("LOGINFORM: auth.login successful.");
      navigate(from, { replace: true });

    } catch (err) {
      // auth.login dans AuthProvider devrait déjà gérer setAuthError et rejeter une erreur
      // donc err.message devrait contenir le message d'erreur du backend ou un message par défaut.
      const errorMessage = err.message || 'Échec de la connexion. Vérifiez vos identifiants.';
      setError(errorMessage); // Afficher l'erreur dans le formulaire
      console.error("LOGINFORM: Error in handleSubmit catch block:", err);
    } finally {
      // setLoading(false); // Sera géré par auth.isLoading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Connexion</h2>
      {error && <p className="error-message">{error}</p>}
      {auth.authError && !error && <p className="error-message">{auth.authError}</p>} {/* Afficher l'erreur du contexte si pas d'erreur locale */}
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Mot de passe</label>
        <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"/>
      </div>
      <button type="submit" className="button-primary" disabled={auth.isLoading}>
        {auth.isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
      <p className="text-center mt-1">
          Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link>
      </p>
    </form>
  );
};

export default LoginForm;