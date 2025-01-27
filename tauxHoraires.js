let TAUX_HORAIRES = {
    sapeur: { base: 8.08 },
    caporal: { base: 8.68 },
    caporalChef: { base: 9.29 },
    sergent: { base: 10.20 },
    sergentChef: { base: 10.91 },
    adjudant: { base: 11.62 },
    adjudantChef: { base: 12.33 },
    lieutenant: { base: 13.04 },
    capitaine: { base: 14.50 }
};

const TAUX_PERIODE = {
    NORMAL: 0.35,
    ACTIF: 0.65,
    INTERVENTION: 1.0
};

const PERIODES_ACTIVES = [
    { debut: '08:00', fin: '12:00' },
    { debut: '13:30', fin: '17:30' }
];

function sauvegarderTaux() {
    Object.keys(TAUX_HORAIRES).forEach(grade => {
        const input = document.querySelector(`#taux-${grade}`);
        if (input) {
            TAUX_HORAIRES[grade].base = parseFloat(input.value);
        }
    });
    localStorage.setItem('tauxHoraires', JSON.stringify(TAUX_HORAIRES));
}

function chargerTaux() {
    const savedRates = localStorage.getItem('tauxHoraires');
    if (savedRates) {
        TAUX_HORAIRES = JSON.parse(savedRates);
    }
}

// Charger les taux au démarrage
chargerTaux();
