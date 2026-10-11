const crypto = require('node:crypto');
const EventEmitter = require('node:events');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Lightweight native WebSocket connection over a raw net.Socket (RFC 6455).
 * Requires zero external dependencies.
 */
class WebSocketConnection extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.isClosed = false;
    this.buffer = Buffer.alloc(0);

    this.socket.on('data', (chunk) => this._handleData(chunk));
    this.socket.on('close', () => {
      this.isClosed = true;
      this.emit('close');
    });
    this.socket.on('error', (err) => {
      this.emit('error', err);
    });
  }

  static accept(req, socket) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return null;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + WS_GUID)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n',
    ];

    socket.write(headers.join('\r\n'));
    return new WebSocketConnection(socket);
  }

  send(data) {
    if (this.isClosed) return;
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
    const length = payload.length;

    let header;
    if (length < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode
      header[1] = length;
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    this.socket.write(Buffer.concat([header, payload]));
  }

  close() {
    if (this.isClosed) return;
    this.isClosed = true;
    try {
      const closeFrame = Buffer.from([0x88, 0x00]); // Close opcode
      this.socket.write(closeFrame, () => {
        this.socket.end();
      });
    } catch (_) {
      this.socket.destroy();
    }
  }

  _handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 2) {
      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];

      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;

      let offset = 2;
      if (payloadLength === 126) {
        if (this.buffer.length < 4) return;
        payloadLength = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) return;
        payloadLength = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let maskKey = null;
      if (isMasked) {
        if (this.buffer.length < offset + 4) return;
        maskKey = this.buffer.slice(offset, offset + 4);
        offset += 4;
      }

      if (this.buffer.length < offset + payloadLength) {
        return; // wait for rest of payload
      }

      const payload = this.buffer.slice(offset, offset + payloadLength);
      this.buffer = this.buffer.slice(offset + payloadLength);

      if (isMasked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      if (opcode === 0x08) {
        // Connection close
        this.close();
        this.emit('close');
        return;
      } else if (opcode === 0x09) {
        // Ping -> respond with Pong (0x0A)
        const pong = Buffer.alloc(2);
        pong[0] = 0x8a;
        pong[1] = 0x00;
        this.socket.write(pong);
      } else if (opcode === 0x01 || opcode === 0x02) {
        // Text or binary frame
        this.emit('message', opcode === 0x01 ? payload.toString('utf8') : payload);
      }
    }
  }
}

module.exports = { WebSocketConnection };
