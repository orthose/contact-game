function createElement(tagName, kwargs={}) {
    return Object.assign(document.createElement(tagName), kwargs);
}

function removeElement(tag) {
    if (tag !== null) { tag.remove(); }
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

    quitGame: function() {
        if (leader) { pages.removeLeaderStar(); }
        const game = document.getElementById("game");
        game.querySelector("span").innerHTML = "";
        game.style = "display: none";
        const secret = document.getElementById("secret");
        secret.querySelector("span").innerHTML = "";
        secret.style = "display: none";
        const ntry = document.getElementById("ntry");
        ntry.innerHTML = "";
        ntry.style = "display: none";
        const players = document.querySelectorAll("#players ul li");
        for (let i = 1; i < players.length; i++) {
            players[i].remove();
        }
    },

    chooseGame: function() {
        pages.quitGame();
        const quit = document.getElementById("quit");
        quit.style = "display: float";
        quit.onclick = callbacks.unregister;
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
        if (li !== null) { li.textContent = "⭐ " + li.textContent; }
    },

    removeLeaderStar: function() {
        const li = document.querySelector(`#players li#${leader}`);
        if (li !== null) { li.textContent = li.textContent.slice(2); }
    },

    printLifes: function(ntry) {
        document.getElementById("ntry").textContent = "❤️".repeat(ntry);
    },

    chooseSecret: function() {
        const quit = document.getElementById("quit");
        quit.onclick = callbacks.quitGame;
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
        span.innerHTML = "";
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
        const quit = document.getElementById("quit");
        quit.onclick = callbacks.quitGame;
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
                id: "send_def", textContent: "Envoyer",
                onclick: callbacks.definition,
            }));
        }
    },

    nextRound: function(rq) {
        rq["accepted"] = true;
        const main = document.querySelector("main");
        main.appendChild(createElement("button", {
            textContent: "Continuer",
            onclick: () => { pages.quitGame(); requests.joinGame(rq); },
        }));
    },

    endGame: function(winner) {
        let className = ""; let src = ""; let msg = "";
        if (winner === role) {
            className = "winner";
            src = "./assets/img/trophy.png";
            msg = "GAGNÉ&nbsp;!";
        } else {
            className = "looser";
            src = "./assets/img/death.png";
            msg = "PERDU&nbsp;!";
        }
        const div = createElement("div", {id: "end_game", className: className});
        div.innerHTML = `<img src="${src}"><span>${msg}</span>`;
        document.querySelector("main").appendChild(div);
        removeElement(document.getElementById("word_input"));
        removeElement(document.getElementById("def_input"));
        removeElement(document.getElementById("send_def"));
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

    addDefinition: function(rq) {
        const div = createElement("div", {id: rq["ndef"], className: "definition"});
        div.innerHTML = `<div class="players">
            <img src="./assets/img/player.png" width="32px" height="32px">
            <span class="author">${rq["pseudo"]}</span>
            <span class="searcher"></span>
        </div>
        <div class="words" style="display: none;">
            <img src="./assets/img/lock.png" width="32px" height="32px">
            <span class="word1" style="display: none"></span>
            <span class="word2"></span>
        </div>
        <div class="leader" style="display: none;">
            <img src="./assets/img/star.png" width="32px" height="32px">
            <span></span>
        </div>
        <p class="definition">${rq["def"]}</p>`
        if (rq["pseudo"] !== pseudo) {
            div.innerHTML += `<input type="text" class="word_input" placeholder="${secret}">
            <button onclick="callbacks.contact(${rq["ndef"]})">${role === "leader" ? "Contre" : "Contact"}</button>`;
        }
        document.getElementById("definition").appendChild(div);
    },
};