/* jshint esversion: 6 */

// ===============================
// ÉLÉMENTS DU DOM
// ===============================
var nomCompetition = document.getElementById("nomCompetition");
var saisonCompetition = document.getElementById("saisonCompetition");
var classementBody = document.getElementById("classementBody");
var zoneGroupe = document.getElementById("zoneChoixGroupe");

// ===============================
// RÉCUPÉRER LA COMPÉTITION (via l'adresse : competition.html#id)
// ===============================
var competitions = [];
try {
    competitions = JSON.parse(localStorage.getItem("competitions")) || [];
} catch (e) {
    competitions = [];
}

var idCompetition = decodeURIComponent(window.location.hash.substring(1));
var competition = competitions.find(function (comp) {
    return comp.id === idCompetition;
});

var groupeActuel = null; // groupe affiché (A, B...) ou null s'il n'y a pas de groupes

// Si on clique sur une autre compétition dans le menu, on recharge la page
window.addEventListener("hashchange", function () {
    window.location.reload();
});

// ===============================
// OUTILS
// ===============================
function esc(texte) {
    return String(texte).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
}

function nomEquipe(equipe) {
    return typeof equipe === "object" ? equipe.nom : equipe;
}

// Groupe d'une équipe : "A", "B"... ou null si "aucun" / absent
function groupeEquipe(equipe) {
    if (equipe && typeof equipe === "object" && equipe.groupe && equipe.groupe !== "aucun") {
        return equipe.groupe;
    }
    return null;
}

// Liste des groupes réellement présents dans les équipes
function listeGroupes() {
    var groupes = [];
    (competition.equipes || []).forEach(function (equipe) {
        var g = groupeEquipe(equipe);
        if (g && groupes.indexOf(g) === -1) groupes.push(g);
    });
    return groupes.sort();
}

// Mode "groupes" actif si le format est "groupes" OU si au moins 2 groupes existent
function modeGroupes() {
    if (competition.format === "elimination") return false;
    var groupes = listeGroupes();
    if (groupes.length === 0) return false;
    return competition.format === "groupes" || groupes.length >= 2;
}

// Groupe d'un match : champ "groupe" du match, sinon groupe de l'équipe à domicile
function groupeDuMatch(match) {
    if (match.groupe && match.groupe !== "aucun") return match.groupe;
    var equipe = (competition.equipes || []).find(function (e) {
        return nomEquipe(e) === match.domicile;
    });
    return groupeEquipe(equipe);
}

function equipesVisibles() {
    var equipes = competition.equipes || [];
    if (!modeGroupes()) return equipes;
    return equipes.filter(function (e) {
        return groupeEquipe(e) === groupeActuel;
    });
}

function matchsVisibles() {
    var matchs = competition.matchs || [];
    if (!modeGroupes()) return matchs;
    return matchs.filter(function (m) {
        return groupeDuMatch(m) === groupeActuel;
    });
}

function logoHtml(equipe, classe) {
    if (typeof equipe === "object" && equipe.logo) {
        return '<img src="' + equipe.logo + '" class="' + classe + '" alt="' +
            esc(equipe.nom) + '" onerror="this.style.display=\'none\'">';
    }
    return '<span class="logo-placeholder">⚽</span>';
}

// ===============================
// INITIALISATION
// ===============================
if (!competition) {
    if (nomCompetition) nomCompetition.textContent = "Compétition introuvable";
    if (saisonCompetition) saisonCompetition.textContent = "Cette saison n'existe pas.";
} else {
    if (nomCompetition) nomCompetition.textContent = "🏆 " + competition.nom;
    if (saisonCompetition) saisonCompetition.textContent = "Saison " + competition.saison;

    if (modeGroupes()) {
        groupeActuel = listeGroupes()[0];
    }

    afficherBoutonsGroupes();

    if (competition.format === "elimination") {
        // Pas de classement : on masque l'onglet et on ouvre les journées
        var boutonClassement = document.querySelector('.btn-onglet[onclick*="classement"]');
        if (boutonClassement) boutonClassement.style.display = "none";
        changerOnglet("journees");
    } else {
        afficherClassement();
    }

    afficherEquipes();
    afficherCalendrier();
}

