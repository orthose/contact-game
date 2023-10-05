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

    addLeaderStar: function() {
        const li = document.querySelector(`#players li#${leader}`);
        li.textContent = "⭐ " + li.textContent;
    },

    removeLeaderStar: function() {
        const li = document.querySelector(`#players li#${leader}`);
        li.textContent = li.textContent.slice(2);
    },

    printLifes: function(ntry) {
        document.getElementById("ntry").textContent = "❤️".repeat(ntry);
    },

    chooseSecret: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("input", {
            type: "text", id: "secret_input", placeholder: "Mot Secret",
        }));
        main.appendChild(createElement("button", {
            textContent: "Envoyer",
            onclick: callbacks.secret,
        }));
    },

    printSecret: function(secret) {
        const span = document.querySelector("#secret span");
        for (let i = 0; i < secret.length; i++) {
            span.appendChild(createElement("span", {textContent: secret[i]}));
        }
        document.querySelector("#secret").style = "display: block";
    },

    foundLetters: function(letters) {
        const span = document.querySelector("#secret span");
        for (let i = 0; i < letters; i++) {
            span.children[i].className = "found";
        }
    },

    playGame: function() {
        const main = document.querySelector("main");
        main.innerHTML = "";

        main.appendChild(createElement("div", {id: "definition"}));
        if (role === "detective") {
            main.appendChild(createElement("input", {
                type: "text", id: "word_input", placeholder: "Chocolat",
            }));
            main.appendChild(createElement("textarea", {
                id: "def_input", placeholder: 
                "Aliment composé de cacao et de sucre.",
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
        const div = createElement("div", {id: rq["ndef"], className: "definition"});
        div.innerHTML = `<div class="players">
            <img src="./assets/img/player.png" width="32px" height="32px">
            <span class="author">${rq["pseudo"]}</span>
            <span class="searcher"></span>
        </div>
        <div class="words" style="display: none;">
            <img src="./assets/img/lock.png" width="32px" height="32px">
            <span class="word1"></span>
            <span class="word2"></span>
        </div>
        <div class="leader" style="display: none;">
            <img src="./assets/img/star.png" width="32px" height="32px">
            <span></span>
        </div>
        <p class="definition">${rq["def"]}</p>`
        if (rq["pseudo"] !== "pseudo") {
            div.innerHTML += `<input type="text" class="word_input" placeholder="${secret}">
            <button onclick="callbacks.contact(${rq["ndef"]})">${role === "leader" ? "Contre" : "Contact"}</button>`;
        }
        document.getElementById("definition").appendChild(div);
    },
};