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

        // Rejoindre une partie
        else if (data["join_game"]) {
            let role = "";
            const game = data["join_game"];
            let isvalid = false;

            // Le joueur participe déjà à cette partie
            if (players[pseudo]["game"] === game) {
                isvalid = true;
                role = players[pseudo]["role"];
            }

            // Le joueur ne peut participer qu'à une partie à la fois
            // Il doit quitter sa partie actuelle avant d'en rejoindre une autre
            else if (players[pseudo]["game"] === "") {
                isvalid = true;

                // Création d'une nouvelle partie
                if (!games.hasOwnProperty(game)) {
                    console.log("< game", game, "created by", pseudo, ">");
                    role = "leader";
                    games[game] = {"secret": "", "letters": 1, "words": new Set(), "players": new Set([pseudo])};
                }

                // La partie existe déjà 
                else {
                    console.log("<", pseudo, "joined", game, ">");
                    role = "detective";
                    games[game]["players"].add(pseudo);
                }

                players[pseudo]["role"] = role;
                players[pseudo]["game"] = game;
            }
            send({"join_game": game, "role": role, "accepted": isvalid});
        }

        // Quitter la partie
        // TODO: Factoriser avec onclose
        else if (data.hasOwnProperty("quit_game")) {
            const game = players[pseudo]["game"];
            const role = players[pseudo]["role"];
            console.log("<", pseudo, "left", game, ">");
            if (games.hasOwnProperty(game)) {
                // Le joueur quitte la liste des participants
                if (role === "detective") {
                    games[game]["players"].delete(pseudo);
                }
                // TODO: Avertir les autres joueurs si partie en cours
                // Si le joueur est leader la partie s'arrête
                //else {}
            }
            
            // Réinitialisation des paramètres du joueur
            players[pseudo]["game"] = "";
            players[pseudo]["role"] = "";
            players[pseudo]["ndef"] = 0;
            players[pseudo]["def"] = {};

            // game optionnel
            send({"quit_game": game});
        }

        // Proposer un mot secret
        else if (data["secret"]) {
            const secret = data["secret"];
            const game = players[pseudo]["game"];
            const role = players[pseudo]["role"];
            // TODO: Vérifier la validité du mot dans le dictionnaire
            const isvalid = role === "leader" && game !== "" 
                && games.hasOwnProperty(game) && games[game]["secret"] === "";
            if (isvalid) {
                console.log("<", pseudo, "choosed", secret, "for", game, ">");
                games[game]["secret"] = secret;
            }
            send({"secret": secret, "accepted": isvalid});
        }
        
        // Message incorrect
        else { send({"accepted": false}); }
    });

    // Déconnexion du joueur
    ws.onclose = function() {
        const game = players[pseudo]["game"];
        const role = players[pseudo]["role"];
        console.log("<", pseudo, "is unregistered >");
        if (games.hasOwnProperty(game)) {
            if (role === "detective") {
                games[game]["players"].delete(pseudo);
            }
            // TODO: Avertir les autres joueurs si partie en cours
            // Si le joueur est leader la partie s'arrête
            //else {}
        }

        // Libérer la mémoire
        // TODO: Si partie en cours supprimer le joueur de la partie
        delete players[pseudo];
    }

    //ws.on('error', console.error);
});

