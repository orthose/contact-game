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
                "secret": "", "letters": 1, "words": new Set(), "ndef": 0, "def": {},
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
    const secret = sg.games[game]["secret"].slice(0, sg.games[game]["letters"]);
    const leader = sg.games[game]["leader"];
    return {"send": {"type": "joinGame", "game": game, "secret": secret, "leader": leader, "accepted": isvalid}};
}

// Quitter la partie en cours
export function quitGame(rq, sg, sl) {
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    console.log("<", sl.pseudo, "left", game, ">");
    if (sg.games.hasOwnProperty(game)) {
        // Le joueur quitte la liste des participants
        if (role === "detective") {
            sg.games[game]["players"].delete(sl.pseudo);
        }
        // TODO: Avertir les autres joueurs si partie en cours
        // Si le joueur est leader la partie s'arrête
        //else {}
    }
    
    // Réinitialisation des paramètres du joueur
    sg.players[sl.pseudo]["game"] = "";

    // game optionnel
    return {"send": {"type": "quitGame", "accepted": true}};
}

// Proposer un mot secret
export function secret(rq, sg, sl) {
    const secret = rq["secret"];
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    // TODO: Vérifier la validité du mot dans le dictionnaire
    const isvalid = role === "leader" && game !== "" 
        && sg.games.hasOwnProperty(game) && sg.games[game]["secret"] === "";
    // Informe le meneur si le mot est validé ou non
    const res = {"send": {"type": "secret", "secret": secret, "accepted": isvalid}};
    if (isvalid) {
        console.log("<", sl.pseudo, "choosed", secret, "for", game, ">");
        sg.games[game]["secret"] = secret;
        // Diffusion à tous les joueurs de la première lettre
        res["broadcast"] = {"type": "secret", "secret": secret.slice(0,1)};
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
    const isvalid = word && role === "detective" && game !== "" && sg.games.hasOwnProperty(game)
        && word.startsWith(sg.games[game]["secret"].slice(0, sg.games[game]["letters"]))
        && !sg.games[game]["words"].has(word);
    if (isvalid) {
        console.log("< definition", ndef, "for", word, ">");
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
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    let isvalid = sg.games[game]["def"].hasOwnProperty(rq["ndef"]);
        //&& games[game]["definition"][rq["ndef"]] === rq["contact"];
    
    if (isvalid) {
        const ndef = rq["ndef"];
        const accepted = sg.games[game]["def"][ndef] === rq["word"];
        const word = sg.games[game]["def"][ndef];

        // En cas de contre du meneur il faut qu'il soit réussi
        if (!(role === "leader" && !accepted)) {
            console.log("< remove definition", ndef, ">");
            // Ajout aux mots consommés
            sg.games[game]["words"].add(word);
            sg.games[game]["words"].add(sg.games[game]["def"][ndef]);
            // Suppression de la définition
            delete sg.games[game]["def"][ndef];
        }

        // Diffusion du contact à tous les joueurs qu'il soit réussi ou non
        // Si c'est le pseudo du leader c'est un contre sinon c'est un vrai contact
        // Variante: ne diffuser que si accepted et retirer "word", "accepted"
        const res = {"type": "contact", "word1": word, "word2": rq["word"], "pseudo": sl.pseudo, "ndef": ndef, "accepted": accepted};

        if (role === "detective") {
            // Diffusion de l'indice
            if (accepted) {
                const letters = ++sg.games[game]["letters"];
                const secret = sg.games[game]["secret"].slice(0,letters);
                console.log("< hint found", secret, ">");
                res["secret"] = secret;
            }
            // Echec du contact
            //else { games[game]["try"]--; }
        }
        return {"broadcast": res};

        // TODO: Gestion de fin de partie try === 0 || games[game]["letters"] === games[game]["secret"].length
    }
}

// Déconnexion du joueur
export function onclose(sg, sl) {
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    console.log("<", sl.pseudo, "unregistered >");
    if (sg.games.hasOwnProperty(game)) {
        if (role === "detective") {
            sg.games[game]["players"].delete(sl.pseudo);
        }
        // TODO: Avertir les autres joueurs si partie en cours
        // Si le joueur est leader la partie s'arrête
        //else {}
    }

    // Libérer la mémoire
    // TODO: Si partie en cours supprimer le joueur de la partie
    delete sg.players[sl.pseudo];
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
        "syntax": (rq) => rq["secret"],
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
