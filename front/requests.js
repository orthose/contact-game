/**
 * Fonctions à appeler en réponse des messages de requêtes du serveur
 * Elles peuvent modifier les variables globales
 * mais ne doivent pas en principe modifier directement le DOM 
 */
const requests = {
    // Enregistrer le joueur
    register: function(rq) {
        if (rq["accepted"]) {
            pseudo = rq["pseudo"]
            // Affichage du pseudo
            pages.listPlayers();
            document.querySelector("#players").style = "display: block";
            document.querySelector("#players li").classList.add("mypseudo");
            // Formulaire de création de partie
            pages.chooseGame();
        } else {
            pages.invalidInput(document.getElementById("pseudo_input"));
        }
    },

    // Rejoindre une partie
    joinGame: function(rq) {
        // Rejoindre une salle
        // Pas de champ accepted si changement de meneur
        if (!rq.hasOwnProperty("accepted") || rq["accepted"]) {
            requests.quitGame();
            game = rq["game"];
            leader = rq["leader"];
            players = new Set(rq["players"]);
            role = leader === pseudo ? "leader" : "detective";
            // Affichage du nom de partie
            document.querySelector("#game").style = "display: block";
            document.querySelector("#game span").textContent = game;
            // Affichage du nombre d'essais restants
            document.querySelector("#ntry").style = "display: block";
            pages.printLifes(rq["ntry"]);
            // Affichage du mot secret ou indice si déjà renseigné
            if (rq["secret"]) {
                secret = rq["secret"]; 
                pages.printSecret(rq["secret"]); 
            }
            // Affichage des joueurs
            pages.listPlayers();

            // Formulaire de choix du mot secret
            if (role === "leader") { pages.chooseSecret(); }

            // Démarrage du jeu
            else if (role === "detective") { pages.playGame(); }

        } else {
            pages.invalidInput(document.getElementById("game_input"));
        }
    },

    // Quitter la partie
    quitGame: function(rq) {
        game = ""; role = ""; players = new Set(); leader = ""; secret = "";
        // Nettoyer les balises d'information du header
        pages.quitGame();
        // Retour à la page de choix de partie
        pages.chooseGame();
    },

    // Fin de partie
    endGame: function(rq) {
        secret = rq["word"];
        if (role === "leader") {
            pages.foundLetters(rq["word"].length);
        }
        else if (role === "detective") {
            pages.printSecret(rq["word"]);
        }
        pages.endGame(rq["winner"]);
        // Nécessaire pour ne pas avoir une ancienne version lors de l'appel à joinGame
        // si des joueurs sont partis ou entrés entre temps
        players = new Set(rq["players"]);
        rq["players"] = players;
        // Manche suivante d'une partie
        pages.nextRound(rq);
    },

    // Ajouter un nouveau joueur
    addPlayer: function(rq) {
        players.add(rq["pseudo"]);
        pages.listPlayers();
    },

    // Supprimer un joueur
    removePlayer: function(rq) {
        players.delete(rq["pseudo"]);
        pages.listPlayers();
    },

    // Choisir un mot secret
    secret: function(rq) {
        // Validation du mot secret du meneur
        if (rq["accepted"]) {
            pages.printSecret(rq["word"]);
            pages.foundLetters(1);
            // Démarrage du jeu
            pages.playGame();
        }
        // Mot secret invalide
        else {
            pages.invalidInput(document.getElementById("secret_input"));
        }
    },

    // Nouvel indice
    hint: function(rq) {
        secret = rq["word"];
        document.querySelectorAll("#definition input.word_input").forEach((input) => {
            input.setAttribute("placeholder", secret);
        });

        if (role === "leader") {
            pages.foundLetters(rq["word"].length);
        }
        else if (role === "detective") {
            pages.printSecret(rq["word"]);
        }
    },

    // Recevoir une définition
    definition: function(rq) {
        if (rq.hasOwnProperty("accepted")) {
            document.getElementById("word_input").classList.remove("invalid");
            if (rq["accepted"]) {
                document.getElementById("word_input").value = "";
                document.getElementById("def_input").value = "";
            } else {
                pages.invalidInput(document.getElementById("word_input"));
            }
        } else {
            pages.addDefinition(rq); 
        }
    },

    // Recevoir un contact
    contact: function(rq) {
        const div = document.querySelector(`#definition div[id="${rq["ndef"]}"]`);
        pages.printLifes(rq["ntry"]);
        // Contre du meneur
        let spanWord = null;
        if (rq["pseudo"] === leader) {
            const divLeader = div.querySelector("div.leader");
            divLeader.style = "display: block";
            divLeader.querySelector("span").textContent = rq["word2"];
            spanWord = divLeader.querySelector("span");
        }
        // Contact réussi 
        else {
            div.querySelector("span.searcher").textContent = rq["pseudo"];
            div.querySelector("div.words").style = "display: block";
            if (!rq["accepted"]) {
                const span = div.querySelector("span.word1");
                span.textContent = rq["word1"];
                span.style = "display: inline-block";
            }
            spanWord = div.querySelector("span.word2");
        }
        Object.assign(spanWord, {
            textContent: rq["word2"],
            className: rq["accepted"] ? "success" : "fail",
        });
        // Suppression des définitions expirées
        rq["expired"].forEach((n) => {
            removeElement(document.getElementById(n));
        });
        // La défintion est consommée
        if (!(rq["pseudo"] === leader && !rq["accepted"] )) {
            div.classList.add("solved");
            removeElement(div.querySelector("input"));
            removeElement(div.querySelector("button"));
        }
    },
};
