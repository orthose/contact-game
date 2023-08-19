import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 8080});

const players = {};
const games = {};

wss.on("connection", function(ws) {
    let pseudo = ""; // Pseudo du joueur courant

    const send = (json) => ws.send(JSON.stringify(json));

    ws.on("message", function(data) {
        data = JSON.parse(data);
        console.log(data);

        // Enregistrer le joueur
        if (data["register"]) {
            const isvalid = (pseudo === "" && !players.hasOwnProperty(data["register"])) || pseudo === data["register"];
            if (isvalid) {
                pseudo = data["register"];
                console.log("<", pseudo, "is registered >");
                players[pseudo] = {"ws": ws, "game": "", "role": "", "ndef": 0, "def": {}}; 
            }
            send({"register": data["register"], "accepted": isvalid});
        }
        
        // Déconnecter le joueur
        else if (data.hasOwnProperty("unregister")) { ws.close(); }

        // Créer une partie
        else if (data["create_game"]) {
            const game = data["create_game"];
            const isvalid = !games.hasOwnProperty(game) && players[pseudo]["game"] === "";
            if (isvalid) {
                console.log("< game", game, "is created >");
                players[pseudo]["role"] = "leader";
                players[pseudo]["game"] = game;
                games[game] = {"secret": "", "letters": 1, "words": new Set(), "players": new Set([pseudo])};
            }
            send({"create_game": game, "accepted": isvalid});
        }
        
        // Message incorrect
        else { send({"accepted": false}); }
    });

    // Déconnexion du joueur
    ws.onclose = function() { 
        console.log("<", pseudo, "is unregistered >");
        // TODO: Avertir les autres joueurs si partie en cours
        // Si le joueur est leader la partie s'arrête

        // Libérer la mémoire
        delete players[pseudo];
    }

    //ws.on('error', console.error);
});

