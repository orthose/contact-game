const ws = new WebSocket("ws://localhost:8080");

let pseudo = ""; // Identifiant du joueur
let game = ""; // Identifiant de la partie
let role = ""; // leader | detective
let leader = ""; // Identifiant du meneur

const send = (json) => ws.send(JSON.stringify(json));

/*ws.addEventListener("open", (ev) => {
    ws.send("Hello Server!");
});*/

ws.onclose = function(ev) {
    console.log("Connexion perdue...");
    pseudo = "";
    // TODO: Revenir à la page d'accueil
};

// Réception des messages du serveur
ws.onmessage = function(ev) {
    let data = JSON.parse(ev.data);
    console.log(data);

    // On fait confiance au serveur pour tous les messages reçus

    // Enregistrer le joueur
    if ("register" === data["type"]) {
        if (data["accepted"]) {
            pseudo = data["pseudo"]
            // Affichage du pseudo
            document.getElementById("pseudo").innerHTML = pseudo;

            // Formulaire de création de partie
            const main = document.querySelector("main")
            main.innerHTML = "";

            const game_input = document.createElement("input")
            game_input.id = "game_input";
            game_input.setAttribute("type", "text");
            main.appendChild(game_input);

            const join_button = document.createElement("button");
            join_button.innerHTML = "Rejoindre une partie";
            join_button.onclick = joinGame;
            main.appendChild(join_button);

        } else {
            document.getElementById("pseudo_input").style = "border-color: red";
        }
    }

    // Rejoindre une partie
    else if ("joinGame" === data["type"]) {
        if (data["accepted"]) {
            game = data["game"];
            leader = data["leader"];
            role = leader === pseudo ? "leader" : "detective";
            // Affichage du nom de partie
            document.getElementById("game").innerHTML = game;
            // Affichage du mot secret ou indice si déjà renseigné
            document.getElementById("secret").textContent = data["secret"];

            // Formulaire de choix du mot secret
            if (role === "leader") {
                const main = document.querySelector("main")
                main.innerHTML = "";

                const secret_label = document.createElement("label");
                secret_label.setAttribute("for", "secret_input");
                secret_label.textContent = "Mot secret";
                main.appendChild(secret_label);

                const secret_input = document.createElement("input");
                secret_input.id = "secret_input";
                secret_input.setAttribute("type", "text");
                main.appendChild(secret_input);

                const secret_button = document.createElement("button");
                secret_button.textContent = "Envoyer";
                secret_button.onclick = secret;
                main.appendChild(secret_button);
            }

            // Démarrage du jeu
            else if (role === "detective") {
                const main = document.querySelector("main")
                main.innerHTML = "";

                const def_div = document.createElement("div");
                def_div.id = "definition";
                main.appendChild(def_div);

                const word_label = document.createElement("label");
                word_label.setAttribute("for", "word_input");
                word_label.textContent = "Mot";
                main.appendChild(word_label);

                const word_input = document.createElement("input");
                word_input.id = "word_input";
                word_input.setAttribute("type", "text");
                main.appendChild(word_input);

                const def_label = document.createElement("label");
                def_label.setAttribute("for", "def_input");
                def_label.textContent = "Définition";
                main.appendChild(def_label);

                const def_input = document.createElement("input");
                def_input.id = "def_input";
                def_input.setAttribute("type", "text");
                main.appendChild(def_input);

                const def_button = document.createElement("button");
                def_button.textContent = "Envoyer";
                def_button.onclick = definition;
                main.appendChild(def_button);
            }

        } else {
            document.getElementById("game_input").style = "border-color: red";
        }
    }

    // Quitter la partie
    else if ("quitGame" === data["type"]) {
        game = ""; role = ""; leader = "";

        // TODO: Afficher la page de création de partie
    }

    // Réception du mot secret
    else if ("secret" === data["type"]) {
        // Validation du mot secret du meneur
        if (data["accepted"]) {
            const secret = `<span style="color: blue">${data["word"].slice(0,1)}</span>${data["word"].slice(1)}`;
            document.getElementById("secret").innerHTML = secret;

            // Démarrage du jeu
            const main = document.querySelector("main")
            main.innerHTML = "";

            const def_div = document.createElement("div");
            def_div.id = "definition";
            main.appendChild(def_div);

            const word_label = document.createElement("label");
            word_label.setAttribute("for", "word_input");
            word_label.textContent = "Mot";
            main.appendChild(word_label);

            const word_input = document.createElement("input");
            word_input.id = "word_input";
            word_input.setAttribute("type", "text");
            main.appendChild(word_input);

            const contact_button = document.createElement("button");
            contact_button.textContent = "Contrer";
            //contact_button.onclick = contact;
            main.appendChild(contact_button);
        }
        // Nouvel indice
        else {
            // Suppression de toutes les définitions non-jouées
            document.querySelectorAll("div#definition div").forEach(
                (div) => { if (!["success-leader", "success", "fail"].includes(div.className)) { div.remove(); } }
            );

            if (role === "leader") {
                const p_secret = document.getElementById("secret");
                const secret = p_secret.textContent;
                const letters = data["word"].length;
                p_secret.innerHTML = `<span style="color: blue">${secret.slice(0,letters)}</span>${secret.slice(letters)}`;

            }
            else if (role === "detective") {
                document.getElementById("secret").textContent = data["word"];
            }
        }
    }

    // Recevoir une définition
    else if ("definition" === data["type"]) {
        if (data.hasOwnProperty("accepted") && !data["accepted"]) {
            alert(`La définition pour le mot ${data["word"]} a été refusée.`);
        } else {
            const def_div = document.createElement("div");
            def_div.id = data["ndef"];
            def_div.onclick = contact;
            const author_p = document.createElement("p");
            author_p.className = "author";
            author_p.textContent = data["pseudo"];
            def_div.appendChild(author_p);
            const searcher_p = document.createElement("p");
            searcher_p.className = "searcher";
            def_div.appendChild(searcher_p);
            const word_p = document.createElement("p");
            word_p.className = "word";
            def_div.appendChild(word_p);
            const contact_p = document.createElement("p");
            contact_p.className = "contact";
            def_div.appendChild(contact_p);
            const def_p = document.createElement("p");
            def_p.className = "definition";
            def_p.textContent = data["def"];
            def_div.appendChild(def_p);
            document.getElementById("definition").appendChild(def_div);
        }
    }

    // Recevoir un contact
    else if ("contact" === data["type"]) {
        const word1 = data["word1"];
        const word2 = data["word2"];
        const def_div = document.querySelector(`#definition div[id="${data["ndef"]}"]`);
        def_div.querySelector("p.searcher").textContent = data["pseudo"];
        def_div.querySelector("p.word").textContent = word1;
        def_div.querySelector("p.contact").textContent = word2;
        if (data["accepted"]) {
            // Contre du meneur
            if (data["pseudo"] === leader) {
                def_div.className = "success-leader";
            }
            // Contact réussi 
            else {
                def_div.className = "success";
            }
        }
        // Contact ou contre échoué 
        else {
            def_div.className = "fail";
        }
        // Suppression des définitions expirées
        data["expired"].forEach((n) => { document.getElementById(n).remove(); });
    }
};

function register() {
    const pseudo = document.getElementById("pseudo_input").value;
    if (pseudo) { send({"type": "register", "pseudo": pseudo}); }
}

function unregister() {
    send({"type": "unregister"});
    pseudo = "";
}

function joinGame() {
    const game = document.getElementById("game_input").value;
    if (game) { send({"type": "joinGame", "game": game}); }
}

function quitGame() {
    if (game) { send({"type": "quitGame"}); }
}

function secret() {
    const secret = document.getElementById("secret_input").value;
    if (secret) { send({"type": "secret", "word": secret}); }
}

function definition() {
    const word = document.getElementById("word_input").value;
    const def = document.getElementById("def_input").value;
    if (word && def) { send({"type": "definition", "def": def, "word": word}); }
}

function contact() {
    const word = document.getElementById("word_input").value;
    if (word) { send({"type": "contact", "word": word, "ndef": parseInt(this.id)}); }
}
