// ===============================
// MENU « COMPÉTITIONS » AUTOMATIQUE
// Remplit tous les menus déroulants avec les compétitions
// enregistrées dans l'administration (plus de liens écrits à la main).
// ===============================
(function () {
    var competitions = [];

    try {
        competitions = JSON.parse(localStorage.getItem("competitions")) || [];
    } catch (e) {
        competitions = [];
    }

    var menus = document.querySelectorAll(".dropdown-content");

    menus.forEach(function (menu) {
        menu.innerHTML = "";

        if (competitions.length === 0) {
            var vide = document.createElement("a");
            vide.href = "#";
            vide.textContent = "Aucune compétition";
            menu.appendChild(vide);
            return;
        }

        competitions.forEach(function (comp) {
            var lien = document.createElement("a");
            lien.href = "competition.html#" + comp.id;
            lien.textContent = comp.nom + " (" + comp.saison + ")";
            menu.appendChild(lien);
        });
    });
})();