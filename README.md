# chatavion
Messaging system over DNS

ATTENTION ! CECI EST UN PROJET EXPÉRIMENTAL EXTRÊMEMENT INSTABLE. IL DOIT ÊTRE UTILISÉ UNIQUEMENT SUR MACHINE VIRTUELLE DÉDIÉE.

WARNING! THIS IS AN EXPERIMENTAL, HIGHLY UNSTABLE PROJECT. IT SHOULD BE USED ONLY ON A DEDICATED VIRTUAL MACHINE.

Chatavion est un système de messagerie fonctionnant uniquement par DNS. 
Il peut ainsi être utilisé sur tous les réseaux publics sans authentification ni paiement.
Il a été créé pour discuter depuis les réseaux Wi-Fi d'avion sans payer et a rempli ce rôle plusieurs fois.

Chatavion se décompose en 4 parties : 
 - Un client, utilisable en ligne de commande sous Android, conçu pour fonctionner avec Termux
 - Un serveur d'envoi (SEND) qui nécessite bash, un compilateur (gcc), le programme base32, un serveur web (Apache) et un serveur DNS (bind)
 - Un serveur de réception (RECV) qui nécessite bash, cron (facultatif) et un serveur DNS (bind)
 - Une partie configuration DNS, qui peut être déléguée à un fournisseur comme freedns.afraid.org 
 
1. Configuration DNS préalable
Chacun des serveurs doit disposer d'une adresse IPv4 fixe. Il est nécessaire d'attribuer un nom de domaine à chacun de ces serveurs. Exemple au hasard :
chatrecv.ca    66.66.166.166
chatsend.ca    33.33.133.133

Ensuite, deux autres domaines doivent renvoyer les requêtes reçues à ces serveurs, qui tâcheront de les interpréter. 
Pour cela, on définit des entrées de type NS. Exemple :
getmmsg.xx.yy   NS   chatrecv.ca
emgt.xx.yy      NS   chatsend.ca

2. Serveur d'envoi
Le serveur d'envoi est celui qui a l'adresse 33.33.133.133 et le nom de domaine chatsend.ca. 
Il est le nameserver du domaine emgt.xx.yy. 
Ainsi, lorsqu'une requête DNS demandant "ohyeah.emgt.xx.yy" est émise sur Internet, le serveur d'envoi la reçoit et l'interprète. 

Le système fonctionne avec un assemblage de plusieurs programmes. Il nécessite notamment apache et base32.
Chatavion étant un prototype extrêmement instable, le serveur utilisé peut planter sans prévenir. 
Il ne doit pas être utilisé pour autre chose. Tous les fichiers téléchargés depuis ce dépôt doivent être placés dans un même répertoire avec autorisation d'écriture. Toutes les commandes doivent être lancées en root.
On considère que le répertoire racine pour apache est /var/www/html/.

Le programme "sousdom" doit être compilé sur le serveur SEND. Le fichier source est sousdom.c. Exemple :
gcc -o sousdom sousdom.c

Le programme "rd2" doit aussi être compilé sur le serveur SEND. Le fichier source est recvdns.c. Exemple :
gcc -o rd2 recvdns.c

Une fois ces préparation effectuées, il n'y a plus qu'à lancer chat.sh en tâche de fond. Exemple :
nohup bash chat.sh &

chat.sh appelle rd2, qui attend une requête DNS. Quand une requête du type "ohyeah.emgt.xx.yy" est interceptée, rd2 enregistre le nom demandé dans un fichier "req". rd2 devait initialement renvoyer une réponse, mais je n'ai jamais réussi à forger un datagramme correct, alors j'ai laissé tomber cette partie, d'où ce bloc de code dégueulasse dans le fichier source.
chat.sh appelle ensuite sousdom, qui lit le fichier req et en extrait la première partie, celle qui vient avant le premier point (dans notre exemple, "ohyeah"). Ce programme en C est un vestige d'un autre projet très ancien et sa fonction pourrait être incluse directement dans le script. 
Pour des raisons techniques, les messages sont transmis en base32. La partie extraite est donc décodée avec base32.
Le programme ajoute la date et le préfixe "Avion : " au message, puis l'ajoute au bout d'un fichier (miaou.txt) directement dans le répertoire public du serveur apache.
L'idée est que ce fichier texte sera récupéré par le serveur de réception pour être redistribué sous forme de DNS.
Le programme se bloque pendant 35 secondes pour éviter de récupérer de nouvelles tentatives d'envoi du même message, puis reprend du début.
