# socket.io-nats-emitter

`socket.io-nats-emitter` allows you to communicate with Socket.io servers easily without access to Socket.io

![Emitter diagram](assets/emitter.png)

It must be used in conjunction with [@mickl/socket.io-nats-adapter](https://github.com/MickL/socket.io-nats-adapter).

The current version is compatible with:

- [NATS.js](https://github.com/nats-io/nats.js/) 2.x, for NATS.js 1.x use `@^1.0.0` of this package

If you have any issues or feature requests please create a pull request.

## How to use

```bash
yarn add nats @mickl/socket.io-nats-emitter
```

```ts
import { connect } from 'nats';
import { NatsEmitter } from '@mickl/socket.io-nats-emitter';

const connection = await connect();
const io         = new NatsEmitter(connection);

// Emit
io.emit('event');

// Emit to room or socket-id
io.to('room').emit('event');

// Namespaces
const nspIo = io.of('/admin');
nspIo.emit('event');
```

## License

MIT
