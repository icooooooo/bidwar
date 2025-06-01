import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import ThemeToggleButton from '../ThemeToggleButton';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          BidWar
        </Link>
        <div className="navbar-search">
          <input type="text" placeholder="Rechercher des enchères..." />
          <button type="button">🔍</button>
        </div>
        <div className="navbar-links">
          <NavLink to="/" className={({isActive}) => isActive ? "active-link" : ""}>Accueil</NavLink>
          
          {isLoading ? (
            <span>Chargement...</span>
          ) : isAuthenticated ? (
            <>
              {user?.role === 'Seller' && <NavLink to="/auctions/new" className={({isActive}) => isActive ? "active-link" : ""}>Créer une enchère</NavLink>}
              {user?.role === 'Admin' && <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "active-link" : ""}>Admin</NavLink>}
              <NavLink to="/profile" className={({isActive}) => isActive ? "active-link" : ""}>{user?.username || 'Profil'}</NavLink>
              <button onClick={logout} className="navbar-logout-button">Déconnexion</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({isActive}) => isActive ? "active-link" : ""}>Connexion</NavLink>
              <NavLink to="/register" className={({isActive}) => isActive ? "active-link" : ""}>Inscription</NavLink>
            </>
          )}
          <ThemeToggleButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;