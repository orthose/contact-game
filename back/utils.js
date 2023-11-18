import crypto from 'crypto'

export function htmlspecialchars(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Supprime les espaces inutiles et les accents puis passe en majuscules
export function formatInput(str) {
    // https://stackoverflow.com/a/37511463
    return str.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

export function randomPassword(length) {
    // https://stackoverflow.com/a/43020177
    return new Array(length).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
    .map(x => (function(chars) { 
        let umax = Math.pow(2, 32), r = new Uint32Array(1), max = umax - (umax % chars.length); 
        do { crypto.getRandomValues(r); 
        } while(r[0] > max); return chars[r[0] % chars.length]; })(x)).join('');
}
