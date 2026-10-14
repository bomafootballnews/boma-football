const listeSaisons =
    document.getElementById("listeSaisons");

const competitions =
    JSON.parse(localStorage.getItem("competitions")) || [];


// Rechercher les saisons de Boma D1
const saisonsBomaD1 = competitions.filter(function (competition) {

    return competition.nom.trim() === "Boma D1";

});


// Afficher les saisons
if (saisonsBomaD1.length === 0) {

    listeSaisons.innerHTML =
        "<p>Aucune saison enregistrée pour Boma D1.</p>";

} else {

    saisonsBomaD1.forEach(function (competition) {

        const lien =
            document.createElement("a");

        lien.href =
            "competition.html#" + competition.id;

        lien.textContent =
            "📅 " + competition.saison;

        lien.style.display = "block";
        lien.style.margin = "10px 0";

        listeSaisons.appendChild(lien);

    });

}