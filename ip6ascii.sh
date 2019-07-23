#!/bin/bash

chr() {
  [ "$1" -lt 256 ] || return 1
  printf "\\$(printf '%03o' "$1")" 2> /dev/null
}

ip="$1"
block=1

while [ $block -le 8 ]
do
        num=`echo $ip | cut -d ":" -f$block`
        if [ "$num" != "" ]
        then
        dec=$((16#$num))
        c1=$((dec/256))
        c2=$((dec % 256))
        if [ $c1 -eq 0 ]
        then # convert 0 to spaces to avoid errors
                c1=32
        fi
        if [ $c2 -eq 0 ]
        then
                c2=32
        fi
        echo -n `chr $c1`
        echo -n `chr $c2`
        fi
        block=$((block+1))
done
