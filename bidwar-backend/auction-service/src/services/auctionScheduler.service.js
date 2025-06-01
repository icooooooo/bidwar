// auction-service/src/services/auctionScheduler.service.js
const cron = require('node-cron');
const Auction = require('../models/auction.model');
// const Bid = require('../models/bid.model'); // Si besoin de vérifier les offres

const processEndedAuctions = async () => {
    console.log('Scheduler: Vérification des enchères terminées...');
    const now = new Date();

    try {
        // Trouver les enchères 'Active' dont end_time est dépassé et qui n'ont pas encore été traitées comme 'Ended' ou 'Sold'
        const endedAuctions = await Auction.find({
            end_time: { $lte: now },
            status: 'Active' // On ne traite que celles qui étaient actives
        });

        if (endedAuctions.length === 0) {
            console.log('Scheduler: Aucune enchère active terminée à traiter.');
            return;
        }

        console.log(`Scheduler: ${endedAuctions.length} enchère(s) terminée(s) trouvée(s). Traitement en cours...`);

        for (const auction of endedAuctions) {
            console.log(`Scheduler: Traitement de l'enchère ID ${auction._id}`);
            if (auction.highest_bidder_id) {
                // Il y a un gagnant
                auction.status = 'Sold'; // Ou 'Payment Pending', 'Awaiting Payment'
                auction.winner_id = auction.highest_bidder_id;
                console.log(`Scheduler: Enchère ${auction._id} vendue au bidder ${auction.winner_id} pour ${auction.current_price}`);
                // TODO: Envoyer une notification au gagnant et au vendeur (via un système d'événements/notifications)
            } else {
                // Personne n'a enchéri
                auction.status = 'Ended'; // Ou 'Not Sold', 'Expired'
                console.log(`Scheduler: Enchère ${auction._id} terminée sans offres.`);
                // TODO: Envoyer une notification au vendeur (via un système d'événements/notifications)
            }
            await auction.save();
        }
        console.log('Scheduler: Traitement des enchères terminées achevé.');
    } catch (error) {
        console.error('Scheduler: Erreur lors du traitement des enchères terminées:', error);
    }
};

// Planifier la tâche pour qu'elle s'exécute, par exemple, toutes les minutes
// Syntaxe cron : seconde(optionnel) minute heure jourDuMois mois jourDeLaSemaine
// '* * * * *'  => Toutes les minutes
// '*/5 * * * *' => Toutes les 5 minutes
const initAuctionScheduler = () => {
    cron.schedule('* * * * *', processEndedAuctions, {
        scheduled: true,
        timezone: "Europe/Paris" // Spécifiez votre fuseau horaire
    });
    console.log('Auction Scheduler initialisé pour s\'exécuter toutes les minutes.');

    // Optionnel: Exécuter une fois au démarrage pour rattraper les enchères manquées si le serveur était arrêté
    // processEndedAuctions();
};

module.exports = { initAuctionScheduler, processEndedAuctions };