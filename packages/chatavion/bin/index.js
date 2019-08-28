// Must be first :
process.env.DEBUG = process.env.DEBUG || '*, -dnscom:client:msg'
// also :
// process.env.DEBUG = 'chatavion:*'

const error = require('debug')('chatavion:error')
const debug = {
  server: require('debug')('chatavion:server'),
  client: require('debug')('chatavion:client')
}

const dnscom = require('dnscom')

const serverline = require('serverline')
serverline.init({
  prompt: 'Command: '
})
serverline._debugModuleSupport(require('debug'))
serverline._debugModuleSupport(require('module').createRequire(require.resolve('dnscom'))('debug'))


const argv = require('yargs-parser')(process.argv.slice(2))

let sendIp = process.env.SENDIP || 'send.xx.yy'
let recvIp = process.env.RECVIP || 'recv.xx.yy'

serverline.question = function () {
  const rl = serverline.getRL()
  rl.question.apply(rl, arguments)
}

serverline.question('SEND address: ', function(ip) {
  sendIp = (ip !== '') ? ip : sendIp

  serverline.question('RECV address: ', function(ip) {
    recvIp = (ip !== '') ? ip : recvIp

    if (argv.server) { // node ./bin/index.js --server
      server()
    } else {
      debug.client('SEND:', sendIp, 'RECV:', recvIp)
      client()
    }
  })
})

function server() {
  const server = dnscom.createServer({
    ip: '0.0.0.0',
    port: 53,
    SEND: sendIp,
    RECV: recvIp
  })

  server.on('message', function(decodedom) {
    debug.server('Message: ' + decodedom)
  })
}

function client() {
  serverline.on('line', function(input) {
    if (/^s /g.test(input)) { // input starts with s 
      try {
        client.sendMessage(input.substring(2), sendIp, success => {
          if (success) {
            debug.client('Message successfully received!')
          } else {
            debug.client('No reply from server. Your message may not have been received.')
          }
        })
      } catch (err) {
        error('Exception: ' + err)
        error(err)
      }

    } else if (/^r/g.test(input)) { // input starts with r 
      const offset = parseInt(input.substring(1)) // r4 = receive from offset 4
      if (offset >= 1) { // avoids negatives, 0 and NaN
        client.nextOffset = offset
      } else if (input.length != 1) { // r uses default offset, other inputs are invalid
        debug.client('Invalid offset, ignoring input')
      }
      debug.client('Will call recep with offset ' + client.nextOffset)
      const chatStream = client.getMessages(recvIp) // display contents

      chatStream.on('data', (chunk) => {
        console.log(chunk.toString())
      })
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
  })

  const client = dnscom.createClient()
  const defaultDnsServ = client.getDefaultServer()

  serverline.question('DNS server [' + defaultDnsServ + ']: ', function(ip) {
    let dns = (ip !== '') ? ip : process.env.DNSSERV

    if (dns !== '') { // no empty input
      client.setServers([dns])
      debug.client('DNS:', dns)
    } else {
      debug.client('Using default server ' + defaultDnsServ)
    }

    const chatStream = client.getMessages(recvIp) // display contents

    chatStream.on('data', (chunk) => {
      console.log(chunk.toString())
    })
  })
}