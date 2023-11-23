# Introduction
« Contact » est un jeu de mots convivial dont les règles sont très simples.
Il présente l'avantage de ne pas nécessiter de matériel spécifique.
C'est grâce à mon cousin Quentin Barillot que je l'ai découvert cet été.

# Cahier des charges
## Fonctionnalités principales
* Application web légère avec le moins de dépendances possibles.
* Jeu performant optimisé pour du temps réel.
* Architecture classique client-serveur.
* Vérification des règles côté serveur.
* Stockage non-persistant des parties en cours.
* Interface graphique multi-plateformes sobre et intuitive. 

## Fonctionnalités supplémentaires optionnelles
* Système d'authentification sécurisé en stockage persistant.
* Classement des joueurs.
* Pénalité en cas d'abandon de partie.
* Mode solo et hors-ligne hors classement.
* IA pour faire deviner le mot.
* Niveaux de difficulté de l'IA.

# Règles du jeu
## Préparation
Un joueur qu'on appellera le **meneur** choisit un mot qui peut être conjugué ou décliné 
sans le révéler aux autres joueurs et annonce la première lettre de celui-ci.
Ce mot doit être un mot valide du dictionnaire français.

## Déroulement
Un joueur parmi ceux cherchant à deviner le mot qu'on appellera les **détectives** 
propose une définition faisant référence à un mot commençant par la lettre annoncée. 
Cette définition ne doit évidemment pas inclure le mot ou une racine du mot auquel elle fait référence.

Si un autre détective croît avoir deviné le mot auquel fait référence cette définition,
alors il dit « contact » et après un décompte de trois, les deux joueurs doivent
simultanément énoncer le mot auquel ils pensent.

* Si les deux mots sont identiques alors la lettre suivante du mot doit être révélée par le meneur.
Les prochaines définitions devront faire référence à des mots commençant par la suite de lettres ainsi révélées.

* Sinon si les deux mots diffèrent alors aucun indice n'est révélé.

Si le meneur pense avoir deviné le mot auquel fait référence la définition proposée, 
il a le droit de s'interposer pour annuler la tentative des détectives en énonçant « pas » suivi du mot en question.

## Fin de partie
* Si deux détectives parviennent à énoncer simultanément le mot secret du meneur alors ils ont gagné.
Le prochain meneur est le détective ayant proposé la définition.

* Si deux détectives énoncent simultanément deux mots différents dont le mot secret alors le meneur a gagné.
Le prochain meneur reste inchangé.

* Sinon lorsque le décompte du nombre de tentatives tombe à zéro le meneur a gagné.
Le prochain meneur reste inchangé.

## Nombre de joueurs
Le jeu est multi-joueurs et nécessite un minimum de trois joueurs :
un meneur pour faire deviner le mot et deux détectives pour le chercher.

Si l'IA est utilisée pour faire deviner le mot, seulement deux joueurs sont nécessaires.

Il est possible d'envisager un mode solo dans lequel l'IA fait deviner au joueur des mots du dictionnaire.

# Installation de l'application
L'application web peut être utilisée en tant que PWA (application web progressive) sur smartphone,
grâce aux informations contenues dans le fichier `contact-game.webmanifest`.
Cependant, elle ne fonctionne pas hors-ligne.

## Installation sur Android
1. Sur votre appareil Android, ouvrez Chrome.
2. Accédez à un site Web comportant une PWA que vous souhaitez installer.
3. Appuyez sur Installer.
4. Suivez les instructions à l'écran.

## Installation sur iOS
1. Sur votre iPhone ou votre iPad, ouvrez Safari.
2. Accédez au site que vous souhaitez ajouter.
3. À côté de la barre d'adresse, appuyez sur Partager.
4. Recherchez l'option Ajouter à l'écran d'accueil, puis appuyez dessus.
5. Confirmez ou modifiez les détails concernant le site Web, puis appuyez sur Ajouter.

# Mise en production
Les instructions ci-dessous sont valables pour un système sous **Debian**.

