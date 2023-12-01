import { strict as assert } from 'node:assert';
import { requests, onclose } from "../back/requests.js";

// Désactivation de la sortie standard
console.log = function() {};

// Demande de statut du serveur
{
    // Instanciation des structures de données
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    const rq = {"type": "status"};
    const request = requests[rq["type"]];
    // Aucune contrainte
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    // Aucun joueur et aucune partie
    assert.deepStrictEqual(rp, {"send": {"type": "status", "onlinePlayers": 0, "currentGames": 0}});
    // Aucune modification de l'état interne
    assert.deepStrictEqual(sg, {players: {}, games: {}});
    assert.deepStrictEqual(sl, {pseudo: "", ws: null});

    // Le serveur héberge plusieurs parties en cours
    sg.players["Maxime"] = {"ws": null, "sid": "qAP0qXfEPcGGvNTl8QSVqIcE6hCKGUlm", "closeTimer": null, "game": "Pizza"};
    sg.players["Amélie"] = {"ws": null, "sid": "qAP0qXfEPcGGvNTl8QSVqIcE6hCKGUlm", "closeTimer": null, "game": "Pizza"};
    sg.players["Quentin"] = {"ws": null, "sid": "qAP0qXfEPcGGvNTl8QSVqIcE6hCKGUlm", "closeTimer": null, "game": "Pizza"};
    sg.games["Pizza"] =
    {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {
            "Maxime": new Set(), "Amélie": new Set(), "Quentin": new Set()}
    };
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send":{"type": "status", "onlinePlayers": 3, "currentGames": 1}});
}

// Enregistrement d'un nouveau joueur
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "register"};
    const request = requests[rq["type"]];
    // Manque le champ "pseudo"
    assert(!request["precheck"](rq, sg, sl));
    rq = {"type": "register", "pseudo": "Maxime"};
    // Je ne suis pas déjà enregistré
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    const sid = rp["send"]["sid"];
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Maxime", "sid": sid, "accepted": true, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: null});
    // Je me connecte avec "Maxime"
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Maxime", "sid": "", "accepted": false, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: null});
    // Je me connecte avec "Quentin"
    rq = {"type": "register", "pseudo": "Quentin"};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Quentin", "sid": "", "accepted": false, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: null});
    // Je me déconnecte mais "Maxime" est toujours dans la liste des joueurs
    sl.pseudo = "";
    // Je me connecte avec "Maxime"
    rq = {"type": "register", "pseudo": "Maxime"};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Maxime", "sid": "", "accepted": false, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "", ws: null});
    // Je me connecte avec "Quentin"
    rq = {"type": "register", "pseudo": "Quentin"};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    const sid2 = rp["send"]["sid"];
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Quentin", "sid": sid2, "accepted": true, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}, "Quentin": {"ws": null, "sid": sid2, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "Quentin", ws: null});
    // Création d'une partie publique et d'une partie privée
    sg.games["Pizza"] =
    {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set()}
    };
    sg.games["Quiche"] =
    {
        "visibility": "private", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Quentin", "players": {"Quentin": new Set()}
    };
    // Je me déconnecte
    sl.pseudo = "";
    // Je me connecte avec "Amélie"
    rq = {"type": "register", "pseudo": "Amélie"};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    const sid3 = rp["send"]["sid"];
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Amélie", "sid": sid3, "accepted": true, "publicGames": [{"game": "Pizza", "players": 1}]}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": null, "sid": sid, "closeTimer": null, "game": ""}, "Quentin": {"ws": null, "sid": sid2, "closeTimer": null, "game": ""}, "Amélie": {"ws": null, "sid": sid3, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {"Pizza":{"visibility": "public", "secret": "", "letters": 1, "words": new Set(), "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set()}}, "Quiche": {"visibility": "private", "secret": "", "letters": 1, "words": new Set(), "ntry": 5, "ndef": 0, "def": {}, "leader": "Quentin", "players": {"Quentin": new Set()}}});
    assert.deepStrictEqual(sl, {pseudo: "Amélie", ws: null});
}

// Déconnexion d'un joueur
{
    const sg = {players: {}, games: {}};
    // Le WebSocket est simulé
    const ws = {"closeTimeout": 3*60*1000};
    const sl = {pseudo: "", ws: ws};
    ws.close = () => { onclose(sg, sl); };
    const rq = {"type": "unregister"};
    const request = requests[rq["type"]];
    // Je me déconnecte alors que je ne suis pas connecté
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    let rp = register["callback"](rq2, sg, sl);
    const sid = rp["send"]["sid"];
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Maxime", "sid": sid, "accepted": true, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": ws, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sg.games, {});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: ws});
    // Je crée une partie
    sg.games["Pizza"] =
    {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set()}
    };
    sg.players["Maxime"]["game"] = "Pizza";
    // "Quentin" se connecte
    const rq3 = {"type": "register", "pseudo": "Quentin"};
    const ws2 = {"closeTimeout": 3*60*1000};
    const sl2 = {pseudo: "", ws: ws2};
    ws2.close = () => { onclose(sg, sl2); };
    assert(register["precheck"](rq3, sg, sl2));
    register["callback"](rq3, sg, sl2);
    assert(sg.players.hasOwnProperty("Quentin"));
    // Je ne peux pas déconnecter "Maxime" en étant "Quentin"
    sl2.pseudo = "Quentin";
    // Le champ rq.pseudo n'est pas pris en compte c'est sl.pseudo qui est utilisé
    assert(request["precheck"]({"type": "unregister", "pseudo": "Maxime"}, sg, sl2));
    request["callback"]({"type": "unregister", "pseudo": "Maxime"}, sg, sl2);
    assert(sg.players.hasOwnProperty("Maxime") && !sg.players.hasOwnProperty("Quentin"));
    // Je me déconnecte
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {});
    assert.deepStrictEqual(sg.players, {});
    assert.deepStrictEqual(sg.games, {});
    // Le champ "closeTimeout" permet une suppression immédiate
    ws["closeTimeout"] = 0;
    // L'objet sl est ensuite détruit dans la pratique du fait de sa portée locale
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: ws});
}

