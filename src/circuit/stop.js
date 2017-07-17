'use strict'

const setImmediate = require('async/setImmediate')

const EE = require('events').EventEmitter
const Connection = require('interface-connection').Connection
const utilsFactory = require('./utils')
const PeerInfo = require('peer-info')
const proto = require('../protocol')

const debug = require('debug')

const log = debug('libp2p:circuit:stop')
log.err = debug('libp2p:circuit:error:stop')

class Stop extends EE {
  constructor (swarm) {
    super()
    this.swarm = swarm
    this.utils = utilsFactory(swarm)
  }

  handle (message, streamHandler, callback) {
    callback = callback || (() => {})

    return this.utils.validateMsg(message, streamHandler, proto.CircuitRelay.Type.STOP, (err) => {
      if (err) {
        callback(err)
        return log(err)
      }

      streamHandler.write(proto.CircuitRelay.encode({
        type: proto.CircuitRelay.Type.STATUS,
        code: proto.CircuitRelay.Status.SUCCESS
      }), (err) => {
        if (err) {
          log.err(err)
          return callback(err)
        }

        const peerInfo = new PeerInfo(message.srcPeer.id)
        message.srcPeer.addrs.forEach((addr) => peerInfo.multiaddrs.add(addr.toString()))
        const newConn = new Connection(streamHandler.rest())
        newConn.setPeerInfo(peerInfo)
        setImmediate(() => this.emit('connection', newConn))
        callback(newConn)
      })
    })
  }
}

module.exports = Stop
