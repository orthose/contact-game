const ws = new WebSocket("ws://localhost:8080");

let pseudo = "";
let game = "";

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

    // Enregistrer le joueur
    if (data["register"]) {
        if (data["register"] === pseudo && data["accepted"]) {
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

    // Créer une partie
    else if (data["join_game"]) {
        if (data["join_game"] === game && data["accepted"]) {
            document.getElementById("game_input").style = "border-color: green";
            // Affichage du nom de partie
            document.getElementById("game").innerHTML = game;

            // TODO: Formulaire de choix du mot secret

        } else {
            document.getElementById("game_input").style = "border-color: red";
        }
    }
};

function register() {
    pseudo = document.getElementById("pseudo_input").value;
    if (pseudo) { send({"register": pseudo}); }
}

function unregister() {
    send({"unregister": pseudo});
    pseudo = "";
}

function join_game() {
    game = document.getElementById("game_input").value;
    if (game) { send({"join_game": game}) };
}
