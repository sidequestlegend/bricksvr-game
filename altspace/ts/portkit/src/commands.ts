// Numbered commands to the referee.
//
// Several upstream games use a synced field as a command channel ("task"): a player writes a request and the
// master acts on it when it deserialises. Copied as is, a late joiner would act on the last request again, and a
// request written while the referee changes would be lost. So a request is a record instead:
//
//   - The sender publishes the head of its queue in its announcement leaf: x.q = [n, behaviour, player, name, args].
//   - The referee runs every request whose number is above the one it has acknowledged for that sender, then
//     writes the number into its own announcement leaf: x.ak = {e, m: {<sid>: n}} (refrecord.ts). It is not in
//     public space state, where any client could acknowledge another player's requests so that they never run.
//   - The sender publishes its next request once the acknowledgement is mirrored.
//
// Only the referee ever runs a request, each one in order; a new referee carries on from the last numbers it read.
// (If a referee runs a request and leaves before its acknowledgement reaches the room, the next referee runs it
// again: at-least-once in that one corner.)

import type { Behaviour } from "./behaviour.ts";
import type { Core } from "./core.ts";
import type { Presence } from "./presence.ts";
import type { Referee } from "./referee.ts";
import { RefereeTable } from "./refrecord.ts";
import { asciiJson, utf8Length } from "./util.ts";
import { decodeValue, encodeValue } from "./values.ts";

export interface CommandRoutes {
  /** The local copy of the behaviour a request addresses: its id and, for a per-player one, its owner's session. */
  resolve(id: string, playerSid: string | null): Behaviour | null;
  address(behaviour: Behaviour): { id: string; playerSid: string | null } | null;
  /** Runs `name` on the behaviour with the sender as the calling player. */
  invoke(behaviour: Behaviour, name: string, args: unknown[], fromSid: string): void;
  acknowledged(behaviour: Behaviour, number: number): void;
  refused(behaviour: Behaviour, code: string, name: string): void;
}

interface Pending {
  n: number;
  behaviour: Behaviour;
  record: [number, string, string, string, unknown[]];
}

/** A request must fit in the announcement leaf with room to spare. */
const MAX_COMMAND_BYTES = 2048;

export class Commands {
  private readonly core: Core;
  private readonly presence: Presence;
  private readonly referee: Referee;
  private readonly routes: CommandRoutes;
  private readonly queue: Pending[] = [];
  private nextNumber = 0;
  private readonly acks: RefereeTable<number>;
  /** False until behaviours have started: the referee runs nothing before then. */
  started = false;
  run = 0;

  constructor(core: Core, presence: Presence, referee: Referee, routes: CommandRoutes) {
    this.core = core;
    this.presence = presence;
    this.referee = referee;
    this.routes = routes;
    this.acks = new RefereeTable(presence, referee, "ak", (v) => (typeof v === "number" ? v : null));
  }

  listen(): void {
    this.presence.onExtra(() => this.review());
    this.presence.on(() => this.review());
    this.referee.on(() => this.review());
  }

  send(behaviour: Behaviour, name: string, args: unknown[]): number {
    const address = this.routes.address(behaviour);
    if (!address) return 0;
    if (this.nextNumber === 0) this.nextNumber = (this.table()[this.core.me.sid] ?? 0) + 1;
    const n = this.nextNumber++;
    const record: Pending["record"] = [n, address.id, address.playerSid ?? "", name, args.map(encodeValue)];
    if (utf8Length(asciiJson(record)) > MAX_COMMAND_BYTES) {
      this.routes.refused(behaviour, "value_too_large", name);
      return 0;
    }
    this.queue.push({ n, behaviour, record });
    this.review();
    return n;
  }

  /** Publishes, runs and acknowledges whatever is due. Also called about once a second. */
  review(): void {
    if (this.core.disposed || !this.started) return;
    const me = this.core.me.sid;
    const acked = this.table()[me] ?? 0;
    while (this.queue.length && this.queue[0]!.n <= acked) {
      const done = this.queue.shift()!;
      this.core.guard("OnCommandAcknowledged", () => this.routes.acknowledged(done.behaviour, done.n));
    }
    const head = this.queue[0];
    const published = this.presence.extra(me, "q");
    if (head) {
      if (!Array.isArray(published) || published[0] !== head.n) this.presence.setExtra("q", head.record);
    } else if (published !== undefined) this.presence.setExtra("q", undefined);
    if (this.referee.isMe()) this.officiate();
  }

  private officiate(): void {
    const table = this.acks.working();
    let changed = false;
    for (const sid of Object.keys(table)) {
      if (!this.presence.has(sid)) {
        delete table[sid];
        changed = true;
      }
    }
    for (const who of this.presence.list()) {
      const q = this.presence.extra(who.sid, "q");
      if (!Array.isArray(q) || typeof q[0] !== "number" || typeof q[1] !== "string" || typeof q[3] !== "string") continue;
      if (q[0] <= (table[who.sid] ?? 0)) continue;
      table[who.sid] = q[0];
      changed = true;
      const behaviour = this.routes.resolve(q[1], typeof q[2] === "string" && q[2] ? q[2] : null);
      const args = Array.isArray(q[4]) ? q[4].map(decodeValue) : [];
      this.run++;
      if (behaviour) this.routes.invoke(behaviour, q[3], args, who.sid);
    }
    if (changed) this.acks.write(table);
  }

  private table(): Record<string, number> {
    return this.acks.read();
  }
}
