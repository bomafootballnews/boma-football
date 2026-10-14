// ===============================
// ÉLÉMENTS DE LA PAGE
// ===============================

const selectionCompetition =
    document.getElementById("selectionCompetition");

const selectionSaison =
    document.getElementById("selectionSaison");

const journee =
    document.getElementById("journee");

const dateMatch =
    document.getElementById("dateMatch");

const selectionGroupe =
    document.getElementById("selectionGroupe")

const equipeDomicile =
    document.getElementById("equipeDomicile");

const equipeExterieure =
    document.getElementById("equipeExterieure");

const ajouterMatch =
    document.getElementById("ajouterMatch");

const listeMatchs =
    document.getElementById("listeMatchs");

const enregistrerCalendrier =
    document.getElementById("enregistrerCalendrier");


// ===============================
// RÉCUPÉRER LES COMPÉTITIONS
// ===============================

let competitions =
    JSON.parse(
        localStorage.getItem("competitions")
    ) || [];


// Compétition actuellement sélectionnée
let competitionActuelle = null;


// Matchs actuellement affichés
let matchs = [];


// Match en cours de modification
let indexModification = -1;


// ===============================
// AFFICHER LES COMPÉTITIONS
// ===============================

const nomsCompetitions = [];

competitions.forEach(function (competition) {

    if (
        !nomsCompetitions.includes(
            competition.nom
        )
    ) {

        nomsCompetitions.push(
            competition.nom
        );

    }

});


nomsCompetitions.forEach(function (nom) {

    const option =
        document.createElement("option");

    option.value = nom;

    option.textContent = nom;

    selectionCompetition.appendChild(
        option
    );

});


// ===============================
// CHOISIR UNE COMPÉTITION
// ===============================

selectionCompetition.addEventListener(
    "change",
    function () {

        selectionSaison.innerHTML =
            '<option value="">Sélectionner une saison</option>';

        equipeDomicile.innerHTML =
            '<option value="">Sélectionner une équipe</option>';

        equipeExterieure.innerHTML =
            '<option value="">Sélectionner une équipe</option>';

        listeMatchs.innerHTML = "";

        competitionActuelle = null;

        matchs = [];


        const nom =
            selectionCompetition.value;


        if (!nom) {

            return;

        }


        const saisons =
            competitions.filter(
                function (competition) {

                    return competition.nom === nom;

                }
            );


        saisons.forEach(function (competition) {

            const option =
                document.createElement("option");

            option.value =
                competition.id;

            option.textContent =
                competition.saison;

            selectionSaison.appendChild(
                option
            );

        });

    }
);


// ===============================
// CHOISIR UNE SAISON
// ===============================

selectionSaison.addEventListener(
    "change",
    function () {

        const id =
            selectionSaison.value;


        if (!id) {

            return;

        }


        competitionActuelle =
            competitions.find(
                function (competition) {

                    return competition.id === id;

                }
            );


        if (!competitionActuelle) {

            return;

        }


        // Récupérer les matchs existants
        matchs =
            competitionActuelle.matchs
                ? [...competitionActuelle.matchs]
                : [];


        // Afficher les équipes
        afficherEquipes();


        // Afficher le calendrier
        afficherMatchs();

    }
);


// ===============================
// AFFICHER LES ÉQUIPES
// ===============================

function afficherEquipes() {

    equipeDomicile.innerHTML =
        '<option value="">Sélectionner une équipe</option>';

    equipeExterieure.innerHTML =
        '<option value="">Sélectionner une équipe</option>';

    if (!competitionActuelle || !competitionActuelle.equipes) return;

    const groupeFiltre = selectionGroupe ? selectionGroupe.value : "tous";

    const equipesFiltrees = competitionActuelle.equipes.filter(function (equipe) {
        if (groupeFiltre === "tous") return true;
        return (equipe.groupe || "A") === groupeFiltre;
    });

    equipesFiltrees.forEach(function (equipe) {

        const option1 = document.createElement("option");
        option1.value = equipe.nom;
        option1.textContent = equipe.nom;
        equipeDomicile.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = equipe.nom;
        option2.textContent = equipe.nom;
        equipeExterieure.appendChild(option2);

    });

}

