import React from 'react';
// Correction du chemin : un seul '../' pour remonter de 'components' à 'src'
import { useTheme } from '../hooks/useTheme';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Passer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
      style={{
        background: 'transparent',
        border: '1px solid var(--text-secondary)',
        color: 'var(--text-primary)',
        padding: '0.5rem',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.2rem',
        lineHeight: '1',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggleButton;