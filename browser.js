const ws = new WebSocket("ws://localhost:8080");

let pseudo = "";
let game = "";
let role = ""; // detective | leader

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
    const data = JSON.parse(ev.data);
    console.log(data);

    // On fait confiance au serveur pour configurer les variables du joueur

    // Enregistrer le joueur
    if (data["register"]) {
        if (data["accepted"]) {
            pseudo = data["register"]
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
            join_button.onclick = join_game;
            main.appendChild(join_button);

        } else {
            document.getElementById("pseudo_input").style = "border-color: red";
        }
    }

    // Rejoindre une partie
    else if (data["join_game"]) {
        if (data["accepted"]) {
            game = data["join_game"];
            role = data["role"];
            // Affichage du nom de partie
            document.getElementById("game").innerHTML = game;

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
                //def_button.onclick = definition;
                main.appendChild(def_button);
            }

        } else {
            document.getElementById("game_input").style = "border-color: red";
        }
    }

    // Quitter la partie
    else if (data.hasOwnProperty("quit_game")) {
        game = ""; role = "";

        // TODO: Afficher la page de création de partie
    }

    // Proposer un mot secret
    else if (data["secret"]) {
        const secret = `<span style="color: blue">${data["secret"].slice(0,1)}</span>${data["secret"].slice(1)}`;
        document.getElementById("secret").innerHTML = secret;

        // Démarrage du jeu
        const main = document.querySelector("main")
        main.innerHTML = "";

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
};

function register() {
    const pseudo = document.getElementById("pseudo_input").value;
    if (pseudo) { send({"register": pseudo}); }
}

function unregister() {
    // pseudo optionnel
    send({"unregister": pseudo});
    pseudo = "";
}

function join_game() {
    const game = document.getElementById("game_input").value;
    if (game) { send({"join_game": game}); }
}

function quit_game() {
    // game optionnel
    if (game) { send({"quit_game": game}); }
}

function secret() {
    const secret = document.getElementById("secret_input").value;
    if (secret) { send({"secret": secret}); }
}