// ===============================
// ONGLETS
// ===============================
function changerOnglet(nomOnglet) {
    document.querySelectorAll(".contenu-onglet").forEach(function (vue) {
        vue.style.display = "none";
    });

    document.querySelectorAll(".btn-onglet").forEach(function (btn) {
        btn.classList.remove("active");
    });

    var vueCible = document.getElementById("vue-" + nomOnglet);
    if (vueCible) vueCible.style.display = "block";

    var boutonActif = document.querySelector('.btn-onglet[onclick*="' + nomOnglet + '"]');
    if (boutonActif) boutonActif.classList.add("active");
}

// ===============================
// GROUPES : un seul sélecteur, au-dessus des onglets
// ===============================
function afficherBoutonsGroupes() {
    if (!zoneGroupe) return;

    zoneGroupe.innerHTML = "";

    if (!modeGroupes()) {
        zoneGroupe.style.display = "none";
        return;
    }

    zoneGroupe.style.display = "flex";
    zoneGroupe.style.gap = "10px";

    listeGroupes().forEach(function (groupe) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "Groupe " + groupe;
        btn.className = "btn-groupe" + (groupe === groupeActuel ? " active" : "");
        btn.addEventListener("click", function () {
            changerGroupe(groupe);
        });
        zoneGroupe.appendChild(btn);
    });
}

function changerGroupe(groupe) {
    groupeActuel = groupe;
    afficherBoutonsGroupes();

    if (competition.format !== "elimination") afficherClassement();
    afficherEquipes();
    afficherCalendrier();
}

// ===============================
// ÉQUIPES
// ===============================
function afficherEquipes() {
    var conteneur = document.getElementById("listeEquipes");
    var titre = document.getElementById("titreEquipes");
    if (!conteneur) return;

    conteneur.innerHTML = "";

    if (titre) {
        titre.textContent = modeGroupes() ? "Clubs du Groupe " + groupeActuel : "Clubs Participants";
    }

    if (!competition.equipes || competition.equipes.length === 0) {
        conteneur.innerHTML = "<p>Aucun club enregistré pour le moment.</p>";
        return;
    }

    var equipes = equipesVisibles();

    if (equipes.length === 0) {
        conteneur.innerHTML = "<p>Aucun club enregistré pour ce groupe.</p>";
        return;
    }

    equipes.forEach(function (club) {
        var li = document.createElement("li");
        li.className = "carte-equipe";
        li.innerHTML = logoHtml(club, "logo-tableau") + " <strong>" + esc(nomEquipe(club)) + "</strong>";
        conteneur.appendChild(li);
    });
}

// ===============================
// JOURNÉES
// ===============================
function afficherCalendrier() {
    var select = document.getElementById("selectJournee");
    var conteneur = document.getElementById("listeMatchsJournee");
    if (!select || !conteneur) return;

    var precedente = select.value;
    select.innerHTML = "";
    conteneur.innerHTML = "";

    var matchs = matchsVisibles();

    if (matchs.length === 0) {
        conteneur.innerHTML = "<p>Aucun match programmé pour le moment.</p>";
        return;
    }

    var journees = [];
    matchs.forEach(function (m) {
        var j = Number(m.journee) || 1;
        if (journees.indexOf(j) === -1) journees.push(j);
    });
    journees.sort(function (a, b) { return a - b; });

    journees.forEach(function (j) {
        var option = document.createElement("option");
        option.value = j;
        option.textContent = "Journée " + j;
        select.appendChild(option);
    });

    if (precedente && journees.indexOf(Number(precedente)) !== -1) {
        select.value = precedente;
    }

    afficherMatchsJournee();
}

