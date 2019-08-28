const { exec } = require('child_process')
const fs = require('fs')
const EventEmitter = require('events')

var base32 = require('hi-base32')
const named = require('node-named')
const debug = require('debug')('dnscom:server')

const logFile = "./miaou.txt"

/**
 * Create a DNS Server for receipt DNS Request & message
 *
 * @class
 *
 * @param   {object}    opt         Information about the user.
 * @param   {string}    opt.ip      Server Ip (defaut: 0.0.0.0)
 * @param   {number}    opt.port    Port Number (defaut: 53)
 */
function Server(opt) {
  const settings = opt || {}
  /**
   * Event emitter
   *
   * @type    {EventEmitter}
   * @private
   */
  const serverEmitter = new EventEmitter()

  /**
   * Adds the `listener` function to the end of the listeners array for the event named `eventName`.
   *
   * More informations on : https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
   *
   * @param   {string}      eventName      The name of the event
   * @param   {function}    listener       The callback function
   */
  this.on = function(eventName, listener) {
    serverEmitter.on.call(serverEmitter, eventName, listener)
  }

  /**
   * Synchronously calls each of the listeners registered for the event named eventName, in the order
   * they were registered, passing the supplied arguments to each.
   *
   * More informations on : https://nodejs.org/api/events.html#events_emitter_emit_eventname_args
   *
   * @param   {string}   eventName    The name of the event 
   * @param   {...*}     args         Send args to listener function
   */
  this.emit = function(eventName) {
    serverEmitter.emit.apply(serverEmitter, arguments)
  }

  const ip = settings.ip || '0.0.0.0'
  const port = settings.port || 53
  const SEND = settings.SEND
  const RECV = settings.RECV

  debug('Starting listen on', ip, port)
  debug('SEND:', SEND, 'RECV:', RECV)

  this.createServer(ip, port, SEND, RECV)
}

module.exports = Server

/**
 * Start DNS Server
 *
 * @param   {string}    ip      Server Ip (defaut: 0.0.0.0)
 * @param   {number}    port    Port Number (defaut: 53)
 * @param   {string}    SEND    Send domain
 * @param   {string}    RECV    Recv domain 
 */
Server.prototype.createServer = function(ip, port, SEND, RECV) {
  const SENDTAG = SEND.split('.')[0]
  const RECVTAG = RECV.split('.')[0]
  const server = named.createServer()

  server.listen(port, ip, function() {
    debug('DNS server started on port 53')
  })

  let previousDomain = '0'

  server.on('query', (query) => { // --> anonymous function to keep this equal to Dnscom
    const domain = query.name()
    debug('Query: ' + domain)

    const words = domain.split('.')

    if (words[1] == SENDTAG) { // if the request is a new message -> SEND
      sendTAG.call(this, query, previousDomain)
    } else if (words[1] == RECVTAG) { // if the request is for reception, e.g. m1.get.xx or m1n1.get.xx
      recvTAG.call(this, query)
    }

    previousDomain = domain
  })

  this.server = server
}


/**
 * Send TAG
 *
 * @param   {object}     query             Request query
 * @param   {string}     previousDomain    Last requested domain
 */
function sendTAG(query, previousDomain) {
  const domain = query.name()
  const words = domain.split('.')

  if (previousDomain != domain) {
    const sousdom = words[0]
    const decodedom = base32.decode(sousdom.toUpperCase())
    
    this.emit('message', decodedom)

    // date to be improved
    const curDate = new Date(Date.now())
    fs.appendFileSync(logFile, curDate.toLocaleString('fr-FR') + ' Avion : ' + decodedom + '\n', function(err) {
      if (err) {
        return debug(err)
      }
      debug('Miaou (log) file was saved!')
    })
  }
  // 42.42.42.42 means success
  const target = new named.ARecord('42.42.42.42')
  // 60 is the ttl for this record
  query.addAnswer(domain, target, 60)
  debug('Sending DNS answer')
  this.server.send(query)
}


/**
 * Receive TAG
 *
 * @param   {object}     query             Request query
 */
function recvTAG(query) {
  const domain = query.name()
  const words = domain.split('.')
  // load log file
  const fullLog = fs.readFileSync(logFile, 'ascii')
  const logLines = fullLog.split('\n')
  let reqType = 2 // type of request. mX (TXT) = 0, mX.oY (AAAA) = 1, mX.nY (A) = 2
  const tmp = words[0].split('n')
  let lineOffset = 0
  let colOffset = 0
  if (tmp.length == 2) { // found n
    reqType = 2
    lineOffset = parseInt(tmp[0].split('m')[1])
    colOffset = parseInt(tmp[1])
  } else {
    let tmp2 = tmp[0].split('o')
    if (tmp2.length == 2) { // found o
      reqType = 1
      lineOffset = parseInt(tmp2[0].split('m')[1])
      colOffset = parseInt(tmp2[1])
    } else { // neither n nor o found, assume TXT type
      reqType = 0
      lineOffset = parseInt(tmp2[0].split('m')[1])
    }
  }
  // const lineOffset = parseInt(words[0].split('m')[1]) // tries to parse 1 from m1, for example, will be NaN if it fails
  debug('Line offset ' + lineOffset + ' / Length ' + logLines.length + ' / reqType ' + reqType + ' / colOffset ' + colOffset)
  if (lineOffset <= logLines.length) { // if the line actually exists (will fail if NaN)
    if (reqType == 0) { // m1.get.xx supposed = TXT mode
      debug('RECV MODE TEXTE')
      const target = new named.TXTRecord(logLines[lineOffset - 1])
      query.addAnswer(domain, target, 60)
      debug('Sending DNS answer: ' + logLines[lineOffset - 1])
      this.server.send(query)
    } else if (reqType == 1) { // m1o1.get.xx = IPv6 mode
      debug('RECV MODE IPV6')
      const subs = logLines[lineOffset - 1].substring(16 * (colOffset - 1), 16 * colOffset)
      debug('Substring: ' + subs)
      const ipRes = toIPv6(subs)
      const target = new named.AAAARecord(ipRes)
      query.addAnswer(domain, target, 60)
      debug('Sending DNS answer: ' + ipRes)
      this.server.send(query)
    } else if (reqType == 2) { // m1n1.get.xx = IPv4 mode
      debug('RECV MODE IPV4')
      const subs = logLines[lineOffset - 1].substring(4 * (colOffset - 1), 4 * colOffset)
      debug('Substring: ' + subs)
      const ipRes = toIPv4(subs)
      const target = new named.ARecord(ipRes)
      query.addAnswer(domain, target, 60)
      debug('Sending DNS answer: ' + ipRes)
      this.server.send(query)
    }
  }
}

function toIPv4(subs) {
  var ip = ""
  for (var i = 0; i < 4; i++) {
    var val = 0
    if (i < subs.length)
      val = subs[i].charCodeAt()
    ip = ip + val
    if (i != 3)
      ip = ip + "."
  }
  return ip
}

function toIPv6(subs) {
  var ip = ""
  for (var i = 0; i < 16; i++) {
    var val = "00"
    if (i < subs.length)
      val = subs[i].charCodeAt().toString(16)
    if (val.length == 1) // force 2 digits
      val = "0" + val
    ip = ip + val
    if (i % 2 == 1 && i != 15)
      ip = ip + ":"
  }
  return ip
}
