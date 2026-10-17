// ===============================
// CONNEXION ADMINISTRATEUR (Firebase Authentication)
// À garder dans <head> de admin.html, avec donnees.js
// ===============================
(function () {
    // Tant que l'administrateur n'est pas connecté, le contenu reste caché
    var cache = document.createElement("style");
    cache.textContent = "main { display: none !important; }";
    document.head.appendChild(cache);

    document.addEventListener("DOMContentLoaded", function () {
        var main = document.querySelector("main");
        if (!main) return;

        // Boîte de connexion
        var boite = document.createElement("div");
        boite.style.cssText = "max-width: 380px; margin: 30px auto; padding: 20px; background: #f1f3f5; border-radius: 8px;";
        boite.innerHTML =
            "<h2>🔐 Connexion administrateur</h2>" +
            '<label for="adminEmail">E-mail</label>' +
            '<input type="email" id="adminEmail" autocomplete="username" style="width:100%; box-sizing:border-box;">' +
            '<label for="adminMdp">Mot de passe</label>' +
            '<input type="password" id="adminMdp" autocomplete="current-password" style="width:100%; box-sizing:border-box;">' +
            '<br><br><button type="button" id="adminConnexion">Se connecter</button>' +
            '<p id="adminMessage" style="color:#c0392b;"></p>' +
            '<p><a href="index.html">← Retour à l\'accueil</a></p>';
        main.parentNode.insertBefore(boite, main);

        // Barre "connecté" (déconnexion)
        var barre = document.createElement("div");
        barre.style.cssText = "display:none; margin-bottom:15px;";
        main.insertBefore(barre, main.firstChild);

        var champEmail = document.getElementById("adminEmail");
        var champMdp = document.getElementById("adminMdp");
        var bouton = document.getElementById("adminConnexion");
        var message = document.getElementById("adminMessage");

        if (!window.Donnees) {
            message.textContent = "donnees.js est manquant dans cette page.";
            return;
        }

        function seConnecter() {
            message.textContent = "";
            bouton.disabled = true;

            Donnees.connecter(champEmail.value.trim(), champMdp.value)
                .catch(function (erreur) {
                    message.textContent = Donnees.erreurTexte(erreur);
                })
                .then(function () {
                    bouton.disabled = false;
                });
        }

        bouton.addEventListener("click", seConnecter);
        champMdp.addEventListener("keydown", function (e) {
            if (e.key === "Enter") seConnecter();
        });

        Donnees.surConnexion(function (utilisateur, erreur) {
            if (erreur) {
                message.textContent = Donnees.erreurTexte(erreur);
                return;
            }

            if (utilisateur) {
                boite.style.display = "none";
                cache.remove();
                barre.style.display = "block";
                barre.innerHTML = 'Connecté : <strong></strong> <button type="button" id="adminDeconnexion">Se déconnecter</button>';
                barre.querySelector("strong").textContent = utilisateur.email;
                document.getElementById("adminDeconnexion").addEventListener("click", function () {
                    Donnees.deconnecter().then(function () { window.location.reload(); });
                });
            } else {
                boite.style.display = "block";
                if (!cache.parentNode) document.head.appendChild(cache);
                barre.style.display = "none";
            }
        });
    });
})();