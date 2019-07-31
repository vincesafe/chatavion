# chatavion
Messaging system over DNS

WARNING! THIS IS AN EXPERIMENTAL, HIGHLY UNSTABLE PROJECT. 
IT SHOULD BE USED ONLY ON A DEDICATED VIRTUAL MACHINE. 
CONTRIBUTIONS ARE WELCOME.

Chatavion is a messaging system working only over DNS.
It may be used on almost every public Wi-Fi network, without authentication or payment. 
It was made to chat on (expensive) airplane networks for free, and it did work!

It was originally meant to be a proof of concept to send emergency messages in a plane. The design and the code are a shame - don't blame me, that's not my job! But well, it works. :) 

Chatavion is made of 4 parts:
 - A command line interface for Android, designed to be used over the free app Termux
 - A SEND server that requires bash, the base32 command and Node.js with node-named
 - A reception server (RECV) that requires bash, a DNS server (bind) and cron (optional)
 - A DNS configuration that can be delegated to a provider like freedns.afraid.org
 
You can find diagrams to understand these parts on [this forum](https://zestedesavoir.com/forums/sujet/12757/chatavion-une-messagerie-passe-partout/#p206189) (in French). 
 
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

The system requires Node.js, with the node-named package, and base32.

Chatavion is still an unstable prototype, it may crash the server. Do not use it for any other purpose. 
Every file from this repository must be placed in the same directory with read-write rights. 
Everything has to be executed under the root account.

Install the node-named package with the following command:
```npm install node-named```

Once done, just start chatsend.js as a backgound task. E.g.:
```nohup nodejs chatsend.sh &```

chatsend.js starts a web server, listening on TCP port 80, and a DNS server, listening on UDP port 53. Both run independantly. Every HTTP request sends back the conversation log miaou.txt.

DNS requests are caught and processed. The first part, before the first dot, in extracted and base32 decoded. If that fails, the request is not processed any further. The message is logged into the miaou.txt log file, with the "Avion : " ("plane") prefix. This part means this message comes from a likely unstable network (supposedly, a plane), 
in opposition to the "Terre" ("Ground") prefix used in a regular web client (not in this deposit). A DNS reply (42.42.42.42) is sent to inform that the request was received, even if no message was recorded, to avoid multiple retries. If 2 or more identical requests are received, only the first one is processed, in order to avoid duplicates in the conversation log.

That miaou.txt log file will then be grabbed by the RECV server, which will include its contents into the DNS server.

3. Reception server

The RECV server has the address 66.66.166.166 and the domain chatrecv.ca. 
It is the nameserver of the domain getmmsg.xx.yy. Thus, when someone asks for the domain "ohyeah.getmmsg.xx.yy" on the Internet, 
the RECV server receives the request and processes it.

Just like the SEND server, it is a very unstable prototype, it may randomly crash the server. Do not use it for any other purpose. 
Every file from this repository must be placed in the same directory with read-write rights. 
Everything has to be executed under the root account. 

The RECV server requires the DNS server bind with its default configuration. /etc/bind/named.conf.local must be replaced with the named.conf.local from this deposit. Replace getmmsg.xx.yy with your NS name that forwards requests toward the reception server.

On that server, you will need the following files: avionfile.vierge, ip.sh, ip6.sh, dnavion.sh and cron.sh (optional if your server allows cron). In avionfile.vierge, replace getmmsg.xx.yy the same way. Replace also 66.66.166.166 with the RECV server IP address. 

In dnavion.sh, replace getmmsg.xx.yy just like before. chatsend.ca must be replaced with the SEND server address.

In order to get the system working, bind must be started first. dnavion.sh must then be executed regularly, either with a cron (every minute) or using the cron.sh script as a background task, e.g.: 

```nohup bash cron.sh &```

dnavion.sh downloads miaou.txt (the conversation log) from the SEND server. All the double quotes are removed to avoid crashes, since messages will be copied in a configuration file.

It copies an empty configuration template (avionfile.vierge). It is then filled with the log file according to the following pattern:
 - mX is a text record (TXT type) containing the whole raw message on line X
 - mX.nY is an IP address record (type A) containing 4 characters from message #X with #Y offset, converted in digital values according to the ASCII encoding (ip.sh does the conversion)
  - mX.oY is an IPv6 address record (type AAAA) containing 16 characters from message #X with #Y offset, converted in hexadecimal values according to the ASCII encoding (ip6.sh does the conversion)
  
Thus, a TXT type DNS request on m1.getmmsg.xx.yy will get the first message from the conversation log, m2.getmmsg.xx.yy will get the second, and so on.

Some networks allow TXT type requests, like SNCF's TGV Wi-Fi (French high speed trains), but some do not allow them, like ANA on-board Wi-Fi (a Japanese airline company). Yes, I actually tried. As an alternative, we can get messages in the form of numbers, with IP addresses. Thus, a A type (IP address) DNS request on m1.n1.getmmsg.xx.yy will get the 4 first characters of the first message. 
m1.n2.getmmsg.xx.yy will get the 5th to 8th characters of the first message. 
m2.n1.getmmsg.xx.yy will get the 4 first characters of the second message, and so on. 
The same way, a AAAA type (IPv6 address) on m1.o1.getmmsg.xx.yy will get the 16 first characters of the first message.

4. Client

A client for Android was made to work under the Termux app, a terminal emulator. It is composed on the following files: 
send.sh, recepauto.sh, ip6ascii.sh and ip2ascii.sh. 
To install them all in a row, as well as necessary packages, you can download and execute install.sh: 

```wget https://raw.githubusercontent.com/vincesafe/chatavion/master/install.sh```

```bash install.sh```

Make sure to be in an empty directory with read-write access before using it.

send.sh is used to send messages. In that file, replace emgt.xx.yy with the NS name that forwards requests to the SEND server.

Your network may filter DNS requests and allow only the usage of the DNS server provided by DHCP. Use an app like Network Info 2 
to get that server address, and write it in a "dnserv" file, e.g.:

```echo "@1.2.3.4" > dnserv```

To use the send program, use the following command: 

```./send.sh "here is a message"```

send.sh converts the message into base32 and makes a request to (base32message).emgt.xx.yy. 
If everything works fine, that request reaches the SEND server and the message is decoded and logged. 
If the 42.42.42.42 reply is received from SEND, the program indicated that the message was received. However, it does not mean it was actually processed. For instance, sending consecutively the same message will not work.

Provided the system unstability, avoiding special characters is better.

recepauto.sh simply makes DNS requests (m1.getmmsg.xx.yy, ...) to receive messages from the log. Before using it, replace getmmsg.xx.yy with the NS name that forwards requests to the RECV server.

It takes 2 optional parameters: the DNS server to ask and an offset. I advise using the same DNS server as for the sending program. The offset is the line number from which messages shall be read. It avoids reloading former messages you've already got. 
That is really useful when the log is big or when the network is slow. E.g.:

```./recepauto.sh 1.2.3.4 5```

That command asks the DNS server 1.2.3.4 to get messages from line #5. After all messages are read (when the program gets no more reply, or an error), the next offset is displayed to save time for the next time.

3 modes are tried, from the fastest to the slowest. The first is the text mode. TXT type DNS requests are sent and a whole message in included in the answer. That type of requests may be filtered by the Internet access provider. The second mode is IPv6. Chunks are asked until the whole message is received. Characters are stored in the form of a IPv6 address, which is 16 bytes long, so we can get 16 characters at most for each request. The third mode is very similar, but with IPv4. They are only 4 bytes long, so getting 4 characters from each request is long, but it is the least likely to be filtered.

The conversation log (miaou.txt) is synchronized every minute or more, according to the cron running on RECV. Remember there will be a delay between the time a message is send and the time it can be retrieved.
