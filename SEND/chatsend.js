// This Node.js script replaces all files from the original SEND server
// It requires node-named. Install it with the following command: npm install node-named
// This program is compatible with all clients and all RECV servers.
// The conversation log is stored in the current directory, instead of the Apache directory.

const { exec } = require('child_process');
const fs = require('fs')
var named = require('node-named');
var server = named.createServer();
const http = require('http')
const portweb = 80

var previousDomain = '0';

// web server part
const requestHandler = (request, response) => {
  // console.log(request.url)
  response.end(fs.readFileSync('./miaou.txt', 'ascii'))
}

const webserver = http.createServer(requestHandler)

webserver.listen(portweb, (err) => {
  if (err) {
    return console.log('web server: an error occured', err)
  }

  console.log(`web server is listening on ${portweb}`)
})

// dns chat part
// If RECV and SEND are both running on the same server, specify the SEND IP address instead of 0.0.0.0
server.listen(53, '0.0.0.0', function() {
  console.log('DNS server started on port 53');
});

server.on('query', function(query) {
  var domain = query.name();
    console.log('Query: ' + domain);

    if(previousDomain != domain) {
      var words = domain.split('.');
      var sousdom = words[0];
      var decodedom = "";
	    // using Linux base32 for now for compatibility reasons
      exec('echo ' + sousdom + ' | base32 --decode',  (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          console.log("base32 command error");
          return;
        }
        decodedom = `${stdout}`;
        console.log("Message: " + decodedom);
        // date to be implemented
	var curDate = new Date(Date.now());
        fs.appendFileSync("./miaou.txt", curDate.toLocaleString() + " Avion : " + decodedom, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("Miaou file was saved!");
        });

      });


    }

    // 42.42.42.42 means success
    var target = new named.ARecord('42.42.42.42');
    // 60 is the ttl for this record
    query.addAnswer(domain, target, 60);
    console.log("Sending DNS answer");
    server.send(query);
    previousDomain = domain;

});
