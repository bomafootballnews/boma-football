// ===============================
// INITIALISATION AU CHARGEMENT
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    if (!window.Donnees) {
        alert("⚠️ donnees.js est manquant dans admin.html.");
        return;
    }
    rafraichirTousLesSelectsCompetitions();
    ajouterBoutonSupprimerCompetition();
    proposerEnvoiDonneesLocales();
});

function messageErreur(e) {
    return window.Donnees ? Donnees.erreurTexte(e) : String(e);
}

// ===============================
// LOGOS : lecture + réduction (pour ne pas saturer le stockage)
// ===============================
function lireLogo(fichier) {
    return new Promise(function (resolve) {
        if (!fichier) {
            resolve("");
            return;
        }

        const lecteur = new FileReader();

        lecteur.onload = function () {
            const img = new Image();

            img.onload = function () {
                const tailleMax = 80; // pixels
                const echelle = Math.min(1, tailleMax / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.width * echelle));
                canvas.height = Math.max(1, Math.round(img.height * echelle));
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/png"));
            };

            img.onerror = function () { resolve(""); };
            img.src = lecteur.result;
        };

        lecteur.onerror = function () { resolve(""); };
        lecteur.readAsDataURL(fichier);
    });
}

// ===============================
// CRÉER UN BLOC "ÉQUIPE" (nouvelle équipe ou équipe existante)
// ===============================
function creerBlocEquipe(equipe) {
    equipe = equipe || {};

    const bloc = document.createElement("div");
    bloc.classList.add("equipe");
    bloc.style.cssText = "border-bottom: 1px dashed #ccc; padding: 10px 0;";
    bloc.dataset.logo = equipe.logo || ""; // logo déjà enregistré (conservé si on n'en choisit pas un nouveau)

    bloc.innerHTML = `
        <label>Nom du club :</label>
        <input type="text" class="nom-equipe" placeholder="Ex : SC Boma">

        <label>Logo :</label>
        <input type="file" class="logo-equipe" accept="image/*">
        <img class="apercu-logo" alt="" style="height: 28px; vertical-align: middle; display: none;">

        <button type="button" class="supprimer-equipe">🗑 Supprimer</button>
    `;

    bloc.querySelector(".nom-equipe").value = equipe.nom || "";

    if (equipe.logo) {
        const apercu = bloc.querySelector(".apercu-logo");
        apercu.src = equipe.logo;
        apercu.style.display = "inline-block";
    }

    return bloc;
}

// ===============================
// BOUTON : AJOUTER UNE ÉQUIPE
// ===============================
const boutonAjouter = document.getElementById("ajouterEquipe");
const listeEquipes = document.getElementById("equipes");

if (boutonAjouter && listeEquipes) {
    boutonAjouter.addEventListener("click", function () {
        listeEquipes.appendChild(creerBlocEquipe());
    });

    listeEquipes.addEventListener("click", function (event) {
        if (event.target.classList.contains("supprimer-equipe")) {
            event.target.parentElement.remove();
        }
    });

    // Aperçu du logo choisi
    listeEquipes.addEventListener("change", function (event) {
        if (!event.target.classList.contains("logo-equipe")) return;

        const bloc = event.target.closest(".equipe");
        let apercu = bloc.querySelector(".apercu-logo");

        if (!apercu) {
            apercu = document.createElement("img");
            apercu.className = "apercu-logo";
            apercu.alt = "";
            apercu.style.cssText = "height: 28px; vertical-align: middle;";
            event.target.insertAdjacentElement("afterend", apercu);
        }

        const fichier = event.target.files[0];
        if (fichier) {
            apercu.src = URL.createObjectURL(fichier);
            apercu.style.display = "inline-block";
        }
    });
}

// ===============================
// BOUTON : ENREGISTRER COMPÉTITION
// ===============================
const boutonEnregistrer = document.getElementById("enregistrerCompetition");

if (boutonEnregistrer) {
    boutonEnregistrer.addEventListener("click", async function () {
        const nomCompetition = document.getElementById("nomCompetition").value.trim();
        const saison = document.getElementById("saison").value.trim();
        const format = document.getElementById("format").value;
        const victoire = Number(document.getElementById("victoire").value) || 3;
        const nul = Number(document.getElementById("nul").value) || 1;
        const defaite = Number(document.getElementById("defaite").value) || 0;

        if (!nomCompetition || !saison) {
            alert("⚠️ Veuillez renseigner au moins le nom de la compétition et la saison.");
            return;
        }

        const idCompetition = (nomCompetition + "-" + saison)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        const blocsEquipes = document.querySelectorAll(".equipe");
        const equipes = [];

        for (const bloc of blocsEquipes) {
            const champNom = bloc.querySelector(".nom-equipe");
            const champGroupe = bloc.querySelector(".groupe-equipe");
            const champLogo = bloc.querySelector(".logo-equipe");

            if (!champNom || champNom.value.trim() === "") continue;

            // Nouveau logo choisi ? Sinon on garde l'ancien
            const fichier = champLogo && champLogo.files[0] ? champLogo.files[0] : null;
            const nouveauLogo = await lireLogo(fichier);

            equipes.push({
                nom: champNom.value.trim(),
                groupe: champGroupe ? champGroupe.value : "aucun",
                logo: nouveauLogo || bloc.dataset.logo || ""
            });
        }

        boutonEnregistrer.disabled = true;

        try {
            const existante = await Donnees.lire(idCompetition);
            const competition = existante || { id: idCompetition, matchs: [] };

            competition.id = idCompetition;
            competition.nom = nomCompetition;
            competition.saison = saison;
            competition.format = format;
            competition.points = { victoire, nul, defaite };
            competition.equipes = equipes;
            competition.matchs = competition.matchs || [];

            await Donnees.ecrire(competition);

            alert("✅ Compétition '" + nomCompetition + "' enregistrée en ligne !");
            await rafraichirTousLesSelectsCompetitions();
        } catch (erreur) {
            alert("⚠️ Enregistrement impossible : " + messageErreur(erreur));
        } finally {
            boutonEnregistrer.disabled = false;
        }
    });
}

// ===============================
// METTRE À JOUR TOUS LES SELECTS
// ===============================
async function rafraichirTousLesSelectsCompetitions() {
    const selectMatch = document.getElementById("selectCompetitionMatch");
    const selectModifier = document.getElementById("selectCompModifier");

    let competitions = [];
    try {
        competitions = await Donnees.liste();
    } catch (erreur) {
        alert("⚠️ Lecture impossible : " + messageErreur(erreur));
    }

    // Menu pour ajouter des matchs (on garde la sélection actuelle si possible)
    if (selectMatch) {
        const precedent = selectMatch.value;
        selectMatch.innerHTML = "";

        if (competitions.length === 0) {
            selectMatch.innerHTML = "<option value=''>Aucune compétition enregistrée</option>";
        } else {
            competitions.forEach(comp => {
                const opt = document.createElement("option");
                opt.value = comp.id;
                opt.textContent = comp.nom + " (" + comp.saison + ")";
                selectMatch.appendChild(opt);
            });

            if (competitions.some(c => c.id === precedent)) selectMatch.value = precedent;
        }
    }

    // Menu pour charger/modifier les équipes
    if (selectModifier) {
        selectModifier.innerHTML = '<option value="">-- Choisir une compétition existante --</option>';
        competitions.forEach(comp => {
            const opt = document.createElement("option");
            opt.value = comp.id;
            opt.textContent = comp.nom + " (" + comp.saison + ")";
            selectModifier.appendChild(opt);
        });
    }

    await chargerClubsDansSelects();

    // Prévenir matchs.js que la liste est prête
    document.dispatchEvent(new Event("listeCompetitionsPrete"));
}

// ===============================
// CHARGER LES CLUBS DANS LES MENUS DES MATCHS
// ===============================
const selectCompMatch = document.getElementById("selectCompetitionMatch");

if (selectCompMatch) selectCompMatch.addEventListener("change", chargerClubsDansSelects);

async function chargerClubsDansSelects() {
    const idComp = document.getElementById("selectCompetitionMatch") ? document.getElementById("selectCompetitionMatch").value : "";

    const selectDom = document.getElementById("equipeDomicile");
    const selectExt = document.getElementById("equipeExterieur");

    if (!selectDom || !selectExt) return;

    selectDom.innerHTML = "<option value=''>-- Choisir club domicile --</option>";
    selectExt.innerHTML = "<option value=''>-- Choisir club extérieur --</option>";

    if (!idComp) return;

    let comp = null;
    try {
        comp = await Donnees.lire(idComp);
    } catch (erreur) {
        return;
    }

    if (!comp || !comp.equipes || comp.equipes.length === 0) return;

    comp.equipes.forEach(club => {
        const nom = typeof club === "object" ? club.nom : club;

        const optDom = document.createElement("option");
        optDom.value = nom;
        optDom.textContent = nom;
        selectDom.appendChild(optDom);

        const optExt = document.createElement("option");
        optExt.value = nom;
        optExt.textContent = nom;
        selectExt.appendChild(optExt);
    });
}

// ===============================
// CHARGER UNE COMPÉTITION EXISTANTE (infos + équipes + logos)
// ===============================
async function chargerEquipesCompModifier() {
    const idComp = document.getElementById("selectCompModifier").value;
    const conteneur = document.getElementById("equipes");
    if (!conteneur || !idComp) return;

    let comp = null;
    try {
        comp = await Donnees.lire(idComp);
    } catch (erreur) {
        alert("⚠️ Lecture impossible : " + messageErreur(erreur));
        return;
    }
    if (!comp) return;

    // Remplir aussi nom / saison / format / points : l'identifiant est calculé
    // à partir du nom et de la saison, sinon on créerait une compétition en double
    document.getElementById("nomCompetition").value = comp.nom;
    document.getElementById("saison").value = comp.saison;
    document.getElementById("format").value = comp.format || "championnat";

    if (comp.points) {
        document.getElementById("victoire").value = comp.points.victoire;
        document.getElementById("nul").value = comp.points.nul;
        document.getElementById("defaite").value = comp.points.defaite;
    }

    conteneur.innerHTML = "";

    if (!comp.equipes || comp.equipes.length === 0) {
        conteneur.appendChild(creerBlocEquipe());
        return;
    }

    comp.equipes.forEach(eq => {
        conteneur.appendChild(creerBlocEquipe(eq));
    });
}

// ===============================
// SUPPRIMER UNE COMPÉTITION
// ===============================
function ajouterBoutonSupprimerCompetition() {
    const selectModifier = document.getElementById("selectCompModifier");
    if (!selectModifier) return;

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = "🗑 Supprimer cette compétition";
    bouton.style.marginLeft = "10px";
    selectModifier.insertAdjacentElement("afterend", bouton);

    bouton.addEventListener("click", async function () {
        const id = selectModifier.value;
        if (!id) {
            alert("⚠️ Choisissez d'abord une compétition dans la liste.");
            return;
        }

        const libelle = selectModifier.options[selectModifier.selectedIndex].textContent;
        if (!confirm("Supprimer définitivement « " + libelle + " » avec ses clubs et ses matchs ?")) return;

        try {
            await Donnees.supprimer(id);
            alert("✅ Compétition supprimée.");
            await rafraichirTousLesSelectsCompetitions();
        } catch (erreur) {
            alert("⚠️ Suppression impossible : " + messageErreur(erreur));
        }
    });
}

// ===============================
// ENVOYER LES ANCIENNES DONNÉES (stockées dans ce navigateur) VERS FIREBASE
// ===============================
function proposerEnvoiDonneesLocales() {
    let anciennes = [];
    try {
        anciennes = JSON.parse(localStorage.getItem("competitions")) || [];
    } catch (e) {
        anciennes = [];
    }
    if (!Array.isArray(anciennes) || anciennes.length === 0) return;

    const zone = document.getElementById("exporterDonnees");
    if (!zone) return;

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = "⬆ Envoyer mes " + anciennes.length + " compétition(s) de ce navigateur vers la base en ligne";
    bouton.style.cssText = "display:block; margin-top:10px;";
    zone.insertAdjacentElement("afterend", bouton);

    bouton.addEventListener("click", async function () {
        if (!confirm("Envoyer " + anciennes.length + " compétition(s) vers la base en ligne ? Celles qui existent déjà seront remplacées.")) return;

        bouton.disabled = true;
        try {
            for (const comp of anciennes) {
                if (comp && comp.id && comp.nom && comp.saison) await Donnees.ecrire(comp);
            }
            // On garde une copie de l'ancien stockage, sans qu'il resserve
            localStorage.setItem("competitions_ancien", JSON.stringify(anciennes));
            localStorage.removeItem("competitions");
            alert("✅ Données envoyées ! Elles sont maintenant visibles en ligne.");
            bouton.remove();
            await rafraichirTousLesSelectsCompetitions();
        } catch (erreur) {
            alert("⚠️ Envoi impossible : " + messageErreur(erreur));
            bouton.disabled = false;
        }
    });
}

// ===============================
// EXPORT & IMPORT JSON
// ===============================
const boutonExporter = document.getElementById("exporterDonnees");
const champImporter = document.getElementById("importerFichier");

if (boutonExporter) {
    boutonExporter.addEventListener("click", async function () {
        try {
            const toutes = await Donnees.toutes();

            if (toutes.length === 0) {
                alert("⚠️ Aucune donnée à exporter.");
                return;
            }

            const blob = new Blob([JSON.stringify(toutes)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "boma-football-backup.json";
            a.click();
            URL.revokeObjectURL(url);
        } catch (erreur) {
            alert("⚠️ Export impossible : " + messageErreur(erreur));
        }
    });
}

if (champImporter) {
    champImporter.addEventListener("change", function (event) {
        const fichier = event.target.files[0];
        if (!fichier) return;

        const lecteur = new FileReader();
        lecteur.onload = async function (e) {
            try {
                const donnees = JSON.parse(e.target.result);
                if (!Array.isArray(donnees)) {
                    alert("⚠️ Le fichier n'est pas une sauvegarde valide.");
                    return;
                }

                if (!confirm("Envoyer " + donnees.length + " compétition(s) vers la base en ligne ? Celles qui existent déjà seront remplacées.")) return;

                for (const comp of donnees) {
                    if (comp && comp.id && comp.nom && comp.saison) await Donnees.ecrire(comp);
                }

                alert("✅ Données restaurées !");
                champImporter.value = "";
                await rafraichirTousLesSelectsCompetitions();
            } catch (erreur) {
                alert("⚠️ Restauration impossible : " + messageErreur(erreur));
            }
        };
        lecteur.readAsText(fichier);
    });
}