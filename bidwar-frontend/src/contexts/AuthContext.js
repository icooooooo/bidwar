import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, fetchUserProfile } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bidwar-token'));
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (currentToken) => {
    if (currentToken) {
      setIsLoading(true); // Assurer que isLoading est true pendant le chargement
      try {
        const profile = await fetchUserProfile(currentToken);
        setUser(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        localStorage.removeItem('bidwar-token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // Pas de token, pas de chargement
    }
  }, []);


  useEffect(() => {
    loadUserProfile(token);
  }, [token, loadUserProfile]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await apiLogin(email, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('bidwar-token', data.token);
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
     try {
      setIsLoading(true);
      const data = await apiRegister(userData);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('bidwar-token', data.token);
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bidwar-token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};