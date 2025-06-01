import React, { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback

const CountdownTimer = ({ endTime }) => {
  // La fonction pour calculer le temps restant, mise en cache avec useCallback
  const calculateTimeLeftFn = useCallback(() => {
    const difference = +new Date(endTime) - +new Date();
    let timeLeftOutput = {};

    if (difference > 0) {
      timeLeftOutput = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeftOutput;
  }, [endTime]); // Dépendance : endTime

  // État initial basé sur le premier calcul
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeftFn());

  useEffect(() => {
    // Si la date de fin est passée, ne rien faire de plus (ou mettre à vide)
    if (+new Date(endTime) - +new Date() < 0) {
        setTimeLeft({}); // Efface le temps restant si l'enchère est terminée
        return;
    }

    // Met à jour le compteur toutes les secondes
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeftFn());
    }, 1000);

    // Nettoie le timer si le composant est démonté ou si endTime/calculateTimeLeftFn change
    return () => clearTimeout(timer);
  }, [timeLeft, endTime, calculateTimeLeftFn]); // timeLeft est inclus pour relancer si besoin, endTime et la fonction elle-même

  const timerComponents = [];
  if (timeLeft.days > 0) timerComponents.push(<span key="d">{timeLeft.days}j </span>);
  // Afficher les heures si jours > 0 ou heures > 0
  if (timeLeft.hours > 0 || timeLeft.days > 0) timerComponents.push(<span key="h">{String(timeLeft.hours || 0).padStart(2, '0')}h </span>);
  // Afficher les minutes si jours > 0 ou heures > 0 ou minutes > 0
  if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) timerComponents.push(<span key="m">{String(timeLeft.minutes || 0).padStart(2, '0')}m </span>);
  // Toujours afficher les secondes si le temps n'est pas vide (c'est-à-dire, si l'enchère n'est pas terminée)
  // et qu'il reste du temps (ou que c'est la première seconde d'une minute/heure etc.)
  if (Object.keys(timeLeft).length > 0 && typeof timeLeft.seconds === 'number') {
    timerComponents.push(<span key="s">{String(timeLeft.seconds).padStart(2, '0')}s</span>);
  }


  return (
    <div className="countdown-timer">
      {timerComponents.length ? timerComponents : <span>Terminée!</span>}
    </div>
  );
};

export default CountdownTimer;