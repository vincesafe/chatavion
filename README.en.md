# chatavion
Messaging system over DNS

WARNING! THIS IS AN EXPERIMENTAL, HIGHLY UNSTABLE PROJECT. 
IT SHOULD BE USED ONLY ON A DEDICATED VIRTUAL MACHINE. 
CONTRIBUTIONS ARE WELCOME.

Chatavion is a messaging system working only over DNS.
It may be used on almost every public Wi-Fi network, without authentication or payment. 
It was made to chat on (expensive) airplane networks for free, and it did work!

Chatavion is made of 4 parts:
 - A command line interface for Android, designed to be used over the free app Termux
 - A SEND server that requires bash, a C compiler (gcc), the base32 command and a web server (Apache) 
 - A reception server (RECV) that requires bash, a DNS server (bind) and cron (optional)
 - A DNS configuration that can be delegated to a provider like freedns.afraid.org
 
1. DNS configuration

Both servers (SEND and RECV) need a static IP address. A domain name must be associated to each server. Random example:

chatrecv.ca    66.66.166.166

chatsend.ca    33.33.133.133

Then, 2 other domains have to forward requests to these servers, which will process them.
To do so, we define NS entries, e.g.:

getmmsg.xx.yy   NS   chatrecv.ca

emgt.xx.yy      NS   chatsend.ca

2. SEND server

The SEND server has the address 33.33.133.133 and the domain chatsend.ca. 
It is the nameserver of the domain emgt.xx.yy. Thus, when someone asks for the domain "ohyeah.emgt.xx.yy" on the Internet, 
the SEND server receives the request and processes it.

The system is a patchwork of several programs. It requires apache and base32.

Chatavion is a very unstable prototype, it may randomly crash the server. Do not use it for any other purpose. 
Every file from this repository must be placed in the same directory with read-write rights. 
Everything has to be executed under the root account. We will consider /var/www/html/ as the apache directory for web files.

"sousdom" program must be built on the SEND server with the source file sousdom.c. E.g.:
```gcc -o sousdom sousdom.c```

"rd2" program must also be built on the SEND server, with the source file recvdns.c. E.g.:
```gcc -o rd2 recvdns.c```

Once done, just start chat.sh as a backgound task. E.g.:
```nohup bash chat.sh &```

chat.sh calls rd2, which waits for a DNS request. 
When it receives a request like "ohyeah.emgt.xx.yy", rd2 writes that name in a "req" file.
Initially, rd2 was supposed to send a reply, but I never managed to generate an appropriate datagram, so I gave it up.
That's why there is a crappy block of code in the source file.

Then, chat.sh calls sousdom, which reads the "req" file and extracts the first part, before the first dot ("ohyeah" in the example).
That C program is from a very old project of mine, its function could be directly included in the script.

For technical reasons, messages are transmitted encoded in base32. The extracted part is decoded with the base32 command. 
The program adds the date and the "Avion : " prefix before the message, and appends it to a file ("miaou.txt") located in Apache 
public directory. The "Avion" ("plane") part means this message comes from a likely unstable network (supposedly, a plane), 
in opposition to the "Terre" ("Ground") prefix used in a regular web client (not in this deposit).

That miaou.txt log file will then be grabbed by the RECV server, which will include its contents into the DNS server.
The program is blocked for 35 seconds after it gets a message, to prevent future attemps for the same message to be written again. 
Then, it starts over again.

