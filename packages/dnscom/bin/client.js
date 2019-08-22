const base32 = require('hi-base32')
const { Resolver } = require('dns').promises

const debug = require('debug')('dnscom:client')
const error = require('debug')('dnscom:client:error')

/**
 * Make a DNS Client to send a message
 *
 * @class
 */
function Client() {
  /**
   * DNS Resolver
   * The dns.promises API provides an alternative set of asynchronous DNS
   * methods that return Promise objects rather than using callbacks.
   *
   * More informations on : https://nodejs.org/api/dns.html#dns_dns_promises_api
   *
   * @type    {dnsPromises}
   */
  this.dnsResolver = new Resolver()

  /**
   * nextOffset of the next message to get
   *
   * @type    {dnsPromises}
   */
  this.nextOffset = 1
}

module.exports = Client

/**
 * Return IP the first adress string that is currently configured for DNS resolution
 * or return `8.8.8.8`.
 *
 * More informations on : https://nodejs.org/api/dns.html#dns_dns_getservers
 *
 * @return    {string}     IP adress string
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
 * @param    {string}  servers   IPs adressess strings
 */
Client.prototype.setServers = function(servers) {
  this.dnsResolver.setServers.call(this.dnsResolver, servers)
}

/**
 * Get messages of {recvIp} server
 *
 * @param    {string}   recvIp    Receive Server IP
 *
 * @return   {array.<string>}     Return messages
 */
Client.prototype.getMessages = async function(recvIp) {
  return await recep.call(this, recvIp)
}

/**
 * Send {message} to {sendIp} server
 *
 * @param    {string}   message    Text message
 * @param    {string}   sendIp     Send Server IP
 *
 * @return   {array.<string>}     Return messages
 */
Client.prototype.sendMessage = async function(message, sendIp) {
  return await sendm.call(this, message, sendIp)
}

async function sendm(message, sendIp) {
  const req = base32.encode(message) + '.' + sendIp
  debug('Will ask ' + this.dnsResolver.getServers()[0] + ' for ' + req)

  try {
    return addresses = await this.dnsResolver.resolve4(req)
  } catch (err) {
    throw err
  }
}

async function recep(recvIp) {
  const offset = this.nextOffset

  const messages = []

  let mode = 2; // reception mode: 0 TXT / 1 AAAA / 2 A
  let query = 'm1.' + recvIp
  let res = ''
  try {
    res = await this.dnsResolver.resolveTxt(query)
  } catch (err) {
    error('Exception with dnsResolver: ' + err)
    error(err)
  }
  if (res.length > 0) { // result found: TXT mode is fine
    mode = 0
    debug('Setting receive mode to TXT')
    //    debug('res is ' + res)
  } else { // otherwise, try AAAA, then default to A
    debug('No result for TXT Client, will try AAAA')
    query = 'm1o1.' + recvIp
    try {
      res = await this.dnsResolver.resolve6(query)
    } catch (err) {}
    if (res.length > 0) { // result found: AAAA mode is ok
      mode = 1
      debug('Setting receive mode to AAAA')
      // debug('res is ' + res)
    } else // last chance, no need to try to choose mode
      debug('Setting receive mode to A')
  }

  // actual reception and display
  if (mode == 0) { // TXT mode
    do {
      query = 'm' + this.nextOffset + '.' + recvIp
      try {
        res = await this.dnsResolver.resolveTxt(query)
        messages.push(res[0][0])
        this.nextOffset++
      } catch (err) {
        res = ''
      }
    } while (res.length > 0)
  } else if (mode == 1 || mode == 2) { // AAAA mode & A mode
    let line = ''
    do {
      let colOffset = 1
      if (colOffset == 1) line = ''; // new line
      try {
        let subs
        if (mode == 1) { // AAAA mode
          query = 'm' + offset + 'o' + colOffset + '.' + recvIp
          const res = await this.dnsResolver.resolve6(query)
          subs = ip6ascii(res[0])
        } else { // A mode
          query = 'm' + offset + 'n' + colOffset + '.' + recvIp
          const res = await this.dnsResolver.resolve4(query)
          subs = ip4ascii(res[0])
        }

        if (subs.length > 0) {
          line = line + subs
          colOffset++
        } else { // no result: next line
          colOffset = 1
          this.nextOffset++
          messages.push(line)
        }
      } catch (err) {
        line = ''
        error('End of messages. Next offset: ' + offset)
        error('Exception: ' + err)
        error(err)
      }
    } while (line != '')
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
