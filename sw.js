// ===============================
// SERVICE WORKER : rend le site installable et utilisable hors connexion
// Stratégie : on essaie toujours internet d'abord (vous voyez les mises à jour
// tout de suite) ; sans connexion, on affiche la dernière version gardée en mémoire.
// ===============================
var CACHE = "boma-football-v1";

var FICHIERS = [
    "./",
    "index.html",
    "competition.html",
    "competitions.html",
    "actualites.html",
    "apropos.html",
    "style.css",
    "donnees.js",
    "menu.js",
    "competition.js",
    "logo.jpg",
    "icon-192.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            // Un fichier manquant ne doit pas bloquer l'installation
            return Promise.all(FICHIERS.map(function (fichier) {
                return cache.add(fichier).catch(function () { });
            }));
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (noms) {
            return Promise.all(noms.filter(function (nom) { return nom !== CACHE; })
                .map(function (nom) { return caches.delete(nom); }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (event) {
    var requete = event.request;
    var url = new URL(requete.url);

    // On ne touche ni à Firebase / Google (autres sites), ni à l'administration
    if (requete.method !== "GET" || url.origin !== self.location.origin || /admin/i.test(url.pathname)) {
        return;
    }

    event.respondWith(
        fetch(requete)
            .then(function (reponse) {
                if (reponse && reponse.ok) {
                    var copie = reponse.clone();
                    caches.open(CACHE).then(function (cache) { cache.put(requete, copie); });
                }
                return reponse;
            })
            .catch(function () {
                return caches.match(requete, { ignoreSearch: true }).then(function (enMemoire) {
                    return enMemoire || caches.match("index.html");
                });
            })
    );
});