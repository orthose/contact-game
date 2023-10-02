const requests = {
    // Enregistrer le joueur
    register: function(rq) {
        if (rq["accepted"]) {
            pseudo = rq["pseudo"]
            // Affichage du pseudo
            document.getElementById("pseudo").textContent = pseudo;
            // Formulaire de création de partie
            pages.chooseGame();
        } else {
            document.getElementById("pseudo_input").style = "border-color: red";
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
            document.getElementById("game").innerHTML = game;
            // Affichage du nombre d'essais restants
            document.getElementById("ntry").textContent = rq["ntry"];
            // Affichage du mot secret ou indice si déjà renseigné
            document.getElementById("secret").textContent = rq["secret"];

            // Formulaire de choix du mot secret
            if (role === "leader") { pages.chooseSecret(); }

            // Démarrage du jeu
            else if (role === "detective") { pages.playGame(); }

        } else {
            document.getElementById("game_input").style = "border-color: red";
        }
    },

    // Quitter la partie
    quitGame: function(rq) {
        game = ""; role = ""; leader = "";
        pages.chooseGame();
    },

    // Fin de partie
    endGame: function(rq) {
        if (role === "detective") {
            document.getElementById("secret").textContent = rq["word"];
        }
        pages.endGame(rq["winner"] === "leader" ? `Le meneur ${leader} a gagné !` : "Les détectives ont gagné !");
    },

    secret: function(rq) {
        // Validation du mot secret du meneur
        if (rq["accepted"]) {
            const secret = `<span style="color: blue">${rq["word"].slice(0,1)}</span>${rq["word"].slice(1)}`;
            document.getElementById("secret").innerHTML = secret;

            // Démarrage du jeu
            pages.playGame();

        }
        // Nouvel indice
        else if (role === "leader") {
            const p_secret = document.getElementById("secret");
            const secret = p_secret.textContent;
            const letters = rq["word"].length;
            p_secret.innerHTML = `<span style="color: blue">${secret.slice(0,letters)}</span>${secret.slice(letters)}`;

        }
        else if (role === "detective") {
            document.getElementById("secret").textContent = rq["word"];
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
        document.getElementById("ntry").textContent = rq["ntry"];
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
