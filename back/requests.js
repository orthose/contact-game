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

import { config } from "./config.js";
import { getRole } from "./data.js";
import * as checks from "./checks.js";
import { isfilled } from "./checks.js";
import { htmlspecialchars, formatInput, randomPassword, shuffle } from "./utils.js";

// Statistiques actuelles du serveur
export function status(rq, sg, sl) {
    return {"send": {"type": "status", "onlinePlayers": Object.keys(sg.players).length, "currentGames": Object.keys(sg.games).length}};
}

// Sélection aléatoire de parties ayant une visibilité publique
function selectPublicGames(sg) {
    const publicGames = Object.entries(sg.games)
        .filter(([_,v]) => v["visibility"] === "public")
        .map(([k,v]) => {return {"game": k, "players": Object.keys(v["players"]).length}});
    shuffle(publicGames);
    return publicGames.slice(0, config["maxSelectedGames"])
}

// Enregistrer un nouveau joueur lors de sa première connexion
export function register(rq, sg, sl) {
    // Le joueur ne doit pas déjà être enregistré
    const isvalid = (
        // Le joueur n'est pas enregistré
        sl.pseudo === "" && !sg.players.hasOwnProperty(rq["pseudo"])
        && checks.inputIsValid(rq["pseudo"])
    );
    let sid = "";
    if (isvalid) {
        sl.pseudo = rq["pseudo"];
        // Note: le sid n'est pas unique c'est un mot de passe
        sid = randomPassword(32);
        sg.players[sl.pseudo] = {"ws": sl.ws, "sid": sid, "closeTimer": null, "game": ""};
        console.log("<", sl.pseudo, "registered >");
    }
    return {"send": {"type": "register", "pseudo": rq["pseudo"], "sid": sid, "accepted": isvalid,
    "publicGames": selectPublicGames(sg)}};
}

// Déconnecter le joueur courant
export function unregister(rq, sg, sl) {
    // Suppression immédiate du joueur sans délai
    sl.ws.closeTimeout = 0; sl.ws.terminate(); return {};
}

// Restaurer la session (pseudo, sid) dans le délai imparti
export function restore(rq, sg, sl) {
    const isvalid = (
        // Le joueur existe-t-il encore ?
        sg.players.hasOwnProperty(rq["pseudo"])
        // Le session id est-il valide ?
        && rq["sid"] === sg.players[rq["pseudo"]]["sid"]
    );
    let res = [{"type": "restore", "pseudo": rq["pseudo"], "accepted": isvalid}];
    if (isvalid) {
        // Arrêt du délai de suppression du joueur
        clearTimeout(sg.players[rq["pseudo"]]["closeTimer"]);
        // Mise à jour des données du joueur
        sl.pseudo = rq["pseudo"];
        sg.players[sl.pseudo]["ws"] = sl.ws;
        console.log("<", sl.pseudo, "session restored >");
        // Si le joueur est dans une partie alors on l'informe de l'état actuel
        // Dans la plupart des cas si la déconnexion n'est pas longue ce n'est pas utile
        // A priori TCP évite les pertes de paquets et préserve l'ordre d'envoi des données
        // Donc pas de risque d'écraser une information plus récente
        // Le joueur peut manquer des définitions, des contacts ou des fins de partie
        if (isfilled(sg.players[sl.pseudo]["game"])) {
            const game = sg.players[sl.pseudo]["game"];
            const round = sg.games[game]["round"];
            const visibility = sg.games[game]["visibility"];
            const ntry = sg.games[game]["ntry"];
            const letters = sg.games[game]["letters"];
            const secret = sg.games[game]["secret"];
            const hint = secret.slice(0, letters);
            const leader = sg.games[game]["leader"];
            res.push({"type": "joinGame", "game": game, "round": round, "visibility": visibility, 
            "ntry": ntry, "secret": hint, "leader": leader, "players": Object.keys(sg.games[game]["players"]),
            // On ne peut pas mettre à jour les définitions ou les contacts car on ne les stocke pas
            // On peut seulement demander au client de supprimer les définitions qui ne sont plus en jeu
            // Le client devra supprimer toutes les définitions sauf celles dans "def" ou marquées .solved
            // Si le client voit que round a augmenté alors il efface toutes les définitions
            "def": Object.keys(sg.games[game]["def"])});
            
            // Pas besoin de diffuser le pseudo du joueur car il était déjà dans la partie
            
            // Mise à jour des lettres trouvées pour le meneur
            if (secret !== "" && getRole(sg, sl) === "leader") {
                res.push({"type": "secret", "word": secret, "letters": letters});
            }
        }
    }
    return {"send": res};
}