function afficherMatchsJournee() {
    var conteneur = document.getElementById("listeMatchsJournee");
    var select = document.getElementById("selectJournee");
    if (!conteneur || !select) return;

    conteneur.innerHTML = "";
    var journeeChoisie = Number(select.value);

    var matchs = matchsVisibles().filter(function (m) {
        return (Number(m.journee) || 1) === journeeChoisie;
    });

    if (matchs.length === 0) {
        conteneur.innerHTML = "<p>Aucun match pour cette journée.</p>";
        return;
    }

    matchs.forEach(function (match) {
        var div = document.createElement("div");
        div.className = "article";
        div.style.marginBottom = "10px";

        if (match.joue) {
            div.innerHTML =
                '<p style="color: #666; font-size: 0.9em;">📅 ' + formaterDate(match.date) +
                ' - <span style="color: green;">Terminé</span></p>' +
                "<strong>" + esc(match.domicile) + " " + match.scoreDomicile + " - " +
                match.scoreExterieur + " " + esc(match.exterieur) + "</strong>";
        } else {
            div.innerHTML =
                '<p style="color: #666; font-size: 0.9em;">📅 ' + formaterDate(match.date) +
                ' - <span style="color: orange;">À venir</span></p>' +
                "<strong>" + esc(match.domicile) + " 🆚 " + esc(match.exterieur) + "</strong>";
        }

        conteneur.appendChild(div);
    });
}

// ===============================
// CLASSEMENT
// ===============================
function afficherClassement() {
    if (!classementBody) return;
    classementBody.innerHTML = "";

    if (!competition.equipes) return;

    // Système de points choisi dans l'administration (3 / 1 / 0 par défaut)
    var pts = competition.points || {};
    var ptsVictoire = pts.victoire !== undefined ? Number(pts.victoire) : 3;
    var ptsNul = pts.nul !== undefined ? Number(pts.nul) : 1;
    var ptsDefaite = pts.defaite !== undefined ? Number(pts.defaite) : 0;

    // 1. Initialisation : uniquement les équipes du groupe affiché
    var classement = {};
    equipesVisibles().forEach(function (equipe) {
        var nom = nomEquipe(equipe);
        classement[nom] = {
            equipe: nom,
            data: equipe,
            mj: 0, v: 0, n: 0, d: 0,
            bp: 0, bc: 0, diff: 0, pts: 0
        };
    });

    // 2. Calcul : un match compte si ses deux équipes sont dans ce classement
    (competition.matchs || []).forEach(function (match) {
        if (!match.joue) return;

        var dom = classement[match.domicile];
        var ext = classement[match.exterieur];
        if (!dom || !ext) return;

        var sDom = Number(match.scoreDomicile) || 0;
        var sExt = Number(match.scoreExterieur) || 0;

        dom.mj++; ext.mj++;
        dom.bp += sDom; dom.bc += sExt;
        ext.bp += sExt; ext.bc += sDom;
        dom.diff = dom.bp - dom.bc;
        ext.diff = ext.bp - ext.bc;

        if (sDom > sExt) {
            dom.v++; dom.pts += ptsVictoire; ext.d++; ext.pts += ptsDefaite;
        } else if (sDom < sExt) {
            ext.v++; ext.pts += ptsVictoire; dom.d++; dom.pts += ptsDefaite;
        } else {
            dom.n++; dom.pts += ptsNul;
            ext.n++; ext.pts += ptsNul;
        }
    });

    // 3. Tri : points, différence de buts, buts marqués, nom
    var lignes = Object.keys(classement).map(function (cle) {
        return classement[cle];
    });

    lignes.sort(function (a, b) {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.diff !== a.diff) return b.diff - a.diff;
        if (b.bp !== a.bp) return b.bp - a.bp;
        return a.equipe.localeCompare(b.equipe);
    });

    // 4. Affichage
    lignes.forEach(function (e, index) {
        var tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + (index + 1) + "</td>" +
            "<td>" + logoHtml(e.data, "logo-tableau") + " <strong>" + esc(e.equipe) + "</strong></td>" +
            "<td>" + e.mj + "</td>" +
            "<td>" + e.v + "</td>" +
            "<td>" + e.n + "</td>" +
            "<td>" + e.d + "</td>" +
            "<td>" + e.bp + "</td>" +
            "<td>" + e.bc + "</td>" +
            "<td>" + e.diff + "</td>" +
            "<td><strong>" + e.pts + "</strong></td>";
        classementBody.appendChild(tr);
    });
}

// ===============================
// FORMATER LA DATE
// ===============================
function formaterDate(date) {
    if (!date) return "";
    var parties = date.split("-");
    if (parties.length !== 3) return date;
    return parties[2] + "/" + parties[1] + "/" + parties[0];
}