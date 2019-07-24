#!/bin/bash

SENDWEB="chatsend.ca"
RECV="getmmsg.xx.yy"

cp avionfile.vierge avionfile.conf
rm miaou.txt
wget http://$SENDWEB/miaou.txt > /dev/null
sed 's/\"//g' miaou.txt > miaou2.txt
mv miaou2.txt miaou.txt
nline=0
while read -r line
do
        nline=$((nline + 1))
        echo "m$nline                     A      1.2.3.4" >> avionfile.conf # A record: extract time
        echo "                       TXT        \"$line \" " >> avionfile.conf # TXT record

        # generate IPv4-only messages
        ./ip.sh "$line" > sub.txt
        while read -r subline
        do
                echo "m$nline.$subline" >> avionfile.conf
        done < sub.txt
        echo "" >> avionfile.conf

        # generate IPv6-only messages
        ./ip6.sh "$line" > sub.txt
        while read -r subline
        do
                echo "m$nline.$subline" >> avionfile.conf
        done < sub.txt
        echo "" >> avionfile.conf

done < miaou.txt
cp avionfile.conf /etc/bind/$RECV
service bind9 reload