// Restauration de session
{
    const sg = {players: {}, games: {}};
    // Le WebSocket est simulé
    let sl = {pseudo: "", ws: 1};
    let rq = {"type": "restore"};
    const request = requests[rq["type"]];
    // Il manque des champs de requête
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    let rp = register["callback"](rq2, sg, sl);
    const sid = rp["send"]["sid"];
    assert.deepStrictEqual(rp, {"send": {"type": "register", "pseudo": "Maxime", "sid": sid, "accepted": true, "publicGames": []}});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": 1, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: 1});
    // Je restaure ma session alors que je ne suis pas déconnecté
    rq = {"type": "restore", "pseudo": "Maxime", "sid": sid};
    assert(!request["precheck"](rq, sg, sl));
    // Je simule une fermeture de connexion
    sl.pseudo = ""; sl.ws = 2;
    // J'utilise un sid erronné
    rq.sid = sid.slice(0, sid.length-1);
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": [{"type": "restore", "pseudo": "Maxime", "accepted": false}]});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": 1, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sl, {pseudo: "", ws: 2});
    // J'utilise le bon sid
    rq.sid = sid;
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": [{"type": "restore", "pseudo": "Maxime", "accepted": true}]});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": 2, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: 2});
    // Je simule une fermeture de connexion
    sl.pseudo = ""; sl.ws = 3;
    // Je restaure ma session avec un joueur n'existant pas
    rq = {"type": "restore", "pseudo": "Quentin", "sid": sid};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": [{"type": "restore", "pseudo": "Quentin", "accepted": false}]});
    assert.deepStrictEqual(sg.players, {"Maxime": {"ws": 2, "sid": sid, "closeTimer": null, "game": ""}});
    assert.deepStrictEqual(sl, {pseudo: "", ws: 3});
    // Les joueurs "Amélie" et "Quentin" se connectent
    const rq3 = {"type": "register", "pseudo": "Amélie"};
    assert(register["precheck"](rq3, sg, {pseudo: "", ws: null}));
    register["callback"](rq3, sg, {pseudo: "", ws: null});
    const rq4 = {"type": "register", "pseudo": "Quentin"};
    assert(register["precheck"](rq4, sg, {pseudo: "", ws: null}));
    register["callback"](rq4, sg, {pseudo: "", ws: null});
    assert(sg.players.hasOwnProperty("Maxime") && sg.players.hasOwnProperty("Amélie") && sg.players.hasOwnProperty("Quentin"));
    // Je crée une partie en tant que meneur avec déjà quelques tours de jeu
    sg.games["Pizza"] =
    {
        "visibility": "public", "secret": "BONJOUR", "letters": 2, "words": new Set(["BALLON", "BONTE"]), 
        "ntry": 5, "ndef": 2, "def": {}, "leader": "Maxime", "players": {
            "Maxime": new Set(), "Amélie": new Set([0, 1]), "Quentin": new Set()}
    };
    sg.players["Maxime"]["game"] = "Pizza";
    sg.players["Amélie"]["game"] = "Pizza";
    sg.players["Quentin"]["game"] = "Pizza";
    // Je simule une fermeture de connexion pour "Maxime"
    sl.pseudo = ""; sl.ws = 4;
    // Je restaure ma session
    rq = {"type": "restore", "pseudo": "Maxime", "sid": sid};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": [
        {"type": "restore", "pseudo": "Maxime", "accepted": true},
        {"type": 'joinGame', "game": 'Pizza', "visibility": 'public', "ntry": 5, "secret": 'BO', "leader": 'Maxime',
        "players": [ 'Maxime', 'Amélie', 'Quentin' ], "def": []},
        {"type": 'secret', "word": 'BONJOUR', "letters": 2}]}
    );
    assert.deepStrictEqual(sg.players["Maxime"], {"ws": 4, "sid": sid, "closeTimer": null, "game": "Pizza"})
    assert.deepStrictEqual(sl, {pseudo: "Maxime", ws: 4});
    // Je suis un détective de la partie
    sl = {pseudo: "Amélie", ws: null};
    // Je simule une fermeture de connexion
    sl.pseudo = ""; sl.ws = 1;
    // Je restaure ma session
    rq = {"type": "restore", "pseudo": "Amélie", "sid": sg.players["Amélie"]["sid"]};
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": [
        {"type": "restore", "pseudo": "Amélie", "accepted": true},
        {"type": 'joinGame', "game": 'Pizza', "visibility": 'public', "ntry": 5, "secret": 'BO', "leader": 'Maxime',
        "players": [ 'Maxime', 'Amélie', 'Quentin' ], "def": []}]}
    );
    assert.deepStrictEqual(sg.players["Amélie"], {"ws": 1, "sid": sg.players["Amélie"]["sid"], "closeTimer": null, "game": "Pizza"})
    assert.deepStrictEqual(sl, {pseudo: "Amélie", ws: 1});
}

