const ws = new WebSocket("ws://localhost:8080");

let pseudo = "";

const send = (json) => ws.send(JSON.stringify(json));

/*ws.addEventListener("open", (ev) => {
    ws.send("Hello Server!");
});*/

ws.onclose = function(ev) {
    console.log("Connexion perdue...");
    pseudo = "";
    // TODO: Revenir à la page d'accueil
};

ws.onmessage = function(ev) {
    const data = JSON.parse(ev.data);
    console.log(data);

    if (data["register"] === pseudo) {
        const p = document.createElement("p");
        p.innerHTML = data["accepted"] ? "Connexion réussie !" : "Échec de connexion.";
        document.querySelector("body").appendChild(p);
    }
};

function register() {
    pseudo = document.getElementById("pseudo").value;
    if (pseudo !== "") {
        send({"register": pseudo});
    }
}

function unregister() {
    send({"unregister": pseudo});
    pseudo = "";
}
