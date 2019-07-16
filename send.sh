#!/bin/bash

srv=`cat dnserv`
echo "Serveur en cours : $srv"
echo "Pour préciser un serveur, tapez @x.x.x.x dans dnserv."
echo "En paramètre, tapez votre message entre guillemets."

if [ $# -lt 1 ]
then
	echo "Pas de message à envoyer."
	exit
fi

msg=`echo "$1" | base32`
### REPLACE emgt.xx.yy WITH THE DOMAIN USED TO SEND MESSAGES
dig $srv $msg.emgt.xx.yy > logdig.txt 2&>1
echo "Tentative d'envoi. Utilisez recep.sh ou rnum.sh pour vérifier."
