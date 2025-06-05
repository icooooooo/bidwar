import React, { createContext, useState, useEffect, useCallback } from 'react';
// MODIFIÉ : Assurez-vous que ce chemin pointe vers votre fichier api.js (celui avec Axios)
// et que les fonctions exportées correspondent.
import {
    login as apiLoginCall, // Renommé pour éviter la confusion avec la fonction login du contexte
    register as apiRegisterCall, // Renommé
    getUserProfile as apiGetUserProfile // Correspond à ce que nous avions dans api.js
} from '../api'; // Ou '../services/apiService' ou le chemin correct vers votre fichier api.js

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bidwar-token')); // Clé de localStorage
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // Ajouter un état pour les erreurs d'auth

  const loadUserProfile = useCallback(async () => { // currentToken n'est plus nécessaire en argument
    const currentTokenFromStorage = localStorage.getItem('bidwar-token'); // Lire depuis localStorage
    if (currentTokenFromStorage) {
      setIsLoading(true);
      setAuthError(null);
      try {
        // L'intercepteur Axios dans api.js ajoutera le token automatiquement si stocké
        const profileData = await apiGetUserProfile(); // Utilise la fonction de api.js
        setUser(profileData.data); // Supposant que apiGetUserProfile retourne { data: userData }
      } catch (error) {
        console.error("AuthProvider: Failed to fetch profile on load:", error.response?.data?.message || error.message);
        localStorage.removeItem('bidwar-token');
        setToken(null);
        setUser(null);
        // Ne pas définir authError ici, car c'est un échec de chargement silencieux
      } finally {
        setIsLoading(false);
      }
    } else {
      setUser(null); // S'assurer que l'utilisateur est null si pas de token
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    // Pas besoin de passer 'token' ici si loadUserProfile le lit depuis localStorage
    loadUserProfile();
  }, [loadUserProfile]); // loadUserProfile est la dépendance

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await apiLoginCall({ email, password }); // Utilise la fonction de api.js
      // La réponse de votre backend (et de api.js) contient directement les champs utilisateur et le token
      const { token: newAuthToken, ...userData } = response.data;

      localStorage.setItem('bidwar-token', newAuthToken);
      setToken(newAuthToken);
      setUser(userData);
      setIsLoading(false);
      return userData; // Retourner les données utilisateur
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || 'Échec de la connexion.';
      setAuthError(errorMessage);
      console.error("AuthProvider login error:", error.response || error);
      throw new Error(errorMessage);
    }
  };

  const register = async (userDataPayload) => {
     setIsLoading(true); // Mettre au début, avant le try
     setAuthError(null); // Réinitialiser les erreurs
     try {
      const response = await apiRegisterCall(userDataPayload); // Utilise la fonction de api.js
      const { token: newAuthToken, ...userData } = response.data; // Extraire token et userData

      localStorage.setItem('bidwar-token', newAuthToken);
      setToken(newAuthToken);
      setUser(userData);
      // setIsLoading(false); // Déplacé dans finally

      return userData; // Retourner les données utilisateur en cas de succès

    } catch (error) {
      // setIsLoading(false); // Déplacé dans finally
      let displayMessage = 'Échec de l\'inscription.';
      if (error.response && error.response.data) {
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              displayMessage = error.response.data.errors.map(err => err.msg).join(', ');
              console.error("AuthProvider register validation errors:", error.response.data.errors);
          } else if (error.response.data.message) {
              displayMessage = error.response.data.message;
          }
      } else if (error.message) {
          displayMessage = error.message;
      }
      setAuthError(displayMessage);
      console.error("AuthProvider register error (full):", error.response || error);
      throw new Error(displayMessage); // Renvoyer l'erreur pour que le composant puisse la gérer

    } finally { // Assurer que isLoading est toujours remis à false
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bidwar-token');
    setAuthError(null); // Effacer les erreurs d'authentification au logout
    // Idéalement, rediriger ou informer l'application que l'utilisateur s'est déconnecté
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        token, // Vous pouvez exposer le token si d'autres parties de l'app en ont besoin directement
        login, 
        logout, 
        register, 
        isAuthenticated: !!user, 
        isLoading, 
        authError,
        setAuthError // Pour pouvoir effacer l'erreur depuis les composants si besoin
    }}>
      {children}
    </AuthContext.Provider>
  );
};