// Rejoindre ou créer une partie
export function joinGame(rq, sg, sl) {
    const game = rq["game"];
    const isvalid = (
        // Le joueur ne peut participer qu'à une partie à la fois
        // Il doit quitter sa partie actuelle avant d'en rejoindre une autre
        sg.players[sl.pseudo]["game"] === ""
        && checks.inputIsValid(rq["game"])
    );

    if (isvalid) {
        // Création d'une nouvelle partie
        if (!sg.games.hasOwnProperty(game)) {
            console.log("< game", game, "created by", sl.pseudo, ">");
            sg.games[game] = {
                "round": 0, "visibility": rq["visibility"], "secret": "", "letters": 1, "words": new Set(), 
                "ntry": 5, "ndef": 0, "def": {}, "leader": sl.pseudo, "players": {[sl.pseudo]: new Set()}
            };
        }
        // La partie existe déjà 
        else {
            console.log("<", sl.pseudo, "joined", game, ">");
            sg.games[game]["players"][sl.pseudo] = new Set();
        }
        sg.players[sl.pseudo]["game"] = game;

        const round = sg.games[game]["round"];
        const visibility = sg.games[game]["visibility"];
        const ntry = sg.games[game]["ntry"];
        const secret = sg.games[game]["secret"].slice(0, sg.games[game]["letters"]);
        const leader = sg.games[game]["leader"];
        // Informations de la partie transmises au joueur
        return {"send": {"type": "joinGame", "game": game, "round": round, "visibility": visibility, 
        "ntry": ntry, "secret": secret, "leader": leader, 
        "players": Object.keys(sg.games[game]["players"]), "accepted": isvalid},
        // Diffusion du nouvel arrivant aux autres joueurs de la partie
        "broadcast": {"type": "addPlayer", "pseudo": sl.pseudo}, "game": game};
    }

    // Accès à la partie refusé
    return {"send": {"type": "joinGame", "game": game, "accepted": isvalid}};
}

// Quitter la partie en cours
export function quitGame(rq, sg, sl) {
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    const res = {"send": {"type": "quitGame", "accepted": true}};
    console.log("<", sl.pseudo, "left", game, ">");

    // Le joueur quitte la liste des participants
    delete sg.games[game]["players"][sl.pseudo];

    // Tous les joueurs ont quitté la partie
    if (Object.keys(sg.games[game]["players"]).length === 0) {
        console.log("< game", game, "deleted >");
        delete sg.games[game];
    } else {
        res["game"] = game;
        // On avertit les autres joueurs du départ
        res["broadcast"] = [{"type": "removePlayer", "pseudo": sl.pseudo}];
        // Si le meneur quitte la partie il n'est plus meneur de la partie
        // Il pourra se reconnecter en tant que simple détective sur cette partie
        // Mais c'est un peu de la triche s'il donne la réponse
        if (role === "leader") {
            sg.games[game]["leader"] = "";
        }
        // Si le joueur est meneur et que le mot secret n'a pas encore été choisi
        // Alors on désigne un nouveau meneur
        if (role === "leader" && sg.games[game]["secret"] === "") {
            const round = sg.games[game]["round"];
            const visibility = sg.games[game]["visibility"];
            const nextLeader = Object.keys(sg.games[game]["players"])[0];
            sg.games[game]["leader"] = nextLeader;
            res["broadcast"].push({"type": "joinGame", "game": game, 
            "round": round, "visibility": visibility, 
            "ntry": 5, "secret": "", "leader": nextLeader, 
            "players": Object.keys(sg.games[game]["players"])});
        }
    }
    
    // Réinitialisation des paramètres du joueur
    sg.players[sl.pseudo]["game"] = "";

    // Parties publiques disponibles
    res["send"]["publicGames"] = selectPublicGames(sg);

    return res;
}

