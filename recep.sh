#!/bin/bash

server=
offset=1

if [ $# -ge 1 ]
then
	server="@$1"
	if [ $# -ge 2 ]
	then
		offset=$2
	fi
fi

echo "Server $server"
echo "Offset $offset"

while [ 1 -eq 1 ]
do
subs=`dig m$offset.getmmsg.us.to txt | grep \" | cut -d'"' -f 2`
if [ "$subs" = "" ] # no result found
then
	echo "Next offset: $offset"
	exit
fi
echo $subs
offset=$((offset+1))
done