// Rejoindre une partie
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "joinGame"};
    const request = requests[rq["type"]];
    // Il manque le champ "game" et "visibility"
    assert(!request["precheck"](rq, sg, sl));
    rq["game"] = "Pizza"; rq["visibility"] = "public";
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    register["callback"](rq2, sg, sl);
    assert(sl.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // Je crée la partie "Pizza"
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": "joinGame", "game": "Pizza", "visibility": "public", 
    "ntry": 5, "secret": "", "leader": "Maxime", "players": ["Maxime"], accepted: true}, 
    "broadcast": {"type": 'addPlayer', "pseudo": 'Maxime' }, "game": 'Pizza'});
    assert.deepStrictEqual(sg.games, {"Pizza": {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set()}}
    });
    assert(sg.players["Maxime"]["game"] === "Pizza");
    // Je ne peux pas rejoindre la partie si j'y suis déjà
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert(!rp["accepted"]);
    // Le joueur "Amélie" rejoint la partie "Pizza"
    const rq3 = {"type": "register", "pseudo": "Amélie"};
    const sl2 = {pseudo: "", ws: null};
    assert(register["precheck"](rq3, sg, sl2));
    register["callback"](rq3, sg, sl2);
    assert(sg.players.hasOwnProperty("Amélie"));
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl2);
    assert.deepStrictEqual(rp, {"send": {"type": "joinGame", "game": "Pizza", "visibility": "public", 
    "ntry": 5, "secret": "", "leader": "Maxime", "players": ["Maxime", "Amélie"], accepted: true}, 
    "broadcast": {"type": 'addPlayer', "pseudo": 'Amélie'}, "game": 'Pizza'});
    assert.deepStrictEqual(sg.games, {"Pizza": {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set(), "Amélie": new Set()}}
    });
    assert(sg.players["Amélie"]["game"] === "Pizza");
}

