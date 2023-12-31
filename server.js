import { config } from "./back/config.js";
import { players, games } from "./back/data.js";
import { requests, onclose } from "./back/requests.js";
import { log } from "./back/utils.js";
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { WebSocket, WebSocketServer } from 'ws';

console.log = log; // Format des logs

const server = createServer({
    cert: readFileSync(config["certfile"]),
    key: readFileSync(config["keyfile"]),
});

const wss = new WebSocketServer({ server });

// Scope global du serveur
const sg = {players: players, games: games}

wss.on("connection", function(ws) {
    // Durée avant suppression du joueur lors de la déconnexion
    ws.closeTimeout = config["closeTimeout"];

    // Le client est-il toujours connecté ?
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    // Scope local du joueur courant
    const sl = {pseudo: "", ws: ws};

    // Envoi d'un message au joueur courant
    const send = (json) => ws.send(JSON.stringify(json));

    // Diffusion d'un message à tous les joueurs de la partie courante
    function broadcast(json, game) {
        if (sg.games.hasOwnProperty(game)) {
            Object.keys(sg.games[game]["players"]).forEach(function(player) {
                const pws = sg.players[player]["ws"];
                if (pws.readyState === WebSocket.OPEN) {
                    pws.send(JSON.stringify(json));
                }
            });
        }
    }

    // Gestion des suites de messages
    function batch(fsend, msg) {
        if (!Array.isArray(msg)) { msg = [msg]; }
        msg.forEach((m) => fsend(m));
    }

    ws.on("message", function(data) {
        let rq; try { rq = JSON.parse(data); }
        // On ignore la requête en cas d'erreur de parsing 
        catch(err) { return; }

        // Le type de requête est-il valide ?
        if (rq.hasOwnProperty("type") && requests.hasOwnProperty(rq["type"])) {
            if (rq["type"] !== "restore") { console.log(rq); }
            const request = requests[rq["type"]];
            // La requête est-elle valide ?
            if (request["precheck"](rq, sg, sl)) {
                // Traitement de la requête
                const rp = request["callback"](rq, sg, sl);
                if (rp.hasOwnProperty("send")) { batch(send, rp["send"]); }
                if (rp.hasOwnProperty("broadcast")) {
                    // L'identifiant de partie peut être créé ou supprimé par la callback
                    // Lors d'une diffusion il doit être renseigné dans le message
                    batch((json) => broadcast(json, rp["game"]), rp["broadcast"]);
                }
            }
        }

        // On ignore les messages incorrects

        // Debug
        //console.log(sg.games);
        //console.log(sg.players);
    });

    // Déconnexion du joueur
    ws.onclose = function() {
        // Le joueur doit être enregistré avec un pseudo
        // La connexion ne doit pas être une connexion fantôme
        // Sinon cela signifie que le joueur a restauré sa session
        if (sl.pseudo && ws === sg.players[sl.pseudo]["ws"]) {
            sg.players[sl.pseudo]["closeTimer"] = setTimeout(() => {
                const game = sg.players[sl.pseudo]["game"];
                const rp = onclose(sg, sl);
                if (rp.hasOwnProperty("broadcast")) { 
                    batch((json) => broadcast(json, game), rp["broadcast"]); 
                }
            }, ws.closeTimeout);
        }
    }

    //ws.on('error', console.error);
});

// Vérification de la connexion de chaque client à intervalle régulier
// Pour éviter des connexions fantôme engendrant des fuites mémoire
const pingTimer = setInterval(function() {
    wss.clients.forEach(function(ws) {
        if (!ws.isAlive) {
            ws.closeTimeout = 0; ws.terminate(); return;
        }
        ws.isAlive = false; ws.ping();
    });
}, config["pingInterval"]);

server.listen(config["port"]);
