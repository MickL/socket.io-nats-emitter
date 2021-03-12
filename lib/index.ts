import { Client } from "nats";
import * as _debug from "debug";
import { NatsAdapterOptionsDto, SUBJECT_KEY } from "socket.io-nats-adapter";
import { BroadcastFlags, Room, SocketId } from "socket.io-adapter";
import { Packet, PacketType } from "socket.io-parser";

const debug = _debug("socket.io-nats-emitter");

export interface NatsEmitterOptions {
  key?: string;
  nsp?: string;
}

/**
 * Returns a NATS Adapter function
 *
 * TODO: Add return type https://github.com/socketio/socket.io/issues/3796
 */
export const createEmitter = (client: Client, opts?: NatsEmitterOptions) => {
  return new NatsEmitter(client, opts?.nsp, opts?.key);
};

export class NatsEmitter {
  private subject: string;
  private uid = "socket.io-nats-emitter";
  private except: SocketId[] = [];
  private flags: BroadcastFlags = {};
  private rooms: Room[] = [];

  constructor(
    private client: Client,
    private nsp = "/",
    private key = SUBJECT_KEY
  ) {
    this.subject = key + "." + nsp;
  }

  of(nsp: string): NatsEmitter {
    return new NatsEmitter(
      this.client,
      (nsp !== "/" ? "/" : "") + nsp,
      this.subject
    );
  }

  to(room: string): this {
    this.rooms.push(room);
    return this;
  }

  /**
   * Send the packet
   */
  emit(event: string, ...data: any): this {
    const packet: Packet = {
      type: PacketType.EVENT,
      data: [event, ...data],
      nsp: this.nsp,
    };

    const dto: NatsAdapterOptionsDto = {
      fromUid: this.uid,
      packet,
      opts: {
        rooms: Array.from(this.rooms),
        except: Array.from(this.except),
        flags: this.flags,
      },
    };

    const msg = JSON.stringify(dto);

    debug("Publishing message to subject '%s'", this.subject);
    this.client.publish(this.subject, msg);

    this.rooms = [];
    this.except = [];
    this.flags = {};

    return this;
  }
}