// Recharger les équipes quand le groupe change
if (selectionGroupe) {
    selectionGroupe.addEventListener("change", afficherEquipes);
}


// ===============================
// AJOUTER UN MATCH
// ===============================

ajouterMatch.addEventListener(
    "click",
    function () {

        if (!competitionActuelle) {

            alert(
                "⚠️ Sélectionnez d'abord une compétition et une saison."
            );

            return;

        }


        if (
            !journee.value ||
            !dateMatch.value ||
            !equipeDomicile.value ||
            !equipeExterieure.value
        ) {

            alert(
                "⚠️ Veuillez remplir tous les champs."
            );

            return;

        }


        if (
            equipeDomicile.value ===
            equipeExterieure.value
        ) {

            alert(
                "⚠️ Une équipe ne peut pas jouer contre elle-même."
            );

            return;

        }


        const match = {

            id: Date.now(),

            journee:
                journee.value,

            date:
                dateMatch.value,

            domicile:
                equipeDomicile.value,

            exterieur:
                equipeExterieure.value,

            scoreDomicile:
                null,

            scoreExterieur:
                null,

            joue:
                false

        };


        // Si on modifie un match
        if (indexModification !== -1) {

            match.id =
                matchs[indexModification].id;

            match.scoreDomicile =
                matchs[indexModification].scoreDomicile;

            match.scoreExterieur =
                matchs[indexModification].scoreExterieur;

            match.joue =
                matchs[indexModification].joue;


            matchs[indexModification] =
                match;


            indexModification = -1;


            ajouterMatch.textContent =
                "+ Ajouter le match";

        }

        // Sinon, nouveau match
        else {

            matchs.push(match);

        }


        afficherMatchs();


        // Vider le formulaire
        journee.value = "";

        dateMatch.value = "";

        equipeDomicile.value = "";

        equipeExterieure.value = "";

    }
);


// ===============================
// AFFICHER LES MATCHS
// ===============================

function afficherMatchs() {

    listeMatchs.innerHTML = "";


    if (matchs.length === 0) {

        listeMatchs.innerHTML =
            "<p>Aucun match programmé.</p>";

        return;

    }


    matchs.forEach(
        function (match, index) {

            const bloc =
                document.createElement("div");

            bloc.classList.add("article");


            let partieScore = "";


            // Match déjà joué
            if (match.joue) {

                partieScore =

                    "<h4>" +
                    match.domicile +
                    " " +
                    match.scoreDomicile +
                    " — " +
                    match.scoreExterieur +
                    " " +
                    match.exterieur +
                    "</h4>" +

                    "<p>✅ Match terminé</p>" +

                    "<button type='button' " +
                    "onclick='modifierScore(" +
                    index +
                    ")'>" +
                    "⚽ Modifier le score" +
                    "</button>";

            }

            // Match pas encore joué
            else {

                partieScore =

                    "<h4>" +
                    match.domicile +
                    " 🆚 " +
                    match.exterieur +
                    "</h4>" +

                    "<input " +
                    "type='number' " +
                    "min='0' " +
                    "id='scoreDomicile-" +
                    index +
                    "' " +
                    "placeholder='Buts domicile'>" +

                    "<input " +
                    "type='number' " +
                    "min='0' " +
                    "id='scoreExterieur-" +
                    index +
                    "' " +
                    "placeholder='Buts extérieur'>" +

                    "<br><br>" +

                    "<button type='button' " +
                    "onclick='enregistrerScore(" +
                    index +
                    ")'>" +
                    "⚽ Enregistrer le score" +
                    "</button>";

            }


            bloc.innerHTML =

                "<strong>📅 " +
                match.journee +
                "</strong>" +

                "<p>" +
                formaterDate(match.date) +
                "</p>" +

                partieScore +

                "<br>" +

                "<button type='button' " +
                "onclick='modifierMatch(" +
                index +
                ")'>" +
                "✏️ Modifier le match" +
                "</button> " +

                "<button type='button' " +
                "onclick='supprimerMatch(" +
                index +
                ")'>" +
                "❌ Supprimer" +
                "</button>";


            listeMatchs.appendChild(
                bloc
            );

        }
    );

}


