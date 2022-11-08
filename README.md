# chatavion
Système de messagerie sur DNS - Messaging system over DNS

ATTENTION ! CECI EST UN PROJET EXPÉRIMENTAL POTENTIELLEMENT INSTABLE. IL EST CONSEILLÉ D'INSTALLER LE SERVEUR SUR UNE MACHINE DÉDIÉE.
LES CONTRIBUTIONS SONT LES BIENVENUES. 

WARNING! THIS IS AN EXPERIMENTAL, POTENTIALLY UNSTABLE PROJECT. THE SERVER SHOULD BE USED ON A DEDICATED MACHINE. CONTRIBUTIONS ARE WELCOME.

For more information in English, please see README.en.md

Chatavion est un système de messagerie fonctionnant uniquement par DNS. 
Il peut ainsi être utilisé sur tous les réseaux publics sans authentification ni paiement.
Il a été créé pour discuter depuis les réseaux Wi-Fi d'avion sans payer et a rempli ce rôle plusieurs fois.

Conçu initialement comme une preuve de concept d'envoi de message d'urgence en avion, Chatavion est passé d'un assemblage dégueulasse de bouts de code à un vrai programme en NodeJS !

Chatavion se décompose en 3 parties : 
 - Un client en NodeJS, testé sur Linux et Android avec Termux
 - Un serveur en NodeJS
 - Une partie configuration DNS, qui peut être déléguée à un fournisseur comme freedns.afraid.org 
 
Ce fonctionnement est schématisé sur [ce forum](https://zestedesavoir.com/forums/sujet/12757/chatavion-une-messagerie-passe-partout/?page=2#p206584). Pour la version "Community", c'est très légèrement différent, car seule une entrée NS est utilisée.
 
1. Configuration DNS préalable

Le serveur doit disposer d'une adresse IPv4 fixe. Il est nécessaire de lui attribuer un nom de domaine, comme chatavion.ca. Exemple de configuration possible :

chatavion.ca    33.33.133.133

Ensuite, un autre domaine doit renvoyer les requêtes reçues à ce serveur, qui tâchera de les interpréter. 
Pour cela, on définit une entrée de type NS. Exemple :

caserv.xx.yy   NS   chatavion.ca

2. Serveur

Le serveur fonctionne avec NodeJS et les dépendances hi-base32 et node-named. Pour les installer, utilisez la commande suivante dans le même répertoire que caserv.js : ```npm install hi-base32 node-named```. ATTENTION ! Le paquet node-named contient un bug qui peut empêcher l'exécution du programme. Pour le corriger, modifiez le fichier node_modules/node-named/lib/server.js. À la ligne 53, remplacez le code par ```this._socket = dgram.createSocket('udp4');```.

Modifiez le fichier caserv.js pour faire correspondre le nom de domaine (SRVDOMAIN) à votre configuration, ainsi que pour définir les communautés à accueillir. Chaque communauté doit disposer un fichier de log correspondant, à créer avant l'exécution. Exemple : pour la communauté "github", il faut créer le fichier "github.log" dans le même répertoire. Vous pouvez ensuite lancer le serveur en tâche de fond. Si vous utilisez Linux, vous pouvez exécuter ```nohup node caserv.js &```

Le programme intercepte les requêtes DNS qu'il reçoit. S'il détecte une requête qui commence par un "m", c'est *a priori* une demande de réception de message (type RECV). Sinon, il tente de décoder la première partie de la requête en base32. Si ça fonctionne, c'est un message à enregistrer (type SEND). Si le nom d'une communauté n'est pas détecté dans la requête, le type est invalidé afin qu'elle ne soit pas traitée.

Dans le cas d'une requête RECV, le serveur renvoie un extrait de la conversation correspondant à la demande. 3 cas sont possibles : 

- mX.github.carserv.xx.yy renvoie la ligne X de la conversation sous forme de texte directement
- mXnY.github.caserv.xx.yy renvoie 4 caractères à partir de la colonne Y de la ligne X sous forme d'adresse IPv4
- mXoY.github.caserv.xx.yy renvoie 16 caractères à partir de la colonne Y de la ligne X sous forme d'adresse IPv6

Dans le cas d'une requête SEND, le message est décodé et ajouté à la conversation correspondant à la communauté, précédé de la date et du préfixe "Avion :". Ce dernier est commun à tous les messages envoyés par un client Chatavion, par opposition à d'autres clients qui peuvent intervenir dans la conversation de manière plus conventionnelle, par exemple au moyen d'une interface web.

3. Client

Un client a été conçu pour Android, pour fonctionner avec l'émulateur de terminal Termux. Il fonctionne aussi sous Linux et devrait normalement fonctionner sur toute plateforme supportant NodeJS. Il nécessite les dépendances hi-base32 et readline-sync, installables avec la commande suivante dans le même répertoire que caclient.js : 

```npm install readline-sync hi-base32```

Le client Chatavion peut maintenant être lancé avec la commande ```node caclient.js```. Lors du lancement, le client détecte le serveur DNS par défaut. Vous pouvez simplement taper Entrée pour ne pas le modifier. ATTENTION : cela ne fonctionne pas sous Termux, qui propose 8.8.8.8 par défaut. Il est fortement recommandé de récupérer le serveur DNS renvoyé par le fournisseur d'accès, grâce à une appli comme Network Info II.

Ensuite, vous devez saisir les noms de domaine correspondant à l'envoi (SEND) et à la réception (RECV) de messages. Dans le cas de la version Community, les deux sont identiques. Pour reprendre notre exemple, il s'agit de caserv.xx.yy.

Le client récupère immédiatement les messages de la conversation du serveur. Pour envoyer un message, tapez s suivi de votre message. Exemple :

```s Hello world```

Il est recommandé d'éviter les caractères accentués et autres diacritiques, car ils peuvent poser des problèmes d'affichage.

Pour charger les nouveaux messages, tapez r. Pour recharger tous les messages à partir d'une ligne en particulier, tapez r suivi du numéro correspondant. Exemple :

```r4``` recharge toutes les lignes à partir de la 4ème.

Pour quitter, tapez q.

La détection du type de requête DNS est automatique. Dans l'ordre de préférence, on tente le texte (TXT), puis l'IPv6 (AAAA) puis l'IPv4 (A).
