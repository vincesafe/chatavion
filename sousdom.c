/* sousdom.c version alpha 1
This code is under CC BY-NC-SA 3.0 license.
For more information, please visit the link below:
https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode

Ce code est sous licence CC BY-NC-SA 3.0.
Plus d'informations à l'adresse suivante :
https://creativecommons.org/licenses/by-nc-sa/3.0/fr/legalcode

By vincesafe
http://vincesafe.fr/
https://twitter.com/vincesafe

*/

#include <stdio.h>
#include <stdlib.h>

#define FNAME "req"

int main(void)
{
	FILE *f = NULL;
	f = fopen(FNAME, "rb");
	if(f == NULL)
		return -1;

	char str[140] = {0};
	char c = 0, i = 0;

	fseek(f, 13, SEEK_SET);

	do {
		c = fgetc(f);
		str[i] = c;
		i++;
	}	while(c > 9); /* pas un "point dns" */
	str[i-1] = 0; /* reset fin de chaine */

	printf("%s", str);
	
	return 0;
}