// ===============================
// MODIFIER UN MATCH
// ===============================

function modifierMatch(index) {

    const match =
        matchs[index];


    journee.value =
        match.journee;

    dateMatch.value =
        match.date;

    equipeDomicile.value =
        match.domicile;

    equipeExterieure.value =
        match.exterieur;


    indexModification =
        index;


    ajouterMatch.textContent =
        "✏️ Modifier le match";

}


// ===============================
// SUPPRIMER UN MATCH
// ===============================

function supprimerMatch(index) {

    const confirmation =
        confirm(
            "Voulez-vous vraiment supprimer ce match ?"
        );


    if (!confirmation) {

        return;

    }


    matchs.splice(
        index,
        1
    );


    afficherMatchs();

}


// ===============================
// ENREGISTRER LE CALENDRIER
// ===============================

enregistrerCalendrier.addEventListener(
    "click",
    function () {

        if (!competitionActuelle) {

            alert(
                "⚠️ Sélectionnez d'abord une compétition et une saison."
            );

            return;

        }


        competitionActuelle.matchs =
            matchs;


        const index =
            competitions.findIndex(
                function (competition) {

                    return competition.id ===
                        competitionActuelle.id;

                }
            );


        if (index === -1) {

            return;

        }


        competitions[index] =
            competitionActuelle;


        localStorage.setItem(
            "competitions",
            JSON.stringify(competitions)
        );


        alert(
            "✅ Calendrier enregistré avec succès !"
        );

    }
);


// ===============================
// FORMATER LA DATE
// ===============================

function formaterDate(date) {

    const parties =
        date.split("-");


    if (parties.length !== 3) {

        return date;

    }


    return (
        parties[2] +
        "/" +
        parties[1] +
        "/" +
        parties[0]
    );

}

function enregistrerScore(index) {

    const scoreDomicile =
        document.getElementById(
            "scoreDomicile-" + index
        ).value;

    const scoreExterieur =
        document.getElementById(
            "scoreExterieur-" + index
        ).value;


    if (
        scoreDomicile === "" ||
        scoreExterieur === ""
    ) {

        alert(
            "⚠️ Veuillez saisir les deux scores."
        );

        return;

    }


    if (
        Number(scoreDomicile) < 0 ||
        Number(scoreExterieur) < 0
    ) {

        alert(
            "⚠️ Le score ne peut pas être négatif."
        );

        return;

    }


    matchs[index].scoreDomicile =
        Number(scoreDomicile);

    matchs[index].scoreExterieur =
        Number(scoreExterieur);

    matchs[index].joue =
        true;


    afficherMatchs();


    alert(
        "✅ Score enregistré. Cliquez sur « Enregistrer le calendrier » pour sauvegarder."
    );

}

function modifierScore(index) {

    const match =
        matchs[index];


    const nouveauScoreDomicile =
        prompt(
            "Score de " +
            match.domicile +
            " :",
            match.scoreDomicile
        );


    if (
        nouveauScoreDomicile === null
    ) {

        return;

    }


    const nouveauScoreExterieur =
        prompt(
            "Score de " +
            match.exterieur +
            " :",
            match.scoreExterieur
        );


    if (
        nouveauScoreExterieur === null
    ) {

        return;

    }


    if (
        nouveauScoreDomicile === "" ||
        nouveauScoreExterieur === "" ||
        Number(nouveauScoreDomicile) < 0 ||
        Number(nouveauScoreExterieur) < 0
    ) {

        alert(
            "⚠️ Score invalide."
        );

        return;

    }


    match.scoreDomicile =
        Number(nouveauScoreDomicile);

    match.scoreExterieur =
        Number(nouveauScoreExterieur);

    match.joue =
        true;


    afficherMatchs();

}
