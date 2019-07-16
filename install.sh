#!/bin/bash

# THIS TOOL SHOULD BE USED ONLY IN A TERMUX ENVIRONMENT ON ANDROID
# FOR OTHER LINUX SYSTEMS, PLEASE COMMENT THE FOLLOWING PKG LINES

pkg install dnsutils
pkg install coreutils
pkg install nano

wget https://raw.githubusercontent.com/vincesafe/chatavion/master/send.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/recep.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/ip2ascii.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/rnum.sh

chmod u+x *.sh


