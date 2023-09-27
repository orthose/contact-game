/**
 * Objet stockant la liste des joueurs
 * 
 * {"pseudo1": {"ws": WebSocket, "game": "game1"}, ...}
 * 
 * "pseudo1": pseudo unique du joueur
 * "ws": socket pour communiquer avec le joueur
 * "game": identifiant de la partie du joueur
 */
export const players = {};

/**
 * Objet stockant l'état des parties
 * 
 * {"game1": {"secret": "tomate", "letters": 1, "words": Set(), "ntry": 5,
 *            "leader": "pseudo1", "ndef": 2, "def": {0: "tome", 2: "tomate", ...},
 *            "players": {"pseudo2": Set(0, 2), ...}}, ...}
 * 
 * "game1": identifiant unique de la partie
 * "secret": mot secret choisi par le meneur
 * "letters": nombre de lettres obtenues par les détectives
 * "words": mots déjà révélés ne pouvant plus être utilisés
 * "ntry": nombre d'essais restants avant que le meneur gagne
 * "leader": pseudo du meneur de la partie
 * "ndef": compteur de définitions
 * "def": numéro de définition unique associé au mot à deviner
 * "players": liste des utilisateurs stockant leurs propositions de définitions
 * "pseudo2": numéros des définitions proposées par pseudo2
 * 
 * Les définitions ne sont pas stockées sur le serveur par économie de mémoire
 * elles sont simplement transmises entre joueurs
 */
export const games = {};

/**
 * Donne le rôle du joueur courant
 * 
 * @param sg objet global de l'état interne du serveur
 * @param sl objet local dans la fermeture du joueur
 * @return "leader" | "detective" | "" si pas de partie rejointe
 */
export function getRole(sg, sl) {
    const game = sg.players[sl.pseudo]["game"];
    return game ? (sg.games[game]["leader"] === sl.pseudo ? "leader" : "detective") : "";
}
