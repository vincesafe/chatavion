# chatavion
Système de messagerie sur DNS - Messaging system over DNS

ATTENTION ! CECI EST UN PROJET EXPÉRIMENTAL EXTRÊMEMENT INSTABLE. IL DOIT ÊTRE UTILISÉ UNIQUEMENT SUR MACHINE VIRTUELLE DÉDIÉE.
LES CONTRIBUTIONS SONT LES BIENVENUES. 

WARNING! THIS IS AN EXPERIMENTAL, HIGHLY UNSTABLE PROJECT. IT SHOULD BE USED ONLY ON A DEDICATED VIRTUAL MACHINE. CONTRIBUTIONS ARE WELCOME.

For more information in English, please see README.en.md

Chatavion est un système de messagerie fonctionnant uniquement par DNS. 
Il peut ainsi être utilisé sur tous les réseaux publics sans authentification ni paiement.
Il a été créé pour discuter depuis les réseaux Wi-Fi d'avion sans payer et a rempli ce rôle plusieurs fois.

Conçu initialement comme une preuve de concept d'envoi de message d'urgence en avion, aucun soin n'a été apporté à la conception ou au code (ça se voit très vite). C'est du bricolage et de l'assemblage de code dégueulasse. Mais ça marche (à peu près) !

Chatavion, dans sa version mono, se décompose en 3 parties : 
 - Un client, utilisable en ligne de commande sous Android, conçu pour fonctionner avec Termux
 - Un serveur d'envoi (SEND) qui nécessite bash, le programme base32 et Node.js avec le paquet node-named
 - Une partie configuration DNS, qui peut être déléguée à un fournisseur comme freedns.afraid.org 
 
Ce fonctionnement est schématisé sur [ce forum](https://zestedesavoir.com/forums/sujet/12757/chatavion-une-messagerie-passe-partout/?page=2#p206584). 
 
1. Configuration DNS préalable

Le serveur doit disposer d'une adresse IPv4 fixe. Il est nécessaire d'attribuer un nom de domaine à ce serveur. Exemple au hasard :

chatavion.ca    33.33.133.133

Ensuite, deux autres domaines doivent renvoyer les requêtes reçues à ce serveur, qui tâcheront de les interpréter. 
Pour cela, on définit des entrées de type NS. Exemple :

getmmsg.xx.yy   NS   chatavion.ca

emgt.xx.yy      NS   chatavion.ca

2. Serveur

Le serveur a pour adresse 33.33.133.133 et le nom de domaine chatavion.ca. 
Il est le nameserver des domaines emgt.xx.yy (enregistrement de messages) et getmmsg.xx.yy (livraison de messages). 
Ainsi, lorsqu'une requête DNS demandant "ohyeah.emgt.xx.yy" ou "m1.getmmsg.xx.yy" est émise sur Internet, le serveur la reçoit et l'interprète. 

Le système fonctionne avec Node.js et base32 comme commande Linux.

Chatavion étant un prototype instable, le serveur utilisé peut planter sans prévenir. 
Il ne doit pas être utilisé pour autre chose. Toutes les commandes doivent être lancées en root depuis un même répertoire avec autorisation d'écriture. Toutes les commandes doivent être lancées en root.

Node.js doit être installé sur ce serveur. La dépendance node-named peut être installée avec la commande suivante, dans le même répertoire que chatsend.js :
```npm install node-named```

Dans chatsend.js, il convient de modifier les variables SEND et RECV en fonction de sa configuration DNS, SEND étant le NS d'envoi de messages, RECV celui de distribution. Une fois ces préparations effectuées, il n'y a plus qu'à lancer chatsend.js en tâche de fond. Exemple :
```nohup nodejs chatsend.js &```

chatsend.js démarre un serveur DNS sur le port 53. 

Les requêtes DNS sont interceptées et décodées. Si le domaine d'envoi (SEND) est détecté, la procédure suivante est exécutée.

La première partie du domaine, avant le premier point, est extraite puis décodée avec base32. En cas d'échec, le traitement est annulé. Le message est enregistré dans le log, précédé de la date et de l'expression "Avion : ". Ce préfixe permet de préciser que le message est émis depuis un réseau potentiellement instable, par opposition au préfixe "Terre" utilisé par un client web normal (non présent sur ce dépôt). Une réponse DNS (42.42.42.42) est envoyée pour indiquer que la requête a bien été reçue, indépendamment du fait que le message a été traité ou non, et ce pour éviter la multiplication des requêtes. Si plusieurs requêtes identiques sont reçues consécutivement, seule la première est prise en compte pour éviter les doublons dans la conversation. Le message entier est alors enregistré dans le fichier de log défini par la variable logFile.

Si le domaine de réception (RECV) est détecté, la procédure suivante est exécutée.

Le log de conversation est chargé en mémoire ligne par ligne. La première partie du domain est décodée pour être interprétée. Trois cas sont pris en compte :
 - mX renvoie un enregistrement de type texte (TXT) qui contient le message brut contenu à la ligne X
 - mX.nY renvoie un enregistrement de type adresse IP (A) qui contient 4 caractères du message X avec l'offset Y transformés en valeurs numériques selon l'encodage ASCII (cette transformation est opérée par la fonction toIPv4)
 - mX.oY renvoie un enregistrement de type adresse IPv6 (AAAA) qui contient 16 caractères du message X avec l'offset Y transformés en valeurs hexadécimales selon l'encodage ASCII (cette transformation est opérée par la fonction toIPv6)
 
Ainsi, une requête DNS de type TXT sur m1.getmmsg.xx.yy renverra le premier message du log de conversation, m2.getmmsg.xx.yy, le deuxième, etc.

Les requêtes DNS de type TXT fonctionnent sur certains réseaux, comme le Wi-Fi du TGV, mais pas sur d'autres, comme le Wi-Fi de la compagnie aérienne ANA (c'est du vécu). 
Alternativement, il est possible de récupérer les messages sous forme de nombres, stockés dans des adresses IP. 
Ainsi, une requête DNS de type A (adresse IPv4) sur m1.n1.getmmsg.xx.yy renverra les 4 premiers caractères du premier message. m1.n2.getmmsg.xx.yy renverra les caractères 5 à 8 du premier message. m2.n1.getmmsg.xx.yy, les 4 premiers du deuxième message, etc. Selon le même principe, une requête DNS de type AAAA (adresse IPv6) sur m1.o1.getmmsg.xx.yy renverra les 16 premiers caractères du premier message.

