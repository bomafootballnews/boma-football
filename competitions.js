const listeCompetitions =
    document.getElementById("listeCompetitions");

const competitions =
    JSON.parse(localStorage.getItem("competitions")) || [];


// Regrouper les saisons par compétition
const groupes = {};

competitions.forEach(function (competition) {

    if (!groupes[competition.nom]) {
        groupes[competition.nom] = [];
    }

    groupes[competition.nom].push(competition);

});


// Afficher les compétitions
const nomsCompetitions = Object.keys(groupes);

if (nomsCompetitions.length === 0) {

    listeCompetitions.innerHTML = `
        <p>Aucune compétition enregistrée pour le moment.</p>
    `;

} else {

    nomsCompetitions.forEach(function (nom) {

        const blocCompetition =
            document.createElement("div");

        blocCompetition.classList.add("article");

        blocCompetition.innerHTML = `
            <h3>🏆 ${nom}</h3>
            <p>Saisons disponibles :</p>
        `;


        const listeSaisons =
            document.createElement("div");


        groupes[nom].forEach(function (competition) {

            const bouton =
                document.createElement("a");

            bouton.href = 
                "competition.html#" + competition.id;

            bouton.textContent =
                `📅 ${competition.saison}`;

            bouton.style.display = "block";
            bouton.style.margin = "8px 0";

            listeSaisons.appendChild(bouton);

        });


        blocCompetition.appendChild(listeSaisons);

        listeCompetitions.appendChild(blocCompetition);

    });

}