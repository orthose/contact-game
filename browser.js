const ws = new WebSocket("ws://localhost:8080");

const send = (json) => ws.send(JSON.stringify(json));

ws.onclose = function(ev) {
    console.log("Connexion perdue...");
    pseudo = "";
    // Revenir à la page d'accueil
    pages.register();
};

// Réception des messages du serveur
ws.onmessage = function(ev) {
    let rq = JSON.parse(ev.data);
    console.log(rq);

    // Le type de requête est-il valide ?
    if (rq.hasOwnProperty("type") && requests.hasOwnProperty(rq["type"])) {
        // On fait confiance au serveur pour la syntaxe des messages reçus
        // Traitement de la requête
        requests[rq["type"]](rq);
    }
    // On ignore les messages incorrects
};
