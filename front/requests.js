/**
 * Fonctions à appeler en réponse des messages de requêtes du serveur
 * Elles peuvent modifier les variables globales
 * mais ne doivent pas en principe modifier directement le DOM 
 */
const requests = {
    // Statut du serveur
    status: function(rq) {
        document.getElementById("status").style = "display: inline-block"; 
        document.getElementById("onlinePlayers").textContent = rq["onlinePlayers"];
        document.getElementById("currentGames").textContent = rq["currentGames"];
    },

    // Enregistrer le joueur
    register: function(rq) {
        if (rq["accepted"]) {
            pseudo = rq["pseudo"]; sid = rq["sid"];
            // Affichage du pseudo
            pages.listPlayers();
            document.querySelector("#players").style = "display: block";
            document.querySelector("#players li").classList.add("mypseudo");
            // Masquer les règles
            document.getElementById("rules").style = "display: none";
            // Formulaire de création de partie
            pages.chooseGame(rq["publicGames"]);
        } else {
            pages.invalidInput(document.getElementById("pseudo_input"));
        }
    },

    // Restaurer la session
    restore: function(rq) {
        if (rq["accepted"]) {
            // Désactivation de la boucle de restauration de session
            clearInterval(retryTimer);
            // Suppression du message de reconnexion
            document.getElementById("network").style = "display: none";
            // On réactive la fonction appelée en cas de fermeture de socket
            ws.onclose = onclose;
        } else {
            location.reload();
        }
    },

    // Rejoindre une partie
    joinGame: function(rq) {
        // Rejoindre une salle
        // Pas de champ accepted si changement de meneur ou après restauration de session
        if (!rq.hasOwnProperty("accepted") || rq["accepted"]) {
            game = rq["game"];
            leader = rq["leader"];
            players = new Set(rq["players"]);
            role = leader === pseudo ? "leader" : "detective";
            // Affichage du nom de partie
            document.querySelector("#game").style = "display: block";
            document.querySelector("#game span").innerHTML = rq["visibility"] === "public" 
            ? game:`<img src="./assets/img/lock-white.png" width="16px" height="16px">${game}`;
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

            // Suppression des définitions en cas de restauration de session
            // On supprime toutes les définitions sauf celles dans "def" ou marquées .solved
            if (rq.hasOwnProperty("def")) {
                document.querySelectorAll("div.definition").forEach((div) => {
                    if (!div.classList.contains("solved") && !rq["def"].includes(parseInt(div.id))) {
                        div.remove();
                    }
                });
            }

            // Formulaire de choix du mot secret
            if (rq["secret"] === "" && role === "leader") { pages.chooseSecret(); }

            // Démarrage du jeu
            else if (!rq.hasOwnProperty("def") && role === "detective") { pages.playGame(); }

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
        pages.chooseGame(rq["publicGames"]);
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

    // Proposition de mot aléatoire
    randomWord: function(rq) {
        const input = document.getElementById("secret_input");
        if (input !== null) { input.value = rq["word"]; }
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
        if (!(rq["pseudo"] === leader && !rq["accepted"])) {
            div.classList.add("solved");
            removeElement(div.querySelector("input"));
            removeElement(div.querySelector("button"));
        }
        if (role === "leader" && rq["pseudo"] === leader && !rq["accepted"]) {
            removeElement(div.querySelector("input"));
            removeElement(div.querySelector("button"));
        }
    },
};
