/**
 * Fonctions traitant les requêtes en provenance du client
 * 
 * Chaque fonction prend en entrée une requête du client et produit une réponse
 * Dans certains cas si la requête est invalide la fonction ne renvoie undefined
 * Sinon l'objet renvoyé est de la forme {"send": {...}, "broadcast": {...}}
 * Le champ "send" est à renvoyer en réponse au client de la requête
 * Le champ "broadcast" est à diffuser à tous les joueurs de la partie
 * 
 * L'état du serveur est modifié au travers d'un objet état passé par référence
 * et pointant vers des variables globales ou locales au joueur
 * sg = {players: {...}, games: {...}}
 * sl = {pseudo: "", ws: ws}
 * 
 * La signature des fonctions est uniformisée pour faciliter leur manipulation
 * @param rq objet de la requête en provenance du client
 * @param sg objet global de l'état interne du serveur
 * @param sl objet local dans la fermeture du joueur
 * @return objet de réponse à renvoyer au client
 */

import { getRole } from "./data.js";

// Enregistrer un nouveau joueur lors de sa première connexion
export function register(rq, sg, sl) {
    // Le joueur ne doit pas déjà être enregistré
    const isvalid = (sl.pseudo === "" && !sg.players.hasOwnProperty(rq["pseudo"]))
    // Vérification que le joueur est bien enregistré
    || sl.pseudo === rq["pseudo"];
    
    if (isvalid) {
        sl.pseudo = rq["pseudo"];
        console.log("<", sl.pseudo, "registered >");
        sg.players[sl.pseudo] = {"ws": sl.ws, "game": ""};
    }
    return {"send": {"type": "register", "pseudo": rq["pseudo"], "accepted": isvalid}};
}

// Déconnecter le joueur courant
export function unregister(rq, sg, sl) {
    sl.ws.close();
}

// Rejoindre ou créer une partie
export function joinGame(rq, sg, sl) {
    const game = rq["game"];
    let isvalid = false;

    // Le joueur participe déjà à cette partie
    if (sg.players[sl.pseudo]["game"] === game) {
        isvalid = true;
    }

    // Le joueur ne peut participer qu'à une partie à la fois
    // Il doit quitter sa partie actuelle avant d'en rejoindre une autre
    else if (sg.players[sl.pseudo]["game"] === "") {
        isvalid = true;

        // Création d'une nouvelle partie
        if (!sg.games.hasOwnProperty(game)) {
            console.log("< game", game, "created by", sl.pseudo, ">");
            sg.games[game] = {
                "secret": "", "letters": 1, "words": new Set(), "ntry": 5, "ndef": 0, "def": {},
                "leader": sl.pseudo, "players": {[sl.pseudo]: new Set()}
            };
        }

        // La partie existe déjà 
        else {
            console.log("<", sl.pseudo, "joined", game, ">");
            sg.games[game]["players"][sl.pseudo] = new Set();
        }
        sg.players[sl.pseudo]["game"] = game;
    }

    if (isvalid) {
        const ntry = sg.games[game]["ntry"];
        const secret = sg.games[game]["secret"].slice(0, sg.games[game]["letters"]);
        const leader = sg.games[game]["leader"];
        return {"send": {"type": "joinGame", "game": game, "ntry": ntry, "secret": secret, "leader": leader, 
        "players": Object.keys(sg.games[game]["players"]), "accepted": isvalid}, 
        "broadcast": {"type": "addPlayer", "pseudo": sl.pseudo}};
    } else {
        return {"send": {"type": "joinGame", "game": game, "accepted": isvalid}};
    }
}

