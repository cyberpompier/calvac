document.addEventListener('DOMContentLoaded', () => {
    const calculateur = new CalculateurVacations(TAUX_HORAIRES);

    // Éléments du DOM
    const btnAjouterIntervention = document.getElementById('ajouterIntervention');
    const interventionsContainer = document.getElementById('interventions');
    const btnCalculer = document.getElementById('calculer');
    const resultsSection = document.getElementById('resultats');

    btnAjouterIntervention.addEventListener('click', () => {
        const nouvelleIntervention = document.createElement('div');
        nouvelleIntervention.className = 'intervention';
        nouvelleIntervention.innerHTML = `
            <div class="time-inputs">
                <div>
                    <label>Début:</label>
                    <input type="datetime-local" class="intervention-debut">
                </div>
                <div>
                    <label>Fin:</label>
                    <input type="datetime-local" class="intervention-fin">
                </div>
            </div>
        `;
        interventionsContainer.appendChild(nouvelleIntervention);
    });

    // Ajouter le tableau des taux
    const configSection = document.getElementById('config-section');
    const ratesTable = document.createElement('table');
    ratesTable.className = 'rates-table';
    ratesTable.innerHTML = `
        <thead>
            <tr>
                <th>Grade</th>
                <th>Taux horaire (€)</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(TAUX_HORAIRES).map(([grade, data]) => `
                <tr>
                    <td>${grade}</td>
                    <td><input type="number" step="0.01" id="taux-${grade}" 
                         class="rates-input" value="${data.base}"></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    configSection.appendChild(ratesTable);

    const saveButton = document.createElement('button');
    saveButton.className = 'btn save-rates';
    saveButton.textContent = 'Sauvegarder les taux';
    saveButton.onclick = sauvegarderTaux;
    configSection.appendChild(saveButton);

    btnCalculer.addEventListener('click', () => {
        const grade = document.getElementById('grade').value;
        const gardeDebut = document.getElementById('gardeDebut').value;
        const gardeFin = document.getElementById('gardeFin').value;

        if (!grade || !gardeDebut || !gardeFin) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const interventions = [];
        document.querySelectorAll('.intervention').forEach(div => {
            const debut = div.querySelector('.intervention-debut').value;
            const fin = div.querySelector('.intervention-fin').value;
            if (debut && fin) {
                interventions.push({ debut, fin });
            }
        });

        try {
            const resultats = calculateur.calculerVacations(grade, gardeDebut, gardeFin, interventions);
            
            // Générer le détail horaire
            const details = calculateur.genererDetailHoraire(gardeDebut, gardeFin, interventions);
            
            // Créer le tableau de détail
            const breakdownTable = document.createElement('table');
            breakdownTable.className = 'breakdown-table';
            breakdownTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Période</th>
                        <th>Type d'activité</th>
                        <th>Taux</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>
                    ${details.map(detail => {
                        const tauxBase = TAUX_HORAIRES[grade].base;
                        const montant = calculateur.calculerMontantHeure(
                            detail.debut,
                            tauxBase,
                            detail.estIntervention,
                            detail.taux
                        );
                        const rowClass = detail.estIntervention ? 'period-intervention' :
                                       detail.taux === TAUX_PERIODE.ACTIF ? 'period-active' : '';
                        
                        return `
                            <tr class="${rowClass}">
                                <td>${detail.debut.toLocaleTimeString()} - ${detail.fin.toLocaleTimeString()}</td>
                                <td>${detail.nomPeriode}</td>
                                <td>${(detail.taux * 100)}%</td>
                                <td>${calculateur.formaterMontant(montant)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            
            const detailsCalcul = document.getElementById('detailsCalcul');
            detailsCalcul.innerHTML = '';
            detailsCalcul.appendChild(breakdownTable);

            // Afficher les résultats globaux
            document.getElementById('heuresGarde').textContent = calculateur.formaterHeures(resultats.heuresGarde);
            document.getElementById('heuresInterventions').textContent = calculateur.formaterHeures(resultats.heuresInterventions);
            document.getElementById('montantGarde').textContent = calculateur.formaterMontant(resultats.montantGarde);
            document.getElementById('montantInterventions').textContent = calculateur.formaterMontant(resultats.montantInterventions);
            document.getElementById('montantTotal').textContent = calculateur.formaterMontant(resultats.montantTotal);

            resultsSection.classList.remove('hidden');
        } catch (error) {
            alert('Erreur lors du calcul : ' + error.message);
        }
    });
});
