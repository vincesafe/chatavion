const Server = require('./server.js')
const Client = require('./client.js')

/**
 * DNS Com Module
 *
 * @param   {object}    opt         Information about the user.
 * @param   {string}    opt.ip      Server Ip (defaut: 0.0.0.0)
 * @param   {number}    opt.port    Port Number (defaut: 53)
 */
function DNSCom() {

}

module.exports = new DNSCom()

/**
 * Create a DNS Server for receipt DNS Request & message
 *
 * @param   {object}    opt         Information about the user.
 * @param   {string}    opt.ip      Server Ip (defaut: 0.0.0.0)
 * @param   {number}    opt.port    Port Number (defaut: 53)
 */
DNSCom.prototype.createServer = function (opt) {
  return new Server(opt)
}

/**
 * Create a DNS Server for receipt DNS Request & message
 *
 * @param   {object}    opt         Information about the user.
 * @param   {string}    opt.ip      Server Ip (defaut: 0.0.0.0)
 * @param   {number}    opt.port    Port Number (defaut: 53)
 */
DNSCom.prototype.createClient = function () {
  return new Client()
}
