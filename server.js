import { players, games } from "./private/data.js";
import { requests, onclose } from "./private/requests.js";
import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 8080});

/*const players = {};
const games = {};*/

// Scope global du serveur
const sg = {players: players, games: games}

wss.on("connection", function(ws) {
    //let pseudo = ""; // Pseudo du joueur courant
    // Scope local du joueur
    const sl = {pseudo: "", ws: ws};

    // Envoi d'un message au joueur courant
    const send = (json) => ws.send(JSON.stringify(json));

    // Diffusion d'un message à tous les joueurs de la partie courante
    function broadcast(json) {
        const game = sg.players[sl.pseudo]["game"];
        Object.keys(sg.games[game]["players"]).forEach(function(player) {
            const pws = sg.players[player]["ws"];
            if (pws.readyState === WebSocket.OPEN) {
                pws.send(JSON.stringify(json));
            }
        });
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
                // Gestion des suites de messages
                function batch(fsend, msg) {
                    if (!Array.isArray(msg)) { msg = [msg]; }
                    msg.forEach((m) => fsend(m));
                }
                if (rp.hasOwnProperty("send")) { batch(send, rp["send"]); }
                if (rp.hasOwnProperty("broadcast")) { batch(broadcast, rp["broadcast"]); }
            }
        }

        // On ignore les messages incorrects
        
        /*let game = players[pseudo]["game"];
        let role = game ? (games[game]["leader"] === pseudo ? "leader" : "detective") : "";

        // Enregistrer le joueur
        if (data["register"]) {
            /*const isvalid = (pseudo === "" && !players.hasOwnProperty(data["register"])) || pseudo === data["register"];
            if (isvalid) {
                pseudo = data["register"];
                console.log("<", pseudo, "registered >");
                players[pseudo] = {"ws": ws, "game": ""}; 
            }
            send({"register": data["register"], "accepted": isvalid});
            const res = register(data, globalState, localState);
            if (res !== undefined) { send(res["send"]); }
            console.log(globalState);
            console.log(localState);
        }
        
        // Déconnecter le joueur
        else if (data.hasOwnProperty("unregister")) { ws.close(); }

        // Rejoindre une partie
        else if (data["join_game"]) {
            const game = data["join_game"];
            let isvalid = false;

            // Le joueur participe déjà à cette partie
            if (players[pseudo]["game"] === game) {
                isvalid = true;
            }

            // Le joueur ne peut participer qu'à une partie à la fois
            // Il doit quitter sa partie actuelle avant d'en rejoindre une autre
            else if (players[pseudo]["game"] === "") {
                isvalid = true;

                // Création d'une nouvelle partie
                if (!games.hasOwnProperty(game)) {
                    console.log("< game", game, "created by", pseudo, ">");
                    games[game] = {"secret": "", "letters": 1, "words": new Set(), 
                        "leader": pseudo, "players": new Set([pseudo]), "ndef": 0, "def": {}};
                }

                // La partie existe déjà 
                else {
                    console.log("<", pseudo, "joined", game, ">");
                    games[game]["players"].add(pseudo);
                }
                players[pseudo]["game"] = game;
            }
            const secret = games[game]["secret"].slice(0, games[game]["letters"]);
            const leader = games[game]["leader"];
            send({"join_game": game, "secret": secret, "leader": leader, "accepted": isvalid});
        }

        // Quitter la partie
        // TODO: Factoriser avec onclose
        else if (data.hasOwnProperty("quit_game")) {
            const game = players[pseudo]["game"];
            const role = getRole();
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

            // game optionnel
            send({"quit_game": game, "accepted": true});
        }

        // Proposer un mot secret
        else if (data["secret"]) {
            const secret = data["secret"];
            const game = players[pseudo]["game"];
            const role = getRole();
            // TODO: Vérifier la validité du mot dans le dictionnaire
            const isvalid = role === "leader" && game !== "" 
                && games.hasOwnProperty(game) && games[game]["secret"] === "";
            if (isvalid) {
                console.log("<", pseudo, "choosed", secret, "for", game, ">");
                games[game]["secret"] = secret;
                // Diffusion à tous les joueurs de la première lettre
                games[game]["players"].forEach(function(player) {
                    const pws = players[player]["ws"];
                    if (pws.readyState === WebSocket.OPEN) {
                        pws.send(JSON.stringify({"secret": secret.slice(0,1)}));
                    }
                });
            }
            // Informe le meneur que le mot est validé
            send({"secret": secret, "accepted": isvalid});
        }

        // Proposer une défintion
        else if (data["definition"]) {
            const def = data["definition"];
            const word = data["word"];
            const game = players[pseudo]["game"];
            const role = getRole();
            const ndef = games[game]["ndef"];
            const isvalid = word && role === "detective" && game !== "" && games.hasOwnProperty(game)
                && word.startsWith(games[game]["secret"].slice(0, games[game]["letters"]))
                && !games[game]["words"].has(word);
            // Diffusion à tous les joueurs de la partie
            if (isvalid) {
                console.log("< definition", ndef, "for", word, ">");
                games[game]["def"][ndef] = word;
                games[game]["ndef"]++;
                
                games[game]["players"].forEach(function(player) {
                    const pws = players[player]["ws"];
                    if (pws.readyState === WebSocket.OPEN) {
                        // Les messages de diffusion n'ont pas de champ "accepted"
                        pws.send(JSON.stringify({"definition": def, "pseudo": pseudo, "ndef": ndef}));
                    }
                });
            }
            // Définition refusée
            else {
                send({"definition": def, "word": word, "ndef": ndef, "accepted": false});
            }
        }

        // Résoudre un contact
        else if (data["contact"]) {
            const game = players[pseudo]["game"];
            const role = getRole();
            let isvalid = data.hasOwnProperty("ndef") && games[game]["def"].hasOwnProperty(data["ndef"]);
                //&& games[game]["definition"][data["ndef"]] === data["contact"];
            
            if (isvalid) {
                const ndef = data["ndef"];
                const accepted = games[game]["def"][ndef] === data["contact"];
                const word = games[game]["def"][ndef];

                // En cas de contre du meneur il faut qu'il soit réussi
                if (!(role === "leader" && !accepted)) {
                    console.log("< remove definition", ndef, ">");
                    // Ajout aux mots consommés
                    games[game]["words"].add(word);
                    games[game]["words"].add(games[game]["def"][ndef]);
                    // Suppression de la définition
                    delete games[game]["def"][ndef];
                }

                // Diffusion du contact à tous les joueurs qu'il soit réussi ou non
                // Variante: ne diffuser que si accepted et retirer "word", "accepted"
                games[game]["players"].forEach(function(player) {
                    const pws = players[player]["ws"];
                    if (pws.readyState === WebSocket.OPEN) {
                        // Si c'est le pseudo du leader c'est un contre sinon c'est un vrai contact
                        // TODO: Donner le pseudo du leader dans join_game et l'ajouter à game
                        pws.send(JSON.stringify({"contact": data["contact"], "word": word, "pseudo": pseudo, "ndef": ndef}));
                    }
                });

                if (role === "detective") {
                    // Diffusion de l'indice
                    if (accepted) {
                        const letters = ++games[game]["letters"];
                        const secret = games[game]["secret"].slice(0,letters);
                        console.log("< hint found", secret, ">");
                        games[game]["players"].forEach(function(player) {
                            const pws = players[player]["ws"];
                            if (pws.readyState === WebSocket.OPEN) {
                                pws.send(JSON.stringify({"secret": secret}));
                            }
                        });
                    }
                    // Echec du contact
                    //else { games[game]["try"]--; }
                }

                // TODO: Gestion de fin de partie try === 0 || games[game]["letters"] === games[game]["secret"].length
            }
        }
        
        // Message incorrect
        // TODO: Cela n'apporte rien supprimer ? On ignore les messages malformés.
        else { send({"accepted": false}); }

        // Debug
        /*console.log(sg.games);
        console.log(sg.players);*/
    });

    // Déconnexion du joueur
    ws.onclose = function() { onclose(sg, sl); }

    //ws.on('error', console.error);
});

