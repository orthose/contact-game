import { players, games } from "./back/data.js";
import { requests, onclose } from "./back/requests.js";
import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 8080});

// Scope global du serveur
const sg = {players: players, games: games}

wss.on("connection", function(ws) {
    // Scope local du joueur courant
    const sl = {pseudo: "", ws: ws};

    // Envoi d'un message au joueur courant
    const send = (json) => ws.send(JSON.stringify(json));

    // Diffusion d'un message à tous les joueurs de la partie courante
    function broadcast(json, game="") {
        game = game ? game : sg.players[sl.pseudo]["game"];
        Object.keys(sg.games[game]["players"]).forEach(function(player) {
            const pws = sg.players[player]["ws"];
            if (pws.readyState === WebSocket.OPEN) {
                pws.send(JSON.stringify(json));
            }
        });
    }

    // Gestion des suites de messages
    function batch(fsend, msg) {
        if (!Array.isArray(msg)) { msg = [msg]; }
        msg.forEach((m) => fsend(m));
    }

    ws.on("message", function(data) {
        const rq = JSON.parse(data);
        console.log(rq);

        // Le type de requête est-il valide ?
        if (rq.hasOwnProperty("type") && requests.hasOwnProperty(rq["type"])) {
            const request = requests[rq["type"]];
            // La syntaxe de la requête est-elle correcte ?
            if (request["syntax"](rq)) {
                // Traitement de la requête
                const rp = request["callback"](rq, sg, sl);
                if (rp.hasOwnProperty("send")) { batch(send, rp["send"]); }
                if (rp.hasOwnProperty("broadcast")) { batch(broadcast, rp["broadcast"]); }
            }
        }

        // On ignore les messages incorrects

        // Debug
        //console.log(sg.games);
        //console.log(sg.players);
    });

    // Déconnexion du joueur
    ws.onclose = function() {
        if (sl.pseudo) {
            const game = sg.players[sl.pseudo]["game"];
            const rp = onclose(sg, sl);
            if (rp.hasOwnProperty("broadcast")) { 
                batch((json) => broadcast(json, game), rp["broadcast"]); 
            }
        }
    }

    //ws.on('error', console.error);
});