// Quitter une partie
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "quitGame"};
    const request = requests[rq["type"]];
    // Je ne suis pas connecté
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    register["callback"](rq2, sg, sl);
    assert(sl.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // Je n'ai pas rejoint de partie
    assert(!request["precheck"](rq, sg, sl));
    // Je crée la partie "Pizza"
    const rq3 = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    const joinGame = requests["joinGame"];
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl);
    assert.deepStrictEqual(sg.games, {"Pizza": {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set()}}
    });
    // Le joueur "Amélie" rejoint la partie "Pizza"
    const rq4 = {"type": "register", "pseudo": "Amélie"};
    const sl2 = {pseudo: "", ws: null};
    assert(register["precheck"](rq4, sg, sl2));
    register["callback"](rq4, sg, sl2);
    assert(sg.players.hasOwnProperty("Amélie"));
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl2);
    assert.deepStrictEqual(sg.games, {"Pizza": {
        "visibility": "public", "secret": "", "letters": 1, "words": new Set(), 
        "ntry": 5, "ndef": 0, "def": {}, "leader": "Maxime", "players": {"Maxime": new Set(), "Amélie": new Set()}}
    });
    // Le meneur "Maxime" quitte la partie
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": 'quitGame', "accepted": true, "publicGames": [{"game": 'Pizza', "players": 1}]},
        "game": 'Pizza',
        "broadcast": [{"type": 'removePlayer', "pseudo": 'Maxime' },
        {"type": 'joinGame', "game": 'Pizza', "visibility": 'public', "ntry": 5, "secret": '', "leader": 'Amélie', "players": ['Amélie']}]
    });
    assert(sg.players["Maxime"]["game"] === "");
    assert(sg.games["Pizza"]["leader"] === "Amélie");
    assert(!sg.games["Pizza"]["players"].hasOwnProperty("Maxime") && sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    // "Amélie" choisit un mot
    sg.games["Pizza"]["secret"] = "BONJOUR";
    // "Maxime" rejoint la partie "Pizza"
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl);
    assert(sg.games["Pizza"]["leader"] === "Amélie");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Maxime") && sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    // Le meneur "Amélie" quitte la partie
    assert(request["precheck"](rq, sg, sl2));
    rp = request["callback"](rq, sg, sl2);
    assert.deepStrictEqual(rp, {"send": {"type": 'quitGame', "accepted": true, "publicGames": [{"game": 'Pizza', "players": 1}]},
        "game": 'Pizza',
        "broadcast": [{"type": 'removePlayer', "pseudo": 'Amélie'}]
    });
    assert(sg.players["Amélie"]["game"] === "");
    // Tous les joueurs quittent la partie
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": 'quitGame', "accepted": true, "publicGames": []}});
    assert.deepStrictEqual(sg.games, {});
}

// Mot aléatoire du dictionnaire
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "randomWord"};
    const request = requests[rq["type"]];
    // Je ne suis pas connecté
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    register["callback"](rq2, sg, sl);
    assert(sl.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // Je n'ai pas rejoint de partie donc je ne suis pas meneur
    assert(!request["precheck"](rq, sg, sl));
    // Je rejoins la partie "Pizza" en tant que meneur
    const rq3 = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    const joinGame = requests["joinGame"];
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    // Demande de mot aléatoire
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    assert(rp["send"]["word"].length >= 2);
    assert(rp["send"]["word"] === rp["send"]["word"].toUpperCase());
    // Un détective ne peut pas demander de mot aléatoire
    const rq4 = {"type": "register", "pseudo": "Amélie"};
    const sl2 = {pseudo: "", ws: null};
    assert(register["precheck"](rq4, sg, sl2));
    register["callback"](rq4, sg, sl2);
    assert(joinGame["precheck"](rq3, sg, sl2));
    joinGame["callback"](rq3, sg, sl2);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    assert(!request["precheck"](rq, sg, sl2));
}

