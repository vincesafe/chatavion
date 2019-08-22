const base32 = require('hi-base32')
const { Resolver } = require('dns');
const stream = require('stream')
const util = require('util')

const debug = require('debug')('dnscom:client')
const error = require('debug')('dnscom:client:error')
const lgMsg = require('debug')('dnscom:client:msg')

/**
 * Make a DNS Client to send a message
 *
 * @class
 */
function Client() {
  /**
   * DNS Resolver
   *
   * More informations on : https://nodejs.org/api/dns.html
   *
   * @type    {dnsPromises}
   */
  this.dnsResolver = new Resolver()

  /**
   * nextOffset of the next message to get
   *
   * @type    {number}
   */
  this.nextOffset = 1
}

module.exports = Client

/**
 * Return IP the first address string that is currently configured for DNS resolution
 * or return `8.8.8.8`.
 *
 * More informations on : https://nodejs.org/api/dns.html#dns_dns_getservers
 *
 * @return    {string}     IP address string
 */
Client.prototype.getDefaultServer = function() {
  try {
    return this.dnsResolver.getServers()[0]
  } catch (err) {
    return '8.8.8.8'
  }
}

/**
 * Sets the IP address and port of servers to be used when performing DNS resolution.
 *
 * More informations on : https://nodejs.org/api/dns.html#dns_dns_setservers_servers
 *
 * @param    {string}  servers   IPs addresses strings
 */
Client.prototype.setServers = function(servers) {
  this.dnsResolver.setServers(servers)
}

/**
 * Get messages of {recvIp} server
 *
 * @param    {string}   recvIp    Receive Server IP
 *
 * @return   {array.<string>}     Return messages
 */
Client.prototype.getMessages = function(recvIp) {
  return recep.call(this, recvIp)
}

Client.prototype.getMessagesSync = async function(recvIp) {
  return await recepSync.call(this, recvIp)
}

/**
 * Send {message} to {sendIp} server
 *
 * @param    {string}   message    Text message
 * @param    {string}   sendIp     Send Server IP
 *
 * @return   {array.<string>}     Return messages
 */
Client.prototype.sendMessage = function(message, sendIp, callback) {
  return sendm.call(this, message, sendIp, callback)
}

Client.prototype.sendMessageSync = async function(message, sendIp) {
  return await sendmSync.call(this, message, sendIp)
}


function sendm(message, sendIp, callback) {
  const query = base32.encode(message) + '.' + sendIp
  debug('Will ask ' + this.dnsResolver.getServers()[0] + ' for ' + query)

  this.dnsResolver.resolve4(query, (err, records) => {
    const addresses = err ? [] : records
    callback(!!addresses.includes('42.42.42.42'))
  })
}

async function sendmSync(message, sendIp) {
  const query = base32.encode(message) + '.' + sendIp
  debug('Will ask ' + this.dnsResolver.getServers()[0] + ' for ' + query)

  const addresses = await new Promise(resolve => {
    this.dnsResolver.resolve4(query, (err, records) => {
      resolve(err ? [] : records)
    })
  })

  return !!addresses.includes('42.42.42.42')
}

const _MODE = {
  TXT: 0,
  AAAA: 1,
  A: 2,
  dico: [
    [],
    ['o', 'resolve6', ip6ascii],
    ['n', 'resolve4', ip4ascii]
  ]
}

function receptTxt(querySchema, chatStream, next) {
  const args = arguments
  this.dnsResolver.resolveTxt(util.format(querySchema, this.nextOffset), (err, records) => {
    if (err) {
      error('Error with receptTxt:', err)
      next(err)
      return
    }

    if (records.length > 0) {
      lgMsg('new line:', records[0][0])
      chatStream.write(records[0][0])
      this.nextOffset++
      receptTxt.apply(this, args)
    } else {
      next()
    }
  })
}

