import { Client, ClientOpts } from "nats";
import { createServer } from "http";
import { Namespace, Server } from "socket.io";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client/build/socket";
import { AddressInfo } from "net";
import * as expect from "expect.js";
import { connect } from "nats";

const natsUrl                    = "localhost";
const connectOptions: ClientOpts = {
    // json: true,
    // preserveBuffers: true,
};

let namespace1, namespace2, namespace3, namespace4;
let client1, client2, client3, client4;
let socket1, socket2, socket3, socket4;

describe("socket.io-nats-emitter", () => {
    beforeEach(async () => {
        const natsClient = connect(natsUrl, connectOptions);
        await init(natsClient);
    });
    afterEach(cleanup);

    // TODO
});

async function create(
    natsClient: Client,
    options?: ClientOpts,
    nsp = "/"
): Promise<{ namespace: Namespace; client: Socket; socket: any }> {
    return new Promise((resolve) => {
        const httpServer = createServer();
        const ioServer   = new Server(httpServer);

        // @ts-ignore
        ioServer.adapter(createAdapter(natsClient, options));

        httpServer.listen((a) => {
            const port = (<AddressInfo>httpServer.address()).port;
            const url  = "http://localhost:" + port;

            const namespace = ioServer.of(nsp);
            const client    = io(url, {reconnection: false});

            namespace.on("connection", (socket) => {
                resolve({namespace, client, socket});
            });
        });
    });
}

async function init(natsClient: Client, options?: ClientOpts) {
    const created1 = await create(natsClient, options);
    const created2 = await create(natsClient, options);
    const created3 = await create(natsClient, options);
    const created4 = await create(natsClient, options);

    namespace1 = created1.namespace;
    namespace2 = created2.namespace;
    namespace3 = created3.namespace;
    namespace4 = created4.namespace;

    client1 = created1.client;
    client2 = created2.client;
    client3 = created3.client;
    client4 = created4.client;

    socket1 = created1.socket;
    socket2 = created2.socket;
    socket3 = created3.socket;
    socket4 = created4.socket;
}

function noop() {
}

async function cleanup() {
    namespace1.server.close();
    namespace2.server.close();
    namespace3.server.close();
    // handle 'Connection is closed' errors
    namespace1.adapter.on("error", noop);
    namespace2.adapter.on("error", noop);
    namespace3.adapter.on("error", noop);
    // TODO: Need this for Nats?
    // namespace1.adapter.subClient.quit();
    // namespace2.adapter.subClient.quit();
    // namespace3.adapter.subClient.quit();
}