// Quitter la partie en cours
export function quitGame(rq, sg, sl) {
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    const res = {"send": {"type": "quitGame", "accepted": true}};
    console.log("<", sl.pseudo, "left", game, ">");
    // Le joueur participe à une partie
    if (sg.games.hasOwnProperty(game)) {
        // Le joueur quitte la liste des participants
        delete sg.games[game]["players"][sl.pseudo];
        // Tous les joueurs ont quitté la partie
        if (Object.keys(sg.games[game]["players"]).length === 0) {
            delete sg.games[game];
        } else {
            // On avertit les autres joueurs du départ
            res["broadcast"] = [{"type": "removePlayer", "pseudo": sl.pseudo}];
            // Si le joueur est meneur et que le mot secret n'a pas encore été choisi
            // Alors on désigne un nouveau meneur
            if (role === "leader" && sg.games[game]["secret"] === "") {
                const nextLeader = Object.keys(sg.games[game]["players"])[0];
                res["broadcast"].push({"type": "joinGame", "game": game, "ntry": 5, "secret": "", "leader": nextLeader, 
                "players": Object.keys(sg.games[game]["players"])});
            }
        }
    }
    
    // Réinitialisation des paramètres du joueur
    sg.players[sl.pseudo]["game"] = "";

    return res;
}

// Proposer un mot secret
export function secret(rq, sg, sl) {
    const secret = rq["word"];
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    // TODO: Vérifier la validité du mot dans le dictionnaire
    const isvalid = role === "leader" && game !== "" 
        && sg.games.hasOwnProperty(game) && sg.games[game]["secret"] === "";
    // Informe le meneur si le mot est validé ou non
    const res = {"send": {"type": "secret", "word": secret, "accepted": isvalid}};
    if (isvalid) {
        console.log("<", sl.pseudo, "choosed", secret, "for", game, ">");
        sg.games[game]["secret"] = secret;
        // Diffusion à tous les joueurs de la première lettre
        res["broadcast"] = {"type": "secret", "word": secret.slice(0,1)};
    }
    return res;
}

// Proposer une défintion
export function definition(rq, sg, sl) {
    const def = rq["def"];
    const word = rq["word"];
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    const ndef = sg.games[game]["ndef"];
    // TODO: Vérifier que la définition ne contient pas le mot proposé ou une racine
    // TODO: Vérifier que le mot est dans le dictionnaire
    const isvalid = role === "detective" && game !== "" && sg.games.hasOwnProperty(game)
        && word.startsWith(sg.games[game]["secret"].slice(0, sg.games[game]["letters"]))
        && !sg.games[game]["words"].has(word);
    if (isvalid) {
        console.log("< definition", ndef, "for", word, ">");
        sg.games[game]["players"][sl.pseudo].add(ndef);
        sg.games[game]["def"][ndef] = word;
        sg.games[game]["ndef"]++;
        // Diffusion à tous les joueurs de la partie
        // Les messages de diffusion n'ont pas de champ "accepted"
        return {"broadcast": {"type": "definition", "def": def, "pseudo": sl.pseudo, "ndef": ndef}};
    }
    // Définition refusée
    return {"send": {"type": "definition", "def": def, "word": word, "ndef": ndef, "accepted": false}};
}

