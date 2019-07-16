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
 
