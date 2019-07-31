# chatavion
Messaging system over DNS

WARNING! THIS IS AN EXPERIMENTAL, HIGHLY UNSTABLE PROJECT. 
IT SHOULD BE USED ONLY ON A DEDICATED VIRTUAL MACHINE. 
CONTRIBUTIONS ARE WELCOME.

Chatavion is a messaging system working only over DNS.
It may be used on almost every public Wi-Fi network, without authentication or payment. 
It was made to chat on (expensive) airplane networks for free, and it did work!

It was originally meant to be a proof of concept to send emergency messages in a plane. The design and the code are a shame - but it's improving! And well, it works. :) 

Chatavion is made of 3 parts:
 - A command line interface for Android, designed to be used over the free app Termux
 - A server that requires bash, the base32 command and Node.js with node-named
 - A DNS configuration that can be delegated to a provider like freedns.afraid.org
 
You can find diagrams to understand these parts on [this forum](https://zestedesavoir.com/forums/sujet/12757/chatavion-une-messagerie-passe-partout/#p206189) (in French). 
 
1. DNS configuration

The server needs a static IP address. A domain name must be associated to that server. Example:

chatavion.ca    A    33.33.133.133

Then, 2 other domains have to forward requests to that server, which will process them.
To do so, we define NS entries, e.g.:

getmmsg.xx.yy   NS   chatavion.ca

emgt.xx.yy      NS   chatavion.ca

2. Server

The server has the address 33.33.133.133 and the domain chatavion.ca. 
It is the nameserver of both domains emgt.xx.yy and getmmsg.xx.yy. Thus, when someone asks for the domain "ohyeah.emgt.xx.yy" or "m1.getmmsg.us.to" on the Internet, 
the server receives the request and processes it.

The system requires Node.js, with the node-named package, and the base32 command.

Chatavion is still an unstable prototype, it may crash the server. Do not use it for any other purpose. 
Every command must be run under the root account, and from the same directory with read-write rights. 

Install the node-named package with the following command:
```npm install node-named```

In chatsend.js, modify the RECV and SEND variables to match your configuration. Once done, just start chatsend.js as a backgound task. E.g.:
```nohup nodejs chatsend.sh &```

chatsend.js starts a DNS server, listening on UDP port 53.

DNS requests are caught and processed. If the part after the second dot matches SEND, the following is executed.

The first part, before the first dot, in extracted and base32 decoded. If that fails, the request is not processed any further. The message is logged into the log file defined in the logFile variable, with the date and the "Avion : " ("plane") prefix. This part means this message comes from a likely unstable network (supposedly, a plane), 
in opposition to the "Terre" ("Ground") prefix used in a regular web client (not in this deposit). A DNS reply (42.42.42.42) is sent to inform that the request was received, even if no message was recorded, to avoid multiple retries. If 2 or more identical requests are received, only the first one is processed, in order to avoid duplicates in the conversation log.

If the part after the second dot matches RECV, the following happens.

The log file is loaded in memory, line by line. The first part of the domain (before the first dot) is processed to match one of the following possibilities:
 - mX answers the query with a text record (TXT type) containing the whole raw message on line X
 - mX.nY answers the query with an IP address record (type A) containing 4 characters from message #X with #Y offset, converted in digital values according to the ASCII encoding (the toIPv4 function does the conversion)
 - mX.oY answers the query with an IPv6 address record (type AAAA) containing 16 characters from message #X with #Y offset, converted in hexadecimal values according to the ASCII encoding (the toIPv6 function does the conversion)
  
Thus, a TXT type DNS request on m1.getmmsg.xx.yy will get the first message from the conversation log, m2.getmmsg.xx.yy will get the second, and so on.

Some networks allow TXT type requests, like SNCF's TGV Wi-Fi (French high speed trains), but some do not allow them, like ANA on-board Wi-Fi (a Japanese airline company). Yes, I actually tried. As an alternative, we can get messages in the form of numbers, with IP addresses. Thus, a A type (IP address) DNS request on m1n1.getmmsg.xx.yy will get the 4 first characters of the first message. 
m1n2.getmmsg.xx.yy will get the 5th to 8th characters of the first message. 
m2n1.getmmsg.xx.yy will get the 4 first characters of the second message, and so on. 
The same way, a AAAA type (IPv6 address) on m1o1.getmmsg.xx.yy will get the 16 first characters of the first message.

3. Client

A client for Android was made to work under the Termux app, a terminal emulator. It is composed on the following files: 
send.sh, newrecep.sh, ip6ascii.sh and ip2ascii.sh. 
To install them all in a row, as well as necessary packages, you can download and execute install.sh: 

```wget https://raw.githubusercontent.com/vincesafe/chatavion/mono/install.sh```

```bash install.sh```

Make sure to be in an empty directory with read-write access before using it. The client from this mono branch is NOT compatible with servers from other branchs, such as master and node.

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

newrecep.sh simply makes DNS requests (m1.getmmsg.xx.yy, ...) to receive messages from the log. Before using it, replace getmmsg.xx.yy with the NS name that forwards requests to the RECV server.

It takes 2 optional parameters: the DNS server to ask and an offset. I advise using the same DNS server as for the sending program. The offset is the line number from which messages shall be read. It avoids reloading former messages you've already got. 
That is really useful when the log is big or when the network is slow. E.g.:

```./recepauto.sh 1.2.3.4 5```

That command asks the DNS server 1.2.3.4 to get messages from line #5. After all messages are read (when the program gets no more reply, or an error), the next offset is displayed to save time for the next time.

3 modes are tried, from the fastest to the slowest. The first is the text mode. TXT type DNS requests are sent and a whole message in included in the answer. That type of requests may be filtered by the Internet access provider. The second mode is IPv6. Chunks are asked until the whole message is received. Characters are stored in the form of a IPv6 address, which is 16 bytes long, so we can get 16 characters at most for each request. The third mode is very similar, but with IPv4. They are only 4 bytes long, so getting 4 characters from each request is long, but it is the least likely to be filtered.
