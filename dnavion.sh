#!/bin/bash

cp avionfile.vierge avionfile.conf
rm miaou.txt
wget http://vsi.us.to/miaou.txt
sed 's/\"//g' miaou.txt > miaou2.txt
mv miaou2.txt miaou.txt
nline=0
while read -r line
do
	nline=$((nline + 1))
	echo "m$nline                     A      1.2.3.4" >> avionfile.conf # A record: extract time
	echo "                       TXT	\"$line \" " >> avionfile.conf # TXT record
	# generate IP-only messages
	./ip.sh "$line" > sub.txt
	while read -r subline
	do
		echo "m$nline.$subline" >> avionfile.conf
	done < sub.txt
	echo "" >> avionfile.conf
done < miaou.txt
cp avionfile.conf /etc/bind/getmmsg.us.to
service bind9 reload
