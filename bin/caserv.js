// This is a Node.js Chatavion server, community edition.
// It requires node-named and hi-base32. Install then with the following command: npm install node-named hi-base32
// This program is NOT compatible with former bash Chatavion clients.
// Make sure to edit the following variables before starting this program.
// A log file must be created for each community before starting this program (e.g. solo.log, zds.log, ...).

var COMMUNITIES = [ "solo", "zds", "miaou" ];
const SRVDOMAIN = "caserv.blah";

function toIPv4(subs) {
        var ip = "";
        for(var i = 0; i < 4; i++) {
                var val = 0;
                if(i < subs.length)
                        val = subs[i].charCodeAt();
                ip = ip + val;
                if(i != 3)
                        ip = ip + ".";
        }
        return ip;
}

function toIPv6(subs) {
        var ip = "";
        for(var i = 0; i < 16; i++) {
                var val = "00";
                if(i < subs.length)
                        val = subs[i].charCodeAt().toString(16);
                if(val.length == 1)     // force 2 digits
                        val = "0" + val;
                ip = ip + val;
                if(i % 2 == 1 && i != 15)
                        ip = ip + ":";
        }
        return ip;
}

const { exec } = require('child_process');
const fs = require('fs');
var base32 = require('hi-base32');
var named = require('node-named');
var server = named.createServer();

var previousDomain = '0';
// dns chat part
server.listen(53, '0.0.0.0', function() {
  console.log('DNS server started on port 53');
  console.log("Allowed communities: " + COMMUNITIES);
});

server.on('query', function(query) {
    var domain = query.name();
    console.log('Query: ' + domain);

    var type = "";
    var words = domain.split('.');
    if(words[0][0] == "m") // starts with m: assume recv request
        type = "RECV";
    else {
        try {
            var test = base32.decode(words[0]);
            if(test != "")  // able to decode: it is a message
                type = "SEND";
        } catch (e) {   // unable to decode: type void
            type = "";
        }
    }

    if(type != "") {
        var COMMUNITY = words[1];
        if(!COMMUNITIES.includes(COMMUNITY))
            type = "";  // If the community is not expected on this server,
                        // the type is void so nothing is processed.
        const SEND = COMMUNITY + "." + SRVDOMAIN;
        const RECV = SEND;
        var logFile = "./" + COMMUNITY + ".log";
    }

    if(type == "SEND") { // if the request is a new message -> SEND
      if(previousDomain != domain) {
        var sousdom = words[0];
        var decodedom = base32.decode(sousdom.toUpperCase());
        console.log("Message: " + decodedom);
        // date to be improved
        var curDate = new Date(Date.now());
        fs.appendFileSync(logFile, curDate.toLocaleString('fr-FR') + " Avion : " + decodedom + "\n", function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("Miaou (log) file was saved!");
        });
      }
      // 42.42.42.42 means success
      var target = new named.ARecord('42.42.42.42');
      // 60 is the ttl for this record
      query.addAnswer(domain, target, 60);
      console.log("Sending DNS answer");
      server.send(query);



    }
    else if(type == "RECV") { // if the request is for reception, e.g. m1.get.xx or m1n1.get.xx
      // load log file
      var fullLog = fs.readFileSync(logFile, "ascii");
      var logLines = fullLog.split("\n");
      var reqType = 2;  // type of request. mX (TXT) = 0, mXoY (AAAA) = 1, mXnY (A) = 2
      var tmp = words[0].split("n");
      var lineOffset = 0;
      var colOffset = 0;
      if(tmp.length == 2) { // found n
        reqType = 2;
        lineOffset = parseInt(tmp[0].split("m")[1]);
        colOffset = parseInt(tmp[1]);
      }
      else {
        var tmp2 = tmp[0].split("o");
        if(tmp2.length == 2) { // found o
          reqType = 1;
          lineOffset = parseInt(tmp2[0].split("m")[1]);
          colOffset = parseInt(tmp2[1]);
        }
        else { // neither n nor o found, assume TXT type
          reqType = 0;
          lineOffset = parseInt(tmp2[0].split("m")[1]);
        }
      }
//      var lineOffset = parseInt(words[0].split("m")[1]); // tries to parse 1 from m1, for example, will be NaN if it fails
      console.log("Line offset " + lineOffset + " / Length " + logLines.length + " / reqType " + reqType + " / colOffset " + colOffset);
      if(lineOffset <= logLines.length) { // if the line actually exists (will fail if NaN)
        if(reqType == 0) { // m1.get.xx supposed = TXT mode
          console.log("RECV MODE TEXTE");
          var target = new named.TXTRecord(logLines[lineOffset-1]);
          query.addAnswer(domain, target, 60);
          console.log("Sending DNS answer: " + logLines[lineOffset-1]);
          server.send(query);
        }
        else if(reqType == 1) { // m1o1.get.xx = IPv6 mode
          console.log("RECV MODE IPV6");
          var subs = logLines[lineOffset-1].substring(16 * (colOffset - 1), 16 * colOffset);
          console.log("Substring: " + subs);
          var ipRes = toIPv6(subs);
          var target = new named.AAAARecord(ipRes);
          query.addAnswer(domain, target, 60);
          console.log("Sending DNS answer: " + ipRes);
          server.send(query);
        }
        else if(reqType == 2) { // m1n1.get.xx = IPv4 mode
          console.log("RECV MODE IPV4");
          var subs = logLines[lineOffset-1].substring(4 * (colOffset - 1), 4 * colOffset);
          console.log("Substring: " + subs);
          var ipRes = toIPv4(subs);
          var target = new named.ARecord(ipRes);
          query.addAnswer(domain, target, 60);
          console.log("Sending DNS answer: " + ipRes);
          server.send(query);
        }
      }
    }



  previousDomain = domain;

});

