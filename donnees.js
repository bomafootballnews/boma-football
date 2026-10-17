// ===============================
// DONNÉES EN LIGNE (Firebase / Firestore)
// À inclure sur TOUTES les pages : <script src="donnees.js"></script>
// ===============================
(function () {
    // ---- Configuration de votre projet Firebase ----
    // Si la connexion échoue avec « clé invalide », recopiez ce bloc
    // depuis la console Firebase (Paramètres du projet > Vos applications).
    var CONFIG = {
        apiKey: "AIzaSyAB851aMLJV9tMkHKCA20FQFLCYV4nyLrg",
        authDomain: "bomafootball.firebaseapp.com",
        projectId: "bomafootball",
        storageBucket: "bomafootball.firebasestorage.app",
        messagingSenderId: "993906472606",
        appId: "1:993906472606:web:e553867d35b4b9cdfd2d8f"
    };

    var BASE = "https://www.gstatic.com/firebasejs/10.14.1/";
    var COLLECTION = "competitions"; // un document par compétition
    var pretBase = null;
    var pretAuth = null;

    function charger(fichier) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement("script");
            s.src = BASE + fichier;
            s.onload = resolve;
            s.onerror = function () {
                reject(new Error("Impossible de charger " + fichier + " (connexion internet ?)"));
            };
            document.head.appendChild(s);
        });
    }

    function base() {
        if (!pretBase) {
            pretBase = charger("firebase-app-compat.js")
                .then(function () { return charger("firebase-firestore-compat.js"); })
                .then(function () {
                    if (!firebase.apps.length) firebase.initializeApp(CONFIG);
                    return firebase.firestore();
                });
        }
        return pretBase;
    }

    function authentification() {
        if (!pretAuth) {
            pretAuth = base()
                .then(function () { return charger("firebase-auth-compat.js"); })
                .then(function () { return firebase.auth(); });
        }
        return pretAuth;
    }

    // Copie "propre" (Firestore refuse les valeurs undefined)
    function nettoyer(objet) {
        return JSON.parse(JSON.stringify(objet));
    }

    // ---- Lecture ----

    // Liste légère : [{id, nom, saison}] (1 seule lecture)
    function liste() {
        return base()
            .then(function (db) { return db.collection("meta").doc("index").get(); })
            .then(function (doc) {
                return doc.exists ? (doc.data().competitions || []) : [];
            });
    }

    // Une compétition complète (clubs, logos, matchs)
    function lire(id) {
        return base()
            .then(function (db) { return db.collection(COLLECTION).doc(id).get(); })
            .then(function (doc) { return doc.exists ? doc.data() : null; });
    }

    function toutes() {
        return liste()
            .then(function (l) { return Promise.all(l.map(function (c) { return lire(c.id); })); })
            .then(function (r) { return r.filter(Boolean); });
    }

    // ---- Écriture (administrateur) ----

    function ecrire(competition) {
        var comp = nettoyer(competition);

        return base().then(function (db) {
            var refComp = db.collection(COLLECTION).doc(comp.id);
            var refIndex = db.collection("meta").doc("index");

            return db.runTransaction(function (t) {
                return t.get(refIndex).then(function (indexDoc) {
                    var l = indexDoc.exists ? (indexDoc.data().competitions || []) : [];
                    var entree = { id: comp.id, nom: comp.nom, saison: comp.saison };
                    var i = l.findIndex(function (c) { return c.id === comp.id; });

                    if (i === -1) l.push(entree); else l[i] = entree;

                    t.set(refComp, comp);
                    t.set(refIndex, { competitions: l });
                });
            });
        });
    }

    function supprimer(id) {
        return base().then(function (db) {
            var refComp = db.collection(COLLECTION).doc(id);
            var refIndex = db.collection("meta").doc("index");

            return db.runTransaction(function (t) {
                return t.get(refIndex).then(function (indexDoc) {
                    var l = indexDoc.exists ? (indexDoc.data().competitions || []) : [];
                    l = l.filter(function (c) { return c.id !== id; });
                    t.delete(refComp);
                    t.set(refIndex, { competitions: l });
                });
            });
        });
    }

    // ---- Connexion administrateur ----

    function connecter(email, motDePasse) {
        return authentification().then(function (auth) {
            return auth.signInWithEmailAndPassword(email, motDePasse);
        });
    }

    function deconnecter() {
        return authentification().then(function (auth) { return auth.signOut(); });
    }

    function surConnexion(callback) {
        authentification()
            .then(function (auth) { auth.onAuthStateChanged(callback); })
            .catch(function (erreur) { callback(null, erreur); });
    }

    // ---- Messages d'erreur lisibles ----
    function erreurTexte(e) {
        var code = (e && e.code) || "";

        if (code === "permission-denied") {
            return "⛔ Droits insuffisants : connectez-vous avec le compte administrateur.";
        }
        if (code === "auth/invalid-credential" || code === "auth/wrong-password" ||
            code === "auth/user-not-found" || code === "auth/invalid-email") {
            return "E-mail ou mot de passe incorrect.";
        }
        if (code === "auth/too-many-requests") {
            return "Trop de tentatives. Réessayez dans quelques minutes.";
        }
        if (code === "auth/network-request-failed" || code === "unavailable") {
            return "Pas de connexion internet.";
        }
        if (code === "auth/api-key-not-valid.-please-pass-a-valid-api-key." ||
            code === "auth/invalid-api-key") {
            return "Clé de configuration invalide : vérifiez la configuration dans donnees.js.";
        }
        if (code === "auth/unauthorized-domain") {
            return "Domaine non autorisé : ajoutez votre adresse GitHub dans Firebase > Authentication > Paramètres > Domaines autorisés.";
        }
        return (e && e.message) ? e.message : String(e);
    }

    window.Donnees = {
        liste: liste,
        lire: lire,
        toutes: toutes,
        ecrire: ecrire,
        supprimer: supprimer,
        connecter: connecter,
        deconnecter: deconnecter,
        surConnexion: surConnexion,
        erreurTexte: erreurTexte
    };
})();
