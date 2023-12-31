import { config } from "./config.js";
import fs from "fs";

// Chargement du dictionnaire synchrone une seule fois
const dicoSet = new Set(fs.readFileSync(config["dico"], "utf8").split("\n"));
const dicoArray = Array.from(dicoSet);

/**
 * La chaîne de caractères est-elle remplie ?
 * https://stackoverflow.com/a/64704021
 * 
 * @param str Chaîne de caractères
 * @returns true si remplie false sinon
 */
export function isfilled(str) {
    return str ? true : false;
}

/**
 * Le mot existe-t-il dans le dictionnaire ?
 * 
 * @param word Chaîne de caractères du mot à tester 
 * @returns true si le mot existe false sinon
 */
export function wordExists(word) {
    return dicoSet.has(word);
}

/**
 * Donne un mot aléatoire du dictionnaire 
 * Complexité constante
 * 
 * @returns chaîne de caractères
 */
export function getRandomWord() {
    return dicoArray[Math.floor(Math.random()*dicoArray.length)];
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
 * La taille de la définition ne doit pas excéder la taille autorisée
 * 
 * @param word Chaîne de caractères du mot mystère 
 * @param def Chaîne de caractères de la défintion
 * @returns true si définition valide false sinon
 */
export function definitionIsValid(word, def) {
    // TODO: Il faudrait vérifier la racine du mot également
    return def.length <= config["maxDefLength"] && !(def.toUpperCase().includes(word.toUpperCase()));
}
