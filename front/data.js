// Variables globales du client

let pseudo = ""; // Identifiant du joueur
let sid = ""; // Identifiant de session
let retryTimer = null; // Timer de restauration de session
let players = new Set(); // Joueurs de la partie
let game = ""; // Identifiant de la partie
let round = 0; // Numéro de manche
let role = ""; // leader | detective
let leader = ""; // Identifiant du meneur
let secret = ""; // Mot indice

// Nombre de parties gagnées et perdues
if (localStorage.getItem("wonGames") === null) {
    localStorage.setItem("wonGames", "0");
    localStorage.setItem("lostGames", "0");
}
