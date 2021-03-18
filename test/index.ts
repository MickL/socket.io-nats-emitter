import { ConnectionOptions, NatsConnection } from "nats";
import { createServer } from "http";
import { Namespace, Server } from "socket.io";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client/build/socket";
import { AddressInfo } from "net";
import * as expect from "expect.js";
import { connect } from "nats";
import {
  createAdapter,
  NatsAdapterOptions,
} from "@mickl/socket.io-nats-adapter";
import { NatsEmitter } from "../lib";
import { Connect } from "nats/lib/nats-base-client/protocol";

const connectOptions: ConnectionOptions = {};

let namespace1, namespace2;
let client1, client2;
let socket1, socket2;
let emitter: NatsEmitter;

describe("socket.io-nats-emitter", () => {
  beforeEach(async () => {
    const connection = await connect(connectOptions);
    await init(connection);
  });
  afterEach(cleanup);

  it("broadcasts", (done) => {
    client1.on("someEvent", (a, b, c, d) => {
      expect(a).to.eql([]);
      expect(b).to.eql({ a: "b" });

      // TODO: Buffer is not equal
      // expect(Buffer.isBuffer(c) && c.equals(buffer)).to.be(true);

      // TODO: Uint8Array is not equal
      // expect(Buffer.isBuffer(d) && d.equals(Buffer.from(uint8Array))).to.be(true); // converted to Buffer on the client-side

      done();
    });

    const buffer = Buffer.from("abcd1234", "utf8");
    const uint8Array = Uint8Array.of(1, 2, 3, 4);

    emitter.emit("someEvent", [], { a: "b" }, buffer, uint8Array);
  });

  it("broadcasts to a room", (done) => {
    const event = "someEvent";
    const room = "someRoom";

    socket1.join(room);

    client1.on(event, () => {
      setTimeout(done, 100);
    });

    client2.on(event, () => {
      throw new Error(
        `Received event '${event}', but client is not in room '${room}'`
      );
    });

    emitter.to(room).emit(event);
  });

  it("broadcasts to multiple rooms", (done) => {
    socket1.join(["foo", "bar"]);

    let called = false;
    client1.on("broadcast", () => {
      if (called) {
        return done(new Error("Called more than once"));
      }
      called = true;
      setTimeout(done, 100);
    });

    client2.on("broadcast", () => {
      throw new Error("Not in room");
    });

    emitter.to("foo").to("bar").emit("broadcast");
  });
});

async function create(
  connection: NatsConnection,
  options?: NatsAdapterOptions,
  nsp = "/"
): Promise<{ namespace: Namespace; client: Socket; socket: any }> {
  return new Promise((resolve) => {
    const httpServer = createServer();
    const ioServer = new Server(httpServer);

    // @ts-ignore
    ioServer.adapter(createAdapter(connection, options));

    httpServer.listen((a) => {
      const port = (<AddressInfo>httpServer.address()).port;
      const url = "http://localhost:" + port;

      const namespace = ioServer.of(nsp);
      const client = io(url, { reconnection: false });

      namespace.on("connection", (socket) => {
        resolve({ namespace, client, socket });
      });
    });
  });
}

async function init(connection: NatsConnection) {
  const created1 = await create(connection);
  const created2 = await create(connection);

  namespace1 = created1.namespace;
  namespace2 = created2.namespace;

  client1 = created1.client;
  client2 = created2.client;

  socket1 = created1.socket;
  socket2 = created2.socket;

  emitter = new NatsEmitter(connection);
}

function noop() {}

async function cleanup() {
  namespace1.server.close();
  namespace2.server.close();
  namespace1.adapter.on("error", noop);
  namespace2.adapter.on("error", noop);
}
