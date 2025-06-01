// src/services/authService.js
const users = [
  { id: '1', email: 'test@example.com', password: 'password123', username: 'TestUser', role: 'Buyer' },
  { id: '2', email: 'seller@example.com', password: 'password123', username: 'SuperSeller', role: 'Seller' },
  { id: '3', email: 'admin@example.com', password: 'password123', username: 'AdminBoss', role: 'Admin' },
];

export const login = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password, ...userData } = user;
        resolve({ token: `fake-jwt-token-for-${userData.id}`, user: userData });
      } else {
        reject(new Error('Identifiants invalides'));
      }
    }, 1000);
  });
};

export const register = async (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users.find(u => u.email === userData.email)) {
        reject(new Error('Cet email est déjà utilisé'));
        return;
      }
      const newUser = {
        id: String(users.length + 1),
        ...userData,
        role: userData.role || 'Buyer',
      };
      users.push(newUser); // Attention: modifie `users` en place, ok pour mock
      const { password, ...newUserData } = newUser;
      resolve({ token: `fake-jwt-token-for-${newUserData.id}`, user: newUserData });
    }, 1000);
  });
};

export const fetchUserProfile = async (token) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (token && token.startsWith('fake-jwt-token-for-')) {
                const userId = token.replace('fake-jwt-token-for-', '');
                const user = users.find(u => u.id === userId);
                if (user) {
                    const { password, ...userData } = user;
                    resolve(userData);
                } else {
                    reject(new Error('Utilisateur non trouvé pour ce token'));
                }
            } else {
                reject(new Error('Token invalide'));
            }
        }, 500);
    });
};