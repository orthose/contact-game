const requests = {
    // Enregistrer le joueur
    register: function(rq) {
        if (rq["accepted"]) {
            pseudo = rq["pseudo"]
            // Affichage du pseudo
            pages.addPlayer(pseudo);
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
        // Manche suivante d'une partie
        if (!rq.hasOwnProperty("accepted")) {
            pages.nextRound();
        }
        // Rejoindre une salle
        else if (rq["accepted"]) {
            game = rq["game"];
            leader = rq["leader"];
            role = leader === pseudo ? "leader" : "detective";
            // Affichage du nom de partie
            document.querySelector("#game").style = "display: block";
            document.querySelector("#game span").textContent = game;
            // Affichage du nombre d'essais restants
            pages.printLifes(rq["ntry"]);
            // Affichage du mot secret ou indice si déjà renseigné
            if (rq["secret"]) {
                secret = rq["secret"]; 
                pages.printSecret(rq["secret"]); 
            }
            // Affichage des joueurs
            pages.listPlayers(rq["players"]);
            if (leader) { pages.addLeaderStar(); }

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
        game = ""; role = ""; leader = "";
        // TODO: Nettoyer les balises d'information du header
        pages.chooseGame();
    },

    // Fin de partie
    endGame: function(rq) {
        if (role === "detective") {
            document.getElementById("secret").textContent = rq["word"];
        }
        pages.endGame(rq["winner"] === "leader" ? `Le meneur ${leader} a gagné !` : "Les détectives ont gagné !");
    },

    // Ajouter un nouveau joueur
    addPlayer: function(rq) {
        if (rq["pseudo"] !== pseudo) {
            pages.addPlayer(rq["pseudo"]);
        }
    },

    // Supprimer un joueur
    removePlayer: function(rq) {
        pages.removePlayer(rq["pseudo"]);
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
        if (rq.hasOwnProperty("accepted") && !rq["accepted"]) {
            alert(`La définition pour le mot ${rq["word"]} a été refusée.`);
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
            const div = document.getElementById(n);
            if (div !== null) { div.remove(); } 
        });
        // La défintion est consommée
        if (!(rq["pseudo"] === leader && !rq["accepted"] )) {
            div.classList.add("solved");
            const input = div.querySelector("input")
            if (input !== null) { input.remove(); }
            const button = div.querySelector("button")
            if (button != null) { button.remove(); }
        }
    },
};