3. Client

Un client a été conçu pour Android, pour fonctionner avec l'émulateur de terminal Termux. Il est composé des fichiers send.sh, newrecep.sh, ip2ascii.sh et ip6ascii.sh. Pour tout installer d'un coup, avec les paquets nécessaires, il est possible de télécharger et exécuter install.sh. Il est nécessaire de se placer dans un répertoire vide avec droits d'écriture. 

```wget https://raw.githubusercontent.com/vincesafe/chatavion/mono/client/install.sh```

```bash install.sh```

ATTENTION : le client de la branche mono n'est compatible qu'avec le serveur de la branche mono. Il n'est pas compatible avec les branches master et node.

send.sh permet l'envoi de messages. Dans ce fichier, il convient de remplacer emgt.xx.yy par le nom NS qui renvoit vers le serveur d'envoi.

Le réseau peut filtrer les requêtes DNS pour n'autoriser l'utilisation que d'un seul serveur, généralement celui fourni en DHCP. 
Dans ce cas, une application comme Network Info 2 permet de récupérer l'adresse de ce serveur. Il faut la renseigner dans le fichier "dnserv", précédée d'un @, comme ceci :

```echo "@1.2.3.4" > dnserv```

Le programme d'envoi s'utilise avec la commande suivante :

```./send.sh "voici un message"```

La limite est de 34 caractères. send.sh convertit le message en base32 et émet une requête vers (messageBase32).emgt.xx.yy. 
Si tout se passe bien, cette requête est interceptée par le serveur et le message est enregistré. En cas d'échec du décodage base32, le message est ignoré. 
La bonne réception du message par le serveur renvoie la réponse 42.42.42.42, mais cela ne signifie pas forcément que le message a été enregistré. Par exemple, il n'est pas possible d'envoyer consécutivement plusieurs fois le même message.
Compte tenu de l'instabilité du système, éviter les caractères spéciaux augmente les chances de succès.

newrecep.sh émet tout simplement des requêtes DNS (m1.getmmsg.xx.yy, ...) pour réceptionner les messages du log. Au préalable, il faut remplacer getmmsg.xx.yy dans ce fichier par le nom NS qui renvoit vers le serveur de réception.
Il peut prendre 2 paramètres facultatifs : le serveur DNS à utiliser et l'offset. 
Il est conseillé d'utiliser le même serveur DNS que pour l'envoi. 
L'offset correspond à un numéro de ligne. On peut choisir de ne recevoir que les messages à partir du 5ème, par exemple. Cela évite de recharger les messages déjà lus, pratique si la discussion est longue et/ou le réseau lent. Exemple : 

```./newrecep.sh 1.2.3.4 5```

Lorsqu'il détecte qu'il n'y a plus de message à charger (échec de la requête DNS), le programme indique quel est l'offset suivant, pour s'économiser du temps lors de la prochaine réception.

newrecep.sh teste 3 modes de réception différents par ordre de rapidité. Le premier est le mode texte : les messages sont directement transmis sous forme de texte dans la réponse DNS. Ce mode est filtré sur certains hotspots. En cas d'échec, un message d'erreur s'affiche. Le deuxième mode utilise des adresses IPv6. Elles sont 128 bits, soit 16 octets, on peut donc y caser 16 caractères ASCII. Ce mode utilise ip6ascii.sh pour convertir une adresse IPv6 en chaine de caractères et l'afficher. Le troisième mode utilise des adresses IPv4. Elles ne font que 4 octets, les caractères doivent donc être transmis 4 par 4. C'est le mode le plus lent.
