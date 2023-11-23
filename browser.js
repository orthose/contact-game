let ws = null; // Socket bidirectionnel de communication avec le serveur
let send = null; // Fonction d'envoi de messages au serveur

function connectServer() {
    ws = new WebSocket(`wss://${config["host"]}:${config["port"]}`);
    send = (json) => ws.send(JSON.stringify(json));

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
}

function connectionError() {
    console.log("Connexion perdue...");
    document.querySelector("body").innerHTML = 
    `<p class="error">
    OUPS&nbsp;! La connexion a été perdue&nbsp;😲<br><br>
    Essayez de recharger la page&nbsp;🔄<br>
    Vérifiez votre connexion Internet&nbsp;📶<br><br>
    Si le problème persiste revenez plus tard&nbsp;🕐<br>
    Le serveur est peut-être en maintenance&nbsp;🚧</p>
    <button onclick="location.reload()">Recharger</button>`;
}

// Ne pas appeler dans connectServer pour éviter boucle infinie
function onclose(ev) {
    // Le joueur possède-t-il une session ?
    if (pseudo !== "" && sid !== "") {
        document.getElementById("network").style = "display: block";
        connectServer(); // Tentative initiale de reconnexion au serveur
        // Boucle de demande de restauration de session
        let retry = 0; retryTimer = setInterval(() => {
            if (retry < config["maxRetry"]) {
                // On doit attendre que le nouveau socket soit connecté
                if (ws.readyState === WebSocket.OPEN) {
                    send({"type": "restore", "pseudo": pseudo, "sid": sid});
                }
                // Si le socket n'est pas connecté alors on essaye de le reconnecter 
                else { ws.close(); connectServer(); } 
                retry++;
            }
            else {
                clearInterval(retryTimer);
                connectionError();
            }
        }, config["retryInterval"]);
    } 
    else {
        // Pour éviter clignotement 
        setTimeout(connectionError, 1000); 
    }
}

// Connexion initiale au serveur
connectServer();
ws.onclose = onclose;
