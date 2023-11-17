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
