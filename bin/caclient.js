// This is a Node.js Chatavion client.
// It requires readline-sync and hi-base32. Install then with the following command: npm install readline-sync hi-base32
// This program is NOT compatible with former bash Chatavion servers.

var base32 = require('hi-base32');
const { Resolver } = require('dns').promises;
const dns = new Resolver();


function testIPv4(addr) {
	var regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/g;
	return regex.test(addr);
}

function ip6ascii(addr) {
	if(addr == "0000:0000:0000:0000:0000:0000:0000:0000" || addr == "::")
		return "";
	var text = "";
	var numbers = addr.split(":");
	var curNumber = 0;
	for(var i = 0; i < numbers.length; i++) {
		curNumber = parseInt(numbers[i], 16);
		text = text + String.fromCharCode(curNumber / 256);
		text = text + String.fromCharCode(curNumber % 256);
	}
	return text;
}

function ip4ascii(addr) {
        if(addr == "0.0.0.0")
                return "";
        var text = "";
        var numbers = addr.split(".");
        var curNumber = 0;
        for(var i = 0; i < numbers.length; i++) {
                curNumber = parseInt(numbers[i]);
                text = text + String.fromCharCode(curNumber);
        }
        return text;
}


async function recep(offset, srv, recv) {
	var mode = 2;	// reception mode: 0 TXT / 1 AAAA / 2 A
	var query = "m1." + recv;
	var res = "";
	try {
		res = await srv.resolveTxt(query);
	} catch (e) { }
	if(res.length > 0) {	// result found: TXT mode is fine
		mode = 0;
		console.log("Setting receive mode to TXT");
//		console.log("res is " + res);
	}
	else {	// otherwise, try AAAA, then default to A
		console.log("No result for TXT request, will try AAAA");
		query = "m1o1." + recv;
		try {
			res = await srv.resolve6(query);
		} catch (e) { } 
		if(res.length > 0) { // result found: AAAA mode is ok
			mode = 1;
			console.log("Setting receive mode to AAAA");
//			console.log("res is " + res);
		}
		else	// last chance, no need to try to choose mode
			console.log("Setting receive mode to A");
	}

	// actual reception and display
	if(mode == 0) {	// TXT mode
		do {
			query = "m"+offset+"."+recv;
			try {
				res = await srv.resolveTxt(query);
				console.log(res[0][0]);
				offset++;
			} catch (e) {res = "" }
		} while(res.length > 0);
	}
	else if(mode == 1) {	// AAAA mode
		var colOffset = 1;
		var line = "";
		var subs = "";
		var res = "";
		do {
			if(colOffset == 1) line = ""; // new line
			try {
				query = "m"+offset+"o"+colOffset+"."+recv;
				res = await srv.resolve6(query);
				subs = ip6ascii(res[0]);
				if(subs.length > 0) { 
					line = line + subs;
					colOffset++;
				}
				else { // no result: next line
					colOffset = 1;
					offset++;
					console.log(line);
				}
			} catch (e) { 
				line = "";
				console.log("End of messages. Next offset: " + offset); 
				console.log("Exception: " + e);
			}
		} while (line != "");
	}
	else {	// A mode
                var colOffset = 1;
                var line = "";
                var subs = "";
                var res = "";
                do {
                        if(colOffset == 1) line = ""; // new line
                        try {
                                query = "m"+offset+"n"+colOffset+"."+recv;
                                res = await srv.resolve4(query);
                                subs = ip4ascii(res[0]);
                                if(subs.length > 0) {
                                        line = line + subs;
                                        colOffset++;
                                }
                                else { // no result: next line
                                        colOffset = 1;
                                        offset++;
                                        console.log(line);
                                }
                        } catch (e) {
                                line = "";
                                console.log("End of messages. Next offset: " + offset);
                                console.log("Exception: " + e);
                        }
                } while (line != "");

	}

	return offset - 1; // -1 to avoid last \n
}

async function sendm(message, srv, send) {
	var req =  base32.encode(message) + "." + send;
	console.log("Will ask " + srv.getServers()[0] + " for " + req);
	var addresses = "";
	try {
		addresses = await srv.resolve4(req);
	} catch (e) { console.log("Error: " + e); }
	return addresses;
}

var readline = require('readline-sync');

var nextOffset = 1;

var defaultDnserv = "";
try {
	defaultDnserv = dns.getServers()[0];
} catch (e) { defaultDnserv = "8.8.8.8"; }
var dnserv = readline.question("DNS server ["+defaultDnserv+"]: ");

if(dnserv != "") { // no empty input
	try {
		dns.setServers([dnserv]);
	} catch (e) {
		console.log("Invalid DNS server. Using default server " + defaultDnserv);
		dns.setServers([defaultDnserv]);
	}
}
else 	// empty input: reset server in case no DNS server was set
	dns.setServers([defaultDnserv]);


var SEND = readline.question("SEND address: ");
var RECV = readline.question("RECV address: ");


(async () => {
nextOffset = await recep(nextOffset, dns, RECV); // display contents
var input = "";
while(input != "q") {
	input = readline.question("Command: ");
	if(/^s /g.test(input)) { // input starts with s 
		var addr = await sendm(input.substring(2), dns, SEND);
		if(addr.includes("42.42.42.42"))
			console.log("Message successfully received!");
		else
			console.log("No reply from server. Your message may not have been received.");

	}
	else if(/^r/g.test(input)) { // input starts with r 
		var offset = parseInt(input.substring(1)); // r4 = receive from offset 4
		if(offset >= 1) // avoids negatives, 0 and NaN
			nextOffset = offset;
		else if(input.length != 1) // r uses default offset, other inputs are invalid
			console.log("Invalid offset, ignoring input");
		console.log("Will call recep with offset " + nextOffset);
		nextOffset = await recep(nextOffset, dns, RECV);
	}
	else if(/^q/g.test(input)) { // input starts with q
		console.log("Thanks for using chatavion!");
		process.exit();
	}
	else /*if(/^h/g.test(input))*/ { // input starts with h
		console.log("Commands: ");
		console.log("Send a message: s your message");
		console.log("Receive unread messages: r");
		console.log("Receive messages from line 4: r 4");
		console.log("Quit: q");
	}
}
}) ();
