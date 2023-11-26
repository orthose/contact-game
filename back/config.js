export const config = {
    "port": 8080,
    "pingInterval": 5*60*1000,
    "closeTimeout": 3*60*1000,
    "certfile": "./certs/localhost.crt",
    "keyfile": "./certs/localhost.key",
    "dico": "./assets/dico/ods6.txt",
    "allowedChars": "àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ",
    "minInputLength": 1,
    "maxInputLength": 16,
    "maxDefLength": 512,
    "maxSelectedGames": 10,
    "ntry": 5,
};
