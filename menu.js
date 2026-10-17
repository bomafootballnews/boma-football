// ===============================
// MENU « COMPÉTITIONS » AUTOMATIQUE
// Lit la liste des compétitions en ligne (Firebase) et remplit le menu.
// Nécessite donnees.js sur la même page.
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    var menus = document.querySelectorAll(".dropdown-content");
    if (!menus.length) return;

    var CLE_CACHE = "boma_menu_competitions";

    function remplir(competitions) {
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
    }

    // 1. Affichage immédiat avec la dernière liste connue (page plus rapide)
    try {
        var memoire = JSON.parse(localStorage.getItem(CLE_CACHE));
        if (Array.isArray(memoire) && memoire.length) remplir(memoire);
    } catch (e) { /* pas de cache */ }

    if (!window.Donnees) {
        console.warn("donnees.js n'est pas chargé sur cette page.");
        return;
    }

    // 2. Mise à jour depuis la base en ligne
    Donnees.liste()
        .then(function (liste) {
            remplir(liste);
            try { localStorage.setItem(CLE_CACHE, JSON.stringify(liste)); } catch (e) { }
        })
        .catch(function (erreur) {
            console.warn("Menu : lecture impossible", erreur);
            if (!localStorage.getItem(CLE_CACHE)) {
                menus.forEach(function (menu) {
                    menu.innerHTML = '<a href="#">Menu indisponible</a>';
                });
            }
        });
});