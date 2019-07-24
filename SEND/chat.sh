# chat.sh - chatavion send server version alpha 1
# Code under CC BY-NC-SA 3.0 license
# By vincesafe - vincesafe.fr
# twitter.com/vincesafe

#!/bin/bash

while [ 1 -eq 1 ]
do
./rd2
presd=`./sousdom`
capsd=`echo ${presd^^}`
sd=`echo $capsd | base32 --decode`
if [ $? -eq 0 ] && [ "$sd" != "" ]
then # no base32 input error
  echo "Statut : $sd"
  date=`date +%H:%M\ %d/%m/%Y`
  echo "$date Avion : $sd" >> /var/www/html/miaou.txt
  echo "Enregistré dans la conversation"
  echo "Délai de 35 secondes..."
  sleep 35
fi
done
