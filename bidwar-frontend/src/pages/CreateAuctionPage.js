import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createAuction as apiCreateAuction } from '../services/auctionService';
// CSS partagé avec les formulaires d'authentification pour la base
// import '../components/auth/AuthForm.css'; // Déjà inclus globalement ou par LoginPage/RegisterPage

const CreateAuctionPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startPrice, setStartPrice] = useState('');
  const [duration, setDuration] = useState(7);
  const [photos, setPhotos] = useState([]); // Stocke les objets File
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rediriger si l'utilisateur n'est pas vendeur ou admin (déjà géré par ProtectedRoute, mais double sécurité)
  useEffect(() => {
    if (user && !['Seller', 'Admin'].includes(user.role)) {
      navigate('/', { state: { unauthorized: true, attemptedPath: '/auctions/new' } });
    }
  }, [user, navigate]);


  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 10) { // Limite exemple
        setError("Vous ne pouvez uploader que 10 photos maximum.");
        return;
    }
    setError(''); // Clear previous photo error

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
    setPhotoPreviews(newPreviews);
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    setPhotoPreviews(prev => {
        const newPrev = prev.filter((_, index) => index !== indexToRemove);
        // Nettoyer l'URL objet pour la photo retirée
        URL.revokeObjectURL(prev[indexToRemove]);
        return newPrev;
    });
  };

  // Nettoyer les URLs objets lors du démontage du composant
  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (photos.length < 1) { // Minimum 1 photo pour l'exemple, cahier des charges dit 8
        setError("Veuillez uploader au moins 1 photo (objectif: 8 selon cahier des charges).");
        setLoading(false);
        return;
    }
    if (parseFloat(startPrice) <= 0) {
        setError("Le prix de départ doit être positif.");
        setLoading(false);
        return;
    }

    // Dans une vraie application, vous uploaderiez les photos vers un serveur ici
    // et obtiendriez les URLs en retour. Pour ce mock, on simule.
    const photoUrlsForService = photos.map(file => ({ image_url: `https://via.placeholder.com/300?text=${encodeURIComponent(file.name)}` }));

    const auctionData = {
      title,
      description,
      start_price: parseFloat(startPrice),
      end_time: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      photos: photoUrlsForService,
    };

    try {
      if (!user || !token) throw new Error("Authentification requise.");
      const newAuction = await apiCreateAuction(auctionData, token, user.id, user.username);
      alert(`Enchère "${newAuction.title}" soumise pour validation ! (ID: ${newAuction.auction_id})`);
      navigate(`/auctions/${newAuction.auction_id}`);
    } catch (err) {
      setError(err.message || "Erreur lors de la création de l'enchère.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container">
        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop: '2rem', maxWidth: '700px'}}>
          <h2>Créer une nouvelle enchère</h2>
          {error && <p className="error-message">{error}</p>}
          
          <div className="form-group">
            <label htmlFor="title">Titre de l'annonce</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description détaillée</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="5" required></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="startPrice">Prix de départ (€)</label>
            <input type="number" id="startPrice" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} step="0.01" min="0.01" required />
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">Durée de l'enchère (jours)</label>
            <select id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                <option value="1">1 jour</option> <option value="3">3 jours</option> <option value="5">5 jours</option>
                <option value="7">7 jours</option> <option value="10">10 jours</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="photos">Photos (min. 1, objectif 8 selon cahier des charges)</label>
            <input type="file" id="photos" onChange={handlePhotoChange} multiple accept="image/*" />
            {photoPreviews.length > 0 && (
                <div className="photo-previews mt-1" style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                    {photoPreviews.map((previewUrl, index) => (
                        <div key={index} style={{position: 'relative', border: '1px solid var(--border-color)', padding: '5px'}}>
                            <img src={previewUrl} alt={`Aperçu ${index+1}`} style={{width: '100px', height: '100px', objectFit: 'cover'}}/>
                            <button type="button" onClick={() => removePhoto(index)} 
                                    style={{position: 'absolute', top: '0', right: '0', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', lineHeight: '20px', textAlign:'center'}}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? 'Création en cours...' : 'Mettre en vente'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateAuctionPage;