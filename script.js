// ===============================
// INITIALISATION AU CHARGEMENT
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    rafraichirTousLesSelectsCompetitions();
});

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

        let competitions = JSON.parse(localStorage.getItem("competitions")) || [];
        let indexExistante = competitions.findIndex(comp => comp.id === idCompetition);

        if (indexExistante !== -1) {
            competitions[indexExistante].nom = nomCompetition;
            competitions[indexExistante].saison = saison;
            competitions[indexExistante].format = format;
            competitions[indexExistante].points = { victoire, nul, defaite };
            competitions[indexExistante].equipes = equipes;
        } else {
            competitions.push({
                id: idCompetition,
                nom: nomCompetition,
                saison: saison,
                format: format,
                points: { victoire, nul, defaite },
                equipes: equipes,
                matchs: []
            });
        }

        try {
            localStorage.setItem("competitions", JSON.stringify(competitions));
        } catch (erreur) {
            alert("⚠️ Espace de stockage plein : utilisez des logos plus petits ou faites une sauvegarde puis supprimez d'anciennes saisons.");
            return;
        }

        alert("✅ Compétition '" + nomCompetition + "' enregistrée avec succès !");

        rafraichirTousLesSelectsCompetitions();
    });
}

// ===============================
// METTRE À JOUR TOUS LES SELECTS
// ===============================
function rafraichirTousLesSelectsCompetitions() {
    const selectMatch = document.getElementById("selectCompetitionMatch");
    const selectModifier = document.getElementById("selectCompModifier");

    const competitions = JSON.parse(localStorage.getItem("competitions")) || [];

    // Menu pour ajouter des matchs
    if (selectMatch) {
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

    chargerClubsDansSelects();
}

// ===============================
// CHARGER LES CLUBS DANS LES MENUS DES MATCHS
// ===============================
const selectCompMatch = document.getElementById("selectCompetitionMatch");

if (selectCompMatch) selectCompMatch.addEventListener("change", chargerClubsDansSelects);

function chargerClubsDansSelects() {
    const idComp = document.getElementById("selectCompetitionMatch") ? document.getElementById("selectCompetitionMatch").value : "";

    const selectDom = document.getElementById("equipeDomicile");
    const selectExt = document.getElementById("equipeExterieur");

    if (!selectDom || !selectExt) return;

    selectDom.innerHTML = "<option value=''>-- Choisir club domicile --</option>";
    selectExt.innerHTML = "<option value=''>-- Choisir club extérieur --</option>";

    const competitions = JSON.parse(localStorage.getItem("competitions")) || [];
    const comp = competitions.find(c => c.id === idComp);

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
function chargerEquipesCompModifier() {
    const idComp = document.getElementById("selectCompModifier").value;
    const conteneur = document.getElementById("equipes");
    if (!conteneur || !idComp) return;

    const competitions = JSON.parse(localStorage.getItem("competitions")) || [];
    const comp = competitions.find(c => c.id === idComp);
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
// EXPORT & IMPORT JSON
// ===============================
const boutonExporter = document.getElementById("exporterDonnees");
const champImporter = document.getElementById("importerFichier");

if (boutonExporter) {
    boutonExporter.addEventListener("click", function () {
        const donnees = localStorage.getItem("competitions");
        if (!donnees || JSON.parse(donnees).length === 0) {
            alert("⚠️ Aucune donnée à exporter.");
            return;
        }

        const blob = new Blob([donnees], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "boma-football-backup.json";
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (champImporter) {
    champImporter.addEventListener("change", function (event) {
        const fichier = event.target.files[0];
        if (!fichier) return;

        const lecteur = new FileReader();
        lecteur.onload = function (e) {
            try {
                const donnees = JSON.parse(e.target.result);
                if (!Array.isArray(donnees)) {
                    alert("⚠️ Le fichier n'est pas un tableau JSON valide.");
                    return;
                }

                if (confirm("Remplacer toutes les données actuelles par la sauvegarde ?")) {
                    localStorage.setItem("competitions", JSON.stringify(donnees));
                    alert("✅ Données restaurées !");
                    location.reload();
                }
            } catch (err) {
                alert("⚠️ Erreur lors de la lecture du fichier.");
            }
        };
        lecteur.readAsText(fichier);
    });
}