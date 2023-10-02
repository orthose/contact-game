function createElement(tagName, kwargs={}) {
    return Object.assign(document.createElement(tagName), kwargs);
}

const pages = {
    register: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("label", {
            textContent: "Pseudo", for: "pseudo_input",
        }));
        main.appendChild(createElement("input", {
            type: "text", id: "pseudo_input",
        }));
        main.appendChild(createElement("button", {
            textContent: "Envoyer", 
            onclick: callbacks.register,
        }));
    },

    chooseGame: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("input", {
            type: "text", id: "game_input",
        }));
        main.appendChild(createElement("button", {
            textContent: "Rejoindre une partie", 
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
        const ul = document.getElementById("players");
        players.forEach(p => {
            ul.appendChild(createElement("li", {id: p, textContent: p}));
        });
    },

    addPlayer: function(player) {
        const players = document.getElementById("players");
        players.appendChild(createElement("li", {id: player, textContent: player}));
    },

    removePlayer: function(player) {
        document.querySelector(`#players li#${player}`).remove();
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