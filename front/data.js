// Variables globales du client

let pseudo = ""; // Identifiant du joueur
let sid = ""; // Identifiant de session
let retryTimer = null; // Timer de restauration de session
let players = new Set(); // Joueurs de la partie
let game = ""; // Identifiant de la partie
let role = ""; // leader | detective
let leader = ""; // Identifiant du meneur
let secret = ""; // Mot indice