// Choix du mot secret par le meneur
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "secret"};
    const request = requests[rq["type"]];
    // Il manque le champ "word"
    assert(!request["precheck"](rq, sg, sl));
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    register["callback"](rq2, sg, sl);
    assert(sl.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // Je n'ai pas rejoint de partie
    assert(!request["precheck"](rq, sg, sl));
    // Je rejoins la partie "Pizza" en tant que meneur
    const rq3 = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    const joinGame = requests["joinGame"];
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    assert(!request["precheck"](rq, sg, sl));
    // J'ajoute le champ "word"
    rq["word"] = "BONJOUR";
    assert(request["precheck"](rq, sg, sl));
    let rp = request["callback"](rq, sg, sl);
    assert.deepStrictEqual(rp, {"send": {"type": 'secret', "word": 'BONJOUR', "letters": 1, "accepted": true},
        "game": 'Pizza', "broadcast": {"type": 'joinGame', "game": 'Pizza', "visibility": 'public', "ntry": 5, "secret": 'B', "leader": 'Maxime', "players": [ 'Maxime' ]}
    });
    assert(sg.games["Pizza"]["secret"] === "BONJOUR");
    // Je ne peux plus modifier le mot secret
    rq["word"] = "SALUT";
    assert(!request["precheck"](rq, sg, sl));
    // Formatage de l'entrée utilisateur
    sg.games["Pizza"]["secret"] = "";
    rq["word"] = "Bonjour";
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert(rp["send"]["accepted"]);
    assert(rp["send"]["word"] === "BONJOUR");
    assert(sg.games["Pizza"]["secret"] === "BONJOUR");
    sg.games["Pizza"]["secret"] = "";
    rq["word"] = "  BonJour   ";
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert(rp["send"]["accepted"]);
    assert(rp["send"]["word"] === "BONJOUR");
    assert(sg.games["Pizza"]["secret"] === "BONJOUR");
    // Mot absent du dictionnaire
    sg.games["Pizza"]["secret"] = "";
    rq["word"] = "Bonjou";
    assert(request["precheck"](rq, sg, sl));
    rp = request["callback"](rq, sg, sl);
    assert(!rp["send"]["accepted"]);
    assert(!rp.hasOwnProperty("broadcast"));
    // Un détective ne peut pas proposer de mot secret
    sg.games["Pizza"]["secret"] = "";
    const rq4 = {"type": "register", "pseudo": "Amélie"};
    const sl2 = {pseudo: "", ws: null};
    assert(register["precheck"](rq4, sg, sl2));
    register["callback"](rq4, sg, sl2);
    assert(joinGame["precheck"](rq3, sg, sl2));
    joinGame["callback"](rq3, sg, sl2);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    assert(!request["precheck"](rq, sg, sl2));
}

