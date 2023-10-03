function createElement(tagName, kwargs={}) {
    return Object.assign(document.createElement(tagName), kwargs);
}

const pages = {
    invalidInput: function(input) {
        input.classList.add("invalid");
        input.oninput = function() {
            input.classList.remove("invalid");
            input.oninput = null;
        };
    },

    register: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("input", {
            type: "text", id: "pseudo_input", placeholder: "Pseudo",
        }));
        main.appendChild(createElement("br"));
        main.appendChild(createElement("button", {
            textContent: "Envoyer", 
            onclick: callbacks.register,
        }));
    },

    chooseGame: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("input", {
            type: "text", id: "game_input", placeholder: "Salle",
        }));
        main.appendChild(createElement("button", {
            textContent: "Rejoindre", 
            onclick: callbacks.joinGame,
        }));
    },

    chooseSecret: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("label", {
            textContent: "Mot secret", for: "secret_input",
        }));
        main.appendChild(createElement("input", {
            type: "text", id: "secret_input",
        }));
        main.appendChild(createElement("button", {
            textContent: "Envoyer",
            onclick: callbacks.secret,
        }));
    },

    playGame: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("div", {id: "definition"}));
        if (role === "detective") {
            main.appendChild(createElement("label", {
                textContent: "Mot", for: "word_input",
            }));
            main.appendChild(createElement("input", {
                type: "text", id: "word_input",
            }));
            main.appendChild(createElement("label", {
                textContent: "Définition", for: "def_input",
            }));
            main.appendChild(createElement("input", {
                type: "text", id: "def_input",
            }));
            main.appendChild(createElement("button", {
                textContent: "Envoyer",
                onclick: callbacks.definition,
            }));
            main.appendChild(createElement("button", {
                textContent: "Quitter",
                onclick: callbacks.quitGame,
            }));
        }
    },

    nextRound: function() {
        const main = document.querySelector("main");
        main.appendChild(createElement("button", {
            textContent: "Continuer",
            //onclick: ...,
        }));
    },

    endGame: function(msg) {
        const main = document.querySelector("main");
        main.appendChild(createElement("p", {textContent: msg}));
    },

    listPlayers: function(players) {
        players.forEach(p => {
            if (p !== pseudo) { pages.addPlayer(p) }
        });
    },

    addPlayer: function(player) {
        const ul = document.querySelector("#players ul");
        ul.appendChild(createElement("li", {id: player, textContent: player}));
    },

    removePlayer: function(player) {
        document.querySelector(`#players ul li#${player}`).remove();
    },

    /*emptyPlayers: function() {
        document.getElementById("players").innerHTML = "";
    },*/

    addDefinition: function(rq) {
        const div = createElement("div", {id: rq["ndef"], onclick: callbacks.contact});
        div.appendChild(createElement("p", {className: "author", textContent: rq["pseudo"]}));
        div.appendChild(createElement("p", {className: "searcher"}));
        div.appendChild(createElement("p", {className: "word"}));
        div.appendChild(createElement("p", {className: "contact"}));
        div.appendChild(createElement("p", {className: "definition", textContent: rq["def"]}));
        document.getElementById("definition").appendChild(div);
    },
};