function receptIpvN(mode, querySchema, param, chatStream, next) {
  const args = arguments

  const data = _MODE.dico[mode]
  const letter = data[0]
  const resolveN = data[1] // resolveN -> 4 | 6
  const ipNascii = data[2]

  const query = util.format(querySchema, this.nextOffset, letter, param.colOffset)
  const res = this.dnsResolver[resolveN](query, (err, records) => {
    if (err) {
      error('Error with receptIpvN:', err)
      next(err)
      return
    }

    const subs = (records.length > 0) ? ipNascii(records[0]) : false

    if (subs !== false && (subs + param.line) !== "") {
      if (!subs.length) { // no result: next line
        lgMsg('new line:', param.line)
        chatStream.write(param.line)
        param.colOffset = 1
        this.nextOffset++
        param.line = ''
      } else {
        param.line += subs
        param.colOffset++
      }
      receptIpvN.apply(this, args)
    } else {
      next()
    }
  })
}

function whatCanIuse(recvIp, answer) {
  const checkResolve = (err, records, modeName, next) => {
    if (!err && records.length > 0) {
      // result found: current mode is fine
      debug('Setting receive mode to', modeName)
      answer(_MODE[modeName])
      return
    }
    // let's try another thing
    next()
  }

  const callbackOnFail = {
    TXT: () => {
      // otherwise, try AAAA, then default to A
      debug('No result for TXT Client, will try AAAA')

      resolveMode('AAAA', 'm1o1.' + recvIp)
    },
    AAAA: () => {
      // last chance, no need to try to choose mode
      debug('Setting receive mode to A')
      answer(_MODE.A)

      // TODO: improve this part ? Maybe is usefull to throw an error if we can't communicate
    }
  }

  const resolveMode = (modeName, query) => {
    this.dnsResolver.resolve(query, modeName, (err, records) => {
      // Result
      checkResolve.call(this, err, records, modeName, callbackOnFail[modeName])
    })
  }

  resolveMode('TXT', 'm1.' + recvIp)
}

function recep(recvIp) {
  const chatStream = new stream.PassThrough()

  // -1 to avoid last \n
  const end = () => this.nextOffset--

  whatCanIuse.call(this, recvIp, (mode) => {
    debug('mode is ' + mode)

    // actual reception and display
    if (mode == _MODE.TXT) {
      receptTxt.call(this, `m%d.${recvIp}`, chatStream, end)
    } else if (mode == _MODE.AAAA || mode == _MODE.A) {
        const param = {
          line: '',
          colOffset: 1
        }
      receptIpvN.call(this, mode, `m%d%s%d.${recvIp}`, param, chatStream, end)
    } else {
      throw Error("Unknown mode")
    }   
  })

  return chatStream
}

async function recepSync(recvIp) {
  const chatStream = new stream.PassThrough()

  // reception mode: 0 TXT / 1 AAAA / 2 A
  let mode = await new Promise(resolve => {
    whatCanIuse.call(this, recvIp, resolve)
  })

  const messages = []

  chatStream.on('data', (chunk) => {
    messages.push(chunk.toString())
  })

  mode = 1

  debug('mode is ' + mode)

  // actual reception and display
  if (mode == _MODE.TXT) {
    await new Promise(resolve => {
      receptTxt.call(this, `m%d.${recvIp}`, chatStream, resolve)
    })
  } else if (mode == _MODE.AAAA || mode == _MODE.A) {
    await new Promise(resolve => {
      const param = {
        line: '',
        colOffset: 1
      }
      receptIpvN.call(this, mode, `m%d%s%d.${recvIp}`, param, chatStream, resolve)
    })
  } else {
    throw Error("Unknown mode")
  }

  this.nextOffset-- // -1 to avoid last \n

  return messages
}

function testIPv4(addr) {
  const regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/g
  return regex.test(addr)
}

function ip6ascii(addr) {
  if (addr == '0000:0000:0000:0000:0000:0000:0000:0000' || addr == '::')
    return ''
  const numbers = addr.split(':')
  let text = ''
  for (let i = 0, curNumber; i < numbers.length; i++) {
    curNumber = parseInt(numbers[i], 16)
    text = text + String.fromCharCode(curNumber / 256)
    text = text + String.fromCharCode(curNumber % 256)
  }
  return text
}

function ip4ascii(addr) {
  if (addr == '0.0.0.0')
    return ''
  const numbers = addr.split(':')
  let text = ''
  for (let i = 0, curNumber; i < numbers.length; i++) {
    curNumber = parseInt(numbers[i])
    text = text + String.fromCharCode(curNumber)
  }
  return text
}