// Proposition de définition par un détective
{
    const sg = {players: {}, games: {}};
    const sl = {pseudo: "", ws: null};
    let rq = {"type": "definition"};
    const request = requests[rq["type"]];
    // Il manque les champs "def" et "word"
    assert(!request["precheck"](rq, sg, sl));
    rq["def"] = "Aliment composé de cacao et de sucre.";
    rq["word"] = "Chocolat";
    // Je me connecte avec "Maxime"
    const rq2 = {"type": "register", "pseudo": "Maxime"};
    const register = requests["register"];
    assert(register["precheck"](rq2, sg, sl));
    register["callback"](rq2, sg, sl);
    assert(sl.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // Je n'ai pas rejoint de partie
    assert(!request["precheck"](rq, sg, sl));
    // Je rejoins la partie "Pizza" en tant que meneur
    const rq3 = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    const joinGame = requests["joinGame"];
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    assert(!request["precheck"](rq, sg, sl));
    // "Amélie" essaye de proposer une définition
    const rq4 = {"type": "register", "pseudo": "Amélie"};
    const sl2 = {pseudo: "", ws: null};
    assert(register["precheck"](rq4, sg, sl2));
    register["callback"](rq4, sg, sl2);
    assert(sg.players.hasOwnProperty("Amélie"));
    // "Amélie" rejoint la partie "Pizza"
    assert(joinGame["precheck"](rq3, sg, sl));
    joinGame["callback"](rq3, sg, sl2);
    assert(sl2.pseudo === "Amélie" && sg.players.hasOwnProperty("Amélie"));
    assert(!request["precheck"](rq, sg, sl2));
    assert(joinGame["precheck"](rq3, sg, sl2));
    joinGame["callback"](rq3, sg, sl2);
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    assert(!request["precheck"](rq, sg, sl2));
    // "Maxime" choisit un mot secret
    const rq5 = {"type": "secret", "word": "BONJOUR"};
    const secret = requests["secret"];
    assert(secret["precheck"](rq5, sg, sl));
    secret["callback"](rq5, sg, sl);
    assert(sg.games["Pizza"]["secret"] === "BONJOUR");
    // "Amélie" peut proposer une définition car elle est détective mais pas "Maxime"
    assert(!request["precheck"](rq, sg, sl));
    assert(request["precheck"](rq, sg, sl2));
    let rp = request["callback"](rq, sg, sl2);
    // Le mot proposé ne correspond pas à la première lettre
    assert.deepStrictEqual(rp, {"send": {"type": 'definition', "word": 'CHOCOLAT', "ndef": 0, "accepted": false}});
    rq["def"] = "Moyen de transport pour voyager sur l'eau.";
    rq["word"] = "BATEA";
    assert(!request["precheck"](rq, sg, sl));
    assert(request["precheck"](rq, sg, sl2));
    rp = request["callback"](rq, sg, sl2);
    // Le mot "BATEA" n'existe pas dans le dictionnaire
    assert.deepStrictEqual(rp, {"send": {"type": 'definition', "word": 'BATEA', "ndef": 0, "accepted": false}});
    rq["word"] = "  BaTeAu "; // Formatage automatique
    rp = request["callback"](rq, sg, sl2);
    assert.deepStrictEqual(rp, {"game": 'Pizza', "broadcast": {"type": 'definition', "def": 'Moyen de transport pour voyager sur l&#039;eau.', "pseudo": 'Amélie', "ndef": 0},
        "send": {"type": 'definition', "word": 'BATEAU', "ndef": 0, "accepted": true}
    });
    assert(sg.games["Pizza"]["players"]["Amélie"].has(0));
    assert(sg.games["Pizza"]["def"][0] === "BATEAU");
    // Je ne peux pas envoyer de définition si la partie est finie
    // Lorsque la partie est finie elle est immédiatement réinitialisée
    sg.games["Pizza"]["secret"] = "";
    sg.games["Pizza"]["letters"] = 1;
    rq["def"] = "J'essaye de spammer le serveur.";
    rq["word"] = "BONJOUR";
    assert(!request["precheck"](rq, sg, sl2));
}

// Résolution d'un contact entre deux joueurs
// Scénario d'une partie complète à 3 joueurs
{
    const sg = {players: {}, games: {}};
    const sl1 = {pseudo: "", ws: null};
    const sl2 = {pseudo: "", ws: null};
    const sl3 = {pseudo: "", ws: null};
    const register = requests["register"];
    const joinGame = requests["joinGame"];
    const secret = requests["secret"];
    const definition = requests["definition"];
    const contact = requests["contact"];
    // "Maxime" se connecte
    let rq = {"type": "register", "pseudo": "Maxime"};
    assert(register["precheck"](rq, sg, sl1));
    assert(register["callback"](rq, sg, sl1)["send"]["accepted"]);
    assert(sl1.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // "Amélie" se connecte
    rq["pseudo"] = "Amélie";
    assert(register["precheck"](rq, sg, sl2));
    assert(register["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sl2.pseudo === "Amélie" && sg.players.hasOwnProperty("Amélie"));
    // "Quentin" se connecte
    rq["pseudo"] = "Quentin";
    assert(register["precheck"](rq, sg, sl3));
    assert(register["callback"](rq, sg, sl3)["send"]["accepted"]);
    assert(sl3.pseudo === "Quentin" && sg.players.hasOwnProperty("Quentin"));
    // "Maxime" crée la partie "Pizza"
    rq = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    assert(joinGame["precheck"](rq, sg, sl1));
    assert(joinGame["callback"](rq, sg, sl1)["send"]["accepted"]);
    assert(sg.players["Maxime"]["game"] === "Pizza");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Maxime"));
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    // "Amélie" et "Quentin" rejoignent la partie "Pizza"
    assert(joinGame["precheck"](rq, sg, sl2));
    assert(joinGame["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.players["Amélie"]["game"] === "Pizza");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    assert(joinGame["precheck"](rq, sg, sl3));
    assert(joinGame["callback"](rq, sg, sl3)["send"]["accepted"]);
    assert(sg.players["Quentin"]["game"] === "Pizza");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Quentin"));
    // Il n'y a pas encore de mot secret ni de définition
    rq = {"type": "contact", "word": "BATEAU", "ndef": 0};
    assert(!contact["precheck"](rq, sg, sl1));
    assert(!contact["precheck"](rq, sg, sl2));
    assert(!contact["precheck"](rq, sg, sl3));
    // "Amélie" ne peut pas proposer de définition car il n'y a pas de mot secret
    rq = {"type": "definition", "word": "BATEAU", "def": "Moyen de transport pour voyager sur l'eau."};
    assert(!definition["precheck"](rq, sg, sl2));
    // "Maxime" choisit le mot secret
    rq = {"type": "secret", "word": "BONJOUR"};
    assert(secret["precheck"](rq, sg, sl1));
    assert(secret["callback"](rq, sg, sl1)["send"]["accepted"]);
    assert(sg.games["Pizza"]["secret"] === "BONJOUR");
    // "Amélie" propose une définition
    rq = {"type": "definition", "word": "BATEAU", "def": "Moyen de transport pour voyager sur l'eau."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.games["Pizza"]["def"].hasOwnProperty(0));
    assert(sg.games["Pizza"]["players"]["Amélie"].has(0));
    // "Maxime" contre la définition
    rq = {"type": "contact", "word": "BATEAU", "ndef": 0};
    assert(contact["precheck"](rq, sg, sl1));
    let rp = contact["callback"](rq, sg, sl1);
    assert.deepStrictEqual(rp, {"broadcast": [{"type": 'contact', "word1": 'BATEAU', "word2": 'BATEAU', "pseudo": 'Maxime', "ndef": 0, "ntry": 4, "expired": [], "accepted": true}], "game": 'Pizza'});
    assert(!sg.games["Pizza"]["def"].hasOwnProperty(0));
    assert(sg.games["Pizza"]["ntry"] === 4);
    // "Amélie" propose la même définition mais elle est refusée
    rq = {"type": "definition", "word": "BATEAU", "def": "Moyen de transport pour voyager sur l'eau."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(!definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(!sg.games["Pizza"]["def"].hasOwnProperty(1));
    assert(!sg.games["Pizza"]["players"]["Amélie"].has(1));
    // "Amélie" propose une nouvelle définition
    rq = {"type": "definition", "word": "BALLON", "def": "Pour jouer au foot."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.games["Pizza"]["def"].hasOwnProperty(1));
    assert(sg.games["Pizza"]["players"]["Amélie"].has(1));
    // "Maxime" rate le contre
    rq = {"type": "contact", "word": "BATEAU", "ndef": 1};
    assert(contact["precheck"](rq, sg, sl1));
    rp = contact["callback"](rq, sg, sl1);
    assert.deepStrictEqual(rp, {"broadcast": [{"type": 'contact', "word1": '', "word2": 'BATEAU', "pseudo": 'Maxime', "ndef": 1, "ntry": 4, "expired": [], "accepted": false}], "game": 'Pizza'});
    assert(sg.games["Pizza"]["def"].hasOwnProperty(1));
    assert(sg.games["Pizza"]["ntry"] === 4);
    // "Amélie" ne peut pas répondre à sa propre définition
    assert(!contact["precheck"](rq, sg, sl2));
    // "Quentin" rate le contact
    rq["word"] = "BALLE";
    assert(contact["precheck"](rq, sg, sl3));
    rp = contact["callback"](rq, sg, sl3);
    assert.deepStrictEqual(rp, {"broadcast": [{"type": 'contact', "word1": 'BALLON', "word2": 'BALLE', "pseudo": 'Quentin', "ndef": 1, "ntry": 3, "expired": [], "accepted": false}], "game": 'Pizza'});
    assert(!sg.games["Pizza"]["def"].hasOwnProperty(1));
    assert(sg.games["Pizza"]["ntry"] === 3);
    // "Amélie" propose deux nouvelles définitions
    rq = {"type": "definition", "word": "BOULANGER", "def": "Fabricant de pain."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.games["Pizza"]["def"].hasOwnProperty(2));
    assert(sg.games["Pizza"]["players"]["Amélie"].has(2));
    rq = {"type": "definition", "word": "BALAI", "def": "Outil pour nettoyer les poussières."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.games["Pizza"]["def"].hasOwnProperty(3));
    assert(sg.games["Pizza"]["players"]["Amélie"].has(3));
    // "Quentin" réussit le contact
    rq = {"type": "contact", "word": "BOULANGER", "ndef": 2};
    assert(contact["precheck"](rq, sg, sl3));
    rp = contact["callback"](rq, sg, sl3);
    assert.deepStrictEqual(rp, {"broadcast": [{"type": 'contact', "word1": 'BOULANGER', "word2": 'BOULANGER', "pseudo": 'Quentin', "ndef": 2, "ntry": 3, "expired": [ '3' ], "accepted": true}, {"type": 'hint', "word": 'BO'}], "game": 'Pizza'});
    assert(sg.games["Pizza"]["letters"] === 2);
    assert(!sg.games["Pizza"]["def"].hasOwnProperty(2));
    assert(!sg.games["Pizza"]["def"].hasOwnProperty(3));
    // "Amélie" propose une nouvelle définition
    rq = {"type": "definition", "word": "BONJOUR", "def": "Mot pour saluer une personne."};
    assert(definition["precheck"](rq, sg, sl2));
    assert(definition["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.games["Pizza"]["def"].hasOwnProperty(4));
    assert(sg.games["Pizza"]["players"]["Amélie"].has(4));
    // "Quentin" réussit le contact et termine la partie
    rq = {"type": "contact", "word": "BONJOUR", "ndef": 4};
    assert(contact["precheck"](rq, sg, sl3));
    rp = contact["callback"](rq, sg, sl3);
    assert.deepStrictEqual(rp, {"broadcast": [{"type": 'contact', "word1": 'BONJOUR', "word2": 'BONJOUR', "pseudo": 'Quentin', "ndef": 4, "ntry": 3, "expired": [], "accepted": true}, {"type": 'hint', "word": 'BON'}, {"type": 'endGame', "winner": 'detective', "word": 'BONJOUR', "leader": 'Quentin'}], "game": 'Pizza'});
    assert(sg.games["Pizza"]["leader"] === "Quentin");
    assert(sg.games["Pizza"]["secret"] === "");
    assert(sg.games["Pizza"]["letters"] === 1);
}

// Fermeture de connexion
{
    const sg = {players: {}, games: {}};
    const sl1 = {pseudo: "", ws: null};
    const sl2 = {pseudo: "", ws: null};
    const register = requests["register"];
    const joinGame = requests["joinGame"];
    // "Maxime" se connecte
    let rq = {"type": "register", "pseudo": "Maxime"};
    assert(register["precheck"](rq, sg, sl1));
    assert(register["callback"](rq, sg, sl1)["send"]["accepted"]);
    assert(sl1.pseudo === "Maxime" && sg.players.hasOwnProperty("Maxime"));
    // "Amélie" se connecte
    rq["pseudo"] = "Amélie";
    assert(register["precheck"](rq, sg, sl2));
    assert(register["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sl2.pseudo === "Amélie" && sg.players.hasOwnProperty("Amélie"));
    // "Maxime" crée la partie "Pizza"
    rq = {"type": "joinGame", "game": "Pizza", "visibility": "public"};
    assert(joinGame["precheck"](rq, sg, sl1));
    assert(joinGame["callback"](rq, sg, sl1)["send"]["accepted"]);
    assert(sg.players["Maxime"]["game"] === "Pizza");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Maxime"));
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    // "Amélie" rejoint la partie "Pizza"
    assert(joinGame["precheck"](rq, sg, sl2));
    assert(joinGame["callback"](rq, sg, sl2)["send"]["accepted"]);
    assert(sg.players["Amélie"]["game"] === "Pizza");
    assert(sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    assert(sg.games["Pizza"]["leader"] === "Maxime");
    // Fermeture de la connexion de "Amélie"
    onclose(sg, sl2);
    assert(!sg.players.hasOwnProperty("Amélie"));
    assert(!sg.games["Pizza"]["players"].hasOwnProperty("Amélie"));
    // Fermeture de la connexion de "Maxime"
    onclose(sg, sl1);
    assert(!sg.players.hasOwnProperty("Maxime"));
    assert(!sg.games.hasOwnProperty("Pizza"));
}