// Mot au hasard dans le dictionnaire
export function randomWord(rq, sg, sl) {
    return {"send": {"type": "randomWord", "word": checks.getRandomWord()}};
}

// Proposer un mot secret
export function secret(rq, sg, sl) {
    const secret = formatInput(rq["word"]);
    const game = sg.players[sl.pseudo]["game"];
    const letters = sg.games[game]["letters"];
    // Le mot est-il dans le dictionnaire ?
    const isvalid = checks.wordExists(secret);
    // Informe le meneur si le mot est validé ou non
    const res = {"send": {"type": "secret", "word": secret, "letters": letters, "accepted": isvalid}};
    if (isvalid) {
        console.log("<", sl.pseudo, "choosed", secret, "for", game, ">");
        sg.games[game]["secret"] = secret;
        // Diffusion à tous les joueurs de la partie
        // On ne diffuse pas seulement la première lettre 
        // afin de généraliser pour les manches successives
        res["game"] = game;
        const round = ++sg.games[game]["round"];
        const visibility = sg.games[game]["visibility"];
        const ntry = sg.games[game]["ntry"];
        const hint = sg.games[game]["secret"].slice(0, letters);
        const leader = sg.games[game]["leader"];
        res["broadcast"] = {"type": "joinGame", "game": game, "round": round, "visibility": visibility, 
        "ntry": ntry, "secret": hint, "leader": leader, "players": Object.keys(sg.games[game]["players"])};
        // Pas besoin de diffuser le pseudo du meneur car il est déjà dans la partie
    }
    return res;
}

// Proposer une défintion
export function definition(rq, sg, sl) {
    const res = {};
    const def = htmlspecialchars(rq["def"]);
    const word = formatInput(rq["word"]);
    const game = sg.players[sl.pseudo]["game"];
    const ndef = sg.games[game]["ndef"];
    const isvalid = (
        // Le mot mystère doit commencer par les lettres du mot indice
        word.startsWith(sg.games[game]["secret"].slice(0, sg.games[game]["letters"]))
        // Le mot mystère ne doit pas avoir déjà été consommé
        && !sg.games[game]["words"].has(word)
        // La définition ne contient pas le mot proposé
        && checks.definitionIsValid(word, def)
        // Le mot mystère est-il dans le dictionnaire ?
        && checks.wordExists(word)
    );
    if (isvalid) {
        console.log("< definition", ndef, "for", word, ">");
        sg.games[game]["players"][sl.pseudo].add(ndef);
        sg.games[game]["def"][ndef] = word;
        sg.games[game]["ndef"]++;
        // Diffusion à tous les joueurs de la partie
        // Les messages de diffusion n'ont pas de champ "accepted"
        res["game"] = game;
        res["broadcast"] = {"type": "definition", "def": def, "pseudo": sl.pseudo, "ndef": ndef};
    }
    // Définition acceptée ou refusée
    res["send"] = {"type": "definition", "word": word, "ndef": ndef, "accepted": isvalid};
    return res;
}

// Résoudre un contact
export function contact(rq, sg, sl) {
    const res = [];
    const game = sg.players[sl.pseudo]["game"];
    const role = getRole(sg, sl);
    const ndef = rq["ndef"];
    rq["word"] = htmlspecialchars(formatInput(rq["word"]));
    
    // Les mots correspondent-ils ?
    let isvalid = sg.games[game]["def"][ndef] === rq["word"];
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
        // Le meneur ne peut effectuer que maximum 1 contre par défintion
        sg.games[game]["players"][sl.pseudo].add(ndef);
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
            console.log("< hint found", secret, ">");
            res.push({"type": "hint", "word": secret});
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
        res.push({"type": "endGame", "winner": winner, "word": sg.games[game]["secret"], "leader": nextLeader});
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

    return {"broadcast": res, "game": game};
}

