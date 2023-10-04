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
            if (rq["secret"]) { pages.printSecret(rq["secret"]); }
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

    addPlayer: function(rq) {
        if (rq["pseudo"] !== pseudo) {
            pages.addPlayer(rq["pseudo"]);
        }
    },

    removePlayer: function(rq) {
        pages.removePlayer(rq["pseudo"]);
    },

    secret: function(rq) {
        // Validation du mot secret du meneur
        if (rq["accepted"]) {
            pages.printSecret(rq["word"]);
            pages.foundLetters(1);
            // Démarrage du jeu
            pages.playGame();

        }
        // Nouvel indice
        else if (role === "leader") {
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
        const word1 = rq["word1"];
        const word2 = rq["word2"];
        const div = document.querySelector(`#definition div[id="${rq["ndef"]}"]`);
        div.querySelector("p.searcher").textContent = rq["pseudo"];
        div.querySelector("p.word").textContent = word1;
        div.querySelector("p.contact").textContent = word2;
        pages.printLifes(rq["ntry"]);
        if (rq["accepted"]) {
            // Contre du meneur
            if (rq["pseudo"] === leader) {
                div.className = "success-leader";
            }
            // Contact réussi 
            else {
                div.className = "success";
            }
        }
        // Contact ou contre échoué 
        else {
            div.className = "fail";
        }
        // Suppression des définitions expirées
        rq["expired"].forEach((n) => { document.getElementById(n).remove(); });
    },
};
