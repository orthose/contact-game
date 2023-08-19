import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 8080});

const players = new Set();

wss.on("connection", function(ws) {
    let pseudo = ""; // Pseudo du joueur courant

    const send = (json) => ws.send(JSON.stringify(json));

    ws.on("message", function(data) {
        data = JSON.parse(data);
        console.log(data);

        // Enregistrer le joueur
        if (data["register"]) {
            const isvalid = (pseudo === "" && !players.has(data["register"])) || pseudo === data["register"];
            if (isvalid) {
                pseudo = data["register"];
                console.log("<", pseudo, "is registered >");
                players.add(pseudo); 
            }
            send({"register": data["register"], "accepted": isvalid});
        }
        
        // Déconnecter le joueur
        else if (data.hasOwnProperty("unregister")) { ws.close(); }
        
        // Message incorrect
        else { send({"accepted": false}); }
    });

    // Déconnexion du joueur
    ws.onclose = function() { 
        console.log("<", pseudo, "is unregistered >");
        // Libérer la mémoire
        players.delete(pseudo);
    }

    //ws.on('error', console.error);
});

