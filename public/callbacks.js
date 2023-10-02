const callbacks = {
    register: function() {
        const pseudo = document.getElementById("pseudo_input").value;
        if (pseudo) { send({"type": "register", "pseudo": pseudo}); }
    },
    
    unregister: function() {
        send({"type": "unregister"});
        pseudo = "";
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
        if (word && def) { send({"type": "definition", "def": def, "word": word}); }
    },
    
    contact: function() {
        const word = document.getElementById("word_input").value;
        if (word) { send({"type": "contact", "word": word, "ndef": parseInt(this.id)}); }
    },
};