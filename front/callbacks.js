const callbacks = {
    register: function() {
        const pseudo = document.getElementById("pseudo_input").value;
        if (pseudo) { send({"type": "register", "pseudo": pseudo}); }
    },
    
    unregister: function() {
        pseudo = ""; game = ""; role = ""; leader = "";
        send({"type": "unregister"});
    },
    
    joinGame: function() {
        const game = document.getElementById("game_input").value;
        if (game) { send({"type": "joinGame", "game": game}); }
    },
    
    quitGame: function() {
        if (game) { send({"type": "quitGame"}); }
    },
    
    secret: function() {
        const secret = document.getElementById("secret_input").value;
        if (secret) { send({"type": "secret", "word": secret}); }
    },
    
    definition: function() {
        const word = document.getElementById("word_input").value;
        const def = document.getElementById("def_input").value;
        if (word && def) {
            document.getElementById("word_input").value = "";
            document.getElementById("def_input").value = "";
            send({"type": "definition", "def": def, "word": word}); 
        }
    },
    
    contact: function(ndef) {
        const word = document.querySelector(`#definition div[id="${ndef}"] input.word_input`).value;
        if (word) { send({"type": "contact", "word": word, "ndef": parseInt(ndef)}); }
    },
};