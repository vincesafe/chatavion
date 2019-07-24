/* recvdns.c version alpha 1
This code is under CC BY-NC-SA 3.0 license.
For more information, please visit the link below:
https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode

Ce code est sous licence CC BY-NC-SA 3.0.
Plus d'informations à l'adresse suivante :
https://creativecommons.org/licenses/by-nc-sa/3.0/fr/legalcode

By vincesafe, 
based on "demo-udp-03: udp-recv: a simple udp server" by Paul Krzyzanowski
http://vincesafe.fr/
https://twitter.com/vincesafe

*/

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <netdb.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define SERVICE_PORT 53
#define BUFSIZE 2048

int
main(int argc, char **argv)
{
	struct sockaddr_in myaddr;	/* our address */
	struct sockaddr_in remaddr;	/* remote address */
	socklen_t addrlen = sizeof(remaddr);		/* length of addresses */
	int recvlen;			/* # bytes received */
	int fd;				/* our socket */
	unsigned char buf[BUFSIZE];	/* receive buffer */
	int i;

	/* create a UDP socket */

	if ((fd = socket(AF_INET, SOCK_DGRAM, 0)) < 0) {
		perror("cannot create socket\n");
		return 0;
	}

	/* bind the socket to any valid IP address and a specific port (set by the client) */

	memset((char *)&myaddr, 0, sizeof(myaddr));
	myaddr.sin_family = AF_INET;
	myaddr.sin_addr.s_addr = htonl(INADDR_ANY);
	myaddr.sin_port = htons(SERVICE_PORT);

	if (bind(fd, (struct sockaddr *)&myaddr, sizeof(myaddr)) < 0) {
		perror("bind failed");
		return 0;
	}

	/* file to store domain */
	FILE *f = NULL;
	f = fopen("req", "wb");
	if(f == NULL) return -1;

	/* now loop, receiving data and printing what we received */
	for (;;) {
		printf("waiting on port %d\n", SERVICE_PORT);
		recvlen = recvfrom(fd, buf, BUFSIZE, 0, (struct sockaddr *)&remaddr, &addrlen);
		printf("received %d bytes\n", recvlen);
		if (recvlen > 0) {
			buf[recvlen] = 0;
			printf("received message: \"%s\"\n", buf);
			for(i = 0; i < recvlen; i++)
				fputc(buf[i], f);
			buf[2] = buf[2] & 0b10000000; // reply type
			buf[3] = buf[3] & 0b10000000; // authorative
			buf[7] = buf[7] & 0b00000001; // 1 answer
			for(i = recvlen - 1; i > recvlen - 28; i--)
				buf[i+16] = buf[i];
			buf[recvlen-27] = 0xc0;
			buf[recvlen-26] = 0x0c;
                        buf[recvlen-25] = 0;
                        buf[recvlen-24] = 1;
                        buf[recvlen-23] = 0;
                        buf[recvlen-22] = 1;
                        buf[recvlen-21] = 0;
                        buf[recvlen-20] = 0;
                        buf[recvlen-19] = 2;
                        buf[recvlen-18] = 0x58;
                        buf[recvlen-17] = 0;
                        buf[recvlen-16] = 4;
                        buf[recvlen-15] = 1;
                        buf[recvlen-14] = 2;
                        buf[recvlen-13] = 3;
                        buf[recvlen-12] = 4;

			// ...
			// sendto(fd, buf, recvlen+16, 0,(struct sockaddr *)&remaddr, addrlen);
			break;
		}
	}
	/* never exits */
}