## Installation de Node.js
Voir le dépôt [NodeSource](https://github.com/nodesource/distributions).
```shell
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt-get update
sudo apt-get install nodejs -y
```

## Installation du projet
```shell
cd /var/www/html
git clone https://github.com/orthose/contact-game.git
cd contact-game/
npm install
```

Vous pouvez télécharger un dictionnaire votre choix [ici](http://www.3zsoftware.com/fr/listes.php).
```shell
mkdir assets/dico
cd assets/dico
wget http://www.3zsoftware.com/listes/ods6.zip
unzip ods6.zip
rm -r __MACOSX/ ods6.zip
```

## Configuration réseau
Le jeu utilise le protocole [WebSocket](https://developer.mozilla.org/fr/docs/Web/API/WebSockets_API)
pour la communication temps réel entre client et serveur.
Le code côté serveur utilise la bibliothèque [ws](https://www.npmjs.com/package/ws#faq).

Vous pouvez configurer le côté serveur avec le fichier `back/config.js`
et le côté client avec le fichier `front/config.js`.

Le protocole WebSocket est indépendant du protocole HTTPS donc il doit passer par un port différent.
Pour utiliser le port **8080** par exemple il faut modifier les fichiers de configuration.
```js
const config = {
    "port": 8080, 
}
```

Il faut penser à ouvrir le port **8080** du pare-feu de la machine exécutant le serveur.
```shell
sudo ufw allow 8080/tcp
```

Pour sécuriser le protocole on utilise des certificats de la même manière que HTTPS.
Pour le développement en local il est possible de créer un certificat auto-signé.
Pour autoriser ce certificat dans le navigateur, il faut faire une exception 
en se rendant à l'adresse `https://localhost:8080` et en acceptant le risque.
```shell
mkdir certs
cd certs
openssl req -newkey rsa:2048 -nodes -keyout localhost.key -pkcs12 -days 100000 -out localhost.crt -subj "/CN=localhost"
```

Le chemin du certificat et de la clé doivent être renseignés dans `back/config.js`.
Attention vérifiez bien les permissions ! La clé ne doit pas être accessible depuis le web. 
Mais Node.js doit pouvoir accéder à ces deux fichiers.
```js
export const config = {
    "certfile": "./certs/localhost.crt",
    "keyfile": "./certs/localhost.key",
}
```

Si le jeu à vocation à être disponible sur Internet il peut être nécessaire de paramétrer
la table **NAT/PAT**. Ci-dessous un exemple pour ma Livebox.

|Application/Service|Port interne|Port externe|Protocole|Équipement|IP externe|
|-------------------|------------|------------|---------|----------|----------|
|Secure Web Server (HTTPS)|8080|8080|TCP|samsung-N150|Toutes|

En cas de fermeture du socket (passer le navigateur en arrière-plan sur mobile), 
le client essaye de se reconnecter automatiquement au serveur avec son pseudo 
et son mot de passe de session. Il a par défaut 3 minutes pour le faire.
Cette valeur est paramétrable dans `back/config.js`.
```js
export const config = {
    "closeTimeout": 3*60*1000,
}
```

Par défaut, le client essaye de demander 15 fois à 2 secondes d'intervalle 
une restauration de session auprès du serveur. Sachant qu'une connexion initiale
au websocket prend au maximum 250 ms si le réseau est disponible.
Ces paramètres peuvent être configurés dans `front/config.js`.
```js
const config = {
    "maxRetry": 6,
    "retryInterval": 5000,
}
```

## Lancement du serveur
Pour lancer le serveur dans la console en mode local.
Attention évitez de lancer le serveur avec le super-utilisateur.
```shell
# Pour arrêter CTRL+C
node server.js
```

Pour lancer le serveur en production. Les logs sont redirigés dans le fichier `logs.out`.
```shell
# Pour arrêter kill [pid]
nohup node server.js >> logs.out &
```

Pour relancer le serveur à chaque redémarrage de la machine.
```shell
crontab -e
# contact-game
@reboot cd /var/www/html/contact-game; nohup node server.js >> logs.out &
```

Pour vérifier que le flux est bien ouvert sur le port **8080** depuis une autre machine.
Le serveur doit être évidemment démarré.
```shell
telnet my.domain.org 8080
```

Pour accéder au jeu il suffit d'héberger les fichiers sur un serveur Apache ou NGINX
et de requêter le fichier `index.html`. Le jeu ne peut fonctionner que dans un navigateur moderne.

# Développement

## Changer numéro de version
Modifier la version du package Node.js côté serveur.
Crée automatiquement un tag git.
```shell
npm version 0.0.1
```

~~Modifier la version affichée sur le site dans le `footer`.~~
```html
<span>Version Bêta 0.0.1</span>
```

Créer un tag git manuellement et l'envoyer.
```shell
git tag -a v0.0.1
git push origin v0.0.1
git push --tags # pas recommandé
```