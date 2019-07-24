#!/bin/bash

chr() {
  [ "$1" -lt 256 ] || return 1
  printf "\\$(printf '%03o' "$1")"
}

ip="$1"
n1=`echo $ip | cut -d "." -f 1`
n2=`echo $ip | cut -d "." -f 2`
n3=`echo $ip | cut -d "." -f 3`
n4=`echo $ip | cut -d "." -f 4`

# replace 0 with blank space 32 (0x20)
if [ $n1 -eq 0 ]
then
	n1=32
fi
if [ $n2 -eq 0 ]
then
        n2=32
fi
if [ $n3 -eq 0 ]
then
        n3=32
fi
if [ $n4 -eq 0 ]
then
        n4=32
fi


c1=`chr $n1`
c2=`chr $n2`
c3=`chr $n3`
c4=`chr $n4`

echo -n "$c1$c2$c3$c4"
