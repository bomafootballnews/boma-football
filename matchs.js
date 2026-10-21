// ===============================
// GESTION DES MATCHS ET DES SCORES (administration)
// À charger dans admin.html, juste après script.js
// ===============================
(function () {
    var selectCompetition = document.getElementById("selectCompetitionMatch");
    var boutonEnregistrer = document.getElementById("enregistrerMatch");
    var caseJoue = document.getElementById("matchJoue");
    var blocScore = document.getElementById("blocScore");
    var listeAdmin = document.getElementById("listeMatchsAdmin");

    if (!selectCompetition || !boutonEnregistrer) return;

    var matchEnModification = null; // identifiant du match en cours de modification

    // Bouton "Annuler" (visible seulement pendant une modification)
    var boutonAnnuler = document.createElement("button");
    boutonAnnuler.type = "button";
    boutonAnnuler.textContent = "✖ Annuler la modification";
    boutonAnnuler.style.display = "none";
    boutonAnnuler.style.marginLeft = "10px";
    boutonEnregistrer.insertAdjacentElement("afterend", boutonAnnuler);

    // ---------- Outils ----------
    var compCourante = null; // compétition affichée (lue en ligne)

    function messageErreur(e) {
        return window.Donnees ? Donnees.erreurTexte(e) : String(e);
    }

    function esc(texte) {
        return String(texte).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function formaterDate(date) {
        if (!date) return "date à définir";
        var p = date.split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : date;
    }

    function champ(id) {
        return document.getElementById(id);
    }

    function afficherBlocScore() {
        if (blocScore) blocScore.style.display = caseJoue.checked ? "block" : "none";
    }

    // ---------- Formulaire ----------
    function reinitialiserFormulaire() {
        matchEnModification = null;
        champ("equipeDomicile").value = "";
        champ("equipeExterieur").value = "";
        caseJoue.checked = false;
        champ("scoreDomicile").value = 0;
        champ("scoreExterieur").value = 0;
        afficherBlocScore();
        boutonEnregistrer.textContent = "➕ Enregistrer le match";
        boutonAnnuler.style.display = "none";
        // On garde la journée et la date : pratique pour saisir plusieurs matchs de suite
    }

    caseJoue.addEventListener("change", afficherBlocScore);
    boutonAnnuler.addEventListener("click", reinitialiserFormulaire);

    // ---------- Enregistrer / mettre à jour un match ----------
    boutonEnregistrer.addEventListener("click", async function () {
        if (!selectCompetition.value) {
            alert("⚠️ Choisissez d'abord une compétition (enregistrez-en une si la liste est vide).");
            return;
        }

        var domicile = champ("equipeDomicile").value;
        var exterieur = champ("equipeExterieur").value;

        if (!domicile || !exterieur) {
            alert("⚠️ Choisissez les deux clubs.");
            return;
        }
        if (domicile === exterieur) {
            alert("⚠️ Un club ne peut pas jouer contre lui-même.");
            return;
        }

        var joue = caseJoue.checked;

        var match = {
            id: matchEnModification || (Date.now() * 1000 + Math.floor(Math.random() * 1000)),
            journee: Number(champ("journeeMatch").value) || 1,
            date: champ("dateMatch").value,
            domicile: domicile,
            exterieur: exterieur,
            joue: joue,
            scoreDomicile: joue ? Number(champ("scoreDomicile").value) || 0 : 0,
            scoreExterieur: joue ? Number(champ("scoreExterieur").value) || 0 : 0
        };

        boutonEnregistrer.disabled = true;

        try {
            // On relit la compétition juste avant d'écrire (évite d'écraser un changement récent)
            var comp = await Donnees.lire(selectCompetition.value);
            if (!comp) {
                alert("⚠️ Compétition introuvable.");
                return;
            }

            comp.matchs = comp.matchs || [];

            var index = matchEnModification
                ? comp.matchs.findIndex(function (m) { return m.id === matchEnModification; })
                : -1;

            if (index !== -1) {
                comp.matchs[index] = match;
            } else {
                comp.matchs.push(match);
            }

            await Donnees.ecrire(comp);

            alert(index !== -1 ? "✅ Match mis à jour !" : "✅ Match enregistré !");

            reinitialiserFormulaire();
            await afficherMatchsAdmin(match.journee);
        } catch (erreur) {
            alert("⚠️ Enregistrement impossible : " + messageErreur(erreur));
        } finally {
            boutonEnregistrer.disabled = false;
        }
    });

    // ---------- Liste des matchs de la compétition ----------
    // ---------- Sélecteur de journée (comme sur la page de la compétition) ----------
    var barreJournee = document.createElement("div");
    barreJournee.style.cssText = "display: none; margin-bottom: 10px;";

    var etiquetteJournee = document.createElement("strong");
    etiquetteJournee.textContent = "Journée : ";

    var selectJournee = document.createElement("select");

    var infoJournee = document.createElement("span");
    infoJournee.style.cssText = "color: #666; margin-left: 8px;";

    barreJournee.appendChild(etiquetteJournee);
    barreJournee.appendChild(selectJournee);
    barreJournee.appendChild(infoJournee);

    if (listeAdmin) listeAdmin.insertAdjacentElement("beforebegin", barreJournee);

    selectJournee.addEventListener("change", afficherListeJournee);

    function numeroJournee(m) {
        return Number(m.journee) || 1;
    }

    // Par défaut : la 1re journée où il reste des scores à saisir, sinon la dernière
    function journeeParDefaut(matchs, journees) {
        for (var i = 0; i < journees.length; i++) {
            var j = journees[i];
            var resteAJouer = matchs.some(function (m) { return numeroJournee(m) === j && !m.joue; });
            if (resteAJouer) return j;
        }
        return journees[journees.length - 1];
    }

    async function afficherMatchsAdmin(journeePreferee) {
        if (!listeAdmin) return;

        compCourante = null;
        barreJournee.style.display = "none";

        if (!selectCompetition.value) {
            listeAdmin.innerHTML = '<p style="color: #666;">Sélectionnez une compétition pour voir et modifier ses matchs.</p>';
            return;
        }

        listeAdmin.innerHTML = '<p style="color: #666;">Chargement…</p>';

        var comp = null;
        try {
            comp = await Donnees.lire(selectCompetition.value);
        } catch (erreur) {
            listeAdmin.innerHTML = '<p style="color: #c0392b;">Lecture impossible : ' + esc(messageErreur(erreur)) + "</p>";
            return;
        }

        if (!comp) {
            listeAdmin.innerHTML = '<p style="color: #666;">Sélectionnez une compétition pour voir et modifier ses matchs.</p>';
            return;
        }

        compCourante = comp;
        var matchs = comp.matchs || [];

        if (matchs.length === 0) {
            listeAdmin.innerHTML = '<p style="color: #666;">Aucun match enregistré pour cette compétition.</p>';
            return;
        }

        // Journées qui ont au moins un match enregistré
        var journees = [];
        matchs.forEach(function (m) {
            var j = numeroJournee(m);
            if (journees.indexOf(j) === -1) journees.push(j);
        });
        journees.sort(function (a, b) { return a - b; });

        // Quelle journée afficher ? celle qu'on vient d'enregistrer, sinon celle déjà ouverte, sinon la plus utile
        var dejaOuverte = Number(selectJournee.value);
        var choix;
        if (journeePreferee && journees.indexOf(Number(journeePreferee)) !== -1) {
            choix = Number(journeePreferee);
        } else if (journees.indexOf(dejaOuverte) !== -1) {
            choix = dejaOuverte;
        } else {
            choix = journeeParDefaut(matchs, journees);
        }

        selectJournee.innerHTML = journees.map(function (j) {
            var nombre = matchs.filter(function (m) { return numeroJournee(m) === j; }).length;
            return '<option value="' + j + '">Journée ' + j + " (" + nombre + " match" + (nombre > 1 ? "s" : "") + ")</option>";
        }).join("");
        selectJournee.value = String(choix);

        barreJournee.style.display = "block";
        afficherListeJournee();
    }

    function afficherListeJournee() {
        if (!compCourante) return;

        var journee = Number(selectJournee.value);

        var matchs = (compCourante.matchs || []).filter(function (m) {
            return numeroJournee(m) === journee;
        }).sort(function (a, b) {
            return String(a.date || "").localeCompare(String(b.date || ""));
        });

        var joues = matchs.filter(function (m) { return m.joue; }).length;
        infoJournee.textContent = joues + "/" + matchs.length + " joué" + (joues > 1 ? "s" : "");

        var html = "";
        matchs.forEach(function (m) {
            var resultat = m.joue ? m.scoreDomicile + " - " + m.scoreExterieur : "à venir";
            html +=
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; padding:8px 0; border-bottom:1px solid #ddd;">' +
                "<span>" + formaterDate(m.date) + " — " +
                esc(m.domicile) + " <strong>" + resultat + "</strong> " + esc(m.exterieur) + "</span>" +
                "<span>" +
                '<button type="button" class="modifier-match" data-id="' + m.id + '">✏️ Score / Modifier</button> ' +
                '<button type="button" class="supprimer-match" data-id="' + m.id + '">🗑</button>' +
                "</span></div>";
        });

        listeAdmin.innerHTML = html;
    }

    if (listeAdmin) {
        listeAdmin.addEventListener("click", async function (event) {
            var bouton = event.target.closest("button");
            if (!bouton || !compCourante) return;

            var id = bouton.getAttribute("data-id");
            var index = (compCourante.matchs || []).findIndex(function (m) { return String(m.id) === id; });
            if (index === -1) return;
            var m = compCourante.matchs[index];

            if (bouton.classList.contains("supprimer-match")) {
                if (!confirm("Supprimer ce match : " + m.domicile + " - " + m.exterieur + " ?")) return;

                bouton.disabled = true;
                try {
                    var comp = await Donnees.lire(selectCompetition.value);
                    comp.matchs = (comp.matchs || []).filter(function (x) { return String(x.id) !== id; });
                    await Donnees.ecrire(comp);
                    if (matchEnModification === m.id) reinitialiserFormulaire();
                } catch (erreur) {
                    alert("⚠️ Suppression impossible : " + messageErreur(erreur));
                }
                await afficherMatchsAdmin();
                return;
            }

            if (bouton.classList.contains("modifier-match")) {
                matchEnModification = m.id;
                champ("journeeMatch").value = m.journee;
                champ("dateMatch").value = m.date || "";
                champ("equipeDomicile").value = m.domicile;
                champ("equipeExterieur").value = m.exterieur;
                caseJoue.checked = !!m.joue;
                champ("scoreDomicile").value = m.scoreDomicile || 0;
                champ("scoreExterieur").value = m.scoreExterieur || 0;
                afficherBlocScore();
                boutonEnregistrer.textContent = "💾 Mettre à jour le match";
                boutonAnnuler.style.display = "inline-block";
                champ("formMatch").scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    // ---------- Changement de compétition ----------
    selectCompetition.addEventListener("change", function () {
        reinitialiserFormulaire();
        selectJournee.innerHTML = "";
        selectJournee.value = "";
        afficherMatchsAdmin();
    });

    // ---------- Démarrage ----------
    // script.js remplit la liste des compétitions puis envoie cet événement
    document.addEventListener("listeCompetitionsPrete", afficherMatchsAdmin);
    afficherBlocScore();
})();