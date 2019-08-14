// Must be first :
process.env.DEBUG = process.env.DEBUG || '*'
// also :
// process.env.DEBUG = 'chatavion:*'

const error = require('debug')('chatavion:error')
const debug = {
  server: require('debug')('chatavion:server'),
  client: require('debug')('chatavion:client')
}

const dnscom = require('dnscom')

const argv = require('yargs-parser')(process.argv.slice(2))

if (argv.server) { // node ./bin/index.js --server
  const server = dnscom.createServer({
    ip: '0.0.0.0',
    port: 53,
    SEND: "send.xx.yy",
    RECV: "recv.xx.yy"
  })

  server.on('message', function (decodedom) {
    debug.server('Message: ' + decodedom)
  });
} else {
  const readline = require('readline-sync')

  const client = dnscom.createClient();
  const defaultDnsServ = client.getDefaultServer();

  let dnserv = readline.question('DNS server [' + defaultDnsServ + ']: ')

  try {
    if (dnserv !== '') { // no empty input
        client.setServers([dnserv])
    } else { // empty input: reset server in case no DNS server was set
      throw new Error('empty')
    }
  } catch (err) { // catch setServers' error or empty string
    debug.client('Invalid DNS server. Using default server ' + defaultDnsServ)
    client.setServers([defaultDnsServ])
  }

  const sendIp = readline.question('SEND address: ')
  const recvIp = readline.question('RECV address: ')

  ;(async () => {
    async function displayNewMessages() {
      const messages = await client.getMessages(recvIp) // display contents

      if (messages.length === 0)
        debug.client("no new message! :(")

      messages.forEach(function(message) {
        console.log(message)
      });
    }

    await displayNewMessages();

    let input = ''
    while (input != 'q') {
      input = readline.question('Command: ')
      if (/^s /g.test(input)) { // input starts with s 
        try {
          const addr = await client.sendMessage(input.substring(2), sendIp)
          if (addr.includes('42.42.42.42')) {
            debug.client('Message successfully received!')
          } else {
            debug.client('No reply from server. Your message may not have been received.')
          }
        } catch(err) {
          error('Exception: ' + err)
          error(err)
        }

      } else if (/^r/g.test(input)) { // input starts with r 
        const offset = parseInt(input.substring(1)); // r4 = receive from offset 4
        if (offset >= 1) {// avoids negatives, 0 and NaN
          client.nextOffset = offset
        } else if (input.length != 1) {// r uses default offset, other inputs are invalid
          debug.client('Invalid offset, ignoring input')
        }
        debug.client('Will call recep with offset ' + client.nextOffset)
        await displayNewMessages();
      } else if (/^q/g.test(input)) { // input starts with q
        debug.client('Thanks for using chatavion!')
        process.exit()
      } else /*if(/^h/g.test(input))*/ { // input starts with h
        debug.client('Commands: ')
        debug.client('Send a message: s your message')
        debug.client('Receive unread messages: r')
        debug.client('Receive messages from line 4: r 4')
        debug.client('Quit: q')
      }
    }
  })()
}