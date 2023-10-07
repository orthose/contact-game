const ws = new WebSocket(`wss://${config["host"]}:${config["port"]}`);

const send = (json) => ws.send(JSON.stringify(json));

ws.onclose = function(ev) {
    // Pour éviter le clignotement
    setTimeout(() => {
        console.log("Connexion perdue...");
        document.querySelector("body").innerHTML = 
        `<p class="error">
        OUPS&nbsp;!&nbsp;😲<br><br>
        La connexion a été interrompue de manière inopinée&nbsp;📶<br><br>
        Le serveur est probablement en maintenance&nbsp;🚧<br><br>
        Revenez plus tard&nbsp;🕐</p>
        <button onclick="location.reload()">Recharger</button>`;
    }, 1000);
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
