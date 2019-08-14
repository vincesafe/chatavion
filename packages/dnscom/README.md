dnscom
======

<!-- TODO BADGES -->

dnscom.createServer
-------------------

```javascript
const server = dnscom.createServer({
  ip: '0.0.0.0',
  port: 53
})

server.on('message', function (decodedom) {
  console.log('Message: ' + decodedom)
});
```

Class: dnscom.Server
--------------------

### server.on(eventName, listener)

Adds the `listener` function to the end of the listeners array for the event named `eventName`.

[More informations](https://nodejs.org/api/events.html#events_emitter_on_eventname_listener)

### server.emit(eventName[, ...args])

Synchronously calls each of the listeners registered for the event named eventName, in the order
they were registered, passing the supplied arguments to each.

[More informations](https://nodejs.org/api/events.html#events_emitter_emit_eventname_args)

dnscom.createClient
-------------------

```javascript
const client = dnscom.createClient();

client.setServers(['8.8.8.8'])

const addr = client.sendMessage(input.substring(2), sendIp)
if (addr.includes('42.42.42.42')) {
  console.log('Message successfully received!')
} else {
  console.log('No reply from server. Your message may not have been received.')
}

;(async () => {
  async function displayNewMessages() {
    const messages = await client.getMessages(recvIp) // display contents

    if (messages.length === 0)
      console.log("no new message! :(")

    messages.forEach(function(element) {
      console.log(message)
    });
  }

  await displayNewMessages()
})()
```

Class: dnscom.Client
--------------------

### client.getDefaultServer()

Return IP the first adress string that is currently configured for DNS resolution or return `8.8.8.8`

Adds the `listener` function to the end of the listeners array for the event named `eventName`.

[More informations](https://nodejs.org/api/dns.html#dns_dns_getservers)

### cient.setServers(servers)

Sets the IP address and port of servers to be used when performing DNS resolution.

[More informations](https://nodejs.org/api/dns.html#dns_dns_setservers_servers)

### cient.getMessages(recvIp)

Get messages of *{recvIp}* server

### cient.sendMessage(message, sendIp)

Send {message} to *{recvIp}* server
