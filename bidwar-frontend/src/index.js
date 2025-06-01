import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Supposant que index.css est à la racine de src/

// Correction du chemin pour theme.css
import './styles/theme.css'; // Doit être dans src/styles/theme.css

import App from './App';

// Correction des chemins pour les contextes
import { ThemeProvider } from './contexts/ThemeContext'; // Doit être dans src/contexts/ThemeContext.js
import { AuthProvider } from './contexts/AuthContext';   // Doit être dans src/contexts/AuthContext.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);