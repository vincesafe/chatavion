#!/bin/bash

ord() {
  LC_CTYPE=C printf '%.2x' "'$1"
}

#echo `ord " "`
#exit
#msgid=$1
fullstr="$1"
substr=${fullstr:0:16}
offset=0
subid=1
while [ substr != "" ]
do
        ip=
        for col in {0..15}
        do
                hexnum="`ord \"${substr:$col:2}\"`"
                ip="$ip$hexnum"
                if [ $((col % 2)) -eq 1 ] && [ $col -ne 15 ]
                then # every 2 loops, add :, except for the last
                        ip="$ip:"
                fi
        done

        if [ "$ip" == "0000:0000:0000:0000:0000:0000:0000:0000" ]
        then
                exit
        fi
        echo "o$subid   AAAA    $ip"
        offset=$((offset+16))
        substr=${fullstr:$offset:16}
        subid=$((subid+1))
done
