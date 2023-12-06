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
            const previousRound = round;
            round = rq["round"];
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
            // Affichage de l'indice pour les détectives si déjà renseigné
            secret = rq["secret"];
            if (rq["secret"] && role === "detective") {
                pages.printSecret(rq["secret"]);
                pages.updateDefSecret(rq["secret"]);
            }
            // Affichage des joueurs
            pages.listPlayers();

            // Formulaire de choix du mot secret
            if (rq["secret"] === "" && role === "leader") { pages.chooseSecret(); }

            // Attente de la première manche en tant que détective
            else if (round === 0) {
                document.querySelector("main").innerHTML = "<p style='font-size:16px'>Veuillez patienter le temps que le meneur choisisse le mot mystère.</p>";
            }

            // Démarrage du jeu si on passe à la manche suivante
            else if (previousRound < round) { pages.playGame(); }

            // Restauration de session au cours d'une même manche
            else if (previousRound === round && rq.hasOwnProperty("def")) {
                // On supprime toutes les définitions sauf celles dans "def" ou marquées .solved
                document.querySelectorAll("div.definition").forEach((div) => {
                    if (!div.classList.contains("solved") && !rq["def"].includes(div.id)) {
                        div.remove();
                    }
                });
            }

        } else {
            pages.invalidInput(document.getElementById("game_input"));
        }
    },

    // Quitter la partie
    quitGame: function(rq) {
        game = ""; round = 0; role = ""; players = new Set(); leader = ""; secret = "";
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
        // Si je suis le prochain meneur alors je choisis le mot secret
        if (rq["leader"] === pseudo) { pages.nextRound(); }
        // Les joueurs attendent le joinGame qui sera envoyé 
        // à la réception du nouveau mot secret par le serveur
    },

    // Ajouter un nouveau joueur
    addPlayer: function(rq) {
        players.add(rq["pseudo"]);
        pages.listPlayers();
    },

    // Supprimer un joueur
    removePlayer: function(rq) {
        // Si le joueur est meneur lors la partie n'a plus de meneur
        if (leader === rq["pseudo"]) { leader = ""; }
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
        if (!rq.hasOwnProperty("accepted") || rq["accepted"]) {
            pages.printSecret(rq["word"]);
            pages.foundLetters(rq["letters"]);
        }
        // Mot secret invalide
        else {
            pages.invalidInput(document.getElementById("secret_input"));
        }
    },

    // Nouvel indice
    hint: function(rq) {
        secret = rq["word"];
        pages.updateDefSecret(secret);

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
        let spanWord = null;
        div.querySelector("div.words").style = "display:block";
        // Contre du meneur
        if (rq["pseudo"] === leader) {
            spanWord = div.querySelector("span.word2")
        }
        // Contact réussi 
        else {
            div.querySelector("span.searcher").textContent = rq["pseudo"];
            if (!rq["accepted"]) {
                const span = div.querySelector("span.word1");
                span.textContent = rq["word1"];
                span.style = "display:inline-block";
            }
            spanWord = div.querySelector("span.word3")
        }
        spanWord.innerHTML += rq["word2"];
        spanWord.classList.add(rq["accepted"] ? "success" : "fail");
        spanWord.style = "display:inline-block";
        // Suppression des définitions expirées
        rq["expired"].forEach((n) => {
            removeElement(document.getElementById(n));
        });
        // La défintion est consommée
        if (!(rq["pseudo"] === leader && !rq["accepted"])) {
            div.classList.add("solved");
            if (
                // Je suis meneur et les détectives ont raté leur contact
                (role === "leader" && rq["pseudo"] !== leader && !rq["accepted"])
                // Je suis meneur et j'ai réussi mon contre
                || (role === "leader" && rq["pseudo"] === leader && rq["accepted"])
                // Je suis détective et on a réussi notre contact
                || (role === "detective" && rq["pseudo"] !== leader && rq["accepted"])
            ) {
                div.classList.add("success");
            }
            // Je suis meneur et les détectives ont réussi leur contact
            // Je suis détective et le meneur a réussi son contact
            // Je suis détective et on raté notre contact
            else {
                div.classList.add("fail");
            }
            removeElement(div.querySelector("input"));
            removeElement(div.querySelector("button"));
        }
        // Le meneur ne peut contrer qu'une seule fois une définition
        if (role === "leader" && rq["pseudo"] === leader && !rq["accepted"]) {
            removeElement(div.querySelector("input"));
            removeElement(div.querySelector("button"));
        }
    },
};