// Résoudre un contact
export function contact(rq, sg, sl) {
    const res = [];
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    const ndef = rq["ndef"];
    let isvalid = (
        // Le numéro de définition existe-t-il ? 
        sg.games[game]["def"].hasOwnProperty(ndef)
        // Le joueur n'a pas pas proposé cette définition ?
        && !sg.games[game]["players"][sl.pseudo].has(ndef)
        // Le meneur ne peut pas proposer le mot secret pour contrer
        && (role !== "leader" || sg.games[game]["def"][ndef] !== sg.games[game]["secret"])
    );
    
    if (isvalid) {
        // Les mots correspondent-ils ?
        isvalid = sg.games[game]["def"][ndef] === rq["word"];
        let word = sg.games[game]["def"][ndef];
        let winner = "";
        // Définitions expirées si mot déjà consommé
        const expired = [];

        // Si le contact est réussi ou non on change l'état de la partie
        // En cas de contre du meneur il faut qu'il soit réussi 
        if (!(role === "leader" && !isvalid)) {
            console.log("< remove definition", ndef, ">");
            // Ajout aux mots consommés
            sg.games[game]["words"].add(word);
            sg.games[game]["words"].add(sg.games[game]["def"][ndef]);
            // Suppression de la définition
            delete sg.games[game]["def"][ndef];
        }
        
        if (role === "leader") {
            // En cas de contre du meneur réussi les détectives perdent un essai 
            if (isvalid) { sg.games[game]["ntry"]--; }
            // En cas de contre du meneur raté le mot de la définition n'est pas révélé
            else { word = ""; }
        }

        // Diffusion du contact à tous les joueurs qu'il soit réussi ou non
        // Si c'est le pseudo du leader c'est un contre sinon c'est un vrai contact
        // Variante: ne diffuser que si accepted et retirer "word", "accepted"
        res.push({"type": "contact", "word1": word, "word2": rq["word"], "pseudo": sl.pseudo, "ndef": ndef, 
        "ntry": -1, "expired": expired, "accepted": isvalid});

        if (role === "detective") {
            // Diffusion de l'indice
            if (isvalid) {
                const letters = ++sg.games[game]["letters"];
                const secret = sg.games[game]["secret"].slice(0,letters);
                // TODO: Vider les numéros de définition dans "players" et faire repartir ndef = 0 ?
                console.log("< hint found", secret, ">");
                res.push({"type": "secret", "word": secret});
                // Fin de partie si mot secret trouvé par contact entre détectives ou si toutes les lettres trouvées
                if (sg.games[game]["secret"] === word || sg.games[game]["secret"].length === sg.games[game]["letters"]) {
                    winner = "detective";
                }
            }
            // Echec du contact
            else { 
                sg.games[game]["ntry"]--;
                // Fin de partie si mot secret trouvé par contact entre détectives
                if ([word, rq["word"]].includes(sg.games[game]["secret"])) {
                    winner = "leader";
                }
            }
        }

        // Le message de contact doit être envoyé en priorité
        // Certains champs doivent être modifiés à cet endroit

        // Nombre d'essais restant
        res[0]["ntry"] = sg.games[game]["ntry"];

        // Suppression des définitions expirées
        const hint = sg.games[game]["secret"].slice(0,sg.games[game]["letters"]);
        Object.entries(sg.games[game]["def"]).forEach(([n, w]) => {
            // Mot consommé ou ne correspond plus à l'indice
            if (w === word || !w.startsWith(hint)) { 
                console.log("< remove definition", n, ">");
                expired.push(n);
                delete sg.games[game]["def"][n];
            }
        });

        // Gestion de fin de partie
        if (sg.games[game]["ntry"] === 0) { 
            winner = "leader"; 
        }
        if (winner) {
            console.log("< end game winner", winner, ">");
            const nextLeader = winner === "leader" ? sg.games[game]["leader"] : sl.pseudo;
            res.push({"type": "endGame", "winner": winner, "word": sg.games[game]["secret"]});
            res.push({"type": "joinGame", "game": game, "ntry": 5, "secret": "", "leader": nextLeader, 
            "players": Object.keys(sg.games[game]["players"])});
            // Réinitialisation de la partie
            sg.games[game]["secret"] = "";
            sg.games[game]["letters"] = 1;
            sg.games[game]["words"] = new Set();
            sg.games[game]["ntry"] = 5;
            sg.games[game]["ndef"] = 0;
            sg.games[game]["def"] = {};
            sg.games[game]["leader"] = nextLeader;
            Object.keys(sg.games[game]["players"]).forEach(p => {
                sg.games[game]["players"][p] = new Set();
            });
        }
    }
    return {"broadcast": res};
}

// Déconnexion du joueur
export function onclose(sg, sl) {
    console.log("<", sl.pseudo, "unregistered >");
    
    // Le joueur doit éventuellement quitter la partie
    const res = quitGame({}, sg, sl);
    // On ne renvoie pas de message au joueur
    delete res["send"];
    
    // Suppression du joueur
    delete sg.players[sl.pseudo];

    return res;
}

// Association type de requête <-> fonction
export const requests = {
    "register": {
        "syntax": (rq) => rq["pseudo"],
        "callback": register
    },
    "unregister": {
        "syntax": (rq) => true,
        "callback": unregister
    },
    "joinGame": {
        "syntax": (rq) => rq["game"],
        "callback": joinGame
    },
    "quitGame": {
        "syntax": (rq) => true,
        "callback": quitGame
    },
    "secret": {
        "syntax": (rq) => rq["word"],
        "callback": secret
    },
    "definition": {
        "syntax": (rq) => rq["def"] && rq["word"],
        "callback": definition
    },
    "contact": {
        "syntax": (rq) => rq["word"] && typeof rq["ndef"] === "number",
        "callback": contact
    }, 
}
