#!/bin/bash

ord() {
  LC_CTYPE=C printf '%d' "'$1"
}

#msgid=$1
fullstr="$1"
quartstr=${fullstr:0:4}
offset=0
subid=1
while [ quartstr != "" ]
do
	chat1=`ord ${quartstr:0:1}`
	chat2=`ord ${quartstr:1:1}`
	chat3=`ord ${quartstr:2:1}`
	chat4=`ord ${quartstr:3:1}`
	if [ $chat1 == "0" ] && [ $chat2 == "0" ] && [ $chat3 == "0" ] && [ $chat4 == "0" ]
	then
		exit
	fi
	echo "n$subid 	A	$chat1.$chat2.$chat3.$chat4"
	offset=$((offset+4))
	quartstr=${fullstr:$offset:4}
	subid=$((subid+1))
done
