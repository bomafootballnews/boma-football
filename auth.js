(function () {
    // Définir le mot de passe d'accès
    const motDePasseCorrect = "boma2026"; 

    // Vérifier si la session est déjà validée
    const estConnecte = sessionStorage.getItem("adminConnecte");

    if (estConnecte !== "true") {
        const reponse = prompt("🔐 Accès restreint. Veuillez saisir le mot de passe administrateur :");

        if (reponse === motDePasseCorrect) {
            sessionStorage.setItem("adminConnecte", "true");
            alert("✅ Accès autorisé !");
        } else {
            alert("❌ Mot de passe incorrect. Redirection vers l'accueil.");
            window.location.href = "index.html";
        }
    }
})();