// Déconnexion du joueur
export function onclose(sg, sl) {
    console.log("<", sl.pseudo, "unregistered >");
    
    let res = {};
    if (requests["quitGame"]["precheck"]({}, sg, sl)) {
        // Le joueur doit éventuellement quitter la partie
        res = quitGame({}, sg, sl);
        // On ne renvoie pas de message au joueur
        delete res["send"];
    }
    
    // Suppression du joueur
    delete sg.players[sl.pseudo];
    sl.pseudo = "";

    return res;
}

// Association type de requête <-> fonction
// Si precheck est fausse alors callback n'est pas appelée
// Note: Tester le rôle vérifie en même temps si le joueur est dans une partie
// Invariant: Si isfilled(sl.pseudo) alors sg.players.hasOwnProperty(sl.pseudo)
// Invariant: Si isfilled(sg.players[sl.pseudo]["game"]) alors sg.games.hasOwnProperty(sg.players[sl.pseudo]["game"])
// && sg.games[sg.players[sl.pseudo]["game"]]["players"].hasOwnProperty(sl.pseudo)
export const requests = {
    "status": {
        "precheck": (rq, sg, sl) => true,
        "callback": status
    },
    "register": {
        "precheck": (rq, sg, sl) => isfilled(rq["pseudo"]),
        "callback": register
    },
    "unregister": {
        "precheck": (rq, sg, sl) => isfilled(sl.pseudo),
        "callback": unregister
    },
    "restore": {
        "precheck": (rq, sg, sl) => sl.pseudo === "" && isfilled(rq["pseudo"]) && isfilled(rq["sid"]),
        "callback": restore
    },
    "joinGame": {
        "precheck": (rq, sg, sl) => isfilled(rq["game"]) && ["public", "private"].includes(rq["visibility"]) && isfilled(sl.pseudo),
        "callback": joinGame
    },
    "quitGame": {
        "precheck": (rq, sg, sl) => isfilled(sl.pseudo) && isfilled(sg.players[sl.pseudo]["game"]),
        "callback": quitGame
    },
    "randomWord": {
        "precheck": (rq, sg, sl) => isfilled(sl.pseudo) && getRole(sg, sl) === "leader",
        "callback": randomWord
    },
    "secret": {
        "precheck": (rq, sg, sl) => {
            return (
                isfilled(rq["word"]) && isfilled(sl.pseudo) 
                && getRole(sg, sl) === "leader"
                && sg.games[sg.players[sl.pseudo]["game"]]["secret"] === ""
            );
        },
        "callback": secret
    },
    "definition": {
        "precheck": (rq, sg, sl) => {
            return (
                isfilled(rq["def"]) && isfilled(rq["word"]) && isfilled(sl.pseudo) 
                && getRole(sg, sl) === "detective"
                // La partie doit avoir commencé et ne pas être terminée
                && isfilled(sg.games[sg.players[sl.pseudo]["game"]]["secret"])
            );
        },
        "callback": definition
    },
    "contact": {
        "precheck": (rq, sg, sl) => { 
            let res = isfilled(rq["word"]) && typeof rq["ndef"] === "number" && isfilled(sl.pseudo);
            if (res) {
                const game = sg.players[sl.pseudo]["game"];
                const ndef = rq["ndef"];
                res &&= (
                    isfilled(game) && isfilled(sg.games[game]["secret"])
                    // Le numéro de définition existe-t-il ? 
                    && sg.games[game]["def"].hasOwnProperty(ndef)
                    // Le joueur n'a pas pas proposé cette définition ?
                    && !sg.games[game]["players"][sl.pseudo].has(ndef)
                    // Le meneur ne peut pas proposer le mot secret pour contrer
                    && (getRole(sg, sl) !== "leader" || formatInput(rq["word"]) !== sg.games[game]["secret"])
                );
            }
            return res;
        },
        "callback": contact
    }, 
}
