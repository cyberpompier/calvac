class CalculateurVacations {
    constructor(tauxHoraires) {
        this.tauxHoraires = tauxHoraires;
    }

    estDansPeriodeActive(heure) {
        const heureMin = heure.getHours() + heure.getMinutes() / 60;
        
        return PERIODES_ACTIVES.some(periode => {
            const [debutH, debutM] = periode.debut.split(':').map(Number);
            const [finH, finM] = periode.fin.split(':').map(Number);
            const debutHeure = debutH + debutM / 60;
            const finHeure = finH + finM / 60;
            
            return heureMin >= debutHeure && heureMin < finHeure;
        });
    }

    getNomPeriode(heure) {
        const heureMin = heure.getHours() + heure.getMinutes() / 60;
        
        // Garde postée: 8h-12h et 13h30-17h30
        if ((heureMin >= 8 && heureMin < 12) || (heureMin >= 13.5 && heureMin < 17.5)) {
            return "Garde postée";
        }
        // Astreinte: tout le reste du temps (17h30-8h et 12h-13h30)
        return "Astreinte";
    }

    calculerDureeHeures(debut, fin) {
        return (new Date(debut) - new Date(fin)) / (1000 * 60 * 60);
    }

    calculerTauxPeriode(dateHeure) {
        return this.estDansPeriodeActive(new Date(dateHeure)) ? 
            TAUX_PERIODE.ACTIF : TAUX_PERIODE.NORMAL;
    }

    calculerMontantPeriode(debut, fin, tauxBase) {
        let montantTotal = 0;
        let tempsActuel = new Date(debut);
        const finDate = new Date(fin);
        
        while (tempsActuel < finDate) {
            // Calcul par intervalle d'une heure
            const prochainePeriode = new Date(tempsActuel);
            prochainePeriode.setHours(prochainePeriode.getHours() + 1, 0, 0, 0);
            
            const finPeriode = prochainePeriode > finDate ? finDate : prochainePeriode;
            const duree = this.calculerDureeHeures(tempsActuel, finPeriode);
            const taux = this.calculerTauxPeriode(tempsActuel);
            
            montantTotal += duree * tauxBase * taux;
            tempsActuel = prochainePeriode;
        }
        
        return montantTotal;
    }

    calculerVacations(grade, gardeDebut, gardeFin, interventions) {
        const tauxBase = this.tauxHoraires[grade].base;
        if (!tauxBase) {
            throw new Error("Grade invalide");
        }

        // Calculer d'abord le total des heures de garde
        let heuresGarde = Math.abs(this.calculerDureeHeures(gardeFin, gardeDebut));
        
        // Calculer les heures et montants d'interventions
        let heuresInterventions = 0;
        let montantInterventions = 0;

        // Tri des interventions par ordre chronologique
        const interventionsTriees = [...interventions].sort((a, b) => 
            new Date(a.debut) - new Date(b.debut)
        );

        // Calcul des interventions (100%)
        interventionsTriees.forEach(intervention => {
            if (intervention.debut && intervention.fin) {
                const duree = Math.abs(this.calculerDureeHeures(intervention.fin, intervention.debut));
                heuresInterventions += duree;
                montantInterventions += duree * tauxBase * TAUX_PERIODE.INTERVENTION;
            }
        });

        // Déduire les heures d'interventions des heures de garde
        heuresGarde -= heuresInterventions;

        // Calcul du montant de la garde avec les différents taux
        let montantGarde = 0;
        let tempsActuel = new Date(gardeDebut);
        const finDate = new Date(gardeFin);

        while (tempsActuel < finDate) {
            const prochainePeriode = new Date(tempsActuel);
            prochainePeriode.setHours(prochainePeriode.getHours() + 1, 0, 0, 0);
            
            const finPeriode = prochainePeriode > finDate ? finDate : prochainePeriode;
            const duree = Math.abs(this.calculerDureeHeures(finPeriode, tempsActuel));

            // Vérifier si cette période chevauche une intervention
            const chevauchementIntervention = interventionsTriees.some(intervention => {
                const debutInt = new Date(intervention.debut);
                const finInt = new Date(intervention.fin);
                return (tempsActuel >= debutInt && tempsActuel < finInt) ||
                       (finPeriode > debutInt && finPeriode <= finInt);
            });

            // Si pas de chevauchement, ajouter au montant de la garde
            if (!chevauchementIntervention) {
                const taux = this.calculerTauxPeriode(tempsActuel);
                montantGarde += duree * tauxBase * taux;
            }
            
            tempsActuel = prochainePeriode;
        }

        return {
            heuresGarde: Math.max(0, heuresGarde),
            heuresInterventions,
            montantGarde,
            montantInterventions,
            montantTotal: montantGarde + montantInterventions
        };
    }

    formaterHeures(heures) {
        const heuresEntieres = Math.floor(heures);
        const minutes = Math.round((heures - heuresEntieres) * 60);
        return `${heuresEntieres}h${minutes.toString().padStart(2, '0')}`;
    }

    formaterMontant(montant) {
        return montant.toFixed(2) + ' €';
    }

    genererDetailHoraire(debut, fin, interventions) {
        const details = [];
        let currentTime = new Date(debut);
        const endTime = new Date(fin);
        
        while (currentTime < endTime) {
            const hourEnd = new Date(currentTime);
            hourEnd.setHours(hourEnd.getHours() + 1, 0, 0, 0);
            
            const intervention = interventions.find(int => {
                const intDebut = new Date(int.debut);
                const intFin = new Date(int.fin);
                return currentTime >= intDebut && currentTime < intFin;
            });
            
            const taux = intervention ? TAUX_PERIODE.INTERVENTION :
                        this.estDansPeriodeActive(currentTime) ? TAUX_PERIODE.ACTIF :
                        TAUX_PERIODE.NORMAL;
            
            details.push({
                debut: new Date(currentTime),
                fin: new Date(hourEnd),
                taux,
                estIntervention: !!intervention,
                nomPeriode: intervention ? "Intervention" : this.getNomPeriode(currentTime)
            });
            
            currentTime = hourEnd;
        }
        
        return details;
    }

    calculerMontantHeure(heure, tauxBase, estIntervention, taux) {
        return tauxBase * taux;
    }
}
