import { config } from "./config.js";
import fs from "fs";

// Chargement du dictionnaire synchrone une seule fois
const dico = new Set(fs.readFileSync(config["dico"], "utf8").split("\n"));

/**
 * Le mot existe-t-il dans le dictionnaire ?
 * 
 * @param word Chaîne de caractères du mot à tester 
 * @returns true si le mot existe false sinon
 */
export function wordExists(word) {
    return dico.has(word);
}

/**
 * L'entrée utilisateur est-elle valide ?
 * Les valeurs peuvent être ajustées dans la config
 * 
 * @param input Chaîne de caractères de l'entrée à tester
 * @returns true si valide false sinon
 */
export function inputIsValid(input) {
    return RegExp(`^[a-zA-Z0-9${config["allowedChars"]}]{${config["minInputLength"]},${config["maxInputLength"]}}$`).test(input);
}

/**
 * La définition est-elle valide sachant le mot mystère ?
 * La racine du mot ne doit pas apparaître dans la définition
 * 
 * @param word Chaîne de caractères du mot mystère 
 * @param def Chaîne de caractères de la défintion
 * @returns true si définition valide false sinon
 */
export function definitionIsValid(word, def) {
    // TODO: Il faudrait vérifier la racine du mot également
    return !(def.toUpperCase().includes(word.toUpperCase()));
}
