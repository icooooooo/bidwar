import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

const RegisterForm = () => {
  // const [username, setUsername] = useState('');
  const [nom, setNom] = useState('');           // AJOUTER
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Acheteur'); // Choix du rôle
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.register({nom,prenom,email, password, role });
      navigate('/');
    } catch (err) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Inscription</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label htmlFor="reg-nom">Nom</label>
        <input type="text" id="reg-nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoComplete="nom"/>
      </div>
      <div className="form-group">
        <label htmlFor="reg-prenom">Prenom</label>
        <input type="text" id="reg-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required autoComplete="prenom"/>
      </div>
      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
      </div>
      <div className="form-group">
        <label htmlFor="reg-password">Mot de passe</label>
        <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"/>
      </div>
      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"/>
      </div>
      <div className="form-group">
        <label htmlFor="role">Je souhaite m'inscrire en tant que :</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Acheteur">Acheteur</option>
            <option value="Vendeur">Vendeur</option>
        </select>
      </div>
      <button type="submit" className="button-primary" disabled={loading || auth.isLoading}>
        {loading || auth.isLoading ? 'Inscription...' : "S'inscrire"}
      </button>
       <p className="text-center mt-1">
          Déjà un compte ? <Link to="/login">Connectez-vous</Link>
      </p>
    </form>
  );
};

export default RegisterForm;