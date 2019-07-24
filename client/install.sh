#!/bin/bash

# THIS TOOL SHOULD BE USED ONLY IN A TERMUX ENVIRONMENT ON ANDROID
# FOR OTHER LINUX SYSTEMS, PLEASE COMMENT THE FOLLOWING PKG LINES

pkg install dnsutils
pkg install coreutils
pkg install nano

wget https://raw.githubusercontent.com/vincesafe/chatavion/master/client/send.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/client/recepauto.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/client/ip2ascii.sh
wget https://raw.githubusercontent.com/vincesafe/chatavion/master/client/ip6ascii.sh

chmod u+x *.sh


