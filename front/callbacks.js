/**
 * Fonctions à attacher aux boutons pour envoyer des requêtes au serveur
 * Elles ne doivent pas modifier les variables globales 
 * mais peuvent les consulter
 * Elles doivent vérifier que les données textuelles envoyées ne sont pas vides
 */
const callbacks = {
    status: function() {
        send({"type": "status"});
    },

    register: function() {
        const pseudo = document.getElementById("pseudo_input").value;
        if (pseudo) { send({"type": "register", "pseudo": pseudo}); }
    },
    
    unregister: function() {
        send({"type": "unregister"});
        ws.onclose = null; // Ne pas restaurer la session
        // Redémarrage d'un nouveau socket et réinitialisation des variables
        location.reload();
    },
    
    joinGame: function() {
        const game = document.getElementById("game_input").value;
        const visibility = document.getElementById("visibility_input").checked ? "public":"private";
        if (game) { send({"type": "joinGame", "game": game, "visibility": visibility}); }
    },
    
    quitGame: function() {
        if (game) { send({"type": "quitGame"}); }
    },

    updatePlayers: function() {
        if (game) { send({"type": "updatePlayers"}); }
    },
    
    secret: function() {
        const secret = document.getElementById("secret_input").value;
        if (secret) { send({"type": "secret", "word": secret}); }
    },

    updateHint: function() {
        if (game) { send({"type": "updateHint"}); }
    },
    
    definition: function() {
        const word = document.getElementById("word_input").value;
        const def = document.getElementById("def_input").value;
        if (word && def) {
            send({"type": "definition", "def": def, "word": word}); 
        }
    },
    
    contact: function(ndef) {
        const word = document.querySelector(`#definition div[id="${ndef}"] input.word_input`).value;
        if (word) { send({"type": "contact", "word": word, "ndef": parseInt(ndef)}); }
    },

    summary: function(tag) {
        const display = tag.nextElementSibling.style.display;
        if (display === "none") {
            tag.className = "unfold";
            tag.nextElementSibling.style.display = "block";
        }
        else {
            tag.className = "fold";
            tag.nextElementSibling.style.display = "none";
        }
    },
};
