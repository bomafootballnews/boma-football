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
var idCompetition = decodeURIComponent(window.location.hash.substring(1));
if (!/^[a-z0-9-]+$/.test(idCompetition)) idCompetition = "";
var competition = null;

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
function demarrer() {
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
}

document.addEventListener("DOMContentLoaded", function () {
    if (!window.Donnees) {
        if (nomCompetition) nomCompetition.textContent = "Données indisponibles";
        if (saisonCompetition) saisonCompetition.textContent = "Le fichier donnees.js est manquant dans cette page.";
        return;
    }

    if (!idCompetition) {
        demarrer();
        return;
    }

    if (nomCompetition) nomCompetition.textContent = "Chargement…";

    Donnees.lire(idCompetition)
        .then(function (comp) {
            competition = comp;
            demarrer();
        })
        .catch(function () {
            if (nomCompetition) nomCompetition.textContent = "Chargement impossible";
            if (saisonCompetition) saisonCompetition.textContent = "Vérifiez votre connexion internet puis rechargez la page.";
        });
});

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
        li.style.cursor = "pointer";
        li.addEventListener("click", function () {
            ouvrirParcoursEquipe(nomEquipe(club));
        });
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

    // Phrase d'aide (une seule fois), au-dessus du tableau
    var tableau = classementBody.parentElement;
    if (tableau && tableau.parentNode && !document.getElementById("astuceClassement")) {
        var astuce = document.createElement("p");
        astuce.id = "astuceClassement";
        astuce.style.cssText = "color: #666; font-size: 0.9em; margin: 0 0 8px;";
        astuce.textContent = "👆 Appuyez sur un club pour voir ses résultats et ses prochains matchs.";
        tableau.parentNode.insertBefore(astuce, tableau);
    }

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
            "<td><strong>" + e.pts + "</strong></td>" +
            "<td>" + e.mj + "</td>" +
            "<td>" + e.v + "</td>" +
            "<td>" + e.n + "</td>" +
            "<td>" + e.d + "</td>" +
            "<td>" + e.bp + "</td>" +
            "<td>" + e.bc + "</td>" +
            "<td>" + e.diff + "</td>";

        // Appuyer sur une ligne : résultats et prochains matchs de ce club
        tr.style.cursor = "pointer";
        tr.title = "Voir les matchs de " + e.equipe;
        tr.addEventListener("click", function () {
            ouvrirParcoursEquipe(e.equipe);
        });

        classementBody.appendChild(tr);
    });
}

// ===============================
// PARCOURS D'UNE ÉQUIPE : résultats + prochains matchs
// ===============================
function numeroDeJournee(match) {
    return Number(match.journee) || 1;
}

// Tous les matchs d'un club dans la compétition, classés par journée
function matchsDeEquipe(nom) {
    return (competition.matchs || []).filter(function (m) {
        return m.domicile === nom || m.exterieur === nom;
    }).sort(function (a, b) {
        return (numeroDeJournee(a) - numeroDeJournee(b)) ||
            String(a.date || "").localeCompare(String(b.date || ""));
    });
}

// "V", "N" ou "D" du point de vue du club
function resultatPour(nom, match) {
    var buts = match.domicile === nom
        ? [Number(match.scoreDomicile) || 0, Number(match.scoreExterieur) || 0]
        : [Number(match.scoreExterieur) || 0, Number(match.scoreDomicile) || 0];

    if (buts[0] > buts[1]) return "V";
    if (buts[0] < buts[1]) return "D";
    return "N";
}

var COULEURS_RESULTAT = {
    V: { fond: "#2e7d32", texte: "#fff" },
    N: { fond: "#f9a825", texte: "#333" },
    D: { fond: "#c62828", texte: "#fff" }
};

function pastille(lettre) {
    var c = COULEURS_RESULTAT[lettre];
    return '<span style="display:inline-block; min-width:26px; text-align:center; padding:3px 0; ' +
        "border-radius:50%; font-size:0.8em; font-weight:bold; background:" + c.fond + "; color:" + c.texte + ';">' +
        lettre + "</span>";
}

