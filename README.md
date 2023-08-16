# Introduction
« Contact » est un jeu de mots convivial dont les règles sont très simples.
Il présente l'avantage de ne pas nécessiter de matériel spécifique.
C'est grâce à mon cousin Quentin Barillot que je l'ai découvert cet été.
Il est à noter que le nom n'est pas celui du jeu original.

# Cahier des charges
## Fonctionnalités principales
* Application web légère avec le moins de dépendances possibles.
* Jeu performant optimisé pour du temps réel.
* Architecture classique client-serveur.
* Vérification des règles côté serveur.
* Stockage non-persistant des parties en cours.
* Système d'authentification sécurisé en stockage persistant.
* Interface graphique multi-plateformes sobre et intuitive. 

## Fonctionnalités supplémentaires
* Classement des joueurs.
* Pénalité en cas d'abandon de partie.
* Mode solo et hors-ligne hors classement.
* IA pour faire deviner le mot.
* Niveaux de difficulté de l'IA.

# Règles du jeu
## Préparation
Un joueur qu'on appellera le **gardien** choisit un mot non-conjugué ni décliné 
sans le révéler aux autres joueurs et annonce la première lettre de celui-ci.
Ce mot doit être un mot valide du dictionnaire français.

## Déroulement
Un joueur parmi ceux cherchant à deviner le mot qu'on appellera les **détectives** 
propose une définition faisant référence à un mot commençant par la lettre annoncée. 
Cette définition ne doit évidemment pas inclure le mot ou une racine du mot auquel elle fait référence.

Si un autre détective croît avoir deviné le mot auquel fait référence cette définition,
alors il dit « contact » et après un décompte de trois, les deux joueurs doivent
simultanément énoncer le mot auquel ils pensent.

* Si les deux mots sont identiques alors la lettre suivante du mot doit être révélée par le gardien.
Les prochaines définitions devront faire référence à des mots commençant par la suite de lettres ainsi révélées.

* Sinon si les deux mots diffèrent alors aucun indice n'est révélé.

Si le gardien pense avoir deviné le mot auquel fait référence la définition proposée, 
il a le droit de s'interposer pour annuler la tentative des détectives en énonçant « pas » suivi du mot en question.

## Fin de partie
* Si deux détectives parviennent à énoncer simultanément le mot secret du gardien alors ils ont gagné.

* Si deux détectives énoncent simultanément deux mots différents dont le mot secret alors le gardien a gagné.

* Sinon lorsque le décompte du nombre de tentatives tombe à zéro le gardien a gagné.  

## Nombre de joueurs
Le jeu est multi-joueurs et nécessite un minimum de trois joueurs :
un gardien pour faire deviner le mot et deux détectives pour le chercher.

Si l'IA est utilisée pour faire deviner le mot, seulement deux joueurs sont nécessaires.

Il est possible d'envisager un mode solo dans lequel l'IA fait deviner au joueur des mots du dictionnaire.

# Mise en production
## Installation de Node.js
```shell
wget -qO- https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Configuration de NGINX
TODO

## Lancement du serveur
TODO
