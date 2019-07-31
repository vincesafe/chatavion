#!/bin/bash

### REPLACE getmmsg.xx.yy WITH THE DOMAIN USED TO RETRIEVE MESSAGES
RECV="getmmsg.xx.yy"

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

# Tries TXT first (mode 0), then AAAA (mode 1 to be implemented), then A (mode 2)
mode=0
subs=`dig $server m1.$RECV txt | grep \" | cut -d'"' -f 2`
if [ "$subs" = "" ] # no result found
then
  echo "TXT request failed, trying AAAA request..."
  mode=1
  subs=`dig $server m1o1.$RECV aaaa | grep AAAA | grep ':' | cut -f5`
  if [ "$subs" = "" ] # no result found for IPv6
  then
    echo "AAAA request failed, trying A request..."
    mode=2
  fi
fi

if [ $mode -eq 0 ]
then

  while [ 1 -eq 1 ]
  do
  subs=`dig $server m$offset.$RECV txt | grep \" | cut -d'"' -f 2`
  if [ "$subs" = "" ] # no result found
  then
        echo "Next offset: $offset"
        exit
  fi
  echo $subs
  offset=$((offset+1))
  done

elif [ $mode -eq 1 ]
then

        while [ 1 -eq 1 ]
        do
        suboff=1
        subs=""
        while [ $suboff -ge 0 ]
        do
                ipaddr=`dig $server m$offset\o$suboff.$RECV aaaa | grep AAAA | grep ':' | cut -f5`
                if [ "$ipaddr" != "" ] && [ "$ipaddr" != "0000:0000:0000:0000:0000:0000:0000:0000" ] && [ "$ipaddr" != "::" ]
                then # IPv6 found
                        chars="`./ip6ascii.sh $ipaddr`"
                        subs="$subs$chars"
                        suboff=$((suboff+1))
                else #failure: end of message of end of file
                        suboff=-1
                fi
        done
        if [ "$subs" = "" ] # no result found
        then
                echo "Next offset: $offset"
                exit
        fi
        echo $subs
        offset=$((offset+1))
        done

elif [ $mode -eq 2 ]
then
        while [ 1 -eq 1 ]
        do
        suboff=1
        subs=""
        while [ $suboff -ge 0 ]
        do
                dig $server m$offset\n$suboff.$RECV | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}' > tmpip
                if [ `wc -l tmpip | cut -f 1 -d " "` -ge 3 ] && [ "$server" == "" ]
                then # 3 IP addresses in the log + no server defined = 1st is content
                        read -r ipaddr < tmpip
                        chars="`./ip2ascii.sh $ipaddr`"
                        if [ "$chars" == "" ] || [ "$ipaddr" == "0.0.0.0" ]
                        then
                                suboff=-1
                        fi
                        subs=$subs$chars
                        suboff=$((suboff+1))
                elif [ `wc -l tmpip | cut -f 1 -d " "` -ge 4 ] # server defined + content found
                then
                        while read -r ipaddr
                        do
                                if [ "$ipaddr" != "$1" ]
                                then # IP different from server is content
                                        chars="`./ip2ascii.sh $ipaddr`"
                                        subs=$subs$chars
                                        suboff=$((suboff+1))
                                fi
                        done < tmpip
                else #failure: end of message of end of file
                        suboff=-1
                fi
        done
        if [ "$subs" = "" ] # no result found
        then
                echo "Next offset: $offset"
                exit
        fi
        echo $subs
        offset=$((offset+1))
        done
fi
