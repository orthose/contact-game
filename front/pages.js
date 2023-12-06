// Création d'une balise et de ses attributs en une ligne
function createElement(tagName, kwargs={}) {
    return Object.assign(document.createElement(tagName), kwargs);
}

// Suppression d'une balise si sélecteur non null
function removeElement(tag) {
    if (tag !== null) { tag.remove(); }
}

/**
 * Fonctions de modification du DOM
 * Elles ne doivent pas modifier les variables globales 
 * mais peuvent les consulter
 */
const pages = {
    invalidInput: function(input) {
        input.classList.add("invalid");
        input.oninput = function() {
            input.classList.remove("invalid");
            input.oninput = null;
        };
    },

    printScore: function() {
        document.getElementById("wonGames").textContent = localStorage.getItem("wonGames");
        document.getElementById("lostGames").textContent = localStorage.getItem("lostGames");
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
        const game = document.getElementById("game");
        game.querySelector("span").innerHTML = "";
        game.style = "display: none";
        const secret = document.getElementById("secret");
        secret.querySelector("span").innerHTML = "";
        secret.style = "display: none";
        const ntry = document.getElementById("ntry");
        ntry.innerHTML = "";
        ntry.style = "display: none";
        pages.listPlayers();
    },

    chooseGame: function(publicGames) {
        const quit = document.getElementById("quit");
        quit.style = "display: float";
        quit.onclick = callbacks.unregister;
        const main = document.querySelector("main");
        main.innerHTML = "";
        const divVisibility = createElement("div", {style: "margin-bottom: 15px"});
        divVisibility.appendChild(createElement("input", {
            type: "checkbox", id: "visibility_input", name: "visibility", checked: "true",
            onchange: (checkbox) => {
                checkbox.target.nextElementSibling.textContent = checkbox.target.checked ? "Publique":"Privée";
            },
        }));
        divVisibility.appendChild(createElement("label", {
            htmlFor: "visibility", textContent: "Publique",
        }));
        main.appendChild(divVisibility);
        main.appendChild(createElement("input", {
            type: "text", id: "game_input", placeholder: "Salle",
        }));
        main.appendChild(createElement("button", {
            textContent: "Rejoindre", 
            onclick: callbacks.joinGame,
        }));
        const divGames = createElement("div", {id: "publicGames"});
        publicGames.forEach((g) => {
            const divRow = createElement("div", {className: "row", onclick: () => {
                document.getElementById("game_input").value = g["game"];
            }, innerHTML:`<img src="./assets/img/player.png" width="32px" height="32px"><span>`+g["players"]
            +`</span><img src="./assets/img/home.png" width="32px" height="32px"><span>`+g["game"]+`</span>`});
            divGames.appendChild(divRow);
        });
        main.appendChild(divGames);
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
            textContent: "?", 
            onclick: callbacks.randomWord,
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

    updateDefSecret: function(secret) {
        document.querySelectorAll("#definition input.word_input").forEach((input) => {
            input.setAttribute("placeholder", secret);
        });
    },

    playGame: function() {
        const quit = document.getElementById("quit");
        quit.onclick = callbacks.quitGame;
        const main = document.querySelector("main");
        main.innerHTML = "";
        main.appendChild(createElement("div", {id: "definition"}));
        if (role === "detective") {
            main.appendChild(createElement("input", {
                type: "text", id: "word_input", placeholder: config["exampleWord"],
            }));
            main.appendChild(createElement("textarea", {
                id: "def_input", placeholder: 
                config["exampleDef"],
            }));
            main.appendChild(createElement("button", {
                id: "send_def", textContent: "Envoyer",
                onclick: callbacks.definition,
            }));
        }
    },

    nextRound: function() {
        const main = document.querySelector("main");
        main.appendChild(createElement("button", {
            textContent: "Continuer",
            onclick: () => { pages.chooseSecret(); },
        }));
    },

    endGame: function(winner) {
        let className = ""; let src = ""; let msg = "";
        if (winner === role) {
            className = "winner";
            src = "./assets/img/trophy.png";
            msg = "GAGNÉ&nbsp;!";
            localStorage.setItem("wonGames", parseInt(localStorage.getItem("wonGames"))+1);
        } else {
            className = "looser";
            src = "./assets/img/death.png";
            msg = "PERDU&nbsp;!";
            localStorage.setItem("lostGames", parseInt(localStorage.getItem("lostGames"))+1);
        }
        pages.printScore();
        const div = createElement("div", {id: "end_game", className: className});
        div.innerHTML = `<img src="${src}"><span>${msg}</span>`;
        document.querySelector("main").appendChild(div);
        // Suppression des champs d'envoi de définition
        removeElement(document.getElementById("word_input"));
        removeElement(document.getElementById("def_input"));
        removeElement(document.getElementById("send_def"));
        // Suppression des définitions non-résolues
        document.querySelectorAll("div.definition").forEach((div) => {
            if (!div.classList.contains("solved")) { div.remove(); }
        });
    },

    listPlayers: function() {
        function createPlayer(player) {
            const kwargs = {id: player, innerHTML: player};
            if (player === leader) { 
                kwargs.innerHTML = `<img src="./assets/img/star-white.png" width="16px" height="16px">` + player;
            }
            return createElement("li", kwargs);
        }
        const ul = document.querySelector("#players ul");
        ul.innerHTML = "";
        // Affichage du pseudo du joueur
        ul.appendChild(Object.assign(createPlayer(pseudo), {className: "mypseudo"}));
        // Affichage des adversaires
        const opponents = new Set(players);
        opponents.delete(pseudo);
        players.forEach(p => {
            if (p !== pseudo) { ul.appendChild(createPlayer(p)); }
        });
    },

    addDefinition: function(rq) {
        const div = createElement("div", {id: rq["ndef"], className: "definition"});
        div.innerHTML = `<div class="players">
            <img src="./assets/img/player.png" width="32px" height="32px">
            <span class="author">${rq["pseudo"]}</span>
            <span class="searcher"></span>
        </div>
        <div class="words" style="display:none">
            <img src="./assets/img/lock.png" width="32px" height="32px">
            <div><span class="word1" style="display:none"></span>
            <span class="word2" style="display:none"><img src="./assets/img/star-white.png" width="16px" height="16px"></span>
            <span class="word3" style="display:none"></span></div>
        </div>
        <p class="definition">${rq["def"]}</p>`
        if (rq["pseudo"] !== pseudo) {
            div.innerHTML += `<input type="text" class="word_input" placeholder="${secret}">
            <button onclick="callbacks.contact(${rq["ndef"]})">${role === "leader" ? "Contre" : "Contact"}</button>`;
        }
        document.getElementById("definition").appendChild(div);
    },
};
