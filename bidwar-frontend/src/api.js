import axios from 'axios';

// L'URL de base sera le domaine sur lequel Nginx sert le frontend.
// Puisque Nginx fait le reverse proxy, on utilise des chemins relatifs pour les API.
const apiClient = axios.create({
    baseURL: '/', // Ex: si Nginx est sur localhost:3000, les appels iront à localhost:3000/api/...
});

// Intercepteur pour ajouter le token JWT aux requêtes
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Ou votre méthode de stockage de token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Fonctions pour appeler les endpoints
export const login = (credentials) => apiClient.post('/api/auth/login', credentials);
export const register = (userData) => apiClient.post('/api/auth/register', userData);
export const getUserProfile = () => apiClient.get('/api/users/me');

export const fetchAuctions = (params) => {
    console.log("API.JS: fetchAuctions appelée avec params:", params); // LOG API 1
    try {
        const result = apiClient.get('/api/auctions', { params });
        console.log("API.JS: apiClient.get('/api/auctions') exécuté, promesse retournée"); // LOG API 2
        return result;
    } catch (error) {
        console.error("API.JS: Erreur DANS fetchAuctions AVANT l'envoi effectif de la requête:", error); // LOG API ERREUR
        throw error;
    }
};
export const fetchAuctionById = (id) => apiClient.get(`/api/auctions/${id}`);
export const createNewAuction = (auctionData) => apiClient.post('/api/auctions', auctionData);
export const placeNewBid = (auctionId, bidData) => apiClient.post(`/api/auctions/${auctionId}/bids`, bidData);
// Ajoutez d'autres fonctions pour les routes admin, etc.

export default apiClient; // Vous pouvez aussi exporter les fonctions individuellement