function ligneDeMatch(nom, match) {
    var domicile = match.domicile === nom ? "<strong>" + esc(match.domicile) + "</strong>" : esc(match.domicile);
    var exterieur = match.exterieur === nom ? "<strong>" + esc(match.exterieur) + "</strong>" : esc(match.exterieur);

    var gauche = match.joue
        ? pastille(resultatPour(nom, match))
        : '<span style="display:inline-block; min-width:26px; text-align:center;">🗓</span>';

    var milieu = match.joue
        ? domicile + " <strong>" + (Number(match.scoreDomicile) || 0) + " - " + (Number(match.scoreExterieur) || 0) + "</strong> " + exterieur
        : domicile + " 🆚 " + exterieur;

    return '<div style="display:flex; gap:10px; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">' +
        gauche +
        "<div>" +
        '<div style="color:#666; font-size:0.85em;">Journée ' + numeroDeJournee(match) +
        (match.date ? " · " + formaterDate(match.date) : "") + "</div>" +
        "<div>" + milieu + "</div>" +
        "</div></div>";
}

function fermerParcoursEquipe() {
    var fenetre = document.getElementById("parcoursEquipe");
    if (fenetre) fenetre.remove();
    document.body.style.overflow = "";
}

function ouvrirParcoursEquipe(nom) {
    fermerParcoursEquipe();

    var club = (competition.equipes || []).find(function (e) { return nomEquipe(e) === nom; });
    var matchs = matchsDeEquipe(nom);
    var joues = matchs.filter(function (m) { return m.joue; });
    var avenir = matchs.filter(function (m) { return !m.joue; });

    var victoires = joues.filter(function (m) { return resultatPour(nom, m) === "V"; }).length;
    var nuls = joues.filter(function (m) { return resultatPour(nom, m) === "N"; }).length;
    var defaites = joues.length - victoires - nuls;

    // Forme : les 5 derniers matchs joués
    var forme = joues.slice(-5).map(function (m) { return pastille(resultatPour(nom, m)); }).join(" ");

    var html =
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">' +
        '<div style="flex:1; font-size:1.2em;">' + (club ? logoHtml(club, "logo-tableau") : "") +
        " <strong>" + esc(nom) + "</strong></div>" +
        '<button type="button" id="fermerParcours" aria-label="Fermer" ' +
        'style="border:0; background:#eee; color:#333; border-radius:50%; width:36px; height:36px; font-size:1em;">✕</button>' +
        "</div>" +
        '<div style="color:#555; margin-bottom:6px;">' + joues.length + " match" + (joues.length > 1 ? "s" : "") +
        " joué" + (joues.length > 1 ? "s" : "") + " · " + victoires + " V · " + nuls + " N · " + defaites + " D</div>" +
        (forme ? '<div style="margin-bottom:10px;">Forme : ' + forme + "</div>" : "");

    html += '<h4 style="margin:14px 0 4px;">Résultats</h4>';
    html += joues.length
        ? joues.map(function (m) { return ligneDeMatch(nom, m); }).join("")
        : '<p style="color:#666;">Aucun match joué pour le moment.</p>';

    html += '<h4 style="margin:18px 0 4px;">Prochains matchs</h4>';
    html += avenir.length
        ? avenir.map(function (m) { return ligneDeMatch(nom, m); }).join("")
        : '<p style="color:#666;">Aucun match à venir enregistré.</p>';

    var fond = document.createElement("div");
    fond.id = "parcoursEquipe";
    fond.setAttribute("role", "dialog");
    fond.setAttribute("aria-modal", "true");
    fond.style.cssText = "position:fixed; top:0; left:0; right:0; bottom:0; z-index:300; " +
        "background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; padding:12px;";

    var fiche = document.createElement("div");
    fiche.style.cssText = "background:#fff; width:100%; max-width:520px; max-height:88vh; overflow-y:auto; " +
        "border-radius:14px; padding:16px; box-sizing:border-box;";
    fiche.innerHTML = html;

    fond.appendChild(fiche);
    fond.addEventListener("click", function (evenement) {
        if (evenement.target === fond) fermerParcoursEquipe();
    });

    document.body.appendChild(fond);
    document.body.style.overflow = "hidden";

    document.getElementById("fermerParcours").addEventListener("click", fermerParcoursEquipe);
}

document.addEventListener("keydown", function (evenement) {
    if (evenement.key === "Escape") fermerParcoursEquipe();
});

// ===============================
// FORMATER LA DATE
// ===============================
function formaterDate(date) {
    if (!date) return "";
    var parties = date.split("-");
    if (parties.length !== 3) return date;
    return parties[2] + "/" + parties[1] + "/" + parties[0];
}