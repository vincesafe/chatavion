#!/bin/bash

SEND="emgt.xx.yy"

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
dig $srv $msg.$SEND | grep 42.42.42.42  > /dev/null
if [ $? -eq 0 ]
then # server sends 42.42.42.42 = success
        echo "Message envoyé avec succès."
else
        echo "Pas de réponse du serveur. Utilisez recepauto.sh pour vérifier."
fi
