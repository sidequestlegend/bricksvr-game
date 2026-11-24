/*!
 * pk-brick-builder.js - Brick Builder, a port of BricksVR (d12/bricksvr-game) to Altspace.
 *
 * Copyright 2021 BricksVR Studios Inc.
 * Copyright (c) 2026 the Brick Builder port's contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Upstream source: https://github.com/d12/bricksvr-game
 * Source of this script (TypeScript): https://github.com/sidequestlegend/bricksvr-game (branch altspace, folder
 * altspace/ts; build with npm run build). It bundles the portkit runtime (MIT License, Copyright (c) 2026 the portkit
 * authors).
 */
/* pk-brick-builder.js: portkit runtime with the rules of 'brick-builder' (protocol pk1, bindings c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9). Built file: do not edit. */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // portkit/src/behaviour.ts
  var LINK = /* @__PURE__ */ Symbol("pk1.link");
  function linkBehaviour(behaviour, link) {
    Object.defineProperty(behaviour, LINK, { value: link, enumerable: false, configurable: true, writable: false });
  }
  function linkOf(behaviour) {
    const link = behaviour[LINK];
    if (!link) throw new Error("this behaviour is not part of a running instance yet (do not use the runtime in a constructor or a field initialiser)");
    return link;
  }
  var Behaviour = class {
    // ---- what the runtime provides ------------------------------------------------------------------------------
    /** The id this behaviour has in bindings.json. */
    get behaviourId() {
      return linkOf(this).id;
    }
    get gameObject() {
      return linkOf(this).gameObject;
    }
    get transform() {
      return linkOf(this).gameObject.transform;
    }
    get Networking() {
      return linkOf(this).networking;
    }
    get Time() {
      return linkOf(this).time;
    }
    get Random() {
      return linkOf(this).random;
    }
    get Debug() {
      return linkOf(this).debug;
    }
    /** Commit / reveal, fair draws and sealed delivery. */
    get Secrets() {
      return linkOf(this).secrets;
    }
    /** Per-device saved data for the local player (localStorage). */
    get Storage() {
      return linkOf(this).storage;
    }
    /** Text, animator parameters, particles and colours on kit objects. */
    get Host() {
      return linkOf(this).host;
    }
    /** The snippet element's attributes. */
    get Settings() {
      return linkOf(this).settings;
    }
    /** Per-player saved values everyone present can read (VRChat: PlayerData). */
    get PlayerData() {
      return linkOf(this).playerData;
    }
    /** Buttons, thumbsticks, triggers, keys, head and hand poses, haptics, teleport. */
    get Input() {
      return linkOf(this).input;
    }
    /** Values only the world's owner and moderators can write. */
    get Protected() {
      return linkOf(this).protectedValues;
    }
    /**
     * For a per-player behaviour: the player it belongs to. Null on an ordinary behaviour. An upstream field named
     * `Player` would hide it: such a port renames the field (the convention: `upstreamPlayer`) or reads `OwnerPlayer`.
     */
    get Player() {
      return linkOf(this).player;
    }
    /** The same as `Player`, under a name no upstream field is likely to use. */
    get OwnerPlayer() {
      return linkOf(this).player;
    }
    /**
     * One object shared by every instance of this game on the page (two tables of one game keep one chip balance
     * here). Page memory only: not synced, not saved, gone when the page reloads (use Storage for that).
     */
    get Shared() {
      return linkOf(this).shared;
    }
    /** This instance's key (the `room` / `instance` attribute, or the element's index): `pk1.<slug>.<key>`. */
    get InstanceKey() {
      return linkOf(this).instanceKey;
    }
    /**
     * This behaviour's own click reach in metres, overriding the bindings' `reach`, the class's `interactReach` and
     * the game's default (a snippet setting, for example). Undefined: those apply. 0: any distance.
     */
    get InteractReach() {
      return linkOf(this).reach.get(this);
    }
    set InteractReach(metres) {
      if (metres === void 0) linkOf(this).reach.delete(this);
      else linkOf(this).reach.set(this, metres);
    }
    // ---- calls --------------------------------------------------------------------------------------------------
    /** Sends the synced fields. Only the owner's request does anything; it goes out at the end of the tick. */
    RequestSerialization() {
      linkOf(this).requestSerialization();
    }
    SendCustomEvent(name) {
      const fn = this[name];
      if (typeof fn === "function") fn.call(this);
      else this.Debug.LogWarning(`SendCustomEvent: ${this.behaviourId} has no method '${name}'`);
    }
    /**
     * Runs `name` on every client (All: here at once, then everywhere else) or only on the owner's. Arguments
     * must be JSON data or the value types of values.ts. While the method runs, `Networking.CallingPlayer` is
     * the sender: check it before honouring a request not everybody may make. `name` must be listed in the
     * class's `static networkCallable`.
     */
    SendCustomNetworkEvent(target, name, ...args) {
      linkOf(this).sendNetworkEvent(target, name, args);
    }
    /**
     * Asks the referee to run `name` on its copy of this behaviour, with `Networking.CallingPlayer` set to the
     * sender. Unlike a network event the request is numbered and kept until the referee acknowledges it: it is
     * run in order, survives a change of referee, and is never replayed to a late joiner. Returns its number.
     */
    SendCommand(name, ...args) {
      return linkOf(this).sendCommand(name, args);
    }
    SendCustomEventDelayedSeconds(name, seconds) {
      linkOf(this).delaySeconds(name, seconds);
    }
    /** A frame is one 50 ms tick here. */
    SendCustomEventDelayedFrames(name, frames) {
      linkOf(this).delayFrames(name, frames);
    }
    /** Another behaviour of this instance, by its bindings id. */
    FindBehaviour(id) {
      return linkOf(this).find(id);
    }
    /** Every ordinary behaviour of this instance with the given bindings type, in bindings order. */
    FindBehavioursOfType(type) {
      return linkOf(this).findByType(type);
    }
    /** The per-player behaviour of the given type that belongs to `player`. */
    PlayerBehaviour(player, type) {
      return linkOf(this).playerBehaviour(player, type);
    }
    /** One per-player behaviour of the given type for every player present, in player-id order. */
    PlayerBehaviours(type) {
      return linkOf(this).playerBehaviours(type);
    }
    /** One of the few things that are truly asynchronous: await it. */
    Raycast(origin, direction, maxDistance = 1e3, layerMask = -1) {
      return linkOf(this).raycast(origin, direction, maxDistance, layerMask);
    }
    /**
     * Has `method` called when a graph of the kit reports `name` through
     * `window.__pk1.event("<slug>:<inst>", "<name>", "<arg>|<arg>...")`. The method receives the arguments as strings.
     */
    RegisterGraphEvent(name, method) {
      linkOf(this).onGraphEvent(name, method);
    }
    // ---- overridable, as in UdonSharp ---------------------------------------------------------------------------
    Start() {
    }
    /**
     * Called after Start and after any saved values were applied, once this client knows what it came to: a new
     * game ("fresh"), saved state nobody was playing ("resumed": carry on or reset, as the game prefers), a game
     * others are playing ("joined"), or no game yet ("idle"). In a game with declared referee candidates it is
     * called again when the first referee is elected. The same value is `this.Networking.StartKind`.
     */
    OnInstanceStart(_kind) {
    }
    /** Called 20 times a second, only on classes that override it. `this.Time.deltaTime` is the time it covers. */
    Update() {
    }
    /** Synced fields were just replaced by another player's values. Not called for the owner's own writes. */
    OnDeserialization(_result) {
    }
    OnPreSerialization() {
    }
    /** `success` is false when the room refused the write (see OnWriteRefused for why). */
    OnPostSerialization(_result) {
    }
    OnOwnershipTransferred(_player) {
    }
    OnPlayerJoined(_player) {
    }
    OnPlayerLeft(_player) {
    }
    /** A player's saved data and per-player behaviours are loaded and published (VRChat: OnPlayerRestored). */
    OnPlayerRestored(_player) {
    }
    /** Values in a player's PlayerData changed; `keys` names them. */
    OnPlayerDataUpdated(_player, _keys) {
    }
    /** The room refused something this behaviour wrote. Also reported through OnPostSerialization for fields. */
    OnWriteRefused(_refusal) {
    }
    /** The referee has run the command this behaviour sent with that number. */
    OnCommandAcknowledged(_number) {
    }
    /** A player's fair draw under `label` changed state (see Secrets.beginDraw). Called on every behaviour that overrides it. */
    OnDrawChanged(_player, _label, _state) {
    }
    /** A protected value changed. Called on every behaviour that overrides it. */
    OnProtectedChanged(_key) {
    }
    /**
     * The referee changed (VRChat: OnMasterTransferred). Null when there is none left (a game with declared
     * candidates and nobody offering). A game with hidden information may void its match here: the new referee
     * does not know what the old one dealt.
     */
    OnMasterTransferred(_newMaster) {
    }
    /** A controller button of the local player went down or came up. Called on every behaviour that overrides it. */
    OnButtonPressed(_button, _side) {
    }
    OnButtonReleased(_button, _side) {
    }
    /** A key went down or came up; `key` is the Unity KeyCode name. */
    OnKeyPressed(_key) {
    }
    OnKeyReleased(_key) {
    }
    /** The local player clicked this behaviour's object. */
    Interact() {
    }
    OnPickup() {
    }
    OnDrop() {
    }
    /** The instance is going away (its element left the page), or this per-player behaviour's player left. */
    OnDestroy() {
    }
  };
  /** Names of the fields that are synced. Values must be JSON data, arrays of it, or the value types of values.ts. */
  __publicField(Behaviour, "synced", []);
  /** "manual": sent by RequestSerialization(). "continuous": sent when changed, a few times a second. */
  __publicField(Behaviour, "syncMode", "manual");
  /**
   * UdonSharp's [FieldChangeCallback]: synced field name -> the property to assign instead. When a received
   * value differs from the field's current one, the property's setter is called with it (and must store it);
   * local code gets the same effect by assigning through the property.
   *
   *   static synced = ["_open"];
   *   static fieldChangeCallbacks = { _open: "Open" };
   *   _open = false;
   *   get Open() { return this._open; }
   *   set Open(value: boolean) { this._open = value; this.door.SetActive(!value); }
   */
  __publicField(Behaviour, "fieldChangeCallbacks", {});
  /**
   * True for a behaviour that exists once per player (VRChat: a PlayerObject). It is made when the player joins
   * and dropped when they leave, that player owns it for good, and its synced fields travel in their user state.
   */
  __publicField(Behaviour, "perPlayer", false);
  /** For a per-player behaviour: its synced fields are saved on the device and put back on the next visit. */
  __publicField(Behaviour, "persistent", false);
  /**
   * Metres from the nearest of the local head and hands within which a click counts as Interact() (or as a bound
   * click). 0 means any distance. A behaviour can change its own at run time with `InteractReach`.
   */
  __publicField(Behaviour, "interactReach", 0);
  /**
   * The methods another client may run on this behaviour: by SendCustomNetworkEvent, or by SendCommand on the
   * referee. Nothing else can be called from the network (a modified client names any method it likes), and a
   * name starting with `_` never can. A subclass's list adds to its parent's.
   *
   *   static networkCallable = ["StartGame", "PlaceBid"];
   */
  __publicField(Behaviour, "networkCallable", []);

  // portkit/src/names.ts
  var TAG = "pk1";
  function sanitizeInstanceKey(raw) {
    if (!raw) return "";
    return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24).replace(/-+$/g, "");
  }
  function isValidSlug(slug) {
    return /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug);
  }
  function instanceKeyFor(attrs, indexAmongSameName) {
    return sanitizeInstanceKey(attrs.room) || sanitizeInstanceKey(attrs.instance) || String(indexAmongSameName);
  }
  function holderName(slug, inst) {
    return `${TAG}:${slug}:${inst}`;
  }
  function relayKey(slug, inst) {
    return `${slug}:${inst}`;
  }
  function networkId(slug, inst, objKey) {
    return `${TAG}/${slug}/${inst}/${objKey}`;
  }
  function statePrefix(slug, inst) {
    return `${TAG}.${slug}.${inst}`;
  }
  function storagePrefix(slug, inst, uid) {
    return `${TAG}.${slug}.${inst}.${uid}.`;
  }
  function isPathSegment(segment) {
    return /^[A-Za-z0-9_\-@]{1,64}$/.test(segment);
  }
  function makeEnvelope(slug, inst, type, fields) {
    return { pk: 1, g: slug, i: inst, t: type, ...fields };
  }

  // portkit/src/util.ts
  function utf8Length(text) {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 128) bytes += 1;
      else if (c < 2048) bytes += 2;
      else if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        bytes += 4;
        i++;
      } else bytes += 3;
    }
    return bytes;
  }
  function utf8Encode(text) {
    const out = new Uint8Array(utf8Length(text));
    let o = 0;
    for (let i = 0; i < text.length; i++) {
      let c = text.charCodeAt(i);
      if (c >= 55296 && c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (text.charCodeAt(++i) - 56320);
      } else if (c >= 55296 && c <= 57343) c = 65533;
      if (c < 128) out[o++] = c;
      else if (c < 2048) {
        out[o++] = 192 | c >> 6;
        out[o++] = 128 | c & 63;
      } else if (c < 65536) {
        out[o++] = 224 | c >> 12;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      } else {
        out[o++] = 240 | c >> 18;
        out[o++] = 128 | c >> 12 & 63;
        out[o++] = 128 | c >> 6 & 63;
        out[o++] = 128 | c & 63;
      }
    }
    return out;
  }
  function utf8Decode(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; ) {
      const b = bytes[i++];
      let c;
      if (b < 128) c = b;
      else if (b < 224) c = (b & 31) << 6 | bytes[i++] & 63;
      else if (b < 240) {
        c = (b & 15) << 12 | (bytes[i] & 63) << 6 | bytes[i + 1] & 63;
        i += 2;
      } else {
        c = (b & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
        i += 3;
      }
      out += String.fromCodePoint(c);
    }
    return out;
  }
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  function toBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += B64[a >> 2] + B64[(a & 3) << 4 | b >> 4];
      if (i + 1 < bytes.length) out += B64[(b & 15) << 2 | c >> 6];
      if (i + 2 < bytes.length) out += B64[c & 63];
    }
    return out;
  }
  function fromBase64(text) {
    const clean = text.replace(/=+$/, "");
    const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
    let o = 0;
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < clean.length; i++) {
      let v = B64.indexOf(clean[i]);
      if (v < 0) v = clean[i] === "+" ? 62 : clean[i] === "/" ? 63 : -1;
      if (v < 0) throw new Error("bad base64 character");
      buffer = buffer << 6 | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out[o++] = buffer >> bits & 255;
      }
    }
    return out.subarray(0, o);
  }
  function fnv1a(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function canonicalJson(value) {
    return JSON.stringify(sortKeys(value));
  }
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      const out = {};
      for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
      return out;
    }
    return value;
  }
  function asciiJson(value) {
    const json = JSON.stringify(value);
    let out = "";
    let from = 0;
    for (let i = 0; i < json.length; i++) {
      const code = json.charCodeAt(i);
      if (code !== 124 && code < 127) continue;
      out += json.slice(from, i) + BACKSLASH + "u" + code.toString(16).padStart(4, "0");
      from = i + 1;
    }
    return from === 0 ? json : out + json.slice(from);
  }
  var BACKSLASH = String.fromCharCode(92);
  function jsonLeafBytes(text) {
    let bytes = 2;
    for (let i = 0; i < text.length; i++) bytes += leafCharBytes(text, i);
    return bytes;
  }
  function leafCharBytes(text, i) {
    const c = text.charCodeAt(i);
    if (c === 34 || c === 92) return 2;
    if (c < 32) return c === 8 || c === 9 || c === 10 || c === 12 || c === 13 ? 2 : 6;
    if (c < 128) return 1;
    if (c < 2048) return 2;
    if (c >= 56320 && c <= 57343) return i > 0 && (text.charCodeAt(i - 1) & 64512) === 55296 ? 0 : 3;
    if (c >= 55296 && c <= 56319) return i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320 ? 4 : 3;
    return 3;
  }
  function safeParse(text) {
    if (typeof text !== "string" || text.length === 0) return void 0;
    try {
      return JSON.parse(text);
    } catch {
      return void 0;
    }
  }
  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function deferred() {
    let resolveFn;
    const d = {
      promise: new Promise((resolve) => {
        resolveFn = resolve;
      }),
      resolve(value) {
        if (d.settled) return;
        d.settled = true;
        resolveFn(value);
      },
      settled: false
    };
    return d;
  }

  // portkit/src/values.ts
  var Vector2 = class _Vector2 {
    constructor(x = 0, y = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      this.x = x;
      this.y = y;
    }
    static get zero() {
      return new _Vector2(0, 0);
    }
    static get one() {
      return new _Vector2(1, 1);
    }
    static get up() {
      return new _Vector2(0, 1);
    }
    static get down() {
      return new _Vector2(0, -1);
    }
    static get left() {
      return new _Vector2(-1, 0);
    }
    static get right() {
      return new _Vector2(1, 0);
    }
    clone() {
      return new _Vector2(this.x, this.y);
    }
    add(o) {
      return new _Vector2(this.x + o.x, this.y + o.y);
    }
    sub(o) {
      return new _Vector2(this.x - o.x, this.y - o.y);
    }
    scale(k) {
      return new _Vector2(this.x * k, this.y * k);
    }
    /** C# `==` on Vector2 is an approximate comparison; this is the same test. */
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      return dx * dx + dy * dy < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector2.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y;
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector2(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    }
    toString() {
      return `(${this.x}, ${this.y})`;
    }
  };
  var Vector3 = class _Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static get zero() {
      return new _Vector3(0, 0, 0);
    }
    static get one() {
      return new _Vector3(1, 1, 1);
    }
    static get up() {
      return new _Vector3(0, 1, 0);
    }
    static get down() {
      return new _Vector3(0, -1, 0);
    }
    static get left() {
      return new _Vector3(-1, 0, 0);
    }
    static get right() {
      return new _Vector3(1, 0, 0);
    }
    static get forward() {
      return new _Vector3(0, 0, 1);
    }
    static get back() {
      return new _Vector3(0, 0, -1);
    }
    clone() {
      return new _Vector3(this.x, this.y, this.z);
    }
    add(o) {
      return new _Vector3(this.x + o.x, this.y + o.y, this.z + o.z);
    }
    sub(o) {
      return new _Vector3(this.x - o.x, this.y - o.y, this.z - o.z);
    }
    scale(k) {
      return new _Vector3(this.x * k, this.y * k, this.z * k);
    }
    equals(o) {
      if (!o) return false;
      const dx = this.x - o.x;
      const dy = this.y - o.y;
      const dz = this.z - o.z;
      return dx * dx + dy * dy + dz * dz < 999999944e-19;
    }
    get magnitude() {
      return Math.sqrt(this.sqrMagnitude);
    }
    get sqrMagnitude() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    get normalized() {
      const m = this.magnitude;
      return m > 1e-5 ? this.scale(1 / m) : _Vector3.zero;
    }
    static Distance(a, b) {
      return a.sub(b).magnitude;
    }
    /** Degrees between two directions, 0 to 180 (UnityEngine.Vector3.Angle; 0 when either is nearly zero). */
    static Angle(from, to) {
      const denominator = Math.sqrt(from.sqrMagnitude * to.sqrMagnitude);
      if (denominator < 1e-15) return 0;
      const dot = Mathf.Clamp(_Vector3.Dot(from, to) / denominator, -1, 1);
      return Math.acos(dot) * Mathf.Rad2Deg;
    }
    /** Reflects a direction off the plane with normal `inNormal` (UnityEngine.Vector3.Reflect). */
    static Reflect(inDirection, inNormal) {
      const factor = -2 * _Vector3.Dot(inNormal, inDirection);
      return new _Vector3(factor * inNormal.x + inDirection.x, factor * inNormal.y + inDirection.y, factor * inNormal.z + inDirection.z);
    }
    static Dot(a, b) {
      return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static Cross(a, b) {
      return new _Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Vector3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
    }
    static MoveTowards(current, target, maxDelta) {
      const d = target.sub(current);
      const m = d.magnitude;
      return m <= maxDelta || m === 0 ? target.clone() : current.add(d.scale(maxDelta / m));
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z})`;
    }
  };
  var Quaternion = class _Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    static get identity() {
      return new _Quaternion(0, 0, 0, 1);
    }
    clone() {
      return new _Quaternion(this.x, this.y, this.z, this.w);
    }
    /** Unity's Quaternion.Euler: degrees, applied in Z, X, Y order. */
    static Euler(x, y, z) {
      const hx = x * Mathf.Deg2Rad / 2;
      const hy = y * Mathf.Deg2Rad / 2;
      const hz = z * Mathf.Deg2Rad / 2;
      const sx = Math.sin(hx), cx = Math.cos(hx);
      const sy = Math.sin(hy), cy = Math.cos(hy);
      const sz = Math.sin(hz), cz = Math.cos(hz);
      return new _Quaternion(
        cy * sx * cz + sy * cx * sz,
        sy * cx * cz - cy * sx * sz,
        cy * cx * sz - sy * sx * cz,
        cy * cx * cz + sy * sx * sz
      );
    }
    static AngleAxis(degrees, axis) {
      const n = axis.normalized;
      const h = degrees * Mathf.Deg2Rad / 2;
      const s = Math.sin(h);
      return new _Quaternion(n.x * s, n.y * s, n.z * s, Math.cos(h));
    }
    /** this * o: rotate by o first, then by this (Unity's operator order). */
    mul(o) {
      return new _Quaternion(
        this.w * o.x + this.x * o.w + this.y * o.z - this.z * o.y,
        this.w * o.y + this.y * o.w + this.z * o.x - this.x * o.z,
        this.w * o.z + this.z * o.w + this.x * o.y - this.y * o.x,
        this.w * o.w - this.x * o.x - this.y * o.y - this.z * o.z
      );
    }
    /** this * v: the vector rotated by this quaternion. */
    rotate(v) {
      const { x, y, z, w } = this;
      const tx = 2 * (y * v.z - z * v.y);
      const ty = 2 * (z * v.x - x * v.z);
      const tz = 2 * (x * v.y - y * v.x);
      return new Vector3(v.x + w * tx + (y * tz - z * ty), v.y + w * ty + (z * tx - x * tz), v.z + w * tz + (x * ty - y * tx));
    }
    get inverse() {
      const n = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w || 1;
      return new _Quaternion(-this.x / n, -this.y / n, -this.z / n, this.w / n);
    }
    /** Degrees, each in [0, 360), in Unity's convention. */
    get eulerAngles() {
      const { x, y, z, w } = this;
      const sinX = 2 * (w * x - y * z);
      let ex, ey, ez;
      if (Math.abs(sinX) > 0.9999995) {
        ex = Math.sign(sinX) * Math.PI / 2;
        ey = 2 * Math.atan2(y, w);
        ez = 0;
      } else {
        ex = Math.asin(sinX);
        ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
        ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
      }
      const wrap = (r) => {
        const d = r * Mathf.Rad2Deg % 360;
        return d < 0 ? d + 360 : d;
      };
      return new Vector3(wrap(ex), wrap(ey), wrap(ez));
    }
    /** Degrees between two rotations (UnityEngine.Quaternion.Angle). */
    static Angle(a, b) {
      const dot = Math.min(Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w), 1);
      return dot > 0.999999 ? 0 : Math.acos(dot) * 2 * Mathf.Rad2Deg;
    }
    /**
     * The rotation whose forward (Z) is `forward` and whose up is as close to `upwards` as it can be
     * (UnityEngine.Quaternion.LookRotation). A zero forward gives the identity.
     */
    static LookRotation(forward, upwards = new Vector3(0, 1, 0)) {
      const f = forward.normalized;
      if (f.sqrMagnitude < 1e-12) return _Quaternion.identity;
      let r = Vector3.Cross(upwards, f);
      if (r.sqrMagnitude < 1e-12) {
        const axis = Vector3.Cross(new Vector3(0, 0, 1), f);
        if (axis.sqrMagnitude < 1e-12) return f.z >= 0 ? _Quaternion.identity : new _Quaternion(0, 1, 0, 0);
        return _Quaternion.AngleAxis(Math.acos(Mathf.Clamp(f.z, -1, 1)) * Mathf.Rad2Deg, axis);
      }
      r = r.normalized;
      const u = Vector3.Cross(f, r);
      const m00 = r.x, m01 = u.x, m02 = f.x;
      const m10 = r.y, m11 = u.y, m12 = f.y;
      const m20 = r.z, m21 = u.z, m22 = f.z;
      const trace = m00 + m11 + m22;
      let q;
      if (trace > 0) {
        const s = Math.sqrt(trace + 1) * 2;
        q = new _Quaternion((m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s);
      } else if (m00 > m11 && m00 > m22) {
        const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
        q = new _Quaternion(0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s);
      } else if (m11 > m22) {
        const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
        q = new _Quaternion((m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s);
      } else {
        const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
        q = new _Quaternion((m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s);
      }
      return q;
    }
    static Slerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
      const s = dot < 0 ? -1 : 1;
      dot = Math.abs(dot);
      let wa, wb;
      if (dot > 0.9995) {
        wa = 1 - k;
        wb = k;
      } else {
        const theta = Math.acos(dot);
        const sin = Math.sin(theta);
        wa = Math.sin((1 - k) * theta) / sin;
        wb = Math.sin(k * theta) / sin;
      }
      wb *= s;
      const q = new _Quaternion(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb);
      const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
      return new _Quaternion(q.x / n, q.y / n, q.z / n, q.w / n);
    }
    equals(o) {
      if (!o) return false;
      return Math.abs(this.x * o.x + this.y * o.y + this.z * o.z + this.w * o.w) > 0.999999;
    }
    toString() {
      return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
    }
  };
  var Vector4 = class _Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
      __publicField(this, "x");
      __publicField(this, "y");
      __publicField(this, "z");
      __publicField(this, "w");
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    clone() {
      return new _Vector4(this.x, this.y, this.z, this.w);
    }
    equals(o) {
      return !!o && this.x === o.x && this.y === o.y && this.z === o.z && this.w === o.w;
    }
  };
  var Color = class _Color {
    constructor(r = 0, g = 0, b = 0, a = 1) {
      __publicField(this, "r");
      __publicField(this, "g");
      __publicField(this, "b");
      __publicField(this, "a");
      this.r = r;
      this.g = g;
      this.b = b;
      this.a = a;
    }
    static get white() {
      return new _Color(1, 1, 1, 1);
    }
    static get black() {
      return new _Color(0, 0, 0, 1);
    }
    static get red() {
      return new _Color(1, 0, 0, 1);
    }
    static get green() {
      return new _Color(0, 1, 0, 1);
    }
    static get blue() {
      return new _Color(0, 0, 1, 1);
    }
    static get yellow() {
      return new _Color(1, 0.92156863, 0.015686275, 1);
    }
    static get clear() {
      return new _Color(0, 0, 0, 0);
    }
    static get cyan() {
      return new _Color(0, 1, 1, 1);
    }
    static get magenta() {
      return new _Color(1, 0, 1, 1);
    }
    static get gray() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    static get grey() {
      return new _Color(0.5, 0.5, 0.5, 1);
    }
    /**
     * UnityEngine.Color.HSVToRGB, line for line: H, S, V in [0, 1]; with `hdr` false each channel is clamped to
     * [0, 1]. Alpha is 1. (Unity computes in single precision; this in double: the last digits can differ.)
     */
    static HSVToRGB(H, S, V, hdr = true) {
      const c = new _Color(1, 1, 1, 1);
      if (S === 0) {
        c.r = V;
        c.g = V;
        c.b = V;
      } else if (V === 0) {
        c.r = 0;
        c.g = 0;
        c.b = 0;
      } else {
        c.r = 0;
        c.g = 0;
        c.b = 0;
        const h = H * 6;
        const temp = Math.floor(h);
        const t = h - temp;
        const var1 = V * (1 - S);
        const var2 = V * (1 - S * t);
        const var3 = V * (1 - S * (1 - t));
        switch (temp) {
          case 0:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case 1:
            c.r = var2;
            c.g = V;
            c.b = var1;
            break;
          case 2:
            c.r = var1;
            c.g = V;
            c.b = var3;
            break;
          case 3:
            c.r = var1;
            c.g = var2;
            c.b = V;
            break;
          case 4:
            c.r = var3;
            c.g = var1;
            c.b = V;
            break;
          case 5:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
          case 6:
            c.r = V;
            c.g = var3;
            c.b = var1;
            break;
          case -1:
            c.r = V;
            c.g = var1;
            c.b = var2;
            break;
        }
        if (!hdr) {
          c.r = Mathf.Clamp01(c.r);
          c.g = Mathf.Clamp01(c.g);
          c.b = Mathf.Clamp01(c.b);
        }
      }
      return c;
    }
    /** UnityEngine.Color.RGBToHSV: [H, S, V], each in [0, 1]. */
    static RGBToHSV(color) {
      const { r, g, b } = color;
      const rgbToHue = (offset, dominant, c1, c2) => {
        const V = dominant;
        if (V === 0) return [0, 0, 0];
        const min = c1 > c2 ? c2 : c1;
        const delta = V - min;
        if (delta === 0) return [0, 0, V];
        const S = delta / V;
        let H = offset + (c1 - c2) / delta;
        H /= 6;
        if (H < 0) H += 1;
        return [H, S, V];
      };
      if (b > g && b > r) return rgbToHue(4, b, r, g);
      if (g > r) return rgbToHue(2, g, b, r);
      return rgbToHue(0, r, g, b);
    }
    clone() {
      return new _Color(this.r, this.g, this.b, this.a);
    }
    static Lerp(a, b, t) {
      const k = Mathf.Clamp01(t);
      return new _Color(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, a.a + (b.a - a.a) * k);
    }
    equals(o) {
      return !!o && this.r === o.r && this.g === o.g && this.b === o.b && this.a === o.a;
    }
  };
  var Curve = class {
    constructor(keys) {
      __publicField(this, "keys");
      this.keys = keys;
    }
    Evaluate(t) {
      const k = this.keys;
      if (k.length === 0) return 0;
      if (t <= k[0][0]) return k[0][1];
      for (let i = 1; i < k.length; i++) {
        if (t <= k[i][0]) {
          const [t0, v0] = k[i - 1];
          const [t1, v1] = k[i];
          return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
        }
      }
      return k[k.length - 1][1];
    }
  };
  var Mathf = {
    PI: Math.PI,
    Deg2Rad: Math.PI / 180,
    Rad2Deg: 180 / Math.PI,
    Epsilon: 1401298e-51,
    Infinity: Number.POSITIVE_INFINITY,
    Abs: Math.abs,
    Min: Math.min,
    Max: Math.max,
    Sqrt: Math.sqrt,
    Pow: Math.pow,
    Sin: Math.sin,
    Cos: Math.cos,
    Atan2: Math.atan2,
    Floor: Math.floor,
    Ceil: Math.ceil,
    FloorToInt: (v) => Math.floor(v),
    CeilToInt: (v) => Math.ceil(v),
    /** C# rounds halves to the even neighbour; Math.round does not. */
    Round: (v) => {
      const f = Math.floor(v);
      const d = v - f;
      if (d < 0.5) return f;
      if (d > 0.5) return f + 1;
      return f % 2 === 0 ? f : f + 1;
    },
    RoundToInt: (v) => Mathf.Round(v),
    Sign: (v) => v >= 0 ? 1 : -1,
    Clamp: (v, lo, hi) => v < lo ? lo : v > hi ? hi : v,
    Clamp01: (v) => v < 0 ? 0 : v > 1 ? 1 : v,
    Lerp: (a, b, t) => a + (b - a) * Mathf.Clamp01(t),
    LerpUnclamped: (a, b, t) => a + (b - a) * t,
    InverseLerp: (a, b, v) => a === b ? 0 : Mathf.Clamp01((v - a) / (b - a)),
    MoveTowards: (current, target, maxDelta) => Math.abs(target - current) <= maxDelta ? target : current + Math.sign(target - current) * maxDelta,
    Repeat: (t, length) => Mathf.Clamp(t - Math.floor(t / length) * length, 0, length),
    Approximately: (a, b) => Math.abs(b - a) < Math.max(1e-6 * Math.max(Math.abs(a), Math.abs(b)), 1121039e-50)
  };
  function encodeValue(value) {
    if (value === void 0 || value === null) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "object") return value;
    if (value instanceof Vector2) return { $v2: [value.x, value.y] };
    if (value instanceof Vector3) return { $v3: [value.x, value.y, value.z] };
    if (value instanceof Quaternion) return { $q: [value.x, value.y, value.z, value.w] };
    if (value instanceof Vector4) return { $v4: [value.x, value.y, value.z, value.w] };
    if (value instanceof Color) return { $color: [value.r, value.g, value.b, value.a] };
    if (value instanceof Curve) return { $curve: value.keys };
    if (Array.isArray(value)) return value.map(encodeValue);
    const out = {};
    for (const key of Object.keys(value)) out[key] = encodeValue(value[key]);
    return out;
  }
  function decodeValue(json) {
    if (json === null || typeof json !== "object") return json;
    if (Array.isArray(json)) return json.map(decodeValue);
    const o = json;
    const n = (key, len) => {
      const a2 = o[key];
      return Array.isArray(a2) && a2.length === len && a2.every((v) => typeof v === "number") ? a2 : null;
    };
    let a;
    if (a = n("$v2", 2)) return new Vector2(a[0], a[1]);
    if (a = n("$v3", 3)) return new Vector3(a[0], a[1], a[2]);
    if (a = n("$q", 4)) return new Quaternion(a[0], a[1], a[2], a[3]);
    if (a = n("$v4", 4)) return new Vector4(a[0], a[1], a[2], a[3]);
    if (a = n("$color", 4)) return new Color(a[0], a[1], a[2], a[3]);
    if (Array.isArray(o.$curve)) return new Curve(o.$curve);
    const out = {};
    for (const key of Object.keys(o)) out[key] = decodeValue(o[key]);
    return out;
  }

  // portkit/src/fields.ts
  function readFields(target, fields) {
    const bag = target;
    const out = {};
    for (const field of fields) out[field] = encodeValue(bag[field]);
    return out;
  }
  function assignFields(target, fields, data, callbacks) {
    if (!isRecord(data)) return;
    const bag = target;
    for (const field of fields) {
      if (!(field in data)) continue;
      const property = callbacks ? callbacks[field] : void 0;
      if (property === void 0) {
        bag[field] = decodeValue(data[field]);
        continue;
      }
      if (canonicalJson(encodeValue(bag[field])) === canonicalJson(data[field] ?? null)) continue;
      bag[property] = decodeValue(data[field]);
    }
  }

  // portkit/src/peruser.ts
  var MAX_PLAYER_LEAVES = 4;
  var PER_LEAF = 24;
  var PerUser = class {
    constructor(core, storage, hooks) {
      __publicField(this, "core");
      __publicField(this, "storage");
      __publicField(this, "hooks");
      __publicField(this, "remote", /* @__PURE__ */ new Map());
      __publicField(this, "delivered", /* @__PURE__ */ new Map());
      __publicField(this, "local", {});
      __publicField(this, "localLoaded", false);
      __publicField(this, "localDirty", false);
      __publicField(this, "changedKeys", /* @__PURE__ */ new Set());
      /** sid -> behaviour id -> the per-player behaviour */
      __publicField(this, "owned", /* @__PURE__ */ new Map());
      __publicField(this, "dirtyBuckets", /* @__PURE__ */ new Set());
      __publicField(this, "lastWrite", /* @__PURE__ */ new Map());
      __publicField(this, "typeIds", []);
      /** PlayerData is published only when the game uses it. */
      __publicField(this, "dataEnabled", false);
      __publicField(this, "started", false);
      this.core = core;
      this.storage = storage;
      this.hooks = hooks;
    }
    path(leaf) {
      return `${this.core.prefix}.${leaf}`;
    }
    /** Declares the per-player behaviour ids of this game, in bindings order (it fixes which leaf each uses). */
    declareTypes(ids) {
      this.typeIds = ids.slice();
    }
    bucketOf(id) {
      const index = Math.max(0, this.typeIds.indexOf(id));
      const leaves = Math.min(MAX_PLAYER_LEAVES, Math.max(1, Math.ceil(this.typeIds.length / PER_LEAF)));
      return Math.floor(index * leaves / Math.max(1, this.typeIds.length));
    }
    listen() {
      const dot = this.core.prefix + ".";
      this.core.own(
        this.core.platform.onUser(dot, (sid, path) => {
          if (this.core.disposed || sid === this.core.me.sid) return;
          const leaf = path.slice(dot.length);
          if (leaf === "d") this.readRemoteData(sid);
          else if (/^p[0-3]$/.test(leaf)) this.readRemoteBucket(sid, Number(leaf.slice(1)));
        })
      );
    }
    // ---- PlayerData ---------------------------------------------------------------------------------------------
    /** Loads the local player's saved values and publishes them. Called once behaviours have started. */
    restoreLocal() {
      if (this.localLoaded) return;
      this.localLoaded = true;
      const saved = this.storage.get("playerdata", null);
      this.local = isRecord(saved) ? encodeValue(saved) : {};
      if (this.dataEnabled) this.localDirty = true;
    }
    enableData() {
      if (this.dataEnabled) return;
      this.dataEnabled = true;
      if (this.localLoaded) this.localDirty = true;
    }
    Set(key, value) {
      const encoded = encodeValue(value);
      if (canonicalJson(this.local[key] ?? null) === canonicalJson(encoded) && key in this.local) return;
      this.local[key] = encoded;
      this.changedKeys.add(key);
      this.localDirty = true;
      this.enableData();
    }
    Delete(key) {
      if (!(key in this.local)) return;
      delete this.local[key];
      this.changedKeys.add(key);
      this.localDirty = true;
    }
    bag(player) {
      if (player.isLocal) return this.local;
      return this.remote.get(player.sid)?.data ?? null;
    }
    Get(player, key, fallback) {
      const bag = this.bag(player);
      return bag && key in bag ? decodeValue(bag[key]) : fallback;
    }
    Has(player, key) {
      const bag = this.bag(player);
      return !!bag && key in bag;
    }
    Keys(player) {
      const bag = this.bag(player);
      return bag ? Object.keys(bag) : [];
    }
    IsRestored(player) {
      return player.isLocal ? this.localLoaded : !!this.remote.get(player.sid)?.restored;
    }
    SetString(key, value) {
      this.Set(key, String(value));
    }
    SetInt(key, value) {
      this.Set(key, Math.trunc(value));
    }
    SetFloat(key, value) {
      this.Set(key, value);
    }
    SetBool(key, value) {
      this.Set(key, !!value);
    }
    GetString(player, key) {
      return String(this.Get(player, key, ""));
    }
    GetInt(player, key) {
      return Math.trunc(Number(this.Get(player, key, 0)) || 0);
    }
    GetFloat(player, key) {
      return Number(this.Get(player, key, 0)) || 0;
    }
    GetBool(player, key) {
      return this.Get(player, key, false) === true;
    }
    readRemoteData(sid) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path("d")));
      let entry = this.remote.get(sid);
      if (!entry) this.remote.set(sid, entry = { data: {}, restored: false, announced: false });
      const before = entry.data;
      const now = isRecord(raw) && isRecord(raw.d) ? raw.d : {};
      entry.data = now;
      entry.restored = isRecord(raw) && raw.r === 1;
      const player = this.delivered.get(sid);
      if (!player || !this.started) return;
      if (entry.restored && !entry.announced) {
        entry.announced = true;
        this.hooks.restored(player);
        const all = Object.keys(now).sort();
        if (all.length) this.hooks.dataUpdated(player, all);
        return;
      }
      const keys = [];
      for (const key of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(now)])) {
        if (canonicalJson(before[key] ?? null) !== canonicalJson(now[key] ?? null) || key in before !== key in now) keys.push(key);
      }
      if (keys.length) this.hooks.dataUpdated(player, keys.sort());
    }
    // ---- per-player behaviours ----------------------------------------------------------------------------------
    /** Registers a per-player behaviour that has just been made for `player`. Returns true if it already has data. */
    adopt(player, id, behaviour, fields, persistent, callbacks) {
      let mine = this.owned.get(player.sid);
      if (!mine) this.owned.set(player.sid, mine = /* @__PURE__ */ new Map());
      const entry = { id, behaviour, fields, callbacks, persistent, bucket: this.bucketOf(id), n: 0 };
      mine.set(id, entry);
      if (player.isLocal) {
        if (!persistent) return false;
        const saved = this.storage.get(`po.${id}`, null);
        if (!isRecord(saved)) return false;
        this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, encodeValue(saved), callbacks));
        entry.n = 1;
        this.dirtyBuckets.add(entry.bucket);
        return true;
      }
      const stored = this.remoteBucket(player.sid, entry.bucket)[id];
      if (!stored) return false;
      this.core.guard(`${id} field change callback`, () => assignFields(behaviour, fields, stored[1], callbacks));
      entry.n = stored[0];
      return true;
    }
    behaviour(sid, id) {
      return this.owned.get(sid)?.get(id)?.behaviour ?? null;
    }
    behavioursOf(sid) {
      return [...this.owned.get(sid)?.values() ?? []].map((o) => o.behaviour);
    }
    /** The local player asked to send one of their per-player behaviours. */
    requestSerialization(behaviour) {
      const mine = this.owned.get(this.core.me.sid);
      if (!mine) return;
      for (const entry of mine.values()) {
        if (entry.behaviour !== behaviour) continue;
        entry.n++;
        this.dirtyBuckets.add(entry.bucket);
        return;
      }
    }
    remoteBucket(sid, bucket) {
      const raw = safeParse(this.core.platform.userGet(sid, this.path(`p${bucket}`)));
      const out = {};
      if (!isRecord(raw) || !isRecord(raw.b)) return out;
      for (const id of Object.keys(raw.b)) {
        const entry = raw.b[id];
        if (Array.isArray(entry) && typeof entry[0] === "number") out[id] = [entry[0], entry[1]];
      }
      return out;
    }
    readRemoteBucket(sid, bucket) {
      const theirs = this.owned.get(sid);
      if (!theirs) return;
      const stored = this.remoteBucket(sid, bucket);
      for (const entry of theirs.values()) {
        const value = stored[entry.id];
        if (!value || value[0] === entry.n) continue;
        entry.n = value[0];
        this.core.guard(`${entry.id} field change callback`, () => assignFields(entry.behaviour, entry.fields, value[1], entry.callbacks));
        if (this.started) this.hooks.deserialized(entry.behaviour);
      }
    }
    // ---- players coming and going -------------------------------------------------------------------------------
    /** Called after OnPlayerJoined has been delivered for `player`. */
    playerDelivered(player) {
      this.delivered.set(player.sid, player);
      if (player.isLocal) {
        if (this.dataEnabled || this.hasPersistentLocal()) {
          this.hooks.restored(player);
          const all = Object.keys(this.local).sort();
          if (this.dataEnabled && all.length) this.hooks.dataUpdated(player, all);
        }
        return;
      }
      this.readRemoteData(player.sid);
    }
    hasPersistentLocal() {
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.persistent) return true;
      return false;
    }
    /** Drops everything kept for a player who left. Returns their per-player behaviours, for OnDestroy. */
    playerGone(sid) {
      const gone = this.behavioursOf(sid);
      this.owned.delete(sid);
      this.remote.delete(sid);
      this.delivered.delete(sid);
      return gone;
    }
    // ---- writing ------------------------------------------------------------------------------------------------
    /** Writes what changed, at most a few times a second per leaf. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      const due = (leaf) => now - (this.lastWrite.get(leaf) ?? -Infinity) >= this.core.options.continuousIntervalMs;
      const limit = this.core.platform.limits.maxLeafBytes - 64;
      for (const bucket of [...this.dirtyBuckets]) {
        const leaf = `p${bucket}`;
        if (!due(leaf)) continue;
        this.dirtyBuckets.delete(bucket);
        const b = {};
        const mine = [...this.owned.get(this.core.me.sid)?.values() ?? []].filter((o) => o.bucket === bucket && o.n > 0);
        for (const entry of mine) b[entry.id] = [entry.n, readFields(entry.behaviour, entry.fields)];
        const text = asciiJson({ b });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerObject", "value_too_large", this.path(leaf), mine[0]?.behaviour ?? null);
          continue;
        }
        this.lastWrite.set(leaf, now);
        this.core.platform.userSet(this.path(leaf), text);
        for (const entry of mine) if (entry.persistent) this.storage.set(`po.${entry.id}`, decodeValue(b[entry.id][1]));
      }
      if (this.localDirty && this.localLoaded && this.dataEnabled && due("d")) {
        this.localDirty = false;
        const keys = [...this.changedKeys].sort();
        this.changedKeys.clear();
        const text = asciiJson({ r: 1, d: this.local });
        if (jsonLeafBytes(text) > limit) {
          this.hooks.refused("playerData", "value_too_large", this.path("d"), null);
        } else {
          this.lastWrite.set("d", now);
          this.core.platform.userSet(this.path("d"), text);
          this.storage.set("playerdata", decodeValue(this.local));
        }
        const me = this.delivered.get(this.core.me.sid);
        if (me && keys.length) this.hooks.dataUpdated(me, keys);
      }
    }
    /** Removes the local player's leaves, when the instance stops while they stay in the room. */
    retire() {
      const { platform } = this.core;
      if (this.dataEnabled) platform.userSet(this.path("d"), null);
      const leaves = /* @__PURE__ */ new Set();
      for (const entry of this.owned.get(this.core.me.sid)?.values() ?? []) if (entry.n > 0) leaves.add(entry.bucket);
      for (const bucket of leaves) platform.userSet(this.path(`p${bucket}`), null);
    }
  };

  // portkit/src/bindings.ts
  var EVENT_KINDS = ["click", "grab", "drop", "triggerEnter", "triggerExit", "collisionEnter", "collisionExit", "uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field", "graph"];
  var GRAPH_KINDS = ["uiButton", "uiSlider", "uiToggle", "heldTrigger", "heldPrimary", "heldSecondary", "field"];
  function validateBindings(json) {
    const problems = [];
    const fail = (text) => problems.push(text);
    if (!isRecord(json)) throw new Error("bindings: not an object");
    if (json.schema !== 1) fail(`schema is ${JSON.stringify(json.schema)}, expected 1`);
    if (typeof json.slug !== "string" || !isValidSlug(json.slug)) fail(`slug ${JSON.stringify(json.slug)} is not lower-case letters, digits and hyphens`);
    const bundles = isRecord(json.bundles) ? json.bundles : {};
    const objects = isRecord(json.objects) ? json.objects : {};
    const refs = Array.isArray(json.refs) ? json.refs : [];
    const behaviours = Array.isArray(json.behaviours) ? json.behaviours : [];
    const events = Array.isArray(json.events) ? json.events : [];
    const paths = /* @__PURE__ */ new Map();
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      if (!isPathSegment(key)) fail(`object key '${key}' must be 1-64 of A-Z a-z 0-9 _ - @ (it becomes part of a network id)`);
      if (!isRecord(o) || typeof o.path !== "string") {
        fail(`object '${key}' has no path`);
        continue;
      }
      if (o.sync !== void 0 && o.sync !== "none" && o.sync !== "transform") fail(`object '${key}': sync must be "none" or "transform"`);
      const other = paths.get(o.path);
      if (other !== void 0) fail(`objects '${other}' and '${key}' have the same path '${o.path}'`);
      paths.set(o.path, key);
    }
    refs.forEach((ref, i) => {
      if (typeof ref !== "string" || !(ref in objects)) fail(`refs[${i}] '${String(ref)}' is not an object key`);
    });
    if (new Set(refs).size !== refs.length) fail("refs lists an object twice");
    const ids = /* @__PURE__ */ new Set();
    for (const b of behaviours) {
      if (!isRecord(b) || typeof b.id !== "string" || typeof b.type !== "string") {
        fail(`a behaviour entry has no id or type: ${JSON.stringify(b)}`);
        continue;
      }
      if (!isPathSegment(b.id)) fail(`behaviour id '${b.id}' must be 1-64 of A-Z a-z 0-9 _ - @ (it is a state key)`);
      if (ids.has(b.id)) fail(`behaviour id '${b.id}' is used twice`);
      ids.add(b.id);
      if (b.object !== void 0 && b.object !== null && !(String(b.object) in objects)) fail(`behaviour '${b.id}': object '${String(b.object)}' is not an object key`);
      if (b.fields !== void 0 && !isRecord(b.fields)) fail(`behaviour '${b.id}': fields is not an object`);
      if (b.group !== void 0 && (typeof b.group !== "string" || !/^[A-Za-z0-9_-]{1,48}$/.test(b.group))) fail(`behaviour '${b.id}': group must be 1-48 of A-Z a-z 0-9 _ -`);
      if (b.group !== void 0 && b.perPlayer === true) fail(`behaviour '${b.id}': a per-player behaviour cannot be in a sync group`);
    }
    const checkRefs = (where, value) => {
      if (Array.isArray(value)) value.forEach((v, i) => checkRefs(`${where}[${i}]`, v));
      else if (isRecord(value)) {
        if (typeof value.$obj === "string" && !(value.$obj in objects)) fail(`${where}: $obj '${value.$obj}' is not an object key`);
        else if (typeof value.$beh === "string" && !ids.has(value.$beh)) fail(`${where}: $beh '${value.$beh}' is not a behaviour id`);
        else if (typeof value.$comp === "string" && !(value.$comp in objects)) fail(`${where}: $comp '${value.$comp}' is not an object key`);
        else if (value.$clip !== void 0 && value.on !== void 0 && !(String(value.on) in objects)) fail(`${where}: $clip on '${String(value.on)}' is not an object key`);
        else if (!Object.keys(value).some((k) => k.startsWith("$"))) for (const k of Object.keys(value)) checkRefs(`${where}.${k}`, value[k]);
      }
    };
    for (const b of behaviours) if (isRecord(b) && isRecord(b.fields)) for (const f of Object.keys(b.fields)) checkRefs(`behaviour '${String(b.id)}' field '${f}'`, b.fields[f]);
    events.forEach((e, i) => {
      if (!isRecord(e)) return fail(`events[${i}] is not an object`);
      if (typeof e.kind !== "string" || EVENT_KINDS.indexOf(e.kind) < 0) fail(`events[${i}]: kind '${String(e.kind)}' is not one of ${EVENT_KINDS.join(", ")}`);
      if (e.kind === "graph") {
        if (typeof e.name !== "string" || !e.name) fail(`events[${i}]: a graph event needs a name`);
      } else if (typeof e.object !== "string" || !(e.object in objects)) fail(`events[${i}]: object '${String(e.object)}' is not an object key`);
      const unbound = GRAPH_KINDS.indexOf(String(e.kind)) >= 0 && !e.behaviour && !e.method;
      if (unbound) return;
      if (typeof e.behaviour !== "string" || !ids.has(e.behaviour)) fail(`events[${i}]: behaviour '${String(e.behaviour)}' is not a behaviour id`);
      if (typeof e.method !== "string" || !e.method) fail(`events[${i}]: no method`);
    });
    if (problems.length) throw new Error("bindings.json is not valid:\n  - " + problems.join("\n  - "));
    const normalObjects = {};
    for (const key of Object.keys(objects)) {
      const o = objects[key];
      normalObjects[key] = { path: o.path, sync: o.sync === "transform" ? "transform" : "none", grab: o.grab === true, click: o.click === true, seat: o.seat === true };
      if (o.active === false) normalObjects[key].active = false;
    }
    return {
      schema: 1,
      slug: json.slug,
      hash: typeof json.hash === "string" ? json.hash : void 0,
      root: typeof json.root === "string" && json.root ? json.root : void 0,
      bundles: { windows: typeof bundles.windows === "string" ? bundles.windows : "", android: typeof bundles.android === "string" ? bundles.android : "" },
      objects: normalObjects,
      refs,
      behaviours,
      events
    };
  }

  // portkit/src/events.ts
  var NetEvents = class {
    constructor(core, sync, routes) {
      __publicField(this, "core");
      __publicField(this, "sync");
      __publicField(this, "routes");
      __publicField(this, "held", /* @__PURE__ */ new Map());
      /** The session whose event or command is being run right now, for Networking.CallingPlayer. */
      __publicField(this, "callingSid", null);
      __publicField(this, "sent", 0);
      __publicField(this, "received", 0);
      /** Requests naming a method that may not be called from the network, for tests and diagnostics. */
      __publicField(this, "refusedCount", 0);
      __publicField(this, "refusedNames", /* @__PURE__ */ new Set());
      this.core = core;
      this.sync = sync;
      this.routes = routes;
    }
    listen() {
      this.core.own(this.core.platform.onOneShot((fromSid, data) => this.receive(fromSid, data)));
    }
    send(behaviour, target, name, args) {
      if (this.core.disposed) return;
      const address = this.routes.address(behaviour);
      if (!address) return;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCustomNetworkEvent: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable; names starting with '_' can never be sent)`);
        return;
      }
      const fields = { b: address.id, e: name };
      if (args.length) fields.a = args.map(encodeValue);
      const me = this.core.me.sid;
      let ownerSid;
      if (address.playerSid !== null) {
        fields.ps = address.playerSid;
        ownerSid = address.playerSid;
      } else {
        const slot = this.sync.slotOf(behaviour);
        ownerSid = slot ? this.sync.ownerSid(slot) : null;
        if (slot && ownerSid === me) {
          const mark = this.sync.flushOne(slot);
          if (mark && mark.w === me) fields.s = [mark.g, mark.n];
        }
      }
      if (target === "Owner") {
        if (ownerSid === me) {
          this.invoke(behaviour, name, args, me);
          return;
        }
        if (ownerSid === null) {
          this.core.log("warn", `${address.id}.${name}: no owner to send to`);
          return;
        }
        fields.o = ownerSid;
      } else this.invoke(behaviour, name, args, me);
      this.post(behaviour, name, fields);
    }
    post(behaviour, name, fields) {
      const text = asciiJson(makeEnvelope(this.core.slug, this.core.inst, "ev", fields));
      if (utf8Length(text) > this.core.platform.limits.oneShotMaxBytes || !this.core.platform.oneShot(text)) {
        this.core.log("error", `network event '${name}' is too large to send (${utf8Length(text)} bytes)`);
        this.routes.refused(behaviour, "oneshot_too_large", name);
        return;
      }
      this.sent++;
    }
    receive(fromSid, data) {
      if (this.core.disposed || !this.sync.started) return;
      const env2 = parseOurs(data, this.core.slug, this.core.inst);
      if (!env2 || env2.t !== "ev" || typeof env2.b !== "string" || typeof env2.e !== "string") return;
      const me = this.core.me.sid;
      const name = env2.e;
      const args = Array.isArray(env2.a) ? env2.a.map(decodeValue) : [];
      this.received++;
      if (typeof env2.ps === "string") {
        if (typeof env2.o === "string" && env2.o !== me) return;
        const behaviour2 = this.routes.playerBehaviour(env2.ps, env2.b);
        if (behaviour2) this.invoke(behaviour2, name, args, fromSid);
        return;
      }
      const behaviour = this.routes.behaviour(env2.b);
      const slot = behaviour ? this.sync.slotOf(behaviour) : null;
      if (!behaviour || !slot) return;
      if (typeof env2.o === "string") {
        if (env2.o !== me) return;
        if (!this.sync.isOwner(slot)) {
          const owner = this.sync.ownerSid(slot);
          const hops = typeof env2.h === "number" ? env2.h : 0;
          if (owner !== null && owner !== fromSid && hops < 2) {
            const fields = { b: env2.b, e: name, o: owner, h: hops + 1 };
            if (args.length) fields.a = env2.a;
            this.post(behaviour, name, fields);
          }
          return;
        }
      }
      const run = () => this.invoke(behaviour, name, args, fromSid);
      const mark = Array.isArray(env2.s) && typeof env2.s[0] === "number" && typeof env2.s[1] === "number" ? { g: env2.s[0], n: env2.s[1] } : null;
      if (mark && !this.has(slot, mark.g, mark.n)) this.hold(slot, mark.g, mark.n, run);
      else run();
    }
    /** Has the write the event was sent after reached this client's mirror? (Sequence numbers only rise.) */
    has(slot, _g, n) {
      return slot.seenN >= n;
    }
    hold(slot, g, n, run) {
      let list = this.held.get(slot.id);
      if (!list) this.held.set(slot.id, list = []);
      const entry = { g, n, run, timer: 0 };
      entry.timer = this.core.scheduler.after(this.core.options.eventHoldMs, () => {
        const current = this.held.get(slot.id) ?? [];
        const at = current.indexOf(entry);
        if (at < 0) return;
        current.splice(at, 1);
        run();
      });
      list.push(entry);
      slot.onApplied = () => this.release(slot);
    }
    release(slot) {
      const list = this.held.get(slot.id);
      if (!list || !list.length) return;
      const ready = list.filter((h) => this.has(slot, h.g, h.n));
      if (!ready.length) return;
      this.held.set(
        slot.id,
        list.filter((h) => !ready.includes(h))
      );
      for (const h of ready) {
        this.core.scheduler.cancel(h.timer);
        h.run();
      }
    }
    /** Runs a method of game code on behalf of `fromSid` (a network event or a command). */
    invoke(behaviour, name, args, fromSid) {
      if (!callable(behaviour, name)) {
        const key = `${behaviour.constructor.name}.${name}`;
        if (!this.refusedNames.has(key) && this.refusedNames.size < 64) {
          this.refusedNames.add(key);
          this.core.log("warn", `refused a request from session ${fromSid} to run '${String(name).slice(0, 64)}' on ${behaviour.constructor.name}: not in its networkCallable list`);
        }
        this.refusedCount++;
        return;
      }
      const before = this.callingSid;
      this.callingSid = fromSid;
      try {
        this.core.guard(name, () => behaviour[name](...args));
      } finally {
        this.callingSid = before;
      }
    }
  };
  var LISTS = /* @__PURE__ */ new WeakMap();
  function networkCallableOf(cls) {
    let set = LISTS.get(cls);
    if (set) return set;
    const names = /* @__PURE__ */ new Set();
    for (let c = cls; typeof c === "function" && c !== Behaviour && c !== Function.prototype; c = Object.getPrototypeOf(c)) {
      if (Object.prototype.hasOwnProperty.call(c, "networkCallable")) {
        const list = c.networkCallable;
        if (Array.isArray(list)) {
          for (const name of list) if (typeof name === "string") names.add(name);
        }
      }
    }
    set = names;
    LISTS.set(cls, set);
    return set;
  }
  function callable(behaviour, name) {
    if (typeof name !== "string" || name.length === 0 || name.charCodeAt(0) === 95 || name === "constructor") return false;
    if (!networkCallableOf(behaviour.constructor).has(name)) return false;
    for (let proto = Object.getPrototypeOf(behaviour); proto && proto !== Behaviour.prototype && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
      if (Object.prototype.hasOwnProperty.call(proto, name)) return typeof behaviour[name] === "function";
    }
    return false;
  }
  function parseOurs(data, slug, inst) {
    if (typeof data !== "string" || data.indexOf('"pk":1') < 0) return null;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const e = parsed;
    if (e.pk !== 1 || e.g !== slug || e.i !== inst || typeof e.t !== "string") return null;
    return e;
  }

  // portkit/src/refrecord.ts
  var RefereeTable = class {
    constructor(presence, referee, name, parseEntry) {
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "name");
      __publicField(this, "parseEntry");
      __publicField(this, "last", null);
      __publicField(this, "lastText", "");
      this.presence = presence;
      this.referee = referee;
      this.name = name;
      this.parseEntry = parseEntry;
    }
    /** The table as the referee published it: read from the referee's own user state, else the last one read. */
    read() {
      const ref = this.referee.current();
      const epoch = this.referee.epoch;
      if (ref) {
        const raw = this.presence.extra(ref.sid, this.name);
        const parsed = this.parse(raw, epoch);
        if (parsed) {
          this.last = { e: epoch, m: parsed };
          return parsed;
        }
      }
      return this.last && this.last.e === epoch ? this.last.m : {};
    }
    /** A copy the referee may change and `write`: its own published table, else its predecessor's last one. */
    working() {
      const epoch = this.referee.epoch;
      const own = this.parse(this.presence.extra(this.presence.localSid, this.name), epoch);
      const base = own ?? (this.last && this.last.e === epoch ? this.last.m : {});
      return JSON.parse(JSON.stringify(base));
    }
    /** Publishes the table in the local player's user state (only the referee calls this). */
    write(table) {
      const value = { e: this.referee.epoch, m: table };
      const text = asciiJson(value);
      if (text === this.lastText && this.presence.extra(this.presence.localSid, this.name) !== void 0) return;
      this.lastText = text;
      this.presence.setExtra(this.name, value);
      this.last = { e: value.e, m: JSON.parse(JSON.stringify(table)) };
    }
    parse(raw, epoch) {
      if (!isRecord(raw) || raw.e !== epoch || !isRecord(raw.m)) return null;
      const out = {};
      for (const key of Object.keys(raw.m)) {
        const entry = this.parseEntry(raw.m[key]);
        if (entry !== null) out[key] = entry;
      }
      return out;
    }
  };

  // portkit/src/commands.ts
  var MAX_COMMAND_BYTES = 2048;
  var MAX_BATCH = 8;
  var MAX_BATCH_BYTES = 4096;
  var Commands = class {
    constructor(core, presence, referee, routes) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "routes");
      __publicField(this, "queue", []);
      __publicField(this, "nextNumber", 0);
      __publicField(this, "acks");
      /** False until behaviours have started: the referee runs nothing before then. */
      __publicField(this, "started", false);
      __publicField(this, "run", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.routes = routes;
      this.acks = new RefereeTable(presence, referee, "ak", (v) => typeof v === "number" ? v : null);
    }
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
    }
    send(behaviour, name, args) {
      const address = this.routes.address(behaviour);
      if (!address) return 0;
      if (!callable(behaviour, name)) {
        this.core.log("warn", `SendCommand: ${address.id} has no network-callable method '${name}' (list it in its class's static networkCallable)`);
        return 0;
      }
      if (this.nextNumber === 0) this.nextNumber = (this.table()[this.core.me.sid] ?? 0) + 1;
      const n = this.nextNumber++;
      const record = [n, address.id, address.playerSid ?? "", name, args.map(encodeValue)];
      if (utf8Length(asciiJson(record)) > MAX_COMMAND_BYTES) {
        this.routes.refused(behaviour, "value_too_large", name);
        return 0;
      }
      this.queue.push({ n, behaviour, record });
      this.review();
      return n;
    }
    /** Publishes, runs and acknowledges whatever is due. Also called about once a second. */
    review() {
      if (this.core.disposed || !this.started) return;
      const me = this.core.me.sid;
      const acked = this.table()[me] ?? 0;
      while (this.queue.length && this.queue[0].n <= acked) {
        const done = this.queue.shift();
        this.core.guard("OnCommandAcknowledged", () => this.routes.acknowledged(done.behaviour, done.n));
      }
      const published = this.presence.extra(me, "q");
      if (this.queue.length) {
        const batch = [];
        let bytes = 2;
        for (const pending of this.queue) {
          const size = utf8Length(asciiJson(pending.record)) + 1;
          if (batch.length >= MAX_BATCH || batch.length && bytes + size > MAX_BATCH_BYTES) break;
          batch.push(pending.record);
          bytes += size;
        }
        const first = Array.isArray(published) && Array.isArray(published[0]) ? published[0][0] : null;
        const last = Array.isArray(published) && Array.isArray(published[published.length - 1]) ? published[published.length - 1][0] : null;
        if (first !== batch[0][0] || last !== batch[batch.length - 1][0]) this.presence.setExtra("q", batch);
      } else if (published !== void 0) this.presence.setExtra("q", void 0);
      if (this.referee.isMe()) this.officiate();
    }
    officiate() {
      const table = this.acks.working();
      let changed = false;
      for (const sid of Object.keys(table)) {
        if (!this.presence.has(sid)) {
          delete table[sid];
          changed = true;
        }
      }
      for (const who of this.presence.list()) {
        const batch = this.presence.extra(who.sid, "q");
        if (!Array.isArray(batch)) continue;
        for (const q of batch.slice(0, MAX_BATCH)) {
          if (!Array.isArray(q) || typeof q[0] !== "number" || typeof q[1] !== "string" || typeof q[3] !== "string") break;
          const acked = table[who.sid] ?? 0;
          if (q[0] <= acked) continue;
          if (acked > 0 && q[0] !== acked + 1) break;
          table[who.sid] = q[0];
          changed = true;
          const behaviour = this.routes.resolve(q[1], typeof q[2] === "string" && q[2] ? q[2] : null);
          const args = Array.isArray(q[4]) ? q[4].map(decodeValue) : [];
          this.run++;
          if (behaviour) this.routes.invoke(behaviour, q[3], args, who.sid);
        }
      }
      if (changed) this.acks.write(table);
    }
    table() {
      return this.acks.read();
    }
  };

  // portkit/src/core.ts
  var DEFAULT_OPTIONS = {
    settleMs: 1e3,
    claimStepMs: 400,
    claimRetryMs: 3e3,
    snapshotTimeoutMs: 8e3,
    clockTimeoutMs: 2e3,
    clockResyncMs: 6e4,
    admitWarnMs: 15e3,
    ownerClaimTimeoutMs: 5e3,
    continuousIntervalMs: 200,
    eventHoldMs: 2e3,
    whenEmpty: "reset"
  };
  var Core = class {
    constructor(platform, slug, inst, options, scheduler) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      /** `pk1.<slug>.<inst>` */
      __publicField(this, "prefix");
      __publicField(this, "options");
      __publicField(this, "scheduler");
      /** The local player as the platform reported them when the instance started. */
      __publicField(this, "me");
      __publicField(this, "disposed", false);
      __publicField(this, "unsubs", []);
      __publicField(this, "stateHandlers", []);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.prefix = statePrefix(slug, inst);
      this.options = options;
      this.scheduler = scheduler;
      this.me = platform.local();
    }
    /** Starts listening to the room's state under this instance's prefix. */
    listen() {
      const dot = this.prefix + ".";
      this.own(
        this.platform.onState(dot, (path, value) => {
          if (this.disposed) return;
          const key = path.slice(dot.length);
          for (const handler of this.stateHandlers.slice()) {
            try {
              handler(key, value);
            } catch (error) {
              this.error("state handler", error);
            }
          }
        })
      );
    }
    /** Reads a leaf of this instance from the mirror. `key` is relative to the prefix. */
    get(key) {
      return this.platform.stateGet(this.prefix + "." + key);
    }
    set(key, value) {
      if (this.disposed) return;
      this.platform.stateSet(this.prefix + "." + key, value);
    }
    entries() {
      const dot = this.prefix + ".";
      return this.platform.stateEntries(dot).map(([path, value]) => [path.slice(dot.length), value]);
    }
    onState(handler) {
      this.stateHandlers.push(handler);
    }
    /** Keeps an unsubscribe to run when the instance is disposed. */
    own(unsub) {
      if (this.disposed) unsub();
      else this.unsubs.push(unsub);
    }
    log(level, message) {
      this.platform.log(level, `[${this.slug}:${this.inst}] ${message}`);
    }
    error(where, error) {
      const text = error instanceof Error ? error.stack ?? error.message : String(error);
      this.log("error", `${where}: ${text}`);
    }
    /** Runs game code so that one behaviour's exception cannot stop the others. */
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.error(where, error);
      }
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.scheduler.stop();
      for (const unsub of this.unsubs.splice(0)) {
        try {
          unsub();
        } catch {
        }
      }
      this.stateHandlers.length = 0;
    }
  };

  // portkit/src/host.ts
  function encodeRelayArg(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c === 37 || c === 124 || c === 94 || c === 34 || c === 92 || c < 32) {
        out += "%" + c.toString(16).toUpperCase().padStart(2, "0");
      } else if (c >= 55296 && c <= 57343) {
        const pairStart = c <= 56319 && i + 1 < text.length && (text.charCodeAt(i + 1) & 64512) === 56320;
        if (pairStart) {
          out += text[i] + text[i + 1];
          i++;
        } else out += "\uFFFD";
      } else out += text[i];
    }
    return out;
  }
  function decodeRelayArg(text) {
    return text.replace(/%([0-9A-F]{2})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  function relayNumber(value) {
    if (!Number.isFinite(value)) return "0";
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
  function relayRecord(op, target, args) {
    let record = op + "|" + (typeof target === "number" ? String(target) : encodeRelayArg(target));
    for (const arg of args) record += "|" + encodeRelayArg(arg);
    return record;
  }
  function relayPayload(slug, inst, records) {
    return relayKey(slug, inst) + "|" + records.join("^");
  }
  function parseEventArgs(text) {
    return text === "" ? [] : text.split("|").map(decodeRelayArg);
  }
  function materialProperty(property, slot = 0) {
    return slot > 0 ? `#${Math.floor(slot)}:${property}` : property;
  }
  var MAX_PAYLOAD = 12e3;
  var RelayHost = class {
    constructor(platform, slug, inst, refs) {
      __publicField(this, "platform");
      __publicField(this, "slug");
      __publicField(this, "inst");
      __publicField(this, "refs");
      __publicField(this, "warned", /* @__PURE__ */ new Set());
      __publicField(this, "waiting", /* @__PURE__ */ new Map());
      /** What was last sent (or queued) per target and property: an unchanged value is not sent again. */
      __publicField(this, "last", /* @__PURE__ */ new Map());
      __publicField(this, "queue", []);
      __publicField(this, "nextRequest", 1);
      /** Payloads and records handed to the bridge, for tests and diagnostics. */
      __publicField(this, "payloadsSent", 0);
      __publicField(this, "recordsSent", 0);
      /** Used instead of the relay for an object that is not in refs but that the page can reach. */
      __publicField(this, "fallbackActive", () => false);
      /** Plays a clip of the object's own list through the page when the page can reach the object. */
      __publicField(this, "fallbackClip", () => false);
      this.platform = platform;
      this.slug = slug;
      this.inst = inst;
      this.refs = refs;
    }
    /** Called with the graph's reply to a clock op. */
    onClockReply(requestId, seconds) {
      const resolve = this.waiting.get(requestId);
      if (!resolve) return;
      this.waiting.delete(requestId);
      resolve(seconds);
    }
    setText(target, text) {
      this.value("text", target, "text", [text]);
    }
    animBool(target, name, value) {
      this.value("animBool", target, "anim." + name, [name, value ? "1" : "0"]);
    }
    animFloat(target, name, value) {
      this.value("animFloat", target, "anim." + name, [name, relayNumber(value)]);
    }
    animInt(target, name, value) {
      this.value("animInt", target, "anim." + name, [name, String(Math.trunc(value))]);
    }
    animResetTrigger(target, name) {
      this.event("animResetTrigger", target, [name]);
    }
    animPlay(target, state, crossFadeSeconds = 0) {
      this.event("animPlay", target, [state, relayNumber(crossFadeSeconds)]);
    }
    animTrigger(target, name) {
      this.event("animTrigger", target, [name, "1"]);
    }
    particles(target, play) {
      this.event("particles", target, [play ? "play" : "stop"]);
    }
    setColor(target, property, color, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("color", target, "color." + name, [name, relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    matFloat(target, property, value, slot = 0) {
      const name = materialProperty(property, slot);
      this.value("matFloat", target, "mat." + name, [name, relayNumber(value)]);
    }
    uiColor(target, color) {
      this.value("uiColor", target, "uiColor", [relayNumber(color.r), relayNumber(color.g), relayNumber(color.b), relayNumber(color.a)]);
    }
    setActive(target, active) {
      if (!target.startsWith("@") && this.refs.indexOf(target) < 0 && this.fallbackActive(target, active)) return;
      this.value("active", target, "active", [active ? "1" : "0"]);
    }
    playClip(target, clipIndex, clipsOn, volumeScale) {
      const own = clipsOn === void 0 || clipsOn === target;
      const scaled = volumeScale !== void 0 && volumeScale !== 1;
      if (own && !scaled && !target.startsWith("@") && this.refs.indexOf(target) < 0 && this.fallbackClip(target, clipIndex)) return;
      const holder = this.resolve("audio", own ? target : clipsOn);
      if (holder === null) return;
      if (typeof holder !== "number") {
        this.warnOnce(`audio:${holder}`, `the clips of ${holder} cannot be played: the audio op needs the holder in bindings.refs`);
        return;
      }
      if (scaled) this.event("audioScaled", target, [String(Math.trunc(clipIndex)), String(holder), relayNumber(volumeScale)]);
      else this.event("audio", target, [String(Math.trunc(clipIndex)), String(holder)]);
    }
    audioPitch(target, pitch) {
      this.value("audioPitch", target, "audioPitch", [relayNumber(pitch)]);
    }
    audioVolume(target, volume) {
      this.value("audioVolume", target, "audioVolume", [relayNumber(volume)]);
    }
    animEnabled(target, enabled) {
      this.value("animEnabled", target, "animEnabled", [enabled ? "1" : "0"]);
    }
    uiSetToggle(target, on) {
      this.value("uiSetToggle", target, "uiSetToggle", [on ? "1" : "0"]);
    }
    uiSetSlider(target, value) {
      this.value("uiSetSlider", target, "uiSetSlider", [relayNumber(value)]);
    }
    scale(target, localScale) {
      this.value("scale", target, "scale", [relayNumber(localScale.x), relayNumber(localScale.y), relayNumber(localScale.z)]);
    }
    rbVelocity(target, velocity) {
      this.event("rbVelocity", target, [relayNumber(velocity.x), relayNumber(velocity.y), relayNumber(velocity.z)]);
    }
    rbKinematic(target, kinematic) {
      this.value("rbKinematic", target, "rbKinematic", [kinematic ? "1" : "0"]);
    }
    spawn(target, name) {
      this.event("spawn", target, [name]);
    }
    despawn(target) {
      this.event("despawn", target, []);
      if (target.startsWith("@")) {
        for (const key of [...this.last.keys()]) if (key.startsWith(target + "/")) this.last.delete(key);
      }
    }
    op(name, target, args, property) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || name === "clock") throw new Error(`'${name}' is not a relay op name (letters, digits, _; not clock)`);
      const text = args.map((a) => typeof a === "number" ? relayNumber(a) : typeof a === "boolean" ? a ? "1" : "0" : String(a));
      if (property !== void 0) this.value(name, target, `op.${name}.${property}`, text);
      else this.event(name, target, text);
    }
    /** The clock is not batched: its answer is timed from the moment it is sent. */
    requestClock() {
      const id = String(this.nextRequest++);
      return new Promise((resolve) => {
        this.waiting.set(id, resolve);
        this.platform.relaySend(relayPayload(this.slug, this.inst, [relayRecord("clock", 0, [id])]));
      });
    }
    /** Forgets clock requests nobody answered. */
    abandonClock() {
      this.waiting.clear();
    }
    /** Forgets what was sent, so that every value goes out again (after the kit was loaded anew). */
    forget() {
      this.last.clear();
    }
    flush() {
      if (!this.queue.length) return;
      const queue = this.queue;
      this.queue = [];
      const prefix = relayKey(this.slug, this.inst).length + 1;
      let batch = [];
      let size = prefix;
      const send = () => {
        if (!batch.length) return;
        this.payloadsSent++;
        this.recordsSent += batch.length;
        this.platform.relaySend(relayPayload(this.slug, this.inst, batch));
        batch = [];
        size = prefix;
      };
      for (const item of queue) {
        if (batch.length && size + item.record.length + 1 > MAX_PAYLOAD) send();
        batch.push(item.record);
        size += item.record.length + 1;
      }
      send();
    }
    warnOnce(key, message) {
      if (this.warned.has(key)) return;
      this.warned.add(key);
      this.platform.log("warn", `[${this.slug}:${this.inst}] ${message}`);
    }
    /** The wire form of a target: a Refs index, "@<path>", or null when the relay cannot reach the object. */
    resolve(op, target) {
      if (target.startsWith("@")) return target;
      const index = this.refs.indexOf(target);
      if (index >= 0) return index;
      if (!this.warned.has(target)) {
        this.warned.add(target);
        this.platform.log("warn", `[${this.slug}:${this.inst}] '${target}' is not in bindings.refs, so the relay graph cannot reach it (${op} ignored)`);
      }
      return null;
    }
    /** Queues a value. Sending the same value again does nothing; a newer one in the same tick replaces it. */
    value(op, target, property, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      const record = relayRecord(op, wire, args);
      const slot = `${wire}/${property}`;
      if (this.last.get(slot) === record) return;
      this.last.set(slot, record);
      const pending = this.queue.find((q) => q.slot === slot);
      if (pending) pending.record = record;
      else this.queue.push({ slot, record });
    }
    event(op, target, args) {
      const wire = this.resolve(op, target);
      if (wire === null) return;
      this.queue.push({ slot: null, record: relayRecord(op, wire, args) });
    }
  };
  var ClockSync = class {
    constructor(clock) {
      __publicField(this, "clock");
      __publicField(this, "offsetSeconds");
      __publicField(this, "synced", false);
      this.clock = clock;
      this.offsetSeconds = clock.wallSeconds() - clock.now() / 1e3;
    }
    /** `sentAt` and the present bracket the host's reading; it is placed halfway between them. */
    accept(hostSeconds, sentAtMs) {
      if (!Number.isFinite(hostSeconds)) return;
      const mid = (sentAtMs + this.clock.now()) / 2;
      this.offsetSeconds = hostSeconds - mid / 1e3;
      this.synced = true;
    }
    seconds() {
      return this.clock.now() / 1e3 + this.offsetSeconds;
    }
  };

  // portkit/src/scene.ts
  var Transform = class {
    constructor(gameObject) {
      __publicField(this, "gameObject");
      __publicField(this, "pos", Vector3.zero);
      __publicField(this, "rot", Quaternion.identity);
      __publicField(this, "lpos", Vector3.zero);
      __publicField(this, "lrot", Quaternion.identity);
      __publicField(this, "lscale", Vector3.one);
      /** False until the world pose has been read from the host or set by the script. */
      __publicField(this, "known", false);
      this.gameObject = gameObject;
    }
    /** World position as last set or reported. Returns a copy, as a C# struct would be. */
    get position() {
      return this.pos.clone();
    }
    set position(v) {
      this.pos = v.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: v.clone() });
    }
    get rotation() {
      return this.rot.clone();
    }
    set rotation(q) {
      this.rot = q.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ rotation: q.clone() });
    }
    get eulerAngles() {
      return this.rot.eulerAngles;
    }
    set eulerAngles(v) {
      this.rotation = Quaternion.Euler(v.x, v.y, v.z);
    }
    /** Local values are only what the script itself set: the host is not asked for them. */
    get localPosition() {
      return this.lpos.clone();
    }
    set localPosition(v) {
      this.lpos = v.clone();
      this.gameObject.host?.setTransform({ localPosition: v.clone() });
    }
    get localRotation() {
      return this.lrot.clone();
    }
    set localRotation(q) {
      this.lrot = q.clone();
      this.gameObject.host?.setTransform({ localRotation: q.clone() });
    }
    get localScale() {
      return this.lscale.clone();
    }
    set localScale(v) {
      this.lscale = v.clone();
      this.gameObject.host?.setTransform({ localScale: v.clone() });
    }
    get forward() {
      return this.rot.rotate(Vector3.forward);
    }
    get up() {
      return this.rot.rotate(Vector3.up);
    }
    get right() {
      return this.rot.rotate(Vector3.right);
    }
    SetPositionAndRotation(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
      this.gameObject.host?.setTransform({ position: position.clone(), rotation: rotation.clone() });
    }
    /** Asks the host where the object is now (after a drop, or physics). Await it before reading `position`. */
    async Refresh() {
      const pose2 = await this.gameObject.host?.readTransform();
      if (pose2) this._report(pose2.position, pose2.rotation);
    }
    /** @internal The host reported the object's pose. */
    _report(position, rotation) {
      this.pos = position.clone();
      this.rot = rotation.clone();
      this.known = true;
    }
  };
  var GameObject = class {
    constructor(key, name, host, actions, subscribe2 = null) {
      /** The key in bindings.objects, or "" for an object that only exists in the script. */
      __publicField(this, "key");
      __publicField(this, "name");
      __publicField(this, "transform");
      /** @internal */
      __publicField(this, "host");
      __publicField(this, "actions");
      __publicField(this, "subscribe");
      __publicField(this, "active", true);
      __publicField(this, "layerValue", -1);
      this.key = key;
      this.name = name;
      this.host = host;
      this.actions = actions;
      this.subscribe = subscribe2;
      this.transform = new Transform(this);
    }
    /** As last set by the script (objects start active unless the script says otherwise). */
    get activeSelf() {
      return this.active;
    }
    SetActive(active) {
      this.active = !!active;
      if (this.actions && this.key) this.actions.setActive(this.key, this.active);
      else this.host?.setActive(this.active);
    }
    /**
     * The object's layer as last set by the script (-1 before that: the kit's own). Setting it moves the object's
     * collider: 20 (Grabbable) for a pickup that may be picked up, 5 (UI) for one that may not, which is then
     * clickable and lets hands pass through. Only what changes is sent.
     */
    get layer() {
      return this.layerValue;
    }
    set layer(value) {
      const layer = Math.trunc(value);
      if (layer === this.layerValue) return;
      this.layerValue = layer;
      this.host?.setLayer(layer);
    }
    /**
     * Listens to this object's events: the page's own (click, grab, drop, ...) and those a graph reports for it
     * (uiButton, uiSlider, heldTrigger, ...). Prefer `events` in bindings.json; this is for wiring made in code.
     * The listener lives as long as the instance.
     */
    On(kind, handler) {
      if (this.subscribe) this.subscribe(kind, handler);
      else this.host?.on(kind, handler);
    }
    /**
     * Attaches this object to the local player's hand (0 left, 1 right), at an offset from it (BS.AttachedObject;
     * UNVERIFIED in Play mode). Only the local player can be attached to; other players see it only through a synced
     * transform.
     */
    AttachToHand(side, position = new Vector3(), rotation = new Quaternion()) {
      this.host?.attachToHand(side, position, rotation);
    }
    /** Lets go of what AttachToHand attached. */
    Detach() {
      this.host?.detach();
    }
    /** Makes the local player let go of this object if they hold it (VRChat: VRCPickup.Drop()); `drop` follows. */
    ReleaseGrab() {
      this.host?.releaseGrab();
    }
    /** Asks to own the object's synced transform (VRChat: Networking.SetOwner on a VRCObjectSync). */
    TakeOwnership() {
      this.host?.takeOwnership();
    }
    toString() {
      return this.name || this.key;
    }
  };
  var ComponentRef = class {
    constructor(kind, gameObject, actions) {
      __publicField(this, "kind");
      __publicField(this, "gameObject");
      __publicField(this, "actions");
      this.kind = kind;
      this.gameObject = gameObject;
      this.actions = actions;
    }
    get transform() {
      return this.gameObject.transform;
    }
  };
  var TextRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "value", "");
    }
    get text() {
      return this.value;
    }
    set text(value) {
      const next = value === null || value === void 0 ? "" : String(value);
      if (next === this.value) return;
      this.value = next;
      this.actions.setText(this.gameObject.key, next);
    }
    /** The colour of the text (a uGUI graphic). */
    set color(value) {
      this.actions.uiColor(this.gameObject.key, value);
    }
  };
  var AnimatorRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "on", true);
    }
    /** Animator.enabled: a disabled animator holds its pose. Reading gives what the script last set. */
    get enabled() {
      return this.on;
    }
    set enabled(value) {
      this.on = !!value;
      this.actions.animEnabled(this.gameObject.key, this.on);
    }
    SetBool(name, value) {
      this.actions.animBool(this.gameObject.key, name, value);
    }
    SetFloat(name, value) {
      this.actions.animFloat(this.gameObject.key, name, value);
    }
    SetInteger(name, value) {
      this.actions.animInt(this.gameObject.key, name, value);
    }
    SetTrigger(name) {
      this.actions.animTrigger(this.gameObject.key, name);
    }
    ResetTrigger(name) {
      this.actions.animResetTrigger(this.gameObject.key, name);
    }
    Play(state) {
      this.actions.animPlay(this.gameObject.key, state, 0);
    }
    CrossFade(state, seconds) {
      this.actions.animPlay(this.gameObject.key, state, seconds);
    }
  };
  var ParticleSystemRef = class extends ComponentRef {
    Play() {
      this.actions.particles(this.gameObject.key, true);
    }
    Stop() {
      this.actions.particles(this.gameObject.key, false);
    }
  };
  var RendererRef = class extends ComponentRef {
    /** Sets a colour property of one of the renderer's materials, "_BaseColor" of slot 0 by default (URP). */
    SetColor(color, property = "_BaseColor", slot = 0) {
      this.actions.setColor(this.gameObject.key, property, color, slot);
    }
    /** Sets a float property of one of the renderer's materials. */
    SetFloat(property, value, slot = 0) {
      this.actions.matFloat(this.gameObject.key, property, value, slot);
    }
  };
  var AudioSourceRef = class extends ComponentRef {
    constructor() {
      super(...arguments);
      __publicField(this, "pitchValue", 1);
      __publicField(this, "volumeValue", 1);
      /** The clip `Play()` plays (UnityEngine.AudioSource.clip). */
      __publicField(this, "clip", null);
    }
    /** Plays a clip (a `$clip` field value, or an index into this object's own clip list) through this audio source. */
    PlayOneShot(clip, volumeScale) {
      if (typeof clip === "number") this.actions.playClip(this.gameObject.key, clip, void 0, volumeScale);
      else this.actions.playClip(this.gameObject.key, clip.index, clip.on ?? void 0, volumeScale);
    }
    /** Plays `clip` as a one-shot (it overlaps a sound still playing instead of cutting it off). */
    Play() {
      if (this.clip) this.PlayOneShot(this.clip);
    }
    /** AudioSource.pitch (relay op `audioPitch`). Reading gives what the script last set. */
    get pitch() {
      return this.pitchValue;
    }
    set pitch(value) {
      this.pitchValue = value;
      this.actions.audioPitch(this.gameObject.key, value);
    }
    /** AudioSource.volume (relay op `audioVolume`). */
    get volume() {
      return this.volumeValue;
    }
    set volume(value) {
      this.volumeValue = value;
      this.actions.audioVolume(this.gameObject.key, value);
    }
  };
  var AudioClipRef = class {
    constructor(index, on = null) {
      __publicField(this, "index");
      __publicField(this, "on");
      this.index = index;
      this.on = on;
    }
  };
  function makeComponent(kind, gameObject, actions) {
    switch (kind) {
      case "Text":
      case "TMP":
        return new TextRef(kind, gameObject, actions);
      case "Animator":
        return new AnimatorRef(kind, gameObject, actions);
      case "ParticleSystem":
        return new ParticleSystemRef(kind, gameObject, actions);
      case "Renderer":
        return new RendererRef(kind, gameObject, actions);
      case "AudioSource":
        return new AudioSourceRef(kind, gameObject, actions);
      case "Transform":
        return gameObject.transform;
      default:
        return new ComponentRef(kind, gameObject, actions);
    }
  }

  // portkit/src/networking.ts
  var Networking = class {
    /** @internal */
    constructor(host) {
      __publicField(this, "host");
      this.host = host;
    }
    get LocalPlayer() {
      return this.host.localPlayer();
    }
    /** True on the one client that is this instance's referee (VRChat: the master). */
    get IsReferee() {
      return this.host.isReferee();
    }
    /** The same as IsReferee, under the name upstream code uses. */
    get IsMaster() {
      return this.host.isReferee();
    }
    /** The referee, or null while there is none. */
    get Master() {
      return this.host.refereePlayer();
    }
    /**
     * IsOwner(target): does the local player own it?  IsOwner(player, target): does that player?
     * A GameObject stands for the behaviours on it, as in Udon, where ownership belongs to the object.
     */
    IsOwner(a, b) {
      const player = b === void 0 ? this.host.localPlayer() : a;
      const target = b === void 0 ? a : b;
      const behaviour = this.first(target);
      return behaviour ? this.host.isOwner(behaviour, player) : false;
    }
    GetOwner(target) {
      const behaviour = this.first(target);
      return behaviour ? this.host.owner(behaviour) : null;
    }
    /**
     * Makes `player` the owner. It takes effect here at once; if someone else claimed at the same moment and the
     * room kept their claim, OnOwnershipTransferred reports the real owner a moment later.
     */
    SetOwner(player, target) {
      for (const behaviour of this.all(target)) this.host.setOwner(behaviour, player);
    }
    /** Synced time in seconds: the same on every client, to within the accuracy of the first clock exchange. */
    GetServerTimeInSeconds() {
      return this.host.serverSeconds();
    }
    GetServerTimeInMilliseconds() {
      return Math.floor(this.host.serverSeconds() * 1e3);
    }
    /** Everyone taking part in this instance, in player-id order (VRChat: VRCPlayerApi.GetPlayers). */
    GetPlayers() {
      return this.host.playerList();
    }
    GetPlayerCount() {
      return this.host.playerList().length;
    }
    GetPlayerById(id) {
      return this.host.playerById(id);
    }
    /**
     * While a network event or a command runs: the player who sent it (the local player for one sent here).
     * Null outside one, and null for a sender who is not taking part in this instance.
     */
    get CallingPlayer() {
      return this.host.callingPlayer();
    }
    /** The sender's session and user id, as the room stamped them, even when they are not a participant. */
    get CallingSession() {
      return this.host.callingSession();
    }
    /**
     * In a game whose referee candidates are "declared": offers the local player as referee, or withdraws them.
     * A referee who withdraws stops being referee and the remaining candidates elect another.
     */
    SetRefereeCandidate(on) {
      this.host.setCandidate(on);
    }
    IsRefereeCandidate(player) {
      return this.host.isCandidate(player);
    }
    /** Whether this client started a new game, resumed a saved one, or joined one in progress. */
    get StartKind() {
      return this.host.startKind();
    }
    /** Always false: the app queues and retries writes itself. Kept so that upstream checks translate. */
    get IsClogged() {
      return false;
    }
    all(target) {
      return target instanceof GameObject ? this.host.behavioursOn(target) : [target];
    }
    first(target) {
      return this.all(target)[0] ?? null;
    }
  };

  // portkit/src/persistence.ts
  var Persistence = class {
    constructor(store, slug, inst, uid) {
      __publicField(this, "store");
      __publicField(this, "prefix");
      this.store = store;
      this.prefix = storagePrefix(slug, inst, uid);
    }
    /** The saved value, or `fallback` when there is none or it cannot be read. */
    get(key, fallback) {
      let text = null;
      try {
        text = this.store.get(this.prefix + key);
      } catch {
        return fallback;
      }
      if (text === null) return fallback;
      try {
        return decodeValue(JSON.parse(text));
      } catch {
        return fallback;
      }
    }
    /** False when the device refused to store it (storage full or switched off). */
    set(key, value) {
      try {
        this.store.set(this.prefix + key, JSON.stringify(encodeValue(value)));
        return true;
      } catch {
        return false;
      }
    }
    has(key) {
      try {
        return this.store.get(this.prefix + key) !== null;
      } catch {
        return false;
      }
    }
    remove(key) {
      try {
        this.store.remove(this.prefix + key);
      } catch {
      }
    }
    keys() {
      try {
        return this.store.keys(this.prefix).map((k) => k.slice(this.prefix.length));
      } catch {
        return [];
      }
    }
  };

  // portkit/src/players.ts
  var ID_SETTLE_MS = 600;
  var Player = class {
    constructor(sid, uid, name, isLocal, playerId) {
      __publicField(this, "sid");
      __publicField(this, "uid");
      __publicField(this, "isLocal");
      __publicField(this, "displayName");
      __publicField(this, "playerId");
      /** The space's owner or a moderator, as the platform reports it. Not proof: check what the room accepted. */
      __publicField(this, "isSpaceAdmin", false);
      /** @internal */
      __publicField(this, "_valid", true);
      /** @internal */
      __publicField(this, "_isMaster", () => false);
      this.sid = sid;
      this.uid = uid;
      this.displayName = name;
      this.isLocal = isLocal;
      this.playerId = playerId;
    }
    /** False once the player has left: keep no references across OnPlayerLeft. */
    IsValid() {
      return this._valid;
    }
    get isMaster() {
      return this._valid && this._isMaster();
    }
    toString() {
      return `${this.displayName}#${this.playerId}`;
    }
  };
  var Players = class {
    constructor(core, presence, referee) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "bySidMap", /* @__PURE__ */ new Map());
      __publicField(this, "claims", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "localAssigned", deferred());
      __publicField(this, "highWater", 0);
      __publicField(this, "myId", 0);
      __publicField(this, "recheck", 0);
      this.core = core;
      this.presence = presence;
      this.referee = referee;
    }
    /** Starts following ids and claims one for the local player (who must have announced already). */
    start() {
      this.presence.on(() => this.refresh());
      this.presence.onExtra(() => this.refresh());
      this.refresh();
      this.claim();
    }
    /** Resolves once the local player's id has stood for the settle time. */
    whenLocalAssigned() {
      return this.localAssigned.promise;
    }
    get local() {
      return this.bySidMap.get(this.core.me.sid) ?? null;
    }
    bySid(sid) {
      return this.bySidMap.get(sid) ?? null;
    }
    byId(id) {
      for (const player of this.bySidMap.values()) if (player.playerId === id) return player;
      return null;
    }
    /** Everyone taking part, in player-id order. */
    list() {
      return [...this.bySidMap.values()].sort((a, b) => a.playerId - b.playerId);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    /** Upkeep no event triggers. Called about once a second. */
    tend() {
      this.refresh();
    }
    idOf(sid) {
      const id = this.presence.extra(sid, "id");
      return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
    }
    claim() {
      let top = this.highWater;
      for (const who of this.presence.list()) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (id !== null && id > top) top = id;
        if (typeof hw === "number" && hw > top) top = hw;
      }
      this.myId = top + 1;
      this.highWater = this.myId;
      this.presence.setExtra("id", this.myId);
      this.presence.setExtra("hw", this.highWater);
      this.presence.flush();
    }
    refresh() {
      if (this.core.disposed) return;
      const clock = this.core.platform.clock;
      const now = clock.now();
      const me = this.core.me.sid;
      const present = this.presence.list();
      const holders = /* @__PURE__ */ new Map();
      let top = this.highWater;
      for (const who of present) {
        const id = this.idOf(who.sid);
        const hw = this.presence.extra(who.sid, "hw");
        if (typeof hw === "number" && hw > top) top = hw;
        if (id === null) {
          this.claims.delete(who.sid);
          continue;
        }
        if (id > top) top = id;
        const claim = this.claims.get(who.sid);
        if (!claim || claim.id !== id) this.claims.set(who.sid, { id, since: now });
        if (!holders.has(id)) holders.set(id, who.sid);
      }
      for (const sid of [...this.claims.keys()]) if (!this.presence.has(sid)) this.claims.delete(sid);
      if (this.myId > 0 && holders.get(this.myId) !== void 0 && holders.get(this.myId) !== me) {
        this.highWater = top;
        this.claim();
        return;
      }
      if (top > this.highWater) {
        this.highWater = top;
        if (this.myId > 0) this.presence.setExtra("hw", top);
      }
      const leaving = [];
      const joining = [];
      let nextCheck = Infinity;
      for (const player of this.bySidMap.values()) if (!this.presence.has(player.sid)) leaving.push(player);
      for (const who of present) {
        const claim = this.claims.get(who.sid);
        if (!claim || holders.get(claim.id) !== who.sid) continue;
        const existing = this.bySidMap.get(who.sid);
        if (existing) {
          existing.displayName = who.name;
          if (existing.playerId !== claim.id) {
            this.core.log("warn", `player ${existing.displayName} changed id ${existing.playerId} -> ${claim.id} after joining (two ids were claimed at once)`);
            existing.playerId = claim.id;
          }
          continue;
        }
        const ready = claim.since + ID_SETTLE_MS;
        const echoed = who.sid !== me || this.localEchoed();
        if (now >= ready && echoed) joining.push(this.make(who, claim.id));
        else nextCheck = Math.min(nextCheck, Math.max(ready, now + 50));
      }
      for (const player of leaving) {
        this.bySidMap.delete(player.sid);
        player._valid = false;
      }
      for (const player of joining) this.bySidMap.set(player.sid, player);
      for (const player of leaving) this.emit("leave", player);
      for (const player of joining.sort((a, b) => a.playerId - b.playerId)) this.emit("join", player);
      if (this.bySidMap.has(me)) this.localAssigned.resolve();
      if (this.recheck) this.core.scheduler.cancel(this.recheck);
      this.recheck = 0;
      if (nextCheck !== Infinity) {
        this.recheck = this.core.scheduler.after(nextCheck - now, () => {
          this.recheck = 0;
          this.refresh();
        });
      }
    }
    localEchoed() {
      const marker = safeParse(this.core.platform.userGet(this.core.me.sid, this.core.prefix + ".k"));
      return isRecord(marker) && isRecord(marker.x) && marker.x.id === this.myId;
    }
    make(who, id) {
      const player = new Player(who.sid, who.uid, who.name, who.isLocal, id);
      player._isMaster = () => this.referee.current()?.sid === player.sid;
      player.isSpaceAdmin = this.core.platform.players().find((p) => p.sid === who.sid)?.isAdmin === true;
      return player;
    }
    emit(kind, player) {
      for (const handler of this.handlers.slice()) this.core.guard("player handler", () => handler(kind, player));
    }
  };

  // portkit/src/presence.ts
  var Presence = class {
    constructor(core) {
      __publicField(this, "core");
      __publicField(this, "known", /* @__PURE__ */ new Map());
      __publicField(this, "extras", /* @__PURE__ */ new Map());
      __publicField(this, "texts", /* @__PURE__ */ new Map());
      /** Every public key each session has announced, kept after it leaves (a sealed box can outlive its sender's visit). */
      __publicField(this, "keysSeen", /* @__PURE__ */ new Map());
      __publicField(this, "handlers", []);
      __publicField(this, "extraHandlers", []);
      __publicField(this, "announced", null);
      __publicField(this, "localExtras", {});
      __publicField(this, "dirty", false);
      __publicField(this, "started", false);
      this.core = core;
    }
    get markerPath() {
      return this.core.prefix + ".k";
    }
    start() {
      if (this.started) return;
      this.started = true;
      const { platform } = this.core;
      this.core.own(platform.onPlayers(() => this.recompute()));
      this.core.own(
        platform.onUser(this.core.prefix + ".", (_sid, path) => {
          if (path === this.markerPath) this.recompute();
        })
      );
      this.recompute();
    }
    /** Publishes the local marker. From here on the local player is a participant. */
    announce(publicKey) {
      this.announced = publicKey;
      this.write();
      this.recompute();
    }
    /** Withdraws the marker, when the instance stops while its player stays in the room. */
    retire() {
      if (this.announced === null) return;
      this.announced = null;
      this.core.platform.userSet(this.markerPath, null);
    }
    /** Sets or (with undefined) removes one of the local player's published records. Sent at the end of the tick. */
    setExtra(name, value) {
      if (value === void 0) {
        if (!(name in this.localExtras)) return;
        delete this.localExtras[name];
      } else this.localExtras[name] = value;
      this.dirty = true;
      this.emitExtra(this.core.me.sid);
    }
    /** The local player's session id. */
    get localSid() {
      return this.core.me.sid;
    }
    /** A published record of any participant, from the mirror (the local player's own is read back at once). */
    extra(sid, name) {
      if (sid === this.core.me.sid) return this.localExtras[name];
      return this.extras.get(sid)?.[name];
    }
    /** Called when a participant's published records may have changed. */
    onExtra(handler) {
      this.extraHandlers.push(handler);
    }
    /** Looks again at who is here: a session id can change without an event. Called about once a second. */
    tend() {
      if (this.started) this.recompute();
    }
    /** Sends the marker if a record changed. Called once per tick. */
    flush() {
      if (!this.dirty || this.announced === null || this.core.disposed) return;
      this.write();
    }
    write() {
      this.dirty = false;
      const marker = { k: this.announced, v: 1 };
      if (Object.keys(this.localExtras).length) marker.x = this.localExtras;
      this.core.platform.userSet(this.markerPath, asciiJson(marker));
    }
    /** Participants ordered by user id, then session id: the order referee ranks and player ids follow. */
    list() {
      return [...this.known.values()].sort(compare);
    }
    has(sid) {
      return this.known.has(sid);
    }
    get(sid) {
      return this.known.get(sid);
    }
    /** The public key a session announced, now or before it left; undefined for a session never seen. */
    keyOf(sid) {
      return this.known.get(sid)?.publicKey ?? this.keysSeen.get(sid);
    }
    /** Position of `sid` in `list()`, or -1. */
    rank(sid) {
      return this.list().findIndex((p) => p.sid === sid);
    }
    on(handler) {
      this.handlers.push(handler);
    }
    recompute() {
      if (this.core.disposed) return;
      const { platform } = this.core;
      const now = /* @__PURE__ */ new Map();
      const changed = [];
      for (const player of platform.players()) {
        let key = null;
        if (player.isLocal) key = this.announced;
        else {
          const text = platform.userGet(player.sid, this.markerPath) ?? "";
          if (text !== this.texts.get(player.sid)) {
            this.texts.set(player.sid, text);
            const marker2 = safeParse(text);
            this.extras.set(player.sid, isRecord(marker2) && isRecord(marker2.x) ? marker2.x : {});
            changed.push(player.sid);
          }
          const marker = safeParse(text);
          if (isRecord(marker) && typeof marker.k === "string" && marker.k.length > 0) key = marker.k;
        }
        if (key === null) continue;
        now.set(player.sid, { sid: player.sid, uid: player.uid, name: player.name, isLocal: player.isLocal, publicKey: key });
      }
      const left = [];
      const joined = [];
      for (const [sid, who] of this.known) if (!now.has(sid)) left.push(who);
      for (const [sid, who] of now) {
        const before = this.known.get(sid);
        if (!before) joined.push(who);
        else {
          before.name = who.name;
          before.publicKey = who.publicKey;
        }
      }
      for (const who of now.values()) this.keysSeen.set(who.sid, who.publicKey);
      for (const who of left) {
        this.known.delete(who.sid);
        this.extras.delete(who.sid);
        this.texts.delete(who.sid);
      }
      for (const who of joined) this.known.set(who.sid, who);
      for (const who of left.sort(compare)) this.emit("leave", who);
      for (const who of joined.sort(compare)) this.emit("join", who);
      for (const sid of changed) if (this.known.has(sid)) this.emitExtra(sid);
    }
    emit(kind, who) {
      for (const handler of this.handlers.slice()) this.core.guard("presence handler", () => handler(kind, who));
    }
    emitExtra(sid) {
      for (const handler of this.extraHandlers.slice()) this.core.guard("presence record handler", () => handler(sid));
    }
  };
  function compare(a, b) {
    return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : a.sid < b.sid ? -1 : a.sid > b.sid ? 1 : 0;
  }

  // portkit/src/protect.ts
  var ProtectedValues = class {
    constructor(core) {
      __publicField(this, "core");
      /** Told when a protected value changed. */
      __publicField(this, "onChanged", () => {
      });
      this.core = core;
    }
    listen() {
      this.core.onState((key) => {
        if (key.startsWith("x.")) this.core.guard("OnProtectedChanged", () => this.onChanged(key.slice(2)));
      });
    }
    get CanWrite() {
      return this.core.platform.local().isAdmin;
    }
    Set(key, value) {
      if (!isPathSegment(key)) throw new Error(`a protected key must be 1-64 of A-Z a-z 0-9 _ - @, not '${key}'`);
      if (this.core.disposed) return;
      this.core.platform.stateSetProtected(`${this.core.prefix}.x.${key}`, asciiJson({ v: encodeValue(value) }));
    }
    Get(key, fallback) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return raw && typeof raw === "object" && "v" in raw ? decodeValue(raw.v) : fallback;
    }
    Has(key) {
      const raw = safeParse(this.core.get(`x.${key}`));
      return !!raw && typeof raw === "object" && "v" in raw;
    }
  };

  // portkit/src/referee.ts
  var CROSSING_MS = 1500;
  var Referee = class {
    constructor(core, presence, rule) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "rule");
      __publicField(this, "handlers", []);
      __publicField(this, "judging", false);
      __publicField(this, "timer", 0);
      __publicField(this, "timerDue", -1);
      __publicField(this, "invalidSince", 0);
      __publicField(this, "claimAt", -Infinity);
      __publicField(this, "seen", null);
      __publicField(this, "lastEpoch", 0);
      __publicField(this, "declared", false);
      /** Counters for tests and diagnostics. */
      __publicField(this, "claims", 0);
      /** What this client found when it last claimed: a new epoch, or a game other participants were still running. */
      __publicField(this, "lastClaim", null);
      this.core = core;
      this.presence = presence;
      this.rule = rule;
    }
    start() {
      this.core.onState((key) => {
        if (key === "ref") this.check();
      });
      this.presence.on(() => this.check());
      this.presence.onExtra(() => this.check());
      this.invalidSince = this.core.platform.clock.now();
      this.check();
      this.core.scheduler.after(this.core.options.settleMs, () => {
        this.judging = true;
        this.invalidSince = this.core.platform.clock.now();
        this.check();
      });
    }
    /** The mirrored record, whether or not its session is still a candidate. */
    mirrored() {
      const raw = safeParse(this.core.get("ref"));
      if (!isRecord(raw) || typeof raw.sid !== "string" || typeof raw.uid !== "string") return null;
      if (typeof raw.term !== "number" || typeof raw.e !== "number") return null;
      return { sid: raw.sid, uid: raw.uid, term: raw.term, e: raw.e };
    }
    /** The referee, or null while there is none. */
    current() {
      const m = this.mirrored();
      return m && this.isCandidate(m.sid) ? m : null;
    }
    isMe() {
      return this.current()?.sid === this.core.me.sid;
    }
    /** The epoch of the last valid referee seen: records of any other epoch are ignored. 0 before the first. */
    get epoch() {
      return this.lastEpoch;
    }
    /** May this session be elected? */
    isCandidate(sid) {
      if (!this.presence.has(sid)) return false;
      return this.rule === "anyone" || this.presence.extra(sid, "rc") === 1;
    }
    /** Candidates in rank order. */
    candidates() {
      return this.presence.list().filter((p) => this.isCandidate(p.sid)).map((p) => p.sid);
    }
    /** Under the "declared" rule: offers the local player as referee, or withdraws the offer. */
    setCandidate(on) {
      if (this.declared === on) return;
      this.declared = on;
      this.presence.setExtra("rc", on ? 1 : void 0);
      this.presence.flush();
    }
    /** Tells the others which epoch this client is running in, so a claimant knows the game is still alive. */
    publishEpoch() {
      if (this.presence.extra(this.core.me.sid, "ep") === this.lastEpoch) return;
      this.presence.setExtra("ep", this.lastEpoch);
      this.presence.flush();
    }
    on(handler) {
      this.handlers.push(handler);
    }
    check() {
      if (this.core.disposed) return;
      const now = this.current();
      const before = this.seen;
      if (now) {
        this.cancelTimer();
        if (!before || before.sid !== now.sid || before.term !== now.term || before.e !== now.e) {
          const me2 = this.core.me.sid;
          if (before && before.sid === me2 && now.sid !== me2 && this.isCandidate(me2) && this.core.platform.clock.now() - this.claimAt > CROSSING_MS) {
            this.core.log("warn", `the referee seat was taken by session ${now.sid} (term ${now.term}) while this client was referee`);
          }
          this.lastEpoch = now.e;
          this.seen = now;
          this.publishEpoch();
          this.emit(now, before);
        }
        return;
      }
      if (before) {
        this.seen = null;
        this.invalidSince = this.core.platform.clock.now();
        this.claimAt = -Infinity;
        this.emit(null, before);
      }
      if (!this.judging) return;
      const me = this.core.me.sid;
      const rank = this.candidates().indexOf(me);
      if (rank < 0) {
        this.cancelTimer();
        return;
      }
      const earliest = Math.max(this.invalidSince + rank * this.core.options.claimStepMs, this.claimAt + this.core.options.claimRetryMs);
      if (this.timer && this.timerDue === earliest) return;
      this.cancelTimer();
      this.timerDue = earliest;
      this.timer = this.core.scheduler.after(Math.max(0, earliest - this.core.platform.clock.now()), () => {
        this.timer = 0;
        this.claim();
      });
    }
    claim() {
      if (this.core.disposed || this.current()) return;
      const me = this.core.me;
      if (!this.isCandidate(me.sid)) return;
      const old = this.mirrored();
      const alive = old !== null && this.presence.list().some((p) => this.presence.extra(p.sid, "ep") === old.e);
      const fresh = old === null || this.core.options.whenEmpty === "reset" && !alive;
      const record = { sid: me.sid, uid: me.uid, term: (old?.term ?? 0) + 1, e: (old?.e ?? 0) + (fresh ? 1 : 0) };
      this.claims++;
      this.lastClaim = { term: record.term, fresh, alive };
      this.claimAt = this.core.platform.clock.now();
      this.core.log("info", `claiming referee, term ${record.term}, epoch ${record.e}${fresh && old ? " (fresh start)" : ""}`);
      this.core.set("ref", asciiJson(record));
      this.check();
    }
    cancelTimer() {
      if (this.timer) this.core.scheduler.cancel(this.timer);
      this.timer = 0;
      this.timerDue = -1;
    }
    emit(now, before) {
      for (const handler of this.handlers.slice()) this.core.guard("referee handler", () => handler(now, before));
    }
  };

  // portkit/src/scheduler.ts
  var TICK_MS = 50;
  var TICK_SECONDS = TICK_MS / 1e3;
  var Scheduler = class {
    constructor(clock, onError) {
      __publicField(this, "clock");
      __publicField(this, "onError");
      __publicField(this, "delayed", /* @__PURE__ */ new Map());
      __publicField(this, "framed", []);
      __publicField(this, "nextHandle", 1);
      __publicField(this, "tickTimer", 0);
      __publicField(this, "running", false);
      __publicField(this, "stopped", false);
      __publicField(this, "startedAt", 0);
      __publicField(this, "lastTickAt", 0);
      __publicField(this, "tickCount", 0);
      /** Seconds the last tick covered (0 outside a tick's first run). */
      __publicField(this, "deltaTime", 0);
      this.clock = clock;
      this.onError = onError;
      this.startedAt = clock.now();
      this.lastTickAt = this.startedAt;
    }
    /** Seconds since the scheduler was made. */
    get time() {
      return (this.clock.now() - this.startedAt) / 1e3;
    }
    get ticks() {
      return this.tickCount;
    }
    /** Starts the tick. `onTick` runs every 50 ms; a page that stalled is not paid back with a burst of ticks. */
    start(onTick) {
      if (this.running || this.stopped) return;
      this.running = true;
      this.lastTickAt = this.clock.now();
      const step = () => {
        if (!this.running) return;
        const now = this.clock.now();
        const elapsed = now - this.lastTickAt;
        this.lastTickAt = now;
        this.tickCount++;
        this.deltaTime = Math.min(0.25, Math.max(1e-3, elapsed / 1e3));
        const due = this.framed.filter((f) => --f.ticks <= 0);
        if (due.length) this.framed = this.framed.filter((f) => f.ticks > 0);
        for (const f of due) this.guard("delayed frames", f.fn);
        this.guard("tick", () => onTick(this.deltaTime));
        if (this.running) this.tickTimer = this.clock.setTimeout(step, TICK_MS);
      };
      this.tickTimer = this.clock.setTimeout(step, TICK_MS);
    }
    /** Runs `fn` once after `ms`. Returns a handle for `cancel`. */
    after(ms, fn) {
      const id = this.nextHandle++;
      if (this.stopped) return id;
      const timer = this.clock.setTimeout(
        () => {
          if (!this.delayed.delete(id)) return;
          this.guard("delayed event", fn);
        },
        Math.max(0, ms)
      );
      this.delayed.set(id, { timer });
      return id;
    }
    /** Runs `fn` at the start of the tick `ticks` ticks from now (at least the next one). */
    afterTicks(ticks, fn) {
      const id = this.nextHandle++;
      if (!this.stopped) this.framed.push({ id, ticks: Math.max(1, Math.floor(ticks)), fn });
      return id;
    }
    cancel(handle) {
      const d = this.delayed.get(handle);
      if (d) {
        this.clock.clearTimeout(d.timer);
        this.delayed.delete(handle);
        return;
      }
      this.framed = this.framed.filter((f) => f.id !== handle);
    }
    /** Cancels the tick and every pending delayed event. The scheduler cannot be started again. */
    stop() {
      this.running = false;
      this.stopped = true;
      this.clock.clearTimeout(this.tickTimer);
      for (const d of this.delayed.values()) this.clock.clearTimeout(d.timer);
      this.delayed.clear();
      this.framed = [];
    }
    get pending() {
      return this.delayed.size + this.framed.length;
    }
    guard(where, fn) {
      try {
        fn();
      } catch (error) {
        this.onError(where, error);
      }
    }
  };

  // portkit/src/sha256.ts
  var K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  function sha256(message) {
    const h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
    const length = message.length;
    const padded = new Uint8Array((length + 8 >> 6) + 1 << 6);
    padded.set(message);
    padded[length] = 128;
    const bits = length * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
    view.setUint32(padded.length - 4, bits >>> 0);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
      for (let i = 16; i < 64; i++) {
        const a2 = w[i - 15];
        const b2 = w[i - 2];
        const s0 = (a2 >>> 7 | a2 << 25) ^ (a2 >>> 18 | a2 << 14) ^ a2 >>> 3;
        const s1 = (b2 >>> 17 | b2 << 15) ^ (b2 >>> 19 | b2 << 13) ^ b2 >>> 10;
        w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
        const ch = e & f ^ ~e & g;
        const t1 = hh + s1 + ch + K[i] + w[i] | 0;
        const s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
        const maj = a & b ^ a & c ^ b & c;
        const t2 = s0 + maj | 0;
        hh = g;
        g = f;
        f = e;
        e = d + t1 | 0;
        d = c;
        c = b;
        b = a;
        a = t1 + t2 | 0;
      }
      h[0] = h[0] + a | 0;
      h[1] = h[1] + b | 0;
      h[2] = h[2] + c | 0;
      h[3] = h[3] + d | 0;
      h[4] = h[4] + e | 0;
      h[5] = h[5] + f | 0;
      h[6] = h[6] + g | 0;
      h[7] = h[7] + hh | 0;
    }
    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i]);
    return out;
  }
  function sha256Text(text) {
    return toBase64(sha256(utf8Encode(text)));
  }
  function toHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
    return out;
  }

  // portkit/src/secrets.ts
  var Draw = class {
    constructor(seed) {
      __publicField(this, "seed");
      this.seed = seed;
    }
    /** An integer in [0, maxExclusive). `index` picks which of the draw's numbers: die 0, die 1, ... */
    Int(maxExclusive, index = 0) {
      const h = sha256(utf8Encode(`${this.seed}
${index}`));
      const n = h[0] * 2 ** 40 + h[1] * 2 ** 32 + h[2] * 2 ** 24 + h[3] * 2 ** 16 + h[4] * 2 ** 8 + h[5];
      return n % Math.max(1, Math.floor(maxExclusive));
    }
    Ints(count, maxExclusive) {
      const out = [];
      for (let i = 0; i < count; i++) out.push(this.Int(maxExclusive, i));
      return out;
    }
    /** In [0, 1). */
    Float(index = 0) {
      return this.Int(2 ** 32, index) / 2 ** 32;
    }
    toString() {
      return this.seed;
    }
  };
  var DRAW_KEEP_MS = 12e4;
  function parseDrawEntry(e) {
    if (!Array.isArray(e) || typeof e[0] !== "string" || typeof e[1] !== "string" || typeof e[2] !== "string") return null;
    return [e[0], e[1], e[2], typeof e[3] === "number" ? e[3] : 0, e[4] === 1 ? 1 : 0, typeof e[5] === "string" ? e[5] : ""];
  }
  var CURVE = { name: "ECDH", namedCurve: "P-256" };
  function parseDeal(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string" || !Array.isArray(raw.s)) return null;
    return { l: raw.l, h: raw.h, s: raw.s.filter((x) => typeof x === "string"), p: raw.p === 1 ? 1 : 0, r: typeof raw.r === "string" ? raw.r : void 0 };
  }
  function parseContribution(raw) {
    if (!isRecord(raw) || typeof raw.l !== "string" || typeof raw.h !== "string") return null;
    return { l: raw.l, h: raw.h, c: typeof raw.c === "string" ? raw.c : void 0 };
  }
  var Secrets = class {
    constructor(core, presence, referee, nowSeconds) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "crypto");
      __publicField(this, "nowSeconds");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "privateKey", null);
      __publicField(this, "publicKeyText", "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __publicField(this, "derived", /* @__PURE__ */ new Map());
      __publicField(this, "mySecret", null);
      __publicField(this, "lastStates", /* @__PURE__ */ new Map());
      /** The referee's numbers and judgements, read from the referee's own user state. */
      __publicField(this, "numbers");
      __publicField(this, "pins", /* @__PURE__ */ new Map());
      __publicField(this, "pinsEpoch", -1);
      __publicField(this, "warnedPins", /* @__PURE__ */ new Set());
      __publicField(this, "goneSince", /* @__PURE__ */ new Map());
      __publicField(this, "drawStore", null);
      __publicField(this, "drawKey", "");
      __publicField(this, "restoring", null);
      /** The referee's own seed for its current deal. */
      __publicField(this, "dealSeed", null);
      /** This player's contribution to a deal. */
      __publicField(this, "myContribution", null);
      /** Commitments and contributions as first seen, per deal label and session (they outlive a player's visit). */
      __publicField(this, "dealSeen", /* @__PURE__ */ new Map());
      /** Told when a player's draw changes state. */
      __publicField(this, "onDrawChanged", () => {
      });
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.crypto = core.platform.crypto;
      this.nowSeconds = nowSeconds;
      this.numbers = new RefereeTable(presence, referee, "fn", parseDrawEntry);
    }
    /** Starts following commitments, the referee's numbers and reveals. */
    listen() {
      this.presence.onExtra(() => this.review());
      this.presence.on(() => this.review());
      this.referee.on(() => this.review());
    }
    /** `n` bytes from the strong generator (WebCrypto; seeded in the fake room). */
    RandomBytes(n) {
      return this.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))));
    }
    // ---- commit / reveal ----------------------------------------------------------------------------------------
    commit(value) {
      const nonce = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      const opening = { v: encodeValue(value), s: nonce };
      const hash = hashOpening(opening);
      return { hash, reveal: () => ({ v: opening.v, s: opening.s }) };
    }
    /** True when `opening` is what `hash` committed to. */
    verify(hash, opening) {
      if (!opening || typeof opening.s !== "string" || typeof hash !== "string") return false;
      return hashOpening(opening) === hash;
    }
    /** The value inside an opening, with value types rebuilt. Check it with `verify` first. */
    valueOf(opening) {
      return decodeValue(opening.v);
    }
    /** Publishes one of the local player's commitments under `label`, in their own user state. */
    publish(label, hash) {
      const all = { ...this.own("c") };
      all[label] = hash;
      this.presence.setExtra("c", all);
    }
    /** Takes a published commitment back (when its round is over). */
    retract(label) {
      const all = { ...this.own("c") };
      delete all[label];
      this.presence.setExtra("c", Object.keys(all).length ? all : void 0);
    }
    /** The commitment a participant published under `label`, or null. Only that player can have written it. */
    published(sid, label) {
      const all = this.presence.extra(sid, "c");
      return isRecord(all) && typeof all[label] === "string" ? all[label] : null;
    }
    own(name) {
      const value = this.presence.extra(this.core.me.sid, name);
      return isRecord(value) ? value : {};
    }
    // ---- fair draws ---------------------------------------------------------------------------------------------
    //
    // Where each part lives, so that nobody can change another player's part:
    //   x.fd  [label, hash]          the player's commitment, in the player's own user state
    //   x.fr  [label, secret]        the player's reveal, in the player's own user state
    //   x.fn  {e, m: {sid: entry}}   the referee's numbers and judgements, in the referee's own user state
    //                                (refrecord.ts); entry = [label, hash, number, deadline, forfeit, uid]
    // Each client also keeps the first hash and number it saw for a player's label in this epoch (`pins`): a later
    // table that changes them (a referee seat taken over by a modified client) is not believed.
    /** Starts a draw for the local player under `label` (a round name). It replaces their previous draw. */
    beginDraw(label) {
      const secret = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.mySecret = { label, secret };
      this.restoring = null;
      this.saveDraw(false);
      this.presence.setExtra("fr", void 0);
      this.presence.setExtra("fd", [label, sha256Text(secret)]);
    }
    /** Publishes the local player's secret for `label`, so everyone can compute and check the draw. */
    revealDraw(label) {
      if (!this.mySecret || this.mySecret.label !== label) return;
      this.saveDraw(true);
      this.presence.setExtra("fr", [label, this.mySecret.secret]);
    }
    /** The referee starts the clock: draws under `label` not revealed within `seconds` are forfeit. */
    demandReveal(label, seconds) {
      if (!this.referee.isMe()) return;
      const table = this.numbers.working();
      const deadline = this.nowSeconds() + seconds;
      let changed = false;
      for (const sid of Object.keys(table)) {
        const entry = table[sid];
        if (entry[0] === label && entry[3] === 0 && entry[4] === 0) {
          entry[3] = deadline;
          changed = true;
        }
      }
      if (changed) this.numbers.write(table);
    }
    /** Where a participant's draw under `label` stands, and the draw itself once this client may know it. */
    drawOf(sid, label) {
      const entry = this.entryOf(sid);
      const committed = this.presence.extra(sid, "fd");
      const hasCommit = Array.isArray(committed) && committed[0] === label && typeof committed[1] === "string";
      if (!entry || entry[0] !== label) return { state: hasCommit ? "committed" : "none", draw: null };
      const [, hash, number, , forfeit] = entry;
      if (hasCommit && committed[1] !== hash) return { state: "rejected", draw: null };
      const revealed = this.presence.extra(sid, "fr");
      if (Array.isArray(revealed) && revealed[0] === label && typeof revealed[1] === "string") {
        if (sha256Text(revealed[1]) !== hash) return { state: "rejected", draw: null };
        if (forfeit) return { state: "forfeit", draw: null };
        return { state: "revealed", draw: new Draw(drawSeed(revealed[1], number, label)) };
      }
      if (forfeit) return { state: "forfeit", draw: null };
      if (sid === this.core.me.sid && this.mySecret && this.mySecret.label === label && sha256Text(this.mySecret.secret) === hash) {
        return { state: "numbered", draw: new Draw(drawSeed(this.mySecret.secret, number, label)) };
      }
      return { state: "numbered", draw: null };
    }
    /** The local player's own draw under `label`, as soon as the referee's number is in. */
    myDraw(label) {
      return this.drawOf(this.core.me.sid, label).draw;
    }
    /** A participant's entry in the referee's table, with the hash and number this client saw first. */
    entryOf(sid) {
      const entry = this.numbers.read()[sid];
      if (!entry) return null;
      const epoch = this.referee.epoch;
      if (this.pinsEpoch !== epoch) {
        this.pins.clear();
        this.pinsEpoch = epoch;
      }
      const key = `${entry[5]}
${entry[0]}`;
      const pin = this.pins.get(key);
      if (!pin) {
        this.pins.set(key, [entry[1], entry[2]]);
        return entry;
      }
      if (pin[0] !== entry[1] || pin[1] !== entry[2]) {
        if (!this.warnedPins.has(key)) {
          this.warnedPins.add(key);
          this.core.log("warn", `the referee's table changed the pinned commitment or number of a draw (${entry[0]}); keeping the first one seen`);
        }
        return [entry[0], pin[0], pin[1], entry[3], entry[4], entry[5]];
      }
      return entry;
    }
    /** Looks at every participant's draw: the referee answers and judges, and everyone reports changes. */
    review() {
      if (this.core.disposed) return;
      this.reviewDeal();
      this.restoreDraw();
      if (this.referee.isMe()) this.officiate();
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const entry = this.entryOf(who.sid);
        const label = entry ? entry[0] : Array.isArray(committed) && typeof committed[0] === "string" ? committed[0] : null;
        if (label === null) continue;
        const status = this.drawOf(who.sid, label);
        const mark = `${label}
${status.state}`;
        if (this.lastStates.get(who.sid) === mark) continue;
        this.lastStates.set(who.sid, mark);
        this.core.guard("draw handler", () => this.onDrawChanged(who.sid, label, status));
      }
    }
    officiate() {
      const table = this.numbers.working();
      let changed = false;
      const now = this.nowSeconds();
      const clock = this.core.platform.clock.now();
      for (const sid of Object.keys(table)) {
        if (this.presence.has(sid)) {
          this.goneSince.delete(sid);
          continue;
        }
        const since = this.goneSince.get(sid) ?? clock;
        this.goneSince.set(sid, since);
        if (clock - since >= DRAW_KEEP_MS) {
          delete table[sid];
          this.goneSince.delete(sid);
          changed = true;
        }
      }
      for (const who of this.presence.list()) {
        const committed = this.presence.extra(who.sid, "fd");
        const entry = table[who.sid];
        if (Array.isArray(committed) && typeof committed[0] === "string" && typeof committed[1] === "string") {
          if (!entry || entry[0] !== committed[0]) {
            const before = Object.keys(table).find((sid) => {
              const e = table[sid];
              return !this.presence.has(sid) && e[5] === who.uid && e[0] === committed[0] && e[1] === committed[1];
            });
            if (before !== void 0) {
              table[who.sid] = table[before];
              delete table[before];
              this.goneSince.delete(before);
            } else table[who.sid] = [committed[0], committed[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16))), 0, 0, who.uid];
            changed = true;
            continue;
          }
        }
        if (entry && entry[3] > 0 && entry[4] === 0 && now >= entry[3]) {
          const revealed = this.presence.extra(who.sid, "fr");
          const ok = Array.isArray(revealed) && revealed[0] === entry[0] && typeof revealed[1] === "string" && sha256Text(revealed[1]) === entry[1];
          if (!ok) {
            entry[4] = 1;
            changed = true;
          }
        }
      }
      if (changed) this.numbers.write(table);
    }
    saveDraw(revealed) {
      if (!this.drawStore || !this.mySecret) return;
      try {
        this.drawStore.set(this.drawKey, JSON.stringify({ e: this.referee.epoch, l: this.mySecret.label, s: this.mySecret.secret, r: revealed ? 1 : 0 }));
      } catch {
      }
    }
    /**
     * After a page reload: the secret this device saved comes back once the referee's table (as last mirrored)
     * still holds this user's entry for it; the commitment (and the reveal, if it was made) is published again and
     * the referee moves the entry to the new session.
     */
    restoreDraw() {
      const saved = this.restoring;
      if (!saved || this.mySecret) return;
      const epoch = this.referee.epoch;
      if (epoch === 0) return;
      if (saved.e !== 0 && saved.e !== epoch) {
        this.restoring = null;
        return;
      }
      const hash = sha256Text(saved.s);
      const table = this.numbers.read();
      const mine = Object.keys(table).map((sid) => table[sid]).filter((e) => e[5] === this.core.me.uid);
      if (mine.some((e) => e[0] === saved.l && e[1] === hash)) {
        this.restoring = null;
        this.mySecret = { label: saved.l, secret: saved.s };
        this.presence.setExtra("fd", [saved.l, hash]);
        if (saved.r) this.presence.setExtra("fr", [saved.l, saved.s]);
        this.core.log("info", `the draw '${saved.l}' came back after a reload`);
      } else if (mine.length) {
        this.restoring = null;
      }
    }
    // ---- dealt draws ---------------------------------------------------------------------------------------------
    //
    //   referee x.dl  {l: label, h: SHA-256(seed), s: [listed session ids], p: 0 committing | 1 revealing, r?: seed}
    //   player  x.dc  {l: label, h: SHA-256(contribution), c?: contribution}
    // The runtime answers for every listed player by itself (review), so game code only calls beginDeal, dealDraw,
    // revealDeal on the referee and verifyDeal anywhere.
    /** The referee starts a deal under `label` for the players with these session ids. Replaces its previous deal. */
    beginDeal(label, sids) {
      if (!this.referee.isMe()) return;
      const seed = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
      this.dealSeed = { label, seed };
      this.presence.setExtra("dl", { l: label, h: sha256Text(seed), s: sids.slice(), p: 0 });
      this.review();
    }
    /** Where the current referee's deal under `label` stands. */
    dealState(label) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label) return "none";
      const seen = this.dealSeen.get(label);
      if (deal.r !== void 0) return seen && sha256Text(deal.r) === seen.h ? "revealed" : "invalid";
      if (deal.p === 0) return "committing";
      return this.contributions(deal) ? "ready" : "revealing";
    }
    /**
     * The referee's deal, once every listed player still present has revealed a contribution (a listed player who
     * left counts as absent: say so in the game if it matters). Null before that, and on any other client.
     */
    dealDraw(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return null;
      const parts = this.contributions(deal);
      return parts ? new Draw(dealSeedOf(this.dealSeed.seed, label, parts)) : null;
    }
    /** The referee publishes its seed (after the hand), so that everyone can check the deal. */
    revealDeal(label) {
      const deal = this.currentDeal();
      if (!this.referee.isMe() || !deal || deal.l !== label || !this.dealSeed || this.dealSeed.label !== label) return;
      this.presence.setExtra("dl", { ...deal, r: this.dealSeed.seed });
    }
    /** After revealDeal: the deal, recomputed here from the referee's seed and the contributions this client saw; null if it does not check out. */
    verifyDeal(label) {
      const deal = this.currentDeal();
      if (!deal || deal.l !== label || deal.r === void 0) return null;
      const seen = this.dealSeen.get(label);
      if (!seen || sha256Text(deal.r) !== seen.h) return null;
      const parts = this.contributions(deal);
      return parts ? new Draw(dealSeedOf(deal.r, label, parts)) : null;
    }
    currentDeal() {
      const ref = this.referee.current();
      return ref ? parseDeal(this.presence.extra(ref.sid, "dl")) : null;
    }
    /** Every listed contribution, revealed and matching its commitment ("-" for a listed player who left); null while one is missing. */
    contributions(deal) {
      const seen = this.dealSeen.get(deal.l);
      if (!seen) return null;
      const out = [];
      for (const sid of deal.s) {
        const part = seen.parts.get(sid);
        if (part && part.c !== void 0) out.push(part.c);
        else if (!this.presence.has(sid) && (!part || deal.p === 1)) out.push("-");
        else return null;
      }
      return out;
    }
    /** Follows the deal: records what is first seen, answers for the local player, and moves the referee's phase on. */
    reviewDeal() {
      const ref = this.referee.current();
      const deal = this.currentDeal();
      if (!ref || !deal) return;
      let seen = this.dealSeen.get(deal.l);
      if (!seen || seen.refSid !== ref.sid) {
        seen = { h: deal.h, refSid: ref.sid, parts: /* @__PURE__ */ new Map() };
        this.dealSeen.set(deal.l, seen);
        while (this.dealSeen.size > 8) this.dealSeen.delete(this.dealSeen.keys().next().value);
      }
      for (const sid of deal.s) {
        const part = parseContribution(this.presence.extra(sid, "dc"));
        if (!part || part.l !== deal.l) continue;
        const known = seen.parts.get(sid);
        if (!known) seen.parts.set(sid, { h: part.h });
        const entry = seen.parts.get(sid);
        if (part.c !== void 0 && entry.c === void 0 && entry.h === part.h && sha256Text(part.c) === entry.h) entry.c = part.c;
      }
      const me = this.core.me.sid;
      if (deal.s.includes(me)) {
        if (!this.myContribution || this.myContribution.label !== deal.l) {
          this.myContribution = { label: deal.l, c: toBase64(this.crypto.getRandomValues(new Uint8Array(16))) };
          this.presence.setExtra("dc", { l: deal.l, h: sha256Text(this.myContribution.c) });
        } else if (deal.p === 1) {
          const mine = parseContribution(this.presence.extra(me, "dc"));
          if (mine && mine.c === void 0) this.presence.setExtra("dc", { ...mine, c: this.myContribution.c });
        }
      }
      if (this.referee.isMe() && deal.p === 0 && this.dealSeed && this.dealSeed.label === deal.l) {
        const all = deal.s.every((sid) => seen.parts.has(sid) || !this.presence.has(sid));
        if (all) this.presence.setExtra("dl", { ...deal, p: 1 });
      }
    }
    // ---- seal / open --------------------------------------------------------------------------------------------
    /** The local public key (raw point, base64url). Empty before `init`. */
    get publicKey() {
      return this.publicKeyText;
    }
    /**
     * Makes the local key pair, or loads the one this device saved for this player and instance, so that a page
     * reload can still open what was sealed before it.
     */
    async init(store, storeKey, drawKey = "") {
      const subtle = this.crypto.subtle;
      if (store && drawKey) {
        this.drawStore = store;
        this.drawKey = drawKey;
        try {
          const saved = safeParse(store.get(drawKey));
          if (isRecord(saved) && typeof saved.l === "string" && typeof saved.s === "string") {
            this.restoring = { e: typeof saved.e === "number" ? saved.e : 0, l: saved.l, s: saved.s, r: saved.r === 1 ? 1 : 0 };
          }
        } catch {
        }
      }
      if (store) {
        try {
          const saved = safeParse(store.get(storeKey));
          if (isRecord(saved) && isRecord(saved.d) && typeof saved.p === "string") {
            this.privateKey = await subtle.importKey("jwk", saved.d, CURVE, false, ["deriveKey"]);
            this.publicKeyText = saved.p;
            return this.publicKeyText;
          }
        } catch {
        }
      }
      const pair = await subtle.generateKey(CURVE, true, ["deriveKey"]);
      this.privateKey = pair.privateKey;
      this.publicKeyText = toBase64(new Uint8Array(await subtle.exportKey("raw", pair.publicKey)));
      if (store) {
        try {
          store.set(storeKey, JSON.stringify({ p: this.publicKeyText, d: await subtle.exportKey("jwk", pair.privateKey) }));
        } catch {
        }
      }
      return this.publicKeyText;
    }
    /** True once the player's public key is known, so `seal` for them can work. */
    canSealFor(sid) {
      return !!this.presence.get(sid)?.publicKey;
    }
    /**
     * Encrypts `value` for one participant. The result is text that can go anywhere (a synced field, a network
     * event): only that player's key opens it.
     */
    async seal(forSid, value) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const target = this.presence.get(forSid);
      if (!target || !target.publicKey) throw new Error(`no public key known for player session ${forSid}`);
      const key = await this.sharedKey(target.publicKey);
      const iv = this.crypto.getRandomValues(new Uint8Array(12));
      const me = this.core.me;
      const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${forSid}`);
      const plain = utf8Encode(canonicalJson(encodeValue(value)));
      const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, plain));
      return JSON.stringify({ f: me.sid, t: forSid, u: target.uid, p: this.publicKeyText, i: toBase64(iv), c: toBase64(cipher) });
    }
    /**
     * Opens a box sealed for the local player. Throws when it is for someone else, was changed on the way, or
     * claims a sender whose announced key is not the one it was sealed with.
     */
    async open(box) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(box);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.t !== "string" || typeof b.p !== "string" || typeof b.i !== "string" || typeof b.c !== "string") {
        throw new Error("not a sealed box");
      }
      const me = this.core.me;
      if (b.t !== me.sid && b.u !== me.uid) throw new Error("this box is sealed for another player");
      const senderKey = this.presence.keyOf(b.f);
      if (senderKey !== b.p) throw new Error("the box does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${b.t}`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(b.i), additionalData: aad }, key, fromBase64(b.c));
      } catch {
        throw new Error("the box could not be opened (wrong key or changed contents)");
      }
      return decodeValue(JSON.parse(utf8Decode(new Uint8Array(plain))));
    }
    /**
     * Seals one value per participant into a single text, for one synced field that is rewritten as a whole.
     *
     * A box written for one player at a telling moment names its reader even though nobody else can open it. Here
     * every participant gets an entry every time, each padded to `slotBytes` before encryption, in session-id
     * order: the text has the same size and shape whoever it really concerns. `valueFor` returns undefined for a
     * participant who gets nothing; their entry is filled with padding.
     */
    async sealAll(valueFor, slotBytes = 256) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const me = this.core.me;
      const entries = {};
      const everyone = this.presence.list().map((p) => p.sid).sort();
      for (const sid of everyone) {
        const target = this.presence.get(sid);
        if (!target || !target.publicKey) continue;
        const value = valueFor(sid);
        const text = value === void 0 ? "{}" : canonicalJson({ v: encodeValue(value) });
        const bytes = utf8Encode(text);
        if (bytes.length > slotBytes) throw new Error(`sealAll: the value for one player needs ${bytes.length} bytes, more than the slot of ${slotBytes}`);
        const padded = new Uint8Array(slotBytes).fill(32);
        padded.set(bytes);
        const key = await this.sharedKey(target.publicKey);
        const iv = this.crypto.getRandomValues(new Uint8Array(12));
        const aad = utf8Encode(`${this.core.prefix}
${me.sid}
${sid}
all`);
        const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, padded));
        entries[sid] = [toBase64(iv), toBase64(cipher)];
      }
      return asciiJson({ f: me.sid, p: this.publicKeyText, n: slotBytes, m: entries });
    }
    /**
     * Opens the local player's entry of a `sealAll` text. Resolves null when the entry holds nothing for them,
     * or there is none (they arrived after it was written).
     */
    async openMine(bundle) {
      if (!this.privateKey) throw new Error("secrets are not ready");
      const b = safeParse(bundle);
      if (!isRecord(b) || typeof b.f !== "string" || typeof b.p !== "string" || !isRecord(b.m)) throw new Error("not a sealed bundle");
      const me = this.core.me;
      const entry = b.m[me.sid];
      if (!Array.isArray(entry) || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
      if (this.presence.keyOf(b.f) !== b.p) throw new Error("the bundle does not come from the player it names");
      const key = await this.sharedKey(b.p);
      const aad = utf8Encode(`${this.core.prefix}
${b.f}
${me.sid}
all`);
      let plain;
      try {
        plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(entry[0]), additionalData: aad }, key, fromBase64(entry[1]));
      } catch {
        throw new Error("the entry could not be opened (wrong key or changed contents)");
      }
      const parsed = safeParse(utf8Decode(new Uint8Array(plain)).trimEnd());
      return isRecord(parsed) && "v" in parsed ? decodeValue(parsed.v) : null;
    }
    /**
     * Opens a box sealed for the local player and says who sealed it (a session id whose announced key the box was
     * sealed with). A game that takes a dealt value as authority checks that the sender is the referee.
     */
    async openWithSender(box) {
      const value = await this.open(box);
      return { value, from: String(safeParse(box).f) };
    }
    /** True when `box` names the local player as its reader. */
    isForMe(box) {
      const b = safeParse(box);
      return isRecord(b) && (b.t === this.core.me.sid || b.u === this.core.me.uid);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sharedKey(theirPublic) {
      let key = this.derived.get(theirPublic);
      if (!key) {
        const subtle = this.crypto.subtle;
        key = (async () => {
          const pub = await subtle.importKey("raw", fromBase64(theirPublic), CURVE, false, []);
          return subtle.deriveKey({ name: "ECDH", public: pub }, this.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
        })();
        this.derived.set(theirPublic, key);
        key.catch(() => this.derived.delete(theirPublic));
      }
      return key;
    }
  };
  function hashOpening(opening) {
    return sha256Text(opening.s + "\n" + canonicalJson(opening.v));
  }
  function dealSeedOf(seed, label, parts) {
    return toHex(sha256(utf8Encode(`${seed}
${label}
${parts.join("\n")}`)));
  }
  function drawSeed(secret, number, label) {
    return toHex(sha256(utf8Encode(`${secret}
${number}
${label}`)));
  }

  // portkit/src/leaf.ts
  var LEAF_MARGIN = 96;
  var TOMBSTONE = "";
  function headKey(id) {
    return `v.${id}`;
  }
  function chunkKey(id, index) {
    return `c.${id}.${index}`;
  }
  function encodeLeaf(id, record, maxLeafBytes, previousChunks) {
    const budget = Math.max(256, maxLeafBytes - LEAF_MARGIN);
    const whole = asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, d: record.d });
    const bytes = jsonLeafBytes(whole);
    const writes = [];
    let chunks = 0;
    if (bytes <= budget) {
      writes.push([headKey(id), whole]);
    } else {
      const pieces = splitByLeafBytes(whole, budget - 32);
      chunks = pieces.length;
      for (let i = 0; i < pieces.length; i++) writes.push([chunkKey(id, i), `${record.n}.${i}~${pieces[i]}`]);
      writes.push([headKey(id), asciiJson({ e: record.e, g: record.g, n: record.n, w: record.w, c: chunks })]);
    }
    for (let i = chunks; i < previousChunks; i++) writes.push([chunkKey(id, i), TOMBSTONE]);
    return { writes, chunks, bytes };
  }
  function splitByLeafBytes(text, budget) {
    const pieces = [];
    let start = 0;
    let size = 0;
    for (let i = 0; i < text.length; i++) {
      const add = leafCharBytes(text, i);
      const lowHalf = (text.charCodeAt(i) & 64512) === 56320;
      if (size + add > budget && i > start && !lowHalf) {
        pieces.push(text.slice(start, i));
        start = i;
        size = 0;
      }
      size += add;
    }
    if (start < text.length) pieces.push(text.slice(start));
    return pieces;
  }
  function decodeLeaf(id, get) {
    const head = get(headKey(id));
    if (head === void 0 || head === TOMBSTONE) return { kind: "none" };
    const parsed = safeParse(head);
    if (!isRecord(parsed) || !isCount(parsed.e) || !isCount(parsed.g) || !isCount(parsed.n) || typeof parsed.w !== "string") return { kind: "bad" };
    const e = parsed.e;
    const g = parsed.g;
    const n = parsed.n;
    const w = parsed.w;
    if (parsed.c === void 0) return { kind: "value", record: { e, g, n, w, d: parsed.d }, chunks: 0 };
    if (!isCount(parsed.c) || parsed.c < 1 || parsed.c > 512) return { kind: "bad" };
    const chunks = parsed.c;
    let whole = "";
    for (let i = 0; i < chunks; i++) {
      const piece = get(chunkKey(id, i));
      const tag = `${n}.${i}~`;
      if (piece === void 0 || !piece.startsWith(tag)) return { kind: "pending", e, g, n, w, chunks };
      whole += piece.slice(tag.length);
    }
    const full = safeParse(whole);
    if (!isRecord(full) || full.e !== e || full.g !== g || full.n !== n || full.w !== w) return { kind: "bad" };
    return { kind: "value", record: { e, g, n, w, d: full.d }, chunks };
  }
  function isCount(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
  }
  function leafOwnerOf(key) {
    if (key.startsWith("v.")) return key.indexOf(".", 2) < 0 ? key.slice(2) : null;
    if (key.startsWith("c.")) {
      const end = key.indexOf(".", 2);
      return end > 2 ? key.slice(2, end) : null;
    }
    return null;
  }

  // portkit/src/sync.ts
  var Sync = class {
    constructor(core, presence, referee, players) {
      __publicField(this, "core");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "slots", /* @__PURE__ */ new Map());
      __publicField(this, "byBehaviour", /* @__PURE__ */ new Map());
      __publicField(this, "stats", { writes: 0, applied: 0, repairs: 0, claims: 0, lostRaces: 0, rejected: 0, reverted: 0 });
      /** False until behaviours have started: data applied before then is reported once, afterwards. */
      __publicField(this, "started", false);
      __publicField(this, "epochSeen", 0);
      __publicField(this, "warnedIdle", false);
      /** Told when the local player becomes or stops being the owner of a slot (to move its synced objects). */
      __publicField(this, "onLocalOwnership", () => {
      });
      this.core = core;
      this.presence = presence;
      this.referee = referee;
      this.players = players;
    }
    get me() {
      return this.core.me.sid;
    }
    /** Registers a behaviour. With `group`, it shares the leaf and the owner of every other behaviour of that group. */
    add(behaviour, id, fields, mode, callbacks, group) {
      const slotId = group ? `@${group}` : id;
      let slot = this.slots.get(slotId);
      if (!slot) {
        slot = {
          id: slotId,
          grouped: !!group,
          members: [],
          mode,
          snapshotOwed: false,
          mo: null,
          topG: 0,
          pending: null,
          applied: null,
          seenN: 0,
          lastValid: null,
          unconfirmed: null,
          dirty: false,
          chunks: 0,
          lastSent: null,
          lastContinuousAt: -Infinity,
          ownerView: null,
          warnedNotOwner: false,
          onApplied: null
        };
        this.slots.set(slotId, slot);
      } else if (mode === "continuous" || slot.mode === "none" && mode !== "none") slot.mode = mode;
      slot.members.push({ id, behaviour, fields, callbacks: callbacks && Object.keys(callbacks).length ? callbacks : void 0, lastPart: null, owed: false });
      this.byBehaviour.set(behaviour, slot);
      return slot;
    }
    slotOf(behaviour) {
      return this.byBehaviour.get(behaviour) ?? null;
    }
    /** Subscribes to the mirror and reads the owner records. Data is applied by `applySnapshot`, after Start. */
    attach() {
      this.core.onState((key) => this.onLeaf(key));
      this.presence.on(() => this.onPeopleChanged());
      this.presence.onExtra(() => this.onPeopleChanged());
      this.referee.on(() => this.onPeopleChanged());
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        this.readOwner(slot);
        slot.ownerView = this.ownerSid(slot);
      }
    }
    /** Applies whatever counts in the mirror to every behaviour. Runs after Start, so stored data wins over it. */
    applySnapshot() {
      for (const slot of this.slots.values()) {
        this.markParts(slot);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
        this.evaluate(slot, true);
      }
    }
    /** True when the mirror held a value for any behaviour when this client started. */
    hasData() {
      for (const slot of this.slots.values()) if (slot.applied !== null) return true;
      return false;
    }
    /** Marks the behaviours as started and calls OnDeserialization once on each that already has data. */
    begin() {
      this.started = true;
      for (const slot of this.slots.values()) {
        for (const member of slot.members) {
          if (!member.owed) continue;
          member.owed = false;
          this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
        }
      }
    }
    /** The slot a leaf key belongs to (`o.<slot>`, `v.<slot>`, `c.<slot>.<i>`), for reporting a refused write. */
    slotForKey(key) {
      const id = key.startsWith("o.") ? key.slice(2) : leafOwnerOf(key);
      return id === null ? null : this.slots.get(id) ?? null;
    }
    // ---- ownership ----------------------------------------------------------------------------------------------
    ownerSid(slot) {
      if (slot.pending) return slot.pending.sid;
      if (slot.mo && this.presence.has(slot.mo.s)) return slot.mo.s;
      return this.referee.current()?.sid ?? null;
    }
    owner(slot) {
      const sid = this.ownerSid(slot);
      return sid === null ? null : this.players.bySid(sid);
    }
    isOwner(slot, sid = this.me) {
      return this.ownerSid(slot) === sid;
    }
    setOwner(slot, sid, uid) {
      if (this.core.disposed) return;
      if (this.referee.epoch === 0) {
        if (!this.warnedIdle) {
          this.warnedIdle = true;
          this.core.log("warn", `${slot.id}: SetOwner ignored, the instance has no referee yet`);
        }
        return;
      }
      const recorded = slot.pending ? slot.pending.sid : slot.mo ? slot.mo.s : null;
      if (recorded === sid) return;
      const g = Math.max(slot.topG, slot.pending ? slot.pending.g : 0) + 1;
      const record = { e: this.referee.epoch, g, s: sid, u: uid };
      if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
      const timer = this.core.scheduler.after(this.core.options.ownerClaimTimeoutMs, () => {
        if (slot.pending && slot.pending.g === g) {
          this.core.log("warn", `ownership claim for ${slot.id} never came back; giving it up`);
          slot.pending = null;
          this.settleLostClaim(slot);
        }
      });
      slot.pending = { g, sid, timer };
      this.stats.claims++;
      this.core.set(`o.${slot.id}`, asciiJson(record));
      this.noteOwner(slot);
    }
    readOwner(slot) {
      const raw = safeParse(this.core.get(`o.${slot.id}`));
      let record = null;
      if (isRecord(raw) && typeof raw.e === "number" && typeof raw.g === "number" && typeof raw.s === "string") {
        record = { e: raw.e, g: raw.g, s: raw.s, u: typeof raw.u === "string" ? raw.u : "" };
        if (record.g > slot.topG) slot.topG = record.g;
      }
      slot.mo = record && record.e === this.referee.epoch ? record : null;
    }
    onOwnerLeaf(slot) {
      this.readOwner(slot);
      const mo = slot.mo;
      if (slot.pending && mo && mo.s === slot.pending.sid && mo.g === slot.pending.g) {
        this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        if (slot.unconfirmed) slot.lastValid = slot.unconfirmed;
        slot.unconfirmed = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** The claim never reached the room: whatever was changed for it is put back. */
    settleLostClaim(slot) {
      this.stats.lostRaces++;
      const touched = slot.unconfirmed !== null || slot.dirty;
      slot.unconfirmed = null;
      slot.dirty = false;
      if (touched) {
        if (slot.lastValid) {
          slot.applied = slot.lastValid.marker;
          this.markParts(slot);
          this.deserialized(slot, this.assign(slot, slot.lastValid.d), true);
        } else slot.applied = null;
      }
      this.noteOwner(slot);
      this.evaluate(slot, false);
    }
    /** Records what each member of a group holds now, so that the next value only reports real changes. */
    markParts(slot) {
      if (!slot.grouped) return;
      for (const member of slot.members) {
        const bag = member.behaviour;
        member.lastPart = canonicalJson(member.fields.map((field) => encodeValue(bag[field])));
      }
    }
    noteOwner(slot) {
      const now = this.ownerSid(slot);
      if (now === slot.ownerView) return;
      const before = slot.ownerView;
      slot.ownerView = now;
      if (now === this.me || before === this.me) this.core.guard("ownership hook", () => this.onLocalOwnership(slot, now === this.me));
      if (!this.started || now === null) return;
      const player = this.players.bySid(now);
      if (!player) return;
      for (const member of slot.members) this.core.guard(`${member.id}.OnOwnershipTransferred`, () => member.behaviour.OnOwnershipTransferred(player));
    }
    onPeopleChanged() {
      if (this.core.disposed) return;
      if (this.referee.epoch !== this.epochSeen) this.adoptEpoch();
      for (const slot of this.slots.values()) this.noteOwner(slot);
      this.takeOver();
    }
    /**
     * A referee of another epoch appeared: a client that started while there was none joins the game in progress,
     * or the game was started afresh. Everything known about owners and values is read again from the mirror, and
     * values found there are reported as a snapshot.
     */
    adoptEpoch() {
      this.epochSeen = this.referee.epoch;
      for (const slot of this.slots.values()) {
        if (slot.pending) this.core.scheduler.cancel(slot.pending.timer);
        slot.pending = null;
        slot.unconfirmed = null;
        slot.lastValid = null;
        slot.applied = null;
        slot.dirty = false;
        this.readOwner(slot);
        slot.snapshotOwed = true;
        this.evaluate(slot, true);
        slot.snapshotOwed = decodeLeaf(slot.id, (key) => this.core.get(key)).kind === "pending";
      }
    }
    /** The referee records itself as owner of whatever an absent player owned. */
    takeOver() {
      if (!this.started || !this.referee.isMe()) return;
      for (const slot of this.slots.values()) {
        if (slot.pending || !slot.mo || this.presence.has(slot.mo.s)) continue;
        this.setOwner(slot, this.me, this.core.me.uid);
      }
    }
    // ---- data ---------------------------------------------------------------------------------------------------
    requestSerialization(slot) {
      if (slot.mode === "none") return;
      if (!this.isOwner(slot)) {
        if (!slot.warnedNotOwner) {
          slot.warnedNotOwner = true;
          this.core.log("warn", `${slot.id}: RequestSerialization by a player who is not the owner is ignored`);
        }
        return;
      }
      slot.dirty = true;
    }
    /** Writes every dirty slot the local player owns. Called once per tick. */
    flush() {
      if (this.core.disposed || !this.started) return;
      const now = this.core.platform.clock.now();
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        if (slot.mode === "continuous" && now - slot.lastContinuousAt >= this.core.options.continuousIntervalMs && this.isOwner(slot)) {
          slot.lastContinuousAt = now;
          if (canonicalJson(this.read(slot)) !== slot.lastSent) slot.dirty = true;
        }
        if (!slot.dirty) continue;
        slot.dirty = false;
        if (this.isOwner(slot)) this.write(slot);
        else this.revert(slot);
      }
    }
    /**
     * The fields were changed by the owner, and ownership went to someone else before the change could be sent.
     * Nobody else will ever see it, so it is taken back.
     */
    revert(slot) {
      if (!slot.lastValid) return;
      slot.applied = slot.lastValid.marker;
      this.markParts(slot);
      const changed = this.assign(slot, slot.lastValid.d);
      this.stats.reverted++;
      this.deserialized(slot, changed, true);
    }
    /** Serialises one slot now (used when an event must follow its state). Returns the marker of what it holds. */
    flushOne(slot) {
      if (slot.dirty && this.started && this.isOwner(slot)) {
        slot.dirty = false;
        this.write(slot);
      }
      return slot.applied;
    }
    write(slot) {
      const named = slot.pending ? slot.pending.sid === this.me : slot.mo !== null && slot.mo.s === this.me;
      if (!named) this.setOwner(slot, this.me, this.core.me.uid);
      if (!slot.pending && !slot.mo) return;
      const g = slot.pending ? slot.pending.g : slot.mo.g;
      for (const member of slot.members) this.core.guard(`${member.id}.OnPreSerialization`, () => member.behaviour.OnPreSerialization());
      const d = this.read(slot);
      const n = ++slot.seenN;
      const encoded = encodeLeaf(slot.id, { e: this.referee.epoch, g, n, w: this.me, d }, this.core.platform.limits.maxLeafBytes, slot.chunks);
      for (const [key, value] of encoded.writes) this.core.set(key, value);
      slot.chunks = encoded.chunks;
      slot.applied = { g, n, w: this.me };
      slot.lastSent = canonicalJson(d);
      if (slot.grouped) for (const member of slot.members) member.lastPart = canonicalJson(d[member.id] ?? null);
      const kept = { d, marker: slot.applied };
      if (slot.pending) slot.unconfirmed = kept;
      else slot.lastValid = kept;
      this.stats.writes++;
      const result = { success: true, byteCount: encoded.bytes };
      for (const member of slot.members) this.core.guard(`${member.id}.OnPostSerialization`, () => member.behaviour.OnPostSerialization(result));
    }
    read(slot) {
      if (!slot.grouped) return readFields(slot.members[0].behaviour, slot.members[0].fields);
      const out = {};
      for (const member of slot.members) {
        const bag = member.behaviour;
        out[member.id] = member.fields.map((field) => encodeValue(bag[field]));
      }
      return out;
    }
    /** Puts data into the behaviours. Returns the members whose part was new to them. */
    assign(slot, d) {
      if (!slot.grouped) {
        const member = slot.members[0];
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, d, member.callbacks));
        return [member];
      }
      const changed = [];
      if (!isRecord(d)) return changed;
      for (const member of slot.members) {
        const part = d[member.id];
        if (!Array.isArray(part)) continue;
        const text = canonicalJson(part);
        if (text === member.lastPart) continue;
        member.lastPart = text;
        const asFields = {};
        member.fields.forEach((field, i) => {
          if (i < part.length) asFields[field] = part[i];
        });
        this.core.guard(`${member.id} field change callback`, () => assignFields(member.behaviour, member.fields, asFields, member.callbacks));
        changed.push(member);
      }
      return changed;
    }
    onLeaf(key) {
      if (this.core.disposed) return;
      if (key.startsWith("o.")) {
        const slot2 = this.slots.get(key.slice(2));
        if (slot2) this.onOwnerLeaf(slot2);
        return;
      }
      const id = leafOwnerOf(key);
      if (id === null) return;
      const slot = this.slots.get(id);
      if (slot) this.evaluate(slot, slot.snapshotOwed);
    }
    /**
     * Looks at the mirrored value of one slot and applies it, ignores it, or repairs it. `asSnapshot`: the value
     * was already stored when this client came to the game, so it is taken whoever wrote it.
     */
    evaluate(slot, asSnapshot) {
      this.consider(slot, asSnapshot);
      if (slot.onApplied && this.started) this.core.guard("held events", slot.onApplied);
    }
    consider(slot, asSnapshot) {
      const decoded = decodeLeaf(slot.id, (key) => this.core.get(key));
      if (decoded.kind === "pending") {
        if (decoded.n > slot.seenN) slot.seenN = decoded.n;
        return;
      }
      if (decoded.kind !== "value") return;
      const x = decoded.record;
      if (x.n > slot.seenN) slot.seenN = x.n;
      slot.chunks = decoded.chunks;
      if (x.e !== this.referee.epoch) return;
      const a = slot.applied;
      if (a && x.n === a.n && x.w === a.w && x.g === a.g) return;
      if (x.w === this.me && a && a.w === this.me && x.n <= a.n) return;
      const mo = slot.mo;
      if (asSnapshot || mo !== null && x.w === mo.s) {
        slot.applied = { g: x.g, n: x.n, w: x.w };
        slot.lastValid = { d: x.d, marker: slot.applied };
        slot.lastSent = null;
        this.stats.applied++;
        this.deserialized(slot, this.assign(slot, x.d), false);
        return;
      }
      this.stats.rejected++;
      if (mo !== null && mo.s === this.me && !slot.pending) {
        this.stats.repairs++;
        slot.dirty = true;
      }
    }
    deserialized(slot, changed, isRollback) {
      if (!this.started) {
        for (const member of changed) member.owed = true;
        return;
      }
      const isSnapshot = slot.snapshotOwed && !isRollback;
      slot.snapshotOwed = false;
      for (const member of changed) {
        this.core.guard(`${member.id}.OnDeserialization`, () => member.behaviour.OnDeserialization({ isSnapshot, isRollback }));
      }
    }
    /** Canonical text of every synced field of every behaviour: equal on two clients that agree. */
    snapshotText() {
      const all = {};
      for (const slot of this.slots.values()) {
        if (slot.mode === "none") continue;
        for (const member of slot.members) if (member.fields.length) all[member.id] = readFields(member.behaviour, member.fields);
      }
      return canonicalJson(all);
    }
  };

  // portkit/src/instance.ts
  var OBJECT_EVENTS = [
    "click",
    "grab",
    "drop",
    "triggerEnter",
    "triggerExit",
    "collisionEnter",
    "collisionExit",
    "uiButton",
    "uiSlider",
    "uiToggle",
    "heldTrigger",
    "heldPrimary",
    "heldSecondary",
    "field"
  ];
  var MAX_EARLY_EVENTS = 256;
  var GameInstance = class {
    constructor(platform, game2, bindings, element, inst, shared = {}) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      __publicField(this, "element");
      __publicField(this, "inst");
      __publicField(this, "core");
      __publicField(this, "scheduler");
      __publicField(this, "presence");
      __publicField(this, "referee");
      __publicField(this, "players");
      __publicField(this, "sync");
      __publicField(this, "events");
      __publicField(this, "commands");
      __publicField(this, "perUser");
      __publicField(this, "secrets");
      __publicField(this, "protectedValues");
      __publicField(this, "host");
      __publicField(this, "clockSync");
      __publicField(this, "storage");
      __publicField(this, "networking");
      __publicField(this, "settings", /* @__PURE__ */ new Map());
      __publicField(this, "objects", /* @__PURE__ */ new Map());
      /** Set when the instance has started its behaviours. */
      __publicField(this, "started", false);
      /** Resolves when behaviours have started (or the instance was disposed first). */
      __publicField(this, "ready", deferred());
      __publicField(this, "rule");
      __publicField(this, "kit", null);
      __publicField(this, "ordinary", []);
      __publicField(this, "byId", /* @__PURE__ */ new Map());
      __publicField(this, "addresses", /* @__PURE__ */ new Map());
      __publicField(this, "templates", []);
      __publicField(this, "playerBehaviourMap", /* @__PURE__ */ new Map());
      __publicField(this, "objectHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "hostWired", /* @__PURE__ */ new Set());
      __publicField(this, "graphHandlers", /* @__PURE__ */ new Map());
      __publicField(this, "pendingLeaves", []);
      __publicField(this, "earlyGraphEvents", []);
      __publicField(this, "buttons", /* @__PURE__ */ new Set());
      __publicField(this, "keys", /* @__PURE__ */ new Set());
      __publicField(this, "sticks", [new Vector2(), new Vector2()]);
      __publicField(this, "triggers", [0, 0]);
      __publicField(this, "abilitiesOff", /* @__PURE__ */ new Set());
      __publicField(this, "blocksOn", /* @__PURE__ */ new Set());
      __publicField(this, "poses", null);
      __publicField(this, "triggerAt", [-Infinity, -Infinity]);
      __publicField(this, "lastClickSide", null);
      __publicField(this, "vr", null);
      __publicField(this, "reachOverride", /* @__PURE__ */ new Map());
      __publicField(this, "position", null);
      __publicField(this, "startKindValue", "idle");
      __publicField(this, "lastClockAsk", -Infinity);
      __publicField(this, "timeView");
      __publicField(this, "randomView");
      __publicField(this, "debugView");
      __publicField(this, "inputView");
      /** The page-wide object every instance of this game shares (GameRuntime.shared). */
      __publicField(this, "shared");
      this.shared = shared;
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
      this.element = element;
      this.inst = inst;
      this.rule = game2.referee ?? "anyone";
      const options = { ...DEFAULT_OPTIONS, ...game2.options ?? {} };
      this.scheduler = new Scheduler(platform.clock, (where, error) => this.core.error(where, error));
      this.core = new Core(platform, game2.slug, inst, options, this.scheduler);
      for (const name of element.attributeNames()) this.settings.set(name, element.getAttribute(name) ?? "");
      this.presence = new Presence(this.core);
      this.referee = new Referee(this.core, this.presence, this.rule);
      this.players = new Players(this.core, this.presence, this.referee);
      this.sync = new Sync(this.core, this.presence, this.referee, this.players);
      this.clockSync = new ClockSync(platform.clock);
      this.host = new RelayHost(platform, game2.slug, inst, bindings.refs);
      this.storage = new Persistence(platform.storage, game2.slug, inst, platform.local().uid);
      this.secrets = new Secrets(this.core, this.presence, this.referee, () => this.clockSync.seconds());
      this.protectedValues = new ProtectedValues(this.core);
      this.events = new NetEvents(this.core, this.sync, {
        behaviour: (id) => this.byId.get(id) ?? null,
        playerBehaviour: (sid, id) => this.playerBehaviourMap.get(sid)?.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true })
      });
      this.commands = new Commands(this.core, this.presence, this.referee, {
        resolve: (id, playerSid) => playerSid ? this.playerBehaviourMap.get(playerSid)?.get(id) ?? null : this.byId.get(id) ?? null,
        address: (behaviour) => this.addresses.get(behaviour) ?? null,
        invoke: (behaviour, name, args, fromSid) => this.events.invoke(behaviour, name, args, fromSid),
        acknowledged: (behaviour, number) => behaviour.OnCommandAcknowledged(number),
        refused: (behaviour, code, name) => this.refuse(behaviour, { kind: "event", code, key: name, final: true })
      });
      this.perUser = new PerUser(this.core, this.storage, {
        restored: (player) => this.each("OnPlayerRestored", (b) => b.OnPlayerRestored(player)),
        dataUpdated: (player, keys) => this.each("OnPlayerDataUpdated", (b) => b.OnPlayerDataUpdated(player, keys)),
        deserialized: (behaviour) => this.core.guard("OnDeserialization", () => behaviour.OnDeserialization({ isSnapshot: false, isRollback: false })),
        refused: (kind, code, key, behaviour) => this.refuse(behaviour, { kind, code, key, final: true })
      });
      this.networking = new Networking(this);
      const scheduler = this.scheduler;
      this.timeView = {
        get time() {
          return scheduler.time;
        },
        get deltaTime() {
          return scheduler.deltaTime;
        },
        get frameCount() {
          return scheduler.ticks;
        }
      };
      this.randomView = {
        get value() {
          return platform.random();
        },
        Range: (min, max) => min + (max - min) * platform.random(),
        RangeInt: (min, max) => Math.floor(min) + Math.floor((Math.floor(max) - Math.floor(min)) * platform.random()),
        Bytes: (n) => platform.crypto.getRandomValues(new Uint8Array(Math.max(0, Math.floor(n))))
      };
      const say = (level) => (message) => this.core.log(level, typeof message === "string" ? message : String(message));
      this.debugView = { Log: say("info"), LogWarning: say("warn"), LogError: say("error") };
      const owner = this;
      this.inputView = {
        GetButton: (button, side) => this.buttons.has(`${side}/${button}`),
        GetThumbstick: (side) => this.sticks[side].clone(),
        GetTrigger: (side) => this.triggers[side],
        GetKey: (key) => this.keys.has(key),
        get Poses() {
          return owner.poses;
        },
        get Position() {
          return owner.position ? owner.position.clone() : null;
        },
        Haptic: (side, strength, seconds) => platform.haptic(side, strength, seconds),
        get LastClickSide() {
          return owner.lastClickSide;
        },
        get IsVR() {
          return owner.vr;
        },
        InReach: (point, metres) => !(metres > 0) || this.nearestDistance(point) <= metres,
        TeleportTo: (position, yDegrees, stopMovement = true) => {
          this.position = position.clone();
          platform.teleport(position, yDegrees, stopMovement);
        },
        SetAbility: (ability, allowed) => {
          if (allowed) this.abilitiesOff.delete(ability);
          else this.abilitiesOff.add(ability);
          platform.setAbility(ability, allowed);
        },
        SetBlock: (control, blocked) => {
          if (blocked) this.blocksOn.add(control);
          else this.blocksOn.delete(control);
          platform.setBlock(control, blocked);
        }
      };
    }
    // ---- starting -----------------------------------------------------------------------------------------------
    /** Runs the start gate: platform, kit, snapshot, clock, keys, an id, a referee; then starts the behaviours. */
    async start() {
      const { platform, core } = this;
      try {
        await platform.whenReady();
        if (core.disposed) return;
        core.me = platform.local();
        core.listen();
        core.own(
          platform.onRelay(relayKey(core.slug, core.inst), {
            clock: (requestId, seconds) => this.host.onClockReply(requestId, seconds),
            event: (name, args) => this.onGraphEvent(name, args)
          })
        );
        core.own(platform.onPose((poses) => this.onPose(poses)));
        void platform.isVR().then((vr) => this.vr = vr, () => this.vr = false);
        core.own(platform.onInput((event) => this.onInput(event)));
        core.own(platform.onStateError(core.prefix + ".", (path, code, final) => this.onRefusedPath(path.slice(core.prefix.length + 1), code, final)));
        await this.loadKit();
        if (core.disposed) return;
        const snapshot = await platform.whenSnapshot(core.options.snapshotTimeoutMs);
        if (core.disposed) return;
        if (!snapshot) core.log("warn", "no full state snapshot arrived in time; starting from what is mirrored");
        await this.askClock(true);
        if (core.disposed) return;
        const saved = storagePrefix(core.slug, core.inst, core.me.uid);
        const publicKey = await this.secrets.init(platform.storage, saved + "ecdh", saved + "draw");
        if (core.disposed) return;
        this.players.on((kind, player) => this.onPlayer(kind, player));
        this.referee.on((now, before) => this.onReferee(now?.sid ?? null, before?.sid ?? null));
        this.presence.start();
        this.presence.announce(publicKey);
        this.referee.start();
        this.players.start();
        this.secrets.listen();
        this.commands.listen();
        this.perUser.listen();
        this.protectedValues.listen();
        this.events.listen();
        this.secrets.onDrawChanged = (sid, label, status) => {
          const player = this.players.bySid(sid);
          if (player && this.started) this.each("OnDrawChanged", (b) => b.OnDrawChanged(player, label, status.state));
        };
        this.protectedValues.onChanged = (key) => {
          if (this.started) this.each("OnProtectedChanged", (b) => b.OnProtectedChanged(key));
        };
        const warn = this.scheduler.after(core.options.admitWarnMs, () => {
          core.log("warn", `still waiting to start: ${this.players.local ? "no referee has been elected" : "the local player's id has not settled"}`);
        });
        await this.players.whenLocalAssigned();
        if (this.rule === "anyone") await this.whenReferee();
        this.scheduler.cancel(warn);
        if (core.disposed) return;
        this.begin();
      } catch (error) {
        core.error("start", error);
      } finally {
        this.ready.resolve(this.started);
      }
    }
    whenReferee() {
      if (this.referee.current()) return Promise.resolve();
      const gate = deferred();
      this.referee.on((now) => {
        if (now) gate.resolve();
      });
      return gate.promise;
    }
    async loadKit() {
      const { core, bindings, element } = this;
      const address = (attr, fallback) => {
        const value = (element.getAttribute(attr) ?? "").trim();
        return /^https?:\/\//i.test(value) ? value : fallback;
      };
      const released = this.platform.bundles(core.slug);
      const windows = address("windows", released?.windows || bindings.bundles.windows);
      const android = address("android", released?.android || bindings.bundles.android);
      const keys = Object.keys(bindings.objects);
      if (windows || android) {
        const spec = {
          holderName: holderName(core.slug, core.inst),
          rootName: (bindings.root ?? bindings.slug) + "(Clone)",
          windows,
          android,
          position: triple(element.getAttribute("position"), false),
          rotation: triple(element.getAttribute("rotation"), false),
          scale: triple(element.getAttribute("scale"), true),
          objects: keys.map((key) => {
            const o = bindings.objects[key];
            const synced = o.sync === "transform" || o.seat;
            return { key, path: o.path, networkId: synced ? networkId(core.slug, core.inst, key) : "", sync: o.sync, grab: o.grab, click: o.click, seat: o.seat };
          })
        };
        try {
          this.kit = await this.platform.loadKit(spec);
          if (this.kit.missing.length) core.log("error", `kit objects not found: ${this.kit.missing.join(", ")}`);
        } catch (error) {
          core.error("the kit did not load", error);
        }
      } else if (keys.length) core.log("warn", "no bundle address for this kit (bindings.bundles is empty and the element names none): running without objects");
      if (core.disposed) {
        this.kit?.destroy();
        this.kit = null;
        return;
      }
      for (const key of keys) {
        const path = bindings.objects[key].path;
        const subscribe2 = (kind, handler) => this.addObjectHandler(key, kind, handler);
        this.objects.set(key, new GameObject(key, path.slice(path.lastIndexOf("/") + 1), this.kit?.objects.get(key) ?? null, this.host, subscribe2));
      }
      this.host.fallbackActive = (key, active) => {
        const object = this.kit?.objects.get(key);
        if (!object) return false;
        object.setActive(active);
        return true;
      };
      let hidden = 0;
      for (const key of keys) {
        if (bindings.objects[key].active !== false) continue;
        this.objects.get(key).SetActive(false);
        hidden++;
      }
      if (hidden) this.host.flush();
      this.host.fallbackClip = (key, index) => {
        const object = this.kit?.objects.get(key);
        if (!object) return false;
        object.playClip(index);
        return true;
      };
      if (!this.kit) return;
      const reads = keys.map((key) => this.objects.get(key).transform.Refresh().catch(() => void 0));
      const waited = deferred();
      const limit = this.scheduler.after(3e3, () => waited.resolve());
      await Promise.race([Promise.all(reads), waited.promise]);
      this.scheduler.cancel(limit);
      for (const key of keys) {
        const o = bindings.objects[key];
        const hostObject = this.kit.objects.get(key);
        if (!hostObject || !(o.grab || o.sync === "transform")) continue;
        const transform = this.objects.get(key).transform;
        core.own(hostObject.watchTransform((pose2) => transform._report(pose2.position, pose2.rotation)));
      }
    }
    async askClock(first) {
      const sentAt = this.platform.clock.now();
      this.lastClockAsk = sentAt;
      const answer = this.host.requestClock().then((seconds) => {
        if (!this.core.disposed) this.clockSync.accept(seconds, sentAt);
        return true;
      });
      if (!first) return;
      const gate = deferred();
      const timer = this.scheduler.after(this.core.options.clockTimeoutMs, () => gate.resolve(false));
      const ok = await Promise.race([answer, gate.promise]);
      this.scheduler.cancel(timer);
      if (!ok) this.core.log("warn", "the synced clock did not answer; using this device's clock until it does");
    }
    begin() {
      const { core } = this;
      this.createBehaviours();
      this.wireEvents();
      this.sync.onLocalOwnership = (slot, mine) => {
        if (!mine) return;
        for (const member of slot.members) {
          const key = this.addresses.get(member.behaviour) ? member.behaviour.gameObject.key : "";
          if (key && this.bindings.objects[key]?.sync === "transform") member.behaviour.gameObject.TakeOwnership();
        }
      };
      this.sync.attach();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.Start`, () => behaviour.Start());
      this.sync.applySnapshot();
      this.startKindValue = this.computeStartKind();
      this.sync.begin();
      this.commands.started = true;
      this.perUser.started = true;
      this.started = true;
      this.perUser.dataEnabled = this.perUser.dataEnabled || this.anyOverrides("OnPlayerRestored") || this.anyOverrides("OnPlayerDataUpdated");
      this.perUser.restoreLocal();
      for (const behaviour of this.ordinary) core.guard(`${this.idOf(behaviour)}.OnInstanceStart`, () => behaviour.OnInstanceStart(this.startKindValue));
      for (const player of this.players.list()) this.deliverJoin(player);
      this.sync.takeOver();
      this.secrets.review();
      this.commands.review();
      for (const early of this.earlyGraphEvents.splice(0)) this.onGraphEvent(early.name, early.args);
      this.scheduler.start(() => this.tick());
      this.tick();
      let extra = {};
      if (this.game.debug) core.guard("debug hooks", () => extra = this.game.debug(this));
      this.platform.expose(relayKey(core.slug, core.inst), {
        ...extra,
        digest: () => this.digest(),
        state: () => JSON.parse(this.sync.snapshotText()),
        referee: () => this.referee.current(),
        players: () => this.players.list().map((p) => ({ id: p.playerId, name: p.displayName, sid: p.sid }))
      });
      core.log("info", `started (${this.startKindValue}) as ${this.players.local}, ${this.ordinary.length} behaviours`);
    }
    computeStartKind() {
      const ref = this.referee.current();
      if (!ref) return "idle";
      const claim = this.referee.lastClaim;
      if (ref.sid !== this.core.me.sid || !claim || claim.term !== ref.term) return "joined";
      if (claim.fresh) return "fresh";
      return claim.alive ? "joined" : "resumed";
    }
    // ---- behaviours ---------------------------------------------------------------------------------------------
    createBehaviours() {
      const { core, bindings } = this;
      const made = [];
      for (const binding of bindings.behaviours) {
        const cls = this.game.behaviours[binding.type];
        if (!cls) {
          core.log("error", `bindings name behaviour type '${binding.type}' (${binding.id}), which the game does not define`);
          continue;
        }
        if (binding.perPlayer === true || cls.perPlayer === true) {
          this.templates.push({ binding, cls });
          continue;
        }
        const behaviour = new cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, binding, null));
        this.addresses.set(behaviour, { id: binding.id, type: binding.type, playerSid: null });
        this.byId.set(binding.id, behaviour);
        this.ordinary.push(behaviour);
        made.push({ behaviour, binding, cls });
      }
      this.perUser.declareTypes(this.templates.map((t) => t.binding.id));
      for (const { behaviour, binding, cls } of made) {
        this.assignBindingFields(behaviour, binding, null);
        const fields = cls.synced ?? [];
        for (const field of fields) if (!(field in behaviour)) core.log("warn", `${binding.id}: synced field '${field}' is not a field of ${binding.type}`);
        this.sync.add(behaviour, binding.id, fields, fields.length ? cls.syncMode ?? "manual" : "none", cls.fieldChangeCallbacks, binding.group);
      }
    }
    makePlayerBehaviours(player) {
      if (!this.templates.length || this.playerBehaviourMap.has(player.sid)) return;
      const mine = /* @__PURE__ */ new Map();
      this.playerBehaviourMap.set(player.sid, mine);
      const made = [];
      for (const template of this.templates) {
        const behaviour = new template.cls();
        linkBehaviour(behaviour, this.makeLink(behaviour, template.binding, player));
        this.addresses.set(behaviour, { id: template.binding.id, type: template.binding.type, playerSid: player.sid });
        mine.set(template.binding.id, behaviour);
        made.push({ behaviour, template });
      }
      for (const { behaviour, template } of made) this.assignBindingFields(behaviour, template.binding, mine);
      for (const { behaviour, template } of made) {
        const id = template.binding.id;
        this.core.guard(`${id}.Start`, () => behaviour.Start());
        const hasData = this.perUser.adopt(player, id, behaviour, template.cls.synced ?? [], template.cls.persistent === true, template.cls.fieldChangeCallbacks);
        if (hasData) this.core.guard(`${id}.OnDeserialization`, () => behaviour.OnDeserialization({ isSnapshot: true, isRollback: false }));
      }
    }
    makeLink(behaviour, binding, player) {
      const gameObject = (binding.object ? this.objects.get(binding.object) : void 0) ?? new GameObject("", binding.id, null, null);
      const instance = this;
      return {
        id: binding.id,
        gameObject,
        networking: this.networking,
        time: this.timeView,
        random: this.randomView,
        debug: this.debugView,
        secrets: this.secrets,
        storage: this.storage,
        host: this.host,
        settings: this.settings,
        playerData: this.perUser,
        input: this.inputView,
        protectedValues: this.protectedValues,
        player,
        instanceKey: this.inst,
        shared: this.shared,
        reach: this.reachOverride,
        requestSerialization() {
          if (player) {
            if (player.isLocal) instance.perUser.requestSerialization(behaviour);
            return;
          }
          const slot = instance.sync.slotOf(behaviour);
          if (slot) instance.sync.requestSerialization(slot);
        },
        sendNetworkEvent(target, name, args) {
          instance.events.send(behaviour, target, name, args);
        },
        sendCommand(name, args) {
          return instance.commands.send(behaviour, name, args);
        },
        delaySeconds(name, seconds) {
          instance.scheduler.after(seconds * 1e3, () => instance.callByName(behaviour, name));
        },
        delayFrames(name, frames) {
          instance.scheduler.afterTicks(frames, () => instance.callByName(behaviour, name));
        },
        find: (id) => {
          const sibling = player ? this.playerBehaviourMap.get(player.sid)?.get(id) : void 0;
          return sibling ?? this.byId.get(id) ?? null;
        },
        findByType: (type) => this.ordinary.filter((b) => this.addresses.get(b)?.type === type),
        playerBehaviour: (who, type) => this.playerBehaviourOf(who, type),
        playerBehaviours: (type) => this.players.list().map((p) => this.playerBehaviourOf(p, type)).filter((b) => b !== null),
        raycast: (origin, direction, maxDistance, layerMask) => this.platform.raycast(origin, direction, maxDistance, layerMask),
        onGraphEvent: (name, method) => this.addGraphHandler(name, behaviour, method)
      };
    }
    playerBehaviourOf(player, type) {
      const mine = this.playerBehaviourMap.get(player.sid);
      if (!mine) return null;
      for (const behaviour of mine.values()) if (this.addresses.get(behaviour)?.type === type) return behaviour;
      return mine.get(type) ?? null;
    }
    callByName(behaviour, name) {
      if (this.core.disposed) return;
      const fn = behaviour[name];
      if (typeof fn === "function") this.core.guard(name, () => fn.call(behaviour));
      else this.core.log("warn", `${this.idOf(behaviour)} has no method '${name}' for a delayed event`);
    }
    assignBindingFields(behaviour, binding, siblings) {
      if (!binding.fields) return;
      const bag = behaviour;
      for (const name of Object.keys(binding.fields)) bag[name] = this.resolveField(binding.fields[name], siblings, `${binding.id}.${name}`, binding.object ?? null);
    }
    /** Turns a bindings field value into what the behaviour holds: objects, behaviours, component proxies, values. */
    resolveField(value, siblings, where, ownObject) {
      if (Array.isArray(value)) return value.map((v, i) => this.resolveField(v, siblings, `${where}[${i}]`, ownObject));
      if (!isRecord(value)) return value;
      if (typeof value.$obj === "string") return this.objects.get(value.$obj) ?? null;
      if (typeof value.$beh === "string") {
        const found = siblings?.get(value.$beh) ?? this.byId.get(value.$beh) ?? null;
        if (!found) this.core.log("warn", `${where}: behaviour '${value.$beh}' is per-player or missing, so the field is null`);
        return found;
      }
      if (typeof value.$comp === "string") {
        const object = this.objects.get(value.$comp);
        return object ? makeComponent(String(value.kind ?? "Transform"), object, this.host) : null;
      }
      if (typeof value.$clip === "number") return new AudioClipRef(value.$clip, typeof value.on === "string" ? value.on : null);
      if (Object.keys(value).some((key) => key.startsWith("$"))) return decodeValue(value);
      const out = {};
      for (const key of Object.keys(value)) out[key] = this.resolveField(value[key], siblings, `${where}.${key}`, ownObject);
      return out;
    }
    idOf(behaviour) {
      return this.addresses.get(behaviour)?.id ?? "?";
    }
    all() {
      const out = this.ordinary.slice();
      for (const mine of this.playerBehaviourMap.values()) for (const behaviour of mine.values()) out.push(behaviour);
      return out;
    }
    overrides(behaviour, method) {
      return behaviour[method] !== Behaviour.prototype[method];
    }
    anyOverrides(method) {
      if (this.ordinary.some((b) => this.overrides(b, method))) return true;
      return this.templates.some((t) => t.cls.prototype[method] !== Behaviour.prototype[method]);
    }
    /** Calls a callback on every behaviour that overrides it. */
    each(method, call) {
      if (!this.started || this.core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, method)) this.core.guard(`${this.idOf(behaviour)}.${String(method)}`, () => call(behaviour));
      }
    }
    // ---- players and referee ------------------------------------------------------------------------------------
    onPlayer(kind, player) {
      if (!this.started || this.core.disposed) return;
      if (kind === "join") {
        this.deliverJoin(player);
        return;
      }
      if (!this.referee.current()) {
        this.pendingLeaves.push(player);
        if (this.rule === "anyone") this.scheduler.after(5e3, () => this.flushLeaves());
        return;
      }
      this.deliverLeave(player);
    }
    flushLeaves() {
      for (const player of this.pendingLeaves.splice(0)) this.deliverLeave(player);
    }
    deliverJoin(player) {
      this.makePlayerBehaviours(player);
      this.each("OnPlayerJoined", (b) => b.OnPlayerJoined(player));
      this.perUser.playerDelivered(player);
    }
    deliverLeave(player) {
      this.each("OnPlayerLeft", (b) => b.OnPlayerLeft(player));
      const gone = this.perUser.playerGone(player.sid);
      const mine = this.playerBehaviourMap.get(player.sid);
      this.playerBehaviourMap.delete(player.sid);
      for (const behaviour of mine ? mine.values() : gone) {
        this.core.guard("OnDestroy", () => behaviour.OnDestroy());
        this.addresses.delete(behaviour);
      }
    }
    onReferee(now, before) {
      if (!this.started || this.core.disposed) return;
      if (now !== before) {
        const wasIdle = this.startKindValue === "idle";
        if (wasIdle && now !== null) {
          this.startKindValue = this.computeStartKind();
          this.each("OnInstanceStart", (b) => b.OnInstanceStart(this.startKindValue));
        }
        const player = now === null ? null : this.players.bySid(now);
        if (player || now === null && this.referee.candidates().length === 0) this.each("OnMasterTransferred", (b) => b.OnMasterTransferred(player));
      }
      if (now !== null) this.flushLeaves();
    }
    // NetHost
    localPlayer() {
      const local = this.players.local;
      if (!local) throw new Error("the local player is not known before the instance has started");
      return local;
    }
    isReferee() {
      return this.referee.isMe();
    }
    owner(target) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return this.players.bySid(address.playerSid);
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.owner(slot) : null;
    }
    isOwner(target, player) {
      const address = this.addresses.get(target);
      if (address?.playerSid) return address.playerSid === player.sid;
      const slot = this.sync.slotOf(target);
      return slot ? this.sync.isOwner(slot, player.sid) : false;
    }
    setOwner(target, player) {
      if (this.addresses.get(target)?.playerSid) {
        this.core.log("warn", `${this.idOf(target)} is a per-player behaviour: its owner cannot change`);
        return;
      }
      const slot = this.sync.slotOf(target);
      if (slot) this.sync.setOwner(slot, player.sid, player.uid);
    }
    behavioursOn(object) {
      return this.ordinary.filter((b) => b.gameObject === object);
    }
    serverSeconds() {
      return this.clockSync.seconds();
    }
    playerList() {
      return this.players.list();
    }
    playerById(id) {
      return this.players.byId(id);
    }
    callingPlayer() {
      return this.events.callingSid === null ? null : this.players.bySid(this.events.callingSid);
    }
    callingSession() {
      const sid = this.events.callingSid;
      if (sid === null) return null;
      const who = this.platform.players().find((p) => p.sid === sid);
      return { sid, uid: who ? who.uid : "" };
    }
    setCandidate(on) {
      if (this.rule !== "declared") {
        this.core.log("warn", 'SetRefereeCandidate only matters in a game whose definition says referee: "declared"');
        return;
      }
      this.referee.setCandidate(on);
    }
    isCandidate(player) {
      return this.referee.isCandidate(player.sid);
    }
    startKind() {
      return this.startKindValue;
    }
    refereePlayer() {
      const ref = this.referee.current();
      return ref ? this.players.bySid(ref.sid) : null;
    }
    // ---- events from objects, graphs and input ------------------------------------------------------------------
    wireEvents() {
      const explicit = /* @__PURE__ */ new Set();
      const mine = (id) => () => this.playerBehaviourMap.get(this.core.me.sid)?.get(id) ?? null;
      for (const event of this.bindings.events) {
        if (!event.behaviour || !event.method) continue;
        const ordinary = this.byId.get(event.behaviour);
        const perPlayer = !ordinary && this.templates.some((t) => t.binding.id === event.behaviour);
        if (!ordinary && !perPlayer) continue;
        const target = ordinary ?? mine(event.behaviour);
        if (event.kind === "graph") {
          this.addGraphHandler(event.name ?? "", target, event.method);
          continue;
        }
        explicit.add(`${event.object}/${event.kind}/${event.behaviour}`);
        this.addObjectHandler(event.object, event.kind, (detail) => {
          const behaviour = typeof target === "function" ? target() : target;
          if (behaviour) this.callBound(behaviour, event, detail);
        });
      }
      for (const template of this.templates) {
        const key = template.binding.object;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!key || !object) continue;
        const id = template.binding.id;
        const proto = template.cls.prototype;
        const base = Behaviour.prototype;
        if (object.click && proto.Interact !== base.Interact && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            const behaviour = mine(id)();
            if (behaviour && this.withinReach(behaviour, void 0, template.cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && proto.OnPickup !== base.OnPickup && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => mine(id)()?.OnPickup());
        }
        if (object.grab && proto.OnDrop !== base.OnDrop && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => mine(id)()?.OnDrop());
        }
      }
      for (const behaviour of this.ordinary) {
        const key = behaviour.gameObject.key;
        const object = key ? this.bindings.objects[key] : void 0;
        if (!object) continue;
        const id = this.idOf(behaviour);
        const cls = behaviour.constructor;
        if (object.click && this.overrides(behaviour, "Interact") && !explicit.has(`${key}/click/${id}`)) {
          this.addObjectHandler(key, "click", (detail) => {
            if (this.withinReach(behaviour, void 0, cls.interactReach ?? 0, detail)) this.core.guard(`${id}.Interact`, () => behaviour.Interact());
          });
        }
        if (object.grab && this.overrides(behaviour, "OnPickup") && !explicit.has(`${key}/grab/${id}`)) {
          this.addObjectHandler(key, "grab", () => this.core.guard(`${id}.OnPickup`, () => behaviour.OnPickup()));
        }
        if (object.grab && this.overrides(behaviour, "OnDrop") && !explicit.has(`${key}/drop/${id}`)) {
          this.addObjectHandler(key, "drop", () => this.core.guard(`${id}.OnDrop`, () => behaviour.OnDrop()));
        }
      }
    }
    callBound(behaviour, event, detail) {
      const cls = behaviour.constructor;
      if (event.kind === "click" && !this.withinReach(behaviour, event.reach, cls.interactReach ?? 0, detail)) return;
      const fn = behaviour[event.method];
      if (typeof fn !== "function") {
        this.core.log("warn", `${event.behaviour} has no method '${event.method}' (bound to ${event.kind} of ${event.object})`);
        return;
      }
      let argument = detail;
      if (event.kind === "uiSlider") argument = Number(detail.arg ?? "0");
      else if (event.kind === "uiToggle") argument = detail.arg === "1" || detail.arg === "true" || detail.arg === "True";
      else if (event.kind === "field") argument = detail.arg ?? "";
      this.core.guard(`${event.behaviour}.${event.method}`, () => fn.call(behaviour, argument));
    }
    /**
     * True when a click is close enough to count: measured from the nearest of the local head and hands. The reach is
     * the behaviour's own (InteractReach), else the binding's, else the class's, else the game's. With no pose
     * reported yet, every click counts.
     */
    withinReach(behaviour, eventReach, classReach, detail) {
      const own = this.reachOverride.get(behaviour);
      const reach = own !== void 0 ? own : eventReach !== void 0 ? eventReach : classReach > 0 ? classReach : this.game.interactReach ?? 0;
      if (!(reach > 0)) return true;
      const transform = behaviour.gameObject.transform;
      const point = detail.point ?? (transform.known ? transform.position : null);
      if (!point) return true;
      return this.nearestDistance(point) <= reach;
    }
    /** Metres from `point` to the nearest of the local head and hands; 0 when no pose or position is known. */
    nearestDistance(point) {
      const poses = this.poses;
      const from = poses ? [poses.head.position, poses.leftHand.position, poses.rightHand.position] : this.position ? [this.position] : [];
      if (!from.length) return 0;
      let nearest = Infinity;
      for (const p of from) nearest = Math.min(nearest, Vector3.Distance(p, point));
      return nearest;
    }
    /** The hand that clicked: the one whose trigger went down in the last second, else the one nearest the point. */
    clickSide(point) {
      const now = this.platform.clock.now();
      const [left, right] = this.triggerAt;
      const recent = Math.max(left, right);
      if (now - recent <= 1e3) return right >= left ? 1 : 0;
      if (!this.poses || !point) return null;
      return Vector3.Distance(this.poses.rightHand.position, point) <= Vector3.Distance(this.poses.leftHand.position, point) ? 1 : 0;
    }
    addObjectHandler(objKey, kind, handler) {
      let kinds = this.objectHandlers.get(objKey);
      if (!kinds) this.objectHandlers.set(objKey, kinds = /* @__PURE__ */ new Map());
      let list = kinds.get(kind);
      if (!list) kinds.set(kind, list = []);
      list.push(handler);
      const wire = `${objKey}/${kind}`;
      const hostObject = this.kit?.objects.get(objKey);
      if (hostObject && !this.hostWired.has(wire)) {
        this.hostWired.add(wire);
        this.core.own(hostObject.on(kind, (detail) => this.dispatchObject(objKey, kind, detail)));
      }
    }
    /** Delivers an object's event to what is bound to it. Also the entry point for events a graph raised. */
    dispatchObject(objKey, kind, detail) {
      if (!this.started || this.core.disposed) return;
      if (kind === "click") {
        if (detail.side === void 0) {
          const side = this.clickSide(detail.point);
          if (side !== null) detail.side = side;
        }
        this.lastClickSide = detail.side === 0 || detail.side === 1 ? detail.side : null;
      }
      const handlers = this.objectHandlers.get(objKey)?.get(kind);
      if (!handlers || !handlers.length) return;
      const run = () => {
        if (this.core.disposed) return;
        for (const handler of handlers.slice()) this.core.guard(`${objKey} ${kind}`, () => handler(detail));
      };
      const object = this.objects.get(objKey);
      if (kind === "drop" && object && object.host) {
        object.transform.Refresh().then(run, run);
        return;
      }
      run();
    }
    addGraphHandler(name, behaviour, method) {
      if (!name) return;
      let list = this.graphHandlers.get(name);
      if (!list) this.graphHandlers.set(name, list = []);
      list.push({ behaviour, method });
    }
    onGraphEvent(name, args) {
      if (this.core.disposed) return;
      if (!this.started) {
        if (this.earlyGraphEvents.length < MAX_EARLY_EVENTS) this.earlyGraphEvents.push({ name, args });
        return;
      }
      if (OBJECT_EVENTS.indexOf(name) >= 0) {
        const key = this.keyOfTarget(args[0] ?? "");
        if (!key) return;
        const detail = { arg: args[1], args: args.slice(1) };
        if (name.startsWith("collision") || name.startsWith("trigger")) {
          const n = args.slice(2, 8).map(Number);
          if (args[1] !== void 0) detail.otherName = args[1];
          if (n.length >= 3 && n.slice(0, 3).every(Number.isFinite)) detail.point = new Vector3(n[0], n[1], n[2]);
          if (n.length >= 6 && n.slice(3, 6).every(Number.isFinite)) detail.normal = new Vector3(n[3], n[4], n[5]);
        }
        if (name.startsWith("held") && args[1] === "left") detail.side = 0;
        else if (name.startsWith("held") && args[1] === "right") detail.side = 1;
        this.dispatchObject(key, name, detail);
        return;
      }
      const handlers = this.graphHandlers.get(name);
      if (!handlers) return;
      for (const handler of handlers.slice()) {
        const behaviour = typeof handler.behaviour === "function" ? handler.behaviour() : handler.behaviour;
        const method = handler.method;
        if (!behaviour) continue;
        const fn = behaviour[method];
        if (typeof fn === "function") this.core.guard(`${this.idOf(behaviour)}.${method}`, () => fn.apply(behaviour, args));
      }
    }
    /** A relay target ("3", "@Board/Cup") or a binding key, as a binding key. */
    keyOfTarget(target) {
      if (target.startsWith("@")) {
        const path = target.slice(1);
        for (const key of Object.keys(this.bindings.objects)) if (this.bindings.objects[key].path === path) return key;
        return null;
      }
      if (/^\d+$/.test(target)) return this.bindings.refs[Number(target)] ?? null;
      return target in this.bindings.objects ? target : null;
    }
    onPose(poses) {
      this.poses = poses;
      this.position = poses.head.position;
    }
    onInput(event) {
      if (this.core.disposed) return;
      if (event.type === "button") {
        const id = `${event.side}/${event.button}`;
        if (event.pressed && event.button === 0) this.triggerAt[event.side] = this.platform.clock.now();
        if (event.pressed) this.buttons.add(id);
        else this.buttons.delete(id);
        const { button, side } = event;
        if (event.pressed) this.each("OnButtonPressed", (b) => b.OnButtonPressed(button, side));
        else this.each("OnButtonReleased", (b) => b.OnButtonReleased(button, side));
      } else if (event.type === "thumbstick") {
        this.sticks[event.side] = new Vector2(event.x, event.y);
      } else if (event.type === "trigger") {
        this.triggers[event.side] = event.value;
      } else {
        const key = event.key;
        if (event.pressed) this.keys.add(key);
        else this.keys.delete(key);
        if (event.pressed) this.each("OnKeyPressed", (b) => b.OnKeyPressed(key));
        else this.each("OnKeyReleased", (b) => b.OnKeyReleased(key));
      }
    }
    // ---- the tick -----------------------------------------------------------------------------------------------
    tick() {
      const { core } = this;
      if (core.disposed) return;
      for (const behaviour of this.all()) {
        if (this.overrides(behaviour, "Update")) core.guard(`${this.idOf(behaviour)}.Update`, () => behaviour.Update());
      }
      this.sync.flush();
      this.perUser.flush();
      this.presence.flush();
      this.host.flush();
      if (this.scheduler.ticks % 20 === 0) {
        this.presence.tend();
        this.players.tend();
        this.secrets.review();
        this.commands.review();
        this.sync.takeOver();
        if (this.platform.clock.now() - this.lastClockAsk >= core.options.clockResyncMs) void this.askClock(false);
      }
    }
    // ---- refused writes -----------------------------------------------------------------------------------------
    onRefusedPath(key, code, final) {
      if (this.core.disposed) return;
      this.core.log(final ? "error" : "warn", `the room ${final ? "refused" : "is holding back"} a write to ${key}: ${code}`);
      if (key === "d" || /^p[0-3]$/.test(key)) {
        this.refuse(null, { kind: key === "d" ? "playerData" : "playerObject", code, key, final });
        return;
      }
      if (key.startsWith("x.")) {
        this.refuse(null, { kind: "protected", code, key: key.slice(2), final });
        return;
      }
      const slot = this.sync.slotForKey(key);
      if (!slot) {
        this.refuse(null, { kind: "state", code, key, final });
        return;
      }
      for (const member of slot.members) {
        if (final && !key.startsWith("o.")) this.core.guard("OnPostSerialization", () => member.behaviour.OnPostSerialization({ success: false, byteCount: 0 }));
        this.core.guard("OnWriteRefused", () => member.behaviour.OnWriteRefused({ kind: "state", code, key, final }));
      }
    }
    /** Reports a refusal to the behaviour it belongs to, or to every behaviour that listens and to the game. */
    refuse(behaviour, refusal) {
      if (behaviour) {
        this.core.guard("OnWriteRefused", () => behaviour.OnWriteRefused(refusal));
        return;
      }
      this.each("OnWriteRefused", (b) => b.OnWriteRefused(refusal));
      if (this.game.onWriteRefused) this.core.guard("onWriteRefused", () => this.game.onWriteRefused(refusal));
    }
    // ---- inspection and teardown --------------------------------------------------------------------------------
    /** An ordinary behaviour by its bindings id (for tests and for the page registry). */
    behaviour(id) {
      const found = this.byId.get(id);
      if (!found) throw new Error(`no behaviour '${id}' in ${this.core.slug}:${this.inst}`);
      return found;
    }
    /** A per-player behaviour: the copy of `id` that belongs to the player with session `sid`. */
    playerBehaviour(sid, id) {
      return this.playerBehaviourMap.get(sid)?.get(id) ?? null;
    }
    /** A short hash of every synced field: equal on clients that agree. */
    digest() {
      return fnv1a(this.sync.snapshotText());
    }
    dispose() {
      const { core } = this;
      if (core.disposed) return;
      if (this.started) for (const behaviour of this.all()) core.guard("OnDestroy", () => behaviour.OnDestroy());
      for (const ability of this.abilitiesOff) this.platform.setAbility(ability, true);
      for (const control of this.blocksOn) this.platform.setBlock(control, false);
      this.presence.retire();
      this.perUser.retire();
      this.host.abandonClock();
      this.platform.expose(relayKey(core.slug, core.inst), null);
      core.dispose();
      this.kit?.destroy();
      this.kit = null;
      this.ready.resolve(false);
    }
  };
  function triple(text, uniform) {
    if (!text) return null;
    const parts = text.trim().split(/\s+/).map(Number);
    if (parts.some((n) => !Number.isFinite(n))) return null;
    if (parts.length === 3) return new Vector3(parts[0], parts[1], parts[2]);
    if (uniform && parts.length === 1) return new Vector3(parts[0], parts[0], parts[0]);
    return null;
  }

  // portkit/src/boot.ts
  var RUNTIME_VERSION = "0.1.0";
  var GameRuntime = class {
    constructor(platform, game2, bindings) {
      __publicField(this, "platform");
      __publicField(this, "game");
      __publicField(this, "bindings");
      /** Running instances by instance key. */
      __publicField(this, "instances", /* @__PURE__ */ new Map());
      /** One object for every instance of this game on the page (Behaviour.Shared): page memory, not synced or saved. */
      __publicField(this, "shared", {});
      __publicField(this, "stopped", false);
      __publicField(this, "unsubs", []);
      this.platform = platform;
      this.game = game2;
      this.bindings = bindings;
    }
    /** Waits for the page, then serves every element of this game, now and later. */
    async start() {
      await this.platform.whenReady();
      if (this.stopped) return;
      this.unsubs.push(this.platform.onSnippetsChanged(() => this.scan()));
      this.unsubs.push(
        this.platform.onSessionChanged(() => {
          this.platform.log("warn", `[${this.game.slug}] the session changed; restarting every instance`);
          for (const instance of this.instances.values()) instance.dispose();
          this.instances.clear();
          this.scan();
        })
      );
      this.scan();
    }
    /** Brings the running instances in line with the elements on the page. */
    scan() {
      if (this.stopped) return;
      const wanted = /* @__PURE__ */ new Map();
      for (const element of this.platform.snippets(this.game.slug)) {
        if (!element.connected || !element.active) continue;
        const key = instanceKeyFor({ room: element.getAttribute("room"), instance: element.getAttribute("instance") }, element.index);
        if (wanted.has(key)) {
          this.platform.log("warn", `[${this.game.slug}] two elements resolve to instance '${key}' (same room or instance attribute); the second is ignored`);
          continue;
        }
        wanted.set(key, element);
      }
      for (const [key, instance] of [...this.instances]) {
        if (wanted.get(key) === instance.element) continue;
        instance.dispose();
        this.instances.delete(key);
      }
      for (const [key, element] of wanted) {
        if (this.instances.has(key)) continue;
        const instance = new GameInstance(this.platform, this.game, this.bindings, element, key, this.shared);
        this.instances.set(key, instance);
        void instance.start();
      }
    }
    instance(key) {
      return this.instances.get(key);
    }
    stop() {
      this.stopped = true;
      for (const unsub of this.unsubs.splice(0)) unsub();
      for (const instance of this.instances.values()) instance.dispose();
      this.instances.clear();
    }
  };
  function boot(platform, game2, rawBindings) {
    if (!isValidSlug(game2.slug)) throw new Error(`'${game2.slug}' is not a valid slug`);
    const bindings = validateBindings(rawBindings);
    if (bindings.slug !== game2.slug) throw new Error(`bindings.json is for '${bindings.slug}', the game is '${game2.slug}'`);
    if (!platform.claimGame(game2.slug, { runtime: RUNTIME_VERSION, bindings: bindings.hash ?? "" })) return null;
    const runtime = new GameRuntime(platform, game2, bindings);
    runtime.start().catch((error) => platform.log("error", `[${game2.slug}] could not start: ${error instanceof Error ? error.message : String(error)}`));
    return runtime;
  }

  // portkit/src/types.ts
  var DEFAULT_LIMITS = {
    maxLeafBytes: 16384,
    maxRoomKeys: 2048,
    oneShotMaxBytes: 4089,
    maxUserKeys: 64
  };
  var Button = { Trigger: 0, Grip: 1, Primary: 2, Secondary: 3, ThumbstickClick: 4 };

  // src/catalogue.json
  var catalogue_default = {
    _doc: "Generated by altspace/tools/bricks/extract_catalogue.py from BrickData.cs, the held and placed prefabs in Assets/Resources and bricks.json. Poses are in the brick root's space in upstream world units (1 unit = 1/7 mesh metre). The index in `bricks` is the type number on the wire: append only, never reorder.",
    bricks: [
      {
        prefab: "1x1",
        display: "1x1 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:11",
        model: {
          folder: "Bricks/Brick_1x1",
          name: "Brick_1x1",
          shape: "box",
          size: [
            1,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x1/Brick_1x1_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x1/Brick_1x1_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x1/Brick_1x1_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_1x1/Brick_1x1_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_1x1/Brick_1x1_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_1x1/Brick_1x1_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            29e-7,
            0
          ],
          size: [
            0.053169,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              533e-7,
              0,
              0
            ],
            size: [
              0.053169,
              0.0626184,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2",
        display: "1x2 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:12",
        model: {
          folder: "Bricks/Brick_1x2",
          name: "Brick_1x2",
          shape: "box",
          size: [
            2,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x2/Brick_1x2_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x2/Brick_1x2_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x2/Brick_1x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_1x2/Brick_1x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_1x2/Brick_1x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_1x2/Brick_1x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -5459e-7,
              4942e-7,
              0
            ],
            size: [
              0.1077949,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -5459e-7,
            4942e-7,
            0
          ],
          size: [
            0.1077949,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              207e-7,
              -1178e-7,
              0
            ],
            size: [
              0.1094751,
              0.0645752,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x3",
        display: "1x3 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:13",
        model: {
          folder: "Bricks/Brick_1x3",
          name: "Brick_1x3",
          shape: "box",
          size: [
            3,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x3/Brick_1x3_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x3/Brick_1x3_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x3/Brick_1x3_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_1x3/Brick_1x3_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_1x3/Brick_1x3_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_1x3/Brick_1x3_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "1",
            p: [
              -0.0560751,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0560751,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -6149e-7,
              29e-7,
              0
            ],
            size: [
              0.1648138,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -6149e-7,
            29e-7,
            0
          ],
          size: [
            0.1648138,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -6149e-7,
              29e-7,
              0
            ],
            size: [
              0.1648138,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4",
        display: "1x4 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:14",
        model: {
          folder: "Bricks/Brick_1x4",
          name: "Brick_1x4",
          shape: "box",
          size: [
            4,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x4/Brick_1x4_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x4/Brick_1x4_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x4/Brick_1x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_1x4/Brick_1x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_1x4/Brick_1x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_1x4/Brick_1x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              4942e-7,
              0
            ],
            size: [
              0.2226001,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            4942e-7,
            0
          ],
          size: [
            0.2226001,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              -1178e-7,
              0
            ],
            size: [
              0.2226001,
              0.0645752,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x6",
        display: "1x6 Brick",
        category: "bricks",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:15",
        model: {
          folder: "Bricks/Brick_1x6",
          name: "Brick_1x6",
          shape: "box",
          size: [
            6,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x6/Brick_1x6_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x6/Brick_1x6_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x6/Brick_1x6_HollowBody.fbx"
            ],
            solid: [
              "Bricks/Brick_1x6/Brick_1x6_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "5",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -4012e-7,
              4942e-7,
              0
            ],
            size: [
              0.3316568,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -4012e-7,
            4942e-7,
            0
          ],
          size: [
            0.3316568,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -4012e-7,
              4942e-7,
              0
            ],
            size: [
              0.3316568,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x8",
        display: "1x8 Brick",
        category: "bricks",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:16",
        model: {
          folder: "Bricks/Brick_1x8",
          name: "Brick_1x8",
          shape: "box",
          size: [
            8,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x8/Brick_1x8_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x8/Brick_1x8_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x8/Brick_1x8_HollowBody.fbx"
            ],
            solid: [
              "Bricks/Brick_1x8/Brick_1x8_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "7",
            p: [
              0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              0.1962629,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.1962629,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              -0.1962629,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              0.1962629,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -1237e-7,
              4942e-7,
              0
            ],
            size: [
              0.4431494,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -1237e-7,
            4942e-7,
            0
          ],
          size: [
            0.4431494,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -1237e-7,
              4942e-7,
              0
            ],
            size: [
              0.4431494,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x10",
        display: "1x10 Brick",
        category: "bricks",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:17",
        model: {
          folder: "Bricks/Brick_1x10",
          name: "Brick_1x10",
          shape: "box",
          size: [
            10,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_1x10/Brick_1x10_Complete",
          files: {
            complete: [
              "Bricks/Brick_1x10/Brick_1x10_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_1x10/Brick_1x10_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_1x10/Brick_1x10_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_1x10/Brick_1x10_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_1x10/Brick_1x10_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6 (3)",
            p: [
              -0.252338,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (2)",
            p: [
              -0.1962629,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (3)",
            p: [
              0.252338,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (1)",
            p: [
              0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6 (1)",
            p: [
              -0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (3)",
            p: [
              0.2523381,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (3)",
            p: [
              -0.2523381,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (2)",
            p: [
              0.1962629,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (2)",
            p: [
              0.1962629,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6 (2)",
            p: [
              -0.1962629,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (1)",
            p: [
              -0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (1)",
            p: [
              0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              8219e-7,
              4942e-7,
              0
            ],
            size: [
              0.5518919,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            8219e-7,
            4942e-7,
            0
          ],
          size: [
            0.5518919,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              8219e-7,
              4942e-7,
              0
            ],
            size: [
              0.5518919,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2",
        display: "2x2 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:18",
        model: {
          folder: "Bricks/Brick_2x2",
          name: "Brick_2x2",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x2/Brick_2x2_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x2/Brick_2x2_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x2/Brick_2x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_2x2/Brick_2x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_2x2/Brick_2x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_2x2/Brick_2x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              229e-6,
              0
            ],
            size: [
              0.109001,
              0.0646519,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            229e-6,
            0
          ],
          size: [
            0.109001,
            0.0646519,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              -3347e-7,
              0
            ],
            size: [
              0.109001,
              0.0649142,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x3",
        display: "2x3 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:19",
        model: {
          folder: "Bricks/Brick_2x3",
          name: "Brick_2x3",
          shape: "box",
          size: [
            3,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x3/Brick_2x3_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x3/Brick_2x3_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x3/Brick_2x3_HollowBody.fbx"
            ],
            solid: [
              "Bricks/Brick_2x3/Brick_2x3_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              0,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              -0.0560751,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0560751,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              0,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0560751,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.0560751,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.0560751,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0560751,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0560751,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              3766e-7,
              229e-6,
              0
            ],
            size: [
              0.1635602,
              0.0646519,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            3766e-7,
            229e-6,
            0
          ],
          size: [
            0.1635602,
            0.0646519,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              3766e-7,
              229e-6,
              0
            ],
            size: [
              0.1635602,
              0.0646519,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "4x2",
        display: "2x4 Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:20",
        model: {
          folder: "Bricks/Brick_2x4",
          name: "Brick_2x4",
          shape: "box",
          size: [
            4,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x4/Brick_2x4_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x4/Brick_2x4_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x4/Brick_2x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_2x4/Brick_2x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_2x4/Brick_2x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_2x4/Brick_2x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2",
            p: [
              0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              -0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              243e-7,
              -4884e-7,
              0
            ],
            size: [
              0.2196728,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            243e-7,
            -4884e-7,
            0
          ],
          size: [
            0.2196728,
            0.0635233,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              243e-7,
              -4884e-7,
              0
            ],
            size: [
              0.2196728,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x6",
        display: "2x6 Brick",
        category: "bricks",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:21",
        model: {
          folder: "Bricks/Brick_2x6",
          name: "Brick_2x6",
          shape: "box",
          size: [
            6,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x6/Brick_2x6_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x6/Brick_2x6_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x6/Brick_2x6_HollowBody.fbx"
            ],
            solid: [
              "Bricks/Brick_2x6/Brick_2x6_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7 (1)",
            p: [
              -0.1399872,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "10",
            p: [
              -0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.1399872,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "9",
            p: [
              -0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (1)",
            p: [
              0.1399872,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (1)",
            p: [
              0.1399872,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "12",
            p: [
              -0.1399872,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              -0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.1399872,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8 (1)",
            p: [
              -0.1399872,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "11",
            p: [
              -0.1399872,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              417e-6,
              -4884e-7,
              0
            ],
            size: [
              0.3289691,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            417e-6,
            -4884e-7,
            0
          ],
          size: [
            0.3289691,
            0.0635233,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              417e-6,
              -4884e-7,
              0
            ],
            size: [
              0.3289691,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x8",
        display: "2x8 Brick",
        category: "bricks",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:22",
        model: {
          folder: "Bricks/Brick_2x8",
          name: "Brick_2x8",
          shape: "box",
          size: [
            8,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x8/Brick_2x8_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x8/Brick_2x8_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x8/Brick_2x8_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Bricks/Brick_2x8/Brick_2x8_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Bricks/Brick_2x8/Brick_2x8_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Bricks/Brick_2x8/Brick_2x8_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "8",
            p: [
              -0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2 (1)",
            p: [
              0.1399872,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7 (2)",
            p: [
              -0.195962,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8 (2)",
            p: [
              -0.195962,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7 (1)",
            p: [
              -0.1399872,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0840124,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (1)",
            p: [
              0.1399872,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8 (2)",
            p: [
              -0.195962,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (1)",
            p: [
              0.1399872,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8 (1)",
            p: [
              -0.1399872,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              -0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (2)",
            p: [
              0.195962,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2 (2)",
            p: [
              0.195962,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (2)",
            p: [
              0.195962,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (2)",
            p: [
              0.195962,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.0840124,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7 (2)",
            p: [
              -0.195962,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7 (1)",
            p: [
              -0.1399872,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.0840124,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0840124,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8 (1)",
            p: [
              -0.1399872,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (1)",
            p: [
              0.1399872,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -27e-6,
              -4884e-7,
              0
            ],
            size: [
              0.4405859,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -27e-6,
            -4884e-7,
            0
          ],
          size: [
            0.4405859,
            0.0635233,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -27e-6,
              -4884e-7,
              0
            ],
            size: [
              0.4405859,
              0.0635233,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2Corner",
        display: "2x2 L Brick",
        category: "bricks",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:23",
        model: {
          folder: "Bricks/Brick_2x2_Corner",
          name: "Brick_2x2_Corner",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks/Brick_2x2_Corner/Brick_2x2_Corner_Complete",
          files: {
            complete: [
              "Bricks/Brick_2x2_Corner/Brick_2x2_Corner_Complete.fbx"
            ],
            hollow: [
              "Bricks/Brick_2x2_Corner/Brick_2x2_Corner_HollowBody.fbx"
            ],
            solid: [
              "Bricks/Brick_2x2_Corner/Brick_2x2_Corner_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0274712,
              -155e-5,
              12686e-7
            ],
            size: [
              0.0516679,
              0.0645083,
              0.107832
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -172e-7,
              -6972e-7,
              -0.0272972
            ],
            size: [
              0.1083662,
              0.0639059,
              0.0521933
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0.0274336,
            229e-6,
            0
          ],
          size: [
            0.0541337,
            0.0646519,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0.0274712,
              -155e-5,
              12686e-7
            ],
            size: [
              0.0516679,
              0.0645083,
              0.107832
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -172e-7,
              -6972e-7,
              -0.0272972
            ],
            size: [
              0.1083662,
              0.0639059,
              0.0521933
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1Tile",
        display: "1x1 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:24",
        model: {
          folder: "Tiles/Tile_1x1",
          name: "Tile_1x1",
          shape: "box",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x1/Tile_1x1_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x1/Tile_1x1_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x1/Tile_1x1_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Tiles/Tile_1x1/Tile_1x1_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Tiles/Tile_1x1/Tile_1x1_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_1x1/Tile_1x1_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -1181e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.0520651,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -1181e-7,
            -186e-6,
            6033e-7
          ],
          size: [
            0.0520651,
            0.0206993,
            0.0531093
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              2018e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.0536764,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Tile",
        display: "1x2 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:25",
        model: {
          folder: "Tiles/Tile_1x2",
          name: "Tile_1x2",
          shape: "box",
          size: [
            2,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x2/Tile_1x2_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x2/Tile_1x2_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x2/Tile_1x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Tiles/Tile_1x2/Tile_1x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Tiles/Tile_1x2/Tile_1x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_1x2/Tile_1x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              9786e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.1098373,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            9786e-7,
            -186e-6,
            1295e-7
          ],
          size: [
            0.1098373,
            0.0206993,
            0.0521618
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              9786e-7,
              -186e-6,
              3379e-7
            ],
            size: [
              0.1098373,
              0.0206993,
              0.0525785
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x3Tile",
        display: "1x3 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:26",
        model: {
          folder: "Tiles/Tile_1x3",
          name: "Tile_1x3",
          shape: "box",
          size: [
            3,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x3/Tile_1x3_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x3/Tile_1x3_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x3/Tile_1x3_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Tiles/Tile_1x3/Tile_1x3_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Tiles/Tile_1x3/Tile_1x3_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_1x3/Tile_1x3_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1 (1)",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (2)",
            p: [
              0.0560751,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              5877e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.1649587,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            5877e-7,
            -186e-6,
            6033e-7
          ],
          size: [
            0.1649587,
            0.0206993,
            0.0531093
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              5877e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.1649587,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4Tile",
        display: "1x4 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:27",
        model: {
          folder: "Tiles/Tile_1x4",
          name: "Tile_1x4",
          shape: "box",
          size: [
            4,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x4/Tile_1x4_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x4/Tile_1x4_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x4/Tile_1x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Tiles/Tile_1x4/Tile_1x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Tiles/Tile_1x4/Tile_1x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_1x4/Tile_1x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -908e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.2222861,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -908e-7,
            -186e-6,
            1295e-7
          ],
          size: [
            0.2222861,
            0.0206993,
            0.0521618
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -908e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.2222861,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x6Tile",
        display: "1x6 Tile",
        category: "tiles",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:28",
        model: {
          folder: "Tiles/Tile_1x6",
          name: "Tile_1x6",
          shape: "box",
          size: [
            6,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x6/Tile_1x6_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x6/Tile_1x6_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x6/Tile_1x6_HollowBody.fbx"
            ],
            solid: [
              "Tiles/Tile_1x6/Tile_1x6_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -4926e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.3321238,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -4926e-7,
            -186e-6,
            1295e-7
          ],
          size: [
            0.3321238,
            0.0206993,
            0.0521618
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -4926e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.3321238,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x8Tile",
        display: "1x8 Tile",
        category: "tiles",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:29",
        model: {
          folder: "Tiles/Tile_1x8",
          name: "Tile_1x8",
          shape: "box",
          size: [
            8,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x8/Tile_1x8_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x8/Tile_1x8_Complete-HollowBody.fbx",
              "Tiles/Tile_1x8/Tile_1x8_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_1x8/Tile_1x8_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -3327e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.443354,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -3327e-7,
            -186e-6,
            1295e-7
          ],
          size: [
            0.443354,
            0.0206993,
            0.0521618
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -3327e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.443354,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x10Tile",
        display: "1x10 Tile",
        category: "tiles",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:30",
        model: {
          folder: "Tiles/Tile_1x10",
          name: "Tile_1x10",
          shape: "box",
          size: [
            10,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_1x10/Tile_1x10_Complete",
          files: {
            complete: [
              "Tiles/Tile_1x10/Tile_1x10_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_1x10/Tile_1x10_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Tiles/Tile_1x10/Tile_1x10_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Tiles/Tile_1x10/Tile_1x10_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_1x10/Tile_1x10_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5 (4)",
            p: [
              -0.252338,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (5)",
            p: [
              0.2523381,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -6859e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.5521125,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -6859e-7,
            -186e-6,
            1295e-7
          ],
          size: [
            0.5521125,
            0.0206993,
            0.0521618
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -6859e-7,
              -186e-6,
              1295e-7
            ],
            size: [
              0.5521125,
              0.0206993,
              0.0521618
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2Tile",
        display: "2x2 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:31",
        model: {
          folder: "Tiles/Tile_2x2",
          name: "Tile_2x2",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x2/Tile_2x2_Complete",
          files: {
            hollow_nobevel: [
              "Tiles/Tile_2x2/Tile_2x2_Complete+HollowBody_NoBevel.fbx"
            ],
            complete: [
              "Tiles/Tile_2x2/Tile_2x2_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_2x2/Tile_2x2_HollowBody.fbx"
            ],
            solid: [
              "Tiles/Tile_2x2/Tile_2x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_2x2/Tile_2x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              2859e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1063092,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            2859e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.1063092,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              2859e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1063092,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x3Tile",
        display: "2x3 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:32",
        model: {
          folder: "Tiles/Tile_2x3",
          name: "Tile_2x3",
          shape: "box",
          size: [
            3,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x3/Tile_2x3_Complete",
          files: {
            complete: [
              "Tiles/Tile_2x3/Tile_2x3_Complete-HollowBody.fbx",
              "Tiles/Tile_2x3/Tile_2x3_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_2x3/Tile_2x3_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0560751,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0560751,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0560751,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0560751,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              2733e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1626758,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            2733e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.1626758,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              2733e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1626758,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x4Tile",
        display: "2x4 Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:33",
        model: {
          folder: "Tiles/Tile_2x4",
          name: "Tile_2x4",
          shape: "box",
          size: [
            4,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x4/Tile_2x4_Complete",
          files: {
            hollow_nobevel: [
              "Tiles/Tile_2x4/Tile_2x4_Complete+HollowBody_NoBevel.fbx"
            ],
            complete: [
              "Tiles/Tile_2x4/Tile_2x4_Complete.fbx"
            ],
            hollow: [
              "Tiles/Tile_2x4/Tile_2x4_HollowBody.fbx"
            ],
            solid: [
              "Tiles/Tile_2x4/Tile_2x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_2x4/Tile_2x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -198e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.2225158,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -198e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.2225158,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -198e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.2225158,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x6Tile",
        display: "2x6 Tile",
        category: "tiles",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:34",
        model: {
          folder: "Tiles/Tile_2x6",
          name: "Tile_2x6",
          shape: "box",
          size: [
            6,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x6/Tile_2x6_Complete",
          files: {
            complete: [
              "Tiles/Tile_2x6/Tile_2x6_Complete-HollowBody.fbx",
              "Tiles/Tile_2x6/Tile_2x6_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_2x6/Tile_2x6_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              4848e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.3307317,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            4848e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.3307317,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -4805e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.3310424,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x8Tile",
        display: "2x8 Tile",
        category: "tiles",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:35",
        model: {
          folder: "Tiles/Tile_2x8",
          name: "Tile_2x8",
          shape: "box",
          size: [
            8,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x8/Tile_2x8_Complete",
          files: {
            hollow_nobevel: [
              "Tiles/Tile_2x8/Tile_2x8_Complete+HollowBody_NoBevel.fbx"
            ],
            complete: [
              "Tiles/Tile_2x8/Tile_2x8_Complete-HollowBody.fbx",
              "Tiles/Tile_2x8/Tile_2x8_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_2x8/Tile_2x8_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Tiles/Tile_2x8/Tile_2x8_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (5)",
            p: [
              0.1960623,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (7)",
            p: [
              -0.1960623,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (5)",
            p: [
              0.1960623,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (6)",
            p: [
              -0.1400875,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (4)",
            p: [
              0.1400875,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (6)",
            p: [
              -0.1400875,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (7)",
            p: [
              -0.1960623,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (4)",
            p: [
              0.1400875,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              1053e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.4407588,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            1053e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.4407588,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              1053e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.4407588,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2CornerTile",
        display: "2x2 L Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:36",
        model: {
          folder: "Tiles/Tile_2x2_Corner",
          name: "Tile_2x2_Corner",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_2x2_Corner/Tile_2x2_Corner_Complete",
          files: {
            complete: [
              "Tiles/Tile_2x2_Corner/Tile_2x2_Corner_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_2x2_Corner/Tile_2x2_Corner_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0274745,
              -186e-6,
              6071e-7
            ],
            size: [
              0.0533829,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -172e-7,
              -186e-6,
              -0.0279709
            ],
            size: [
              0.1083662,
              0.0206993,
              0.0535408
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -6302e-7,
            -186e-6,
            -0.0275268
          ],
          size: [
            0.1081413,
            0.0206993,
            0.0544291
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -172e-7,
              -186e-6,
              -0.0279709
            ],
            size: [
              0.1083662,
              0.0206993,
              0.0535408
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0274745,
              -186e-6,
              6071e-7
            ],
            size: [
              0.0533829,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1RoundTile",
        display: "1x1 Round Tile",
        category: "tiles",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:37",
        model: {
          folder: "Tiles/Tile_Round_1x1",
          name: "Tile_Round_1x1",
          shape: "round",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Tiles/Tile_Round_1x1/Tile_Round_1x1_Complete",
          files: {
            complete: [
              "Tiles/Tile_Round_1x1/Tile_Round_1x1_Complete.fbx"
            ],
            solid: [
              "Tiles/Tile_Round_1x1/Tile_Round_1x1_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -1181e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.0520651,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -1181e-7,
            -186e-6,
            6033e-7
          ],
          size: [
            0.0520651,
            0.0206993,
            0.0531093
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -1181e-7,
              -186e-6,
              6033e-7
            ],
            size: [
              0.0520651,
              0.0206993,
              0.0531093
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1Plate",
        display: "1x1 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:38",
        model: {
          folder: "Plates/Plate_1x1",
          name: "Plate_1x1",
          shape: "box",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x1/Plate_1x1_Complete",
          files: {
            complete: [
              "Plates/Plate_1x1/Plate_1x1_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x1/Plate_1x1_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_1x1/Plate_1x1_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_1x1/Plate_1x1_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_1x1/Plate_1x1_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            385e-7,
            -4315e-7,
            -1271e-7
          ],
          size: [
            0.0526874,
            0.0202081,
            0.0531516
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Plate",
        display: "1x2 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:39",
        model: {
          folder: "Plates/Plate_1x2",
          name: "Plate_1x2",
          shape: "box",
          size: [
            2,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x2/Plate_1x2_Complete",
          files: {
            complete: [
              "Plates/Plate_1x2/Plate_1x2_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x2/Plate_1x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_1x2/Plate_1x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_1x2/Plate_1x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_1x2/Plate_1x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2",
            p: [
              -0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -12e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.1068733,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -12e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.1068733,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -12e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.1068733,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x3Plate",
        display: "1x3 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:40",
        model: {
          folder: "Plates/Plate_1x3",
          name: "Plate_1x3",
          shape: "box",
          size: [
            3,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x3/Plate_1x3_Complete",
          files: {
            complete: [
              "Plates/Plate_1x3/Plate_1x3_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x3/Plate_1x3_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_1x3/Plate_1x3_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_1x3/Plate_1x3_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_1x3/Plate_1x3_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0560751,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              -0.0560751,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -541e-6,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.1648768,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -541e-6,
            -4315e-7,
            -1271e-7
          ],
          size: [
            0.1648768,
            0.0202081,
            0.0531516
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -541e-6,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.1648768,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4Plate",
        display: "1x4 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:41",
        model: {
          folder: "Plates/Plate_1x4",
          name: "Plate_1x4",
          shape: "box",
          size: [
            4,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x4/Plate_1x4_Complete",
          files: {
            complete: [
              "Plates/Plate_1x4/Plate_1x4_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x4/Plate_1x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_1x4/Plate_1x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_1x4/Plate_1x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_1x4/Plate_1x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "4",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -758e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.2191977,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -758e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.2191977,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -758e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.2191977,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x6Plate",
        display: "1x6 Plate",
        category: "plates",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:42",
        model: {
          folder: "Plates/Plate_1x6",
          name: "Plate_1x6",
          shape: "box",
          size: [
            6,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x6/Plate_1x6_Complete",
          files: {
            complete: [
              "Plates/Plate_1x6/Plate_1x6_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x6/Plate_1x6_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_1x6/Plate_1x6_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              4463e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.3319484,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            4463e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.3319484,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              4463e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.3319484,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x8Plate",
        display: "1x8 Plate",
        category: "plates",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:43",
        model: {
          folder: "Plates/Plate_1x8",
          name: "Plate_1x8",
          shape: "box",
          size: [
            8,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x8/Plate_1x8_Complete",
          files: {
            complete: [
              "Plates/Plate_1x8/Plate_1x8_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x8/Plate_1x8_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_1x8/Plate_1x8_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2",
            p: [
              0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.1962629,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "8",
            p: [
              -0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.1962629,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -7959e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.4451823,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -7959e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.4451823,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -7959e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.4451823,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x10Plate",
        display: "1x10 Plate",
        category: "plates",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:44",
        model: {
          folder: "Plates/Plate_1x10",
          name: "Plate_1x10",
          shape: "box",
          size: [
            10,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_1x10/Plate_1x10_Complete",
          files: {
            complete: [
              "Plates/Plate_1x10/Plate_1x10_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x10/Plate_1x10_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_1x10/Plate_1x10_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_1x10/Plate_1x10_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_1x10/Plate_1x10_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "4 (2)",
            p: [
              -0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (1)",
            p: [
              -0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              -0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (3)",
            p: [
              -0.252338,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (1)",
            p: [
              0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (3)",
            p: [
              0.252338,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (3)",
            p: [
              -0.252338,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (3)",
            p: [
              0.252338,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (1)",
            p: [
              -0.1401878,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (2)",
            p: [
              0.1962629,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4 (2)",
            p: [
              -0.1962629,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (1)",
            p: [
              0.1401878,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.0280375,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0841127,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0841126,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (2)",
            p: [
              0.1962628,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -2546e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.5533708,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -2546e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.5533708,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -2546e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.5533708,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2Plate",
        display: "2x2 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:45",
        model: {
          folder: "Plates/Plate_2x2",
          name: "Plate_2x2",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x2/Plate_2x2_Complete",
          files: {
            complete: [
              "Plates/Plate_2x2/Plate_2x2_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x2/Plate_2x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_2x2/Plate_2x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_2x2/Plate_2x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_2x2/Plate_2x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "1",
            p: [
              -0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              1901e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1079516,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            1901e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.1079516,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              1901e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1079516,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x3Plate",
        display: "2x3 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:46",
        model: {
          folder: "Plates/Plate_2x3",
          name: "Plate_2x3",
          shape: "box",
          size: [
            3,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x3/Plate_2x3_Complete",
          files: {
            complete: [
              "Plates/Plate_2x3/Plate_2x3_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x3/Plate_2x3_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_2x3/Plate_2x3_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.0560751,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (1)",
            p: [
              -0.0560751,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (1)",
            p: [
              -0.0560751,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (1)",
            p: [
              0.0560751,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0560751,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0560751,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0560751,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              -0.0560751,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              494e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1633757,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            494e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.1633757,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              494e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1633757,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x4Plate",
        display: "2x4 Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:47",
        model: {
          folder: "Plates/Plate_2x4",
          name: "Plate_2x4",
          shape: "box",
          size: [
            4,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x4/Plate_2x4_Complete",
          files: {
            complete: [
              "Plates/Plate_2x4/Plate_2x4_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x4/Plate_2x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_2x4/Plate_2x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_2x4/Plate_2x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_2x4/Plate_2x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              -0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3 (3)",
            p: [
              -0.0841128,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5 (3)",
            p: [
              -0.0841128,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5 (2)",
            p: [
              0.0841128,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3 (2)",
            p: [
              0.0841128,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5 (1)",
            p: [
              0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3 (1)",
            p: [
              0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -198e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.2225158,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -198e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.2225158,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -198e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.2225158,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x6Plate",
        display: "2x6 Plate",
        category: "plates",
        picker: true,
        uiScale: 0.8,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:48",
        model: {
          folder: "Plates/Plate_2x6",
          name: "Plate_2x6",
          shape: "box",
          size: [
            6,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x6/Plate_2x6_Complete",
          files: {
            complete: [
              "Plates/Plate_2x6/Plate_2x6_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x6/Plate_2x6_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_2x6/Plate_2x6_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              0.0841128,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0841128,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (5)",
            p: [
              -0.1401878,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "10",
            p: [
              -0.0841128,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "9",
            p: [
              -0.0841128,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.1401879,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "12",
            p: [
              -0.1401879,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (4)",
            p: [
              0.1401878,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (4)",
            p: [
              0.1401878,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.1401879,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (5)",
            p: [
              -0.1401878,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "11",
            p: [
              -0.1401879,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              3228e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.3318222,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            3228e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.3318222,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              3228e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.3318222,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x8Plate",
        display: "2x8 Plate",
        category: "plates",
        picker: true,
        uiScale: 0.65,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:49",
        model: {
          folder: "Plates/Plate_2x8",
          name: "Plate_2x8",
          shape: "box",
          size: [
            8,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x8/Plate_2x8_Complete",
          files: {
            complete: [
              "Plates/Plate_2x8/Plate_2x8_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x8/Plate_2x8_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Plates/Plate_2x8/Plate_2x8_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Plates/Plate_2x8/Plate_2x8_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Plates/Plate_2x8/Plate_2x8_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2 (1)",
            p: [
              -0.1400876,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0280375,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              0.0841128,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (4)",
            p: [
              0.1400875,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7 (2)",
            p: [
              0.1960624,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8 (2)",
            p: [
              0.1960624,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0280375,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2 (2)",
            p: [
              -0.1960624,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              -0.0841127,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (2)",
            p: [
              -0.1960624,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.0841128,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0280375,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8 (1)",
            p: [
              0.1400876,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              0.0841127,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (6)",
            p: [
              -0.1400875,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (5)",
            p: [
              0.1960623,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1 (1)",
            p: [
              -0.1400876,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (5)",
            p: [
              0.1960623,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (7)",
            p: [
              -0.1960623,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (7)",
            p: [
              -0.1960623,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              -0.0841128,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              0.0841128,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7 (1)",
            p: [
              0.1400876,
              0.026,
              -0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0280375,
              0.026,
              0.0280375
            ],
            q: [
              0,
              -1,
              0,
              0
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (6)",
            p: [
              -0.1400875,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (4)",
            p: [
              0.1400875,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              1053e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.4407588,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            1053e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.4407588,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              1053e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.4407588,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2CornerPlate",
        display: "2x2 L Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:50",
        model: {
          folder: "Plates/Plate_2x2_Corner",
          name: "Plate_2x2_Corner",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_2x2_Corner/Plate_2x2_Corner_Complete",
          files: {
            complete: [
              "Plates/Plate_2x2_Corner/Plate_2x2_Corner_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x2_Corner/Plate_2x2_Corner_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_2x2_Corner/Plate_2x2_Corner_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2",
            p: [
              -0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280375,
              0.026,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280375,
              0.026,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0274745,
              -186e-6,
              6071e-7
            ],
            size: [
              0.0533829,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -172e-7,
              -186e-6,
              -0.0279709
            ],
            size: [
              0.1083662,
              0.0206993,
              0.0535408
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -6302e-7,
            -186e-6,
            -0.0275268
          ],
          size: [
            0.1081413,
            0.0206993,
            0.0544291
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0.0274745,
              -186e-6,
              6071e-7
            ],
            size: [
              0.0533829,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -172e-7,
              -186e-6,
              -0.0279709
            ],
            size: [
              0.1083662,
              0.0206993,
              0.0535408
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Plate1Stud",
        display: "1x2 Plate (1)",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:51",
        model: {
          folder: "Plates/Plate_1x2_1Stud",
          name: "Plate_1x2_1Stud",
          shape: "box",
          size: [
            2,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [
            [
              0,
              0
            ]
          ],
          complete: "BrickModels/Plates/Plate_1x2_1Stud/Plate_1x2_1Stud_Complete",
          files: {
            complete: [
              "Plates/Plate_1x2_1Stud/Plate_1x2_1Stud_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_1x2_1Stud/Plate_1x2_1Stud_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_1x2_1Stud/Plate_1x2_1Stud_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -12e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.1068733,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -12e-7,
            -186e-6,
            -854e-7
          ],
          size: [
            0.1068733,
            0.0206993,
            0.0540057
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -12e-7,
              -186e-6,
              -854e-7
            ],
            size: [
              0.1068733,
              0.0206993,
              0.0540057
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2Plate1Stud",
        display: "2x2 Plate (1)",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:52",
        model: {
          folder: "Plates/Plate_2x2_1Stud",
          name: "Plate_2x2_1Stud",
          shape: "box",
          size: [
            2,
            2
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [
            [
              0,
              0
            ]
          ],
          complete: "BrickModels/Plates/Plate_2x2_1Stud/Plate_2x2_1Stud_Complete",
          files: {
            complete: [
              "Plates/Plate_2x2_1Stud/Plate_2x2_1Stud_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_2x2_1Stud/Plate_2x2_1Stud_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_2x2_1Stud/Plate_2x2_1Stud_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "1",
            p: [
              0,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.014,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.014,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              1901e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1079516,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            1901e-7,
            -186e-6,
            6071e-7
          ],
          size: [
            0.1079516,
            0.0206993,
            0.1106968
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              1901e-7,
              -186e-6,
              6071e-7
            ],
            size: [
              0.1079516,
              0.0206993,
              0.1106968
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1RoundPlate",
        display: "1x1 Round Plate",
        category: "plates",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:53",
        model: {
          folder: "Plates/Plate_Round_1x1",
          name: "Plate_Round_1x1",
          shape: "round",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: "all",
          complete: "BrickModels/Plates/Plate_Round_1x1/Plate_Round_1x1_Complete",
          files: {
            complete: [
              "Plates/Plate_Round_1x1/Plate_Round_1x1_Complete.fbx"
            ],
            hollow: [
              "Plates/Plate_Round_1x1/Plate_Round_1x1_HollowBody.fbx"
            ],
            solid: [
              "Plates/Plate_Round_1x1/Plate_Round_1x1_SolidBody.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "1",
            p: [
              0,
              0.026,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            385e-7,
            -4315e-7,
            -1271e-7
          ],
          size: [
            0.0526874,
            0.0202081,
            0.0531516
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Slope",
        display: "1x2 45\xB0 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:54",
        model: {
          folder: "Slopes/Slope_1x2",
          name: "Slope_1x2",
          shape: "slope",
          size: [
            2,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              1,
              0
            ]
          ],
          complete: "BrickModels/Slopes/Slope_1x2/Slope_1x2_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x2/Slope_1x2_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_1x2/Slope_1x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Slopes/Slope_1x2/Slope_1x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Slopes/Slope_1x2/Slope_1x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Slopes/Slope_1x2/Slope_1x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0265992,
              -5752e-7,
              0
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6823e-7,
              -0.0272387,
              0
            ],
            size: [
              0.1080677,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0198149,
              -5684e-7,
              0
            ],
            size: [
              0.077565,
              0.0180568,
              0.0530404
            ],
            q: [
              0,
              0,
              0.3532299,
              0.9355366
            ]
          }
        ],
        rootBox: {
          c: [
            -5459e-7,
            -8015e-7,
            0
          ],
          size: [
            0.1077949,
            0.0613872,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.0204595,
              -1136e-6,
              0
            ],
            size: [
              0.0792828,
              0.0180568,
              0.0530404
            ],
            q: [
              0,
              0,
              0.3532299,
              0.9355366
            ]
          },
          {
            c: [
              -5459e-7,
              4942e-7,
              0
            ],
            size: [
              0.1077949,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -11973e-7,
              -0.0272387,
              0
            ],
            size: [
              0.1090977,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0265992,
              4942e-7,
              0
            ],
            size: [
              0.0535047,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x3Slope",
        display: "1x3 33\xB0 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:55",
        model: {
          folder: "Slopes/Slope_1x3",
          name: "Slope_1x3",
          shape: "slope",
          size: [
            3,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              2,
              0
            ]
          ],
          complete: "BrickModels/Slopes/Slope_1x3/Slope_1x3_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x3/Slope_1x3_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_1x3/Slope_1x3_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Slopes/Slope_1x3/Slope_1x3_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Slopes/Slope_1x3/Slope_1x3_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Slopes/Slope_1x3/Slope_1x3_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0560751,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.054992,
              -10057e-7,
              0
            ],
            size: [
              0.0551394,
              0.0627008,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6835e-7,
              -0.0272387,
              0
            ],
            size: [
              0.1667901,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0220646,
              -12161e-7,
              0
            ],
            size: [
              0.119529,
              0.0146681,
              0.0530404
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          }
        ],
        rootBox: {
          c: [
            -885e-7,
            -8015e-7,
            0
          ],
          size: [
            0.1637112,
            0.0613872,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.0224378,
              -13885e-7,
              0
            ],
            size: [
              0.1203512,
              0.0146681,
              0.0530404
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          },
          {
            c: [
              -885e-7,
              -8015e-7,
              0
            ],
            size: [
              0.1637112,
              0.0613872,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.054992,
              -12534e-7,
              0
            ],
            size: [
              0.0551394,
              0.0631963,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6835e-7,
              -0.0272387,
              0
            ],
            size: [
              0.1667901,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4Slope",
        display: "1x4 18\xB0 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:56",
        model: {
          folder: "Slopes/Slope_1x4",
          name: "Slope_1x4",
          shape: "slope",
          size: [
            4,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              3,
              0
            ]
          ],
          complete: "BrickModels/Slopes/Slope_1x4/Slope_1x4_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x4/Slope_1x4_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_1x4/Slope_1x4_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Slopes/Slope_1x4/Slope_1x4_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Slopes/Slope_1x4/Slope_1x4_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Slopes/Slope_1x4/Slope_1x4_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.085,
              -5752e-7,
              0
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -1788e-7,
              -0.0272387,
              0
            ],
            size: [
              0.2202951,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0243052,
              -7501e-7,
              0
            ],
            size: [
              0.1766648,
              0.0119872,
              0.0530404
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          }
        ],
        rootBox: {
          c: [
            5466e-7,
            -8015e-7,
            0
          ],
          size: [
            0.2208669,
            0.0613872,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0.085,
              -5752e-7,
              0
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              5466e-7,
              -8015e-7,
              0
            ],
            size: [
              0.2208669,
              0.0613872,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0243052,
              -7501e-7,
              0
            ],
            size: [
              0.1766648,
              0.0119872,
              0.0530404
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              -1788e-7,
              -0.0272387,
              0
            ],
            size: [
              0.2202951,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "2x2Slope",
        display: "2x2 45\xB0 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:57",
        model: {
          folder: "Slopes/Slope_2x2",
          name: "Slope_2x2",
          shape: "slope",
          size: [
            2,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              1,
              0
            ],
            [
              1,
              1
            ]
          ],
          complete: "BrickModels/Slopes/Slope_2x2/Slope_2x2_Complete",
          files: {
            complete: [
              "Slopes/Slope_2x2/Slope_2x2_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_2x2/Slope_2x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Slopes/Slope_2x2/Slope_2x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Slopes/Slope_2x2/Slope_2x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Slopes/Slope_2x2/Slope_2x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0280376,
              0.0484,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0270701,
              229e-6,
              0
            ],
            size: [
              0.0548608,
              0.0646519,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.023831,
              15944e-7,
              0
            ],
            size: [
              9625e-6,
              0.0774679,
              0.110404
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          },
          {
            c: [
              -177e-6,
              -0.0271429,
              0
            ],
            size: [
              0.1073086,
              0.0123326,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            229e-6,
            0
          ],
          size: [
            0.109001,
            0.0646519,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0.0270701,
              -2748e-7,
              0
            ],
            size: [
              0.0548608,
              0.0636443,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -177e-6,
              -0.0271429,
              0
            ],
            size: [
              0.1073086,
              0.0123326,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0238622,
              15632e-7,
              0
            ],
            size: [
              9625e-6,
              0.0775561,
              0.110404
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          }
        ]
      },
      {
        prefab: "2x2CornerSlope",
        display: "2x2 45\xB0 Corner",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:58",
        model: {
          folder: "Slopes/Slope_Corner_2x2",
          name: "Slope_Corner_2x2",
          shape: "corner_slope",
          size: [
            2,
            2
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              1,
              1
            ]
          ],
          complete: "BrickModels/Slopes/Slope_Corner_2x2/Slope_Corner_2x2_Complete",
          files: {
            complete: [
              "Slopes/Slope_Corner_2x2/Slope_Corner_2x2_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_Corner_2x2/Slope_Corner_2x2_HollowBody.fbx"
            ],
            solid: [
              "Slopes/Slope_Corner_2x2/Slope_Corner_2x2_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "1",
            p: [
              0.0280376,
              0.0484,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0280376,
              -0.0362,
              -0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0.0279747
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0270701,
              229e-6,
              0.0280197
            ],
            size: [
              0.0548608,
              0.0646519,
              0.0543646
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0246933,
              732e-6,
              0.0270473
            ],
            size: [
              9625e-6,
              0.079907,
              0.0563095
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          },
          {
            c: [
              -177e-6,
              -0.0271429,
              0
            ],
            size: [
              0.1073086,
              0.0123326,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0270473,
              732e-6,
              -0.0246933
            ],
            size: [
              9625e-6,
              0.079907,
              0.0563095
            ],
            q: [
              0.270598,
              -0.6532815,
              -0.270598,
              0.6532815
            ]
          },
          {
            c: [
              -0.034344,
              -89186e-7,
              -50181e-7
            ],
            size: [
              9625e-6,
              0.0526109,
              0.0257667
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          },
          {
            c: [
              -88488e-7,
              -92014e-7,
              -0.0346261
            ],
            size: [
              9625e-6,
              0.0518109,
              0.0233636
            ],
            q: [
              0.270598,
              -0.6532815,
              -0.270598,
              0.6532815
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            229e-6,
            0
          ],
          size: [
            0.109001,
            0.0646519,
            0.110404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.034344,
              -89186e-7,
              -50181e-7
            ],
            size: [
              9625e-6,
              0.0526109,
              0.0257667
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          },
          {
            c: [
              -177e-6,
              -0.0271429,
              0
            ],
            size: [
              0.1073086,
              0.0123326,
              0.110404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0270701,
              229e-6,
              0.0280197
            ],
            size: [
              0.0548608,
              0.0646519,
              0.0543646
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0246933,
              732e-6,
              0.0270473
            ],
            size: [
              9625e-6,
              0.079907,
              0.0563095
            ],
            q: [
              0,
              0,
              -0.3826834,
              0.9238796
            ]
          },
          {
            c: [
              0.0270473,
              732e-6,
              -0.0246933
            ],
            size: [
              9625e-6,
              0.079907,
              0.0563095
            ],
            q: [
              0.270598,
              -0.6532815,
              -0.270598,
              0.6532815
            ]
          },
          {
            c: [
              -88488e-7,
              -92014e-7,
              -0.0346261
            ],
            size: [
              9625e-6,
              0.0518109,
              0.0233636
            ],
            q: [
              0.270598,
              -0.6532815,
              -0.270598,
              0.6532815
            ]
          }
        ]
      },
      {
        prefab: "3x3CornerSlope",
        display: "3x3 33\xB0 Corner",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:59",
        model: {
          folder: "Slopes/Slope_Corner_3x3",
          name: "Slope_Corner_3x3",
          shape: "corner_slope",
          size: [
            3,
            3
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              2,
              2
            ]
          ],
          complete: "BrickModels/Slopes/Slope_Corner_3x3/Slope_Corner_3x3_Complete",
          files: {
            complete: [
              "Slopes/Slope_Corner_3x3/Slope_Corner_3x3_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_Corner_3x3/Slope_Corner_3x3_HollowBody.fbx"
            ],
            solid: [
              "Slopes/Slope_Corner_3x3/Slope_Corner_3x3_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0560751,
              -0.0362,
              -0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (1)",
            p: [
              0,
              -0.0362,
              -0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2 (2)",
            p: [
              0,
              -0.0362,
              0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (2)",
            p: [
              -0.0560751,
              -0.0362,
              0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0560751,
              -0.0362,
              0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0560751,
              0.0484,
              0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1 (1)",
            p: [
              -0.0560751,
              -0.0362,
              -0.0560751
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.054992,
              -17093e-7,
              0.0559081
            ],
            size: [
              0.0551394,
              0.064108,
              0.0547369
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6835e-7,
              -0.0272387,
              155e-7
            ],
            size: [
              0.1667901,
              0.0101977,
              0.1652315
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0240665,
              -21411e-7,
              0.0556691
            ],
            size: [
              0.1239396,
              0.0146681,
              0.0527794
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          },
          {
            c: [
              -0.0484246,
              -0.0133962,
              -43836e-7
            ],
            size: [
              0.0702746,
              0.0146681,
              0.039642
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          },
          {
            c: [
              0.0547967,
              -21411e-7,
              -0.0240665
            ],
            size: [
              0.1239396,
              0.0146681,
              0.054436
            ],
            q: [
              -0.1518408,
              -0.6906116,
              0.1518408,
              0.6906116
            ]
          },
          {
            c: [
              -79976e-7,
              -0.0147229,
              -0.051296
            ],
            size: [
              0.0639482,
              0.0146681,
              0.0479059
            ],
            q: [
              -0.1518408,
              -0.6906116,
              0.1518408,
              0.6906116
            ]
          }
        ],
        rootBox: {
          c: [
            -6149e-7,
            29e-7,
            0
          ],
          size: [
            0.1648138,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0.054992,
              -17093e-7,
              0.0559081
            ],
            size: [
              0.0551394,
              0.064108,
              0.0547369
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0484246,
              -0.0133962,
              -43836e-7
            ],
            size: [
              0.0702746,
              0.0146681,
              0.039642
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          },
          {
            c: [
              -0.0240665,
              -21411e-7,
              0.0556691
            ],
            size: [
              0.1239396,
              0.0146681,
              0.0527794
            ],
            q: [
              0,
              0,
              0.2147352,
              0.9766723
            ]
          },
          {
            c: [
              0.0547967,
              -21411e-7,
              -0.0240665
            ],
            size: [
              0.1239396,
              0.0146681,
              0.054436
            ],
            q: [
              -0.1518408,
              -0.6906116,
              0.1518408,
              0.6906116
            ]
          },
          {
            c: [
              -79976e-7,
              -0.0147229,
              -0.051296
            ],
            size: [
              0.0639482,
              0.0146681,
              0.0479059
            ],
            q: [
              -0.1518408,
              -0.6906116,
              0.1518408,
              0.6906116
            ]
          },
          {
            c: [
              -6835e-7,
              -0.0272387,
              155e-7
            ],
            size: [
              0.1667901,
              0.0101977,
              0.1652315
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "4x4CornerSlope",
        display: "4x4 18\xB0 Corner",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:60",
        model: {
          folder: "Slopes/Slope_Corner_4x4",
          name: "Slope_Corner_4x4",
          shape: "corner_slope",
          size: [
            4,
            4
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [
            [
              3,
              3
            ]
          ],
          complete: "BrickModels/Slopes/Slope_Corner_4x4/Slope_Corner_4x4_Complete",
          files: {
            complete: [
              "Slopes/Slope_Corner_4x4/Slope_Corner_4x4_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_Corner_4x4/Slope_Corner_4x4_HollowBody.fbx"
            ],
            solid: [
              "Slopes/Slope_Corner_4x4/Slope_Corner_4x4_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5 (3)",
            p: [
              -0.0280376,
              -0.0362,
              -0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (1)",
            p: [
              -0.0280376,
              -0.0362,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (2)",
            p: [
              -0.0841127,
              -0.0362,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0841127,
              -0.0362,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (3)",
            p: [
              0.0280376,
              -0.0362,
              -0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (1)",
            p: [
              -0.0841127,
              -0.0362,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (1)",
            p: [
              0.0841127,
              -0.0362,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6 (3)",
            p: [
              -0.0841127,
              -0.0362,
              -0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (3)",
            p: [
              0.0841127,
              -0.0362,
              -0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4 (2)",
            p: [
              0.0841127,
              -0.0362,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5 (2)",
            p: [
              -0.0280376,
              -0.0362,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (1)",
            p: [
              0.0280376,
              -0.0362,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3 (2)",
            p: [
              0.0280376,
              -0.0362,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0841127,
              0.0484,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.0362,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.085,
              -5752e-7,
              0.0834976
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0543627
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -1788e-7,
              -0.0272387,
              -642e-6
            ],
            size: [
              0.2202951,
              0.0101977,
              0.2201134
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0243052,
              -7501e-7,
              0.0837691
            ],
            size: [
              0.1766648,
              0.0119872,
              0.055409
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              -0.0627165,
              -0.0127141,
              0.0141112
            ],
            size: [
              0.0961976,
              0.0119872,
              0.0634438
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              -0.0909694,
              -0.021514,
              -0.0494808
            ],
            size: [
              0.0370106,
              0.0119872,
              0.0556145
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              0.083878,
              -75e-5,
              -0.0243052
            ],
            size: [
              0.1766648,
              0.0119872,
              0.052047
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          },
          {
            c: [
              0.0197539,
              -0.012605,
              -0.0623681
            ],
            size: [
              0.0969314,
              0.0119872,
              0.0745858
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          },
          {
            c: [
              -0.0462789,
              -0.0206767,
              -0.0882852
            ],
            size: [
              0.042638,
              0.0119872,
              0.0564064
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            4942e-7,
            0
          ],
          size: [
            0.2226001,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.0462789,
              -0.0206767,
              -0.0882852
            ],
            size: [
              0.042638,
              0.0119872,
              0.0564064
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          },
          {
            c: [
              -0.0909694,
              -0.021514,
              -0.0494808
            ],
            size: [
              0.0370106,
              0.0119872,
              0.0556145
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              -0.0243052,
              -7501e-7,
              0.0837691
            ],
            size: [
              0.1766648,
              0.0119872,
              0.055409
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              0.0197539,
              -0.012605,
              -0.0623681
            ],
            size: [
              0.0969314,
              0.0119872,
              0.0745858
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          },
          {
            c: [
              -0.0627165,
              -0.0127141,
              0.0141112
            ],
            size: [
              0.0961976,
              0.0119872,
              0.0634438
            ],
            q: [
              0,
              0,
              0.1503982,
              0.9886255
            ]
          },
          {
            c: [
              0.085,
              -5752e-7,
              0.0834976
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0543627
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.083878,
              -75e-5,
              -0.0243052
            ],
            size: [
              0.1766648,
              0.0119872,
              0.052047
            ],
            q: [
              -0.1063475,
              -0.6990638,
              0.1063475,
              0.6990638
            ]
          },
          {
            c: [
              -1788e-7,
              -0.0272387,
              -642e-6
            ],
            size: [
              0.2202951,
              0.0101977,
              0.2201134
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2SlopeInverted",
        display: "1x2 45\xB0 Slope (I)",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:61",
        model: {
          folder: "Slopes/Slope_1x2_Inverted",
          name: "Slope_1x2_Inverted",
          shape: "slope_inverted",
          size: [
            2,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Slopes/Slope_1x2_Inverted/Slope_1x2_Inverted_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x2_Inverted/Slope_1x2_Inverted_Complete.fbx"
            ],
            hollow: [
              "Slopes/Slope_1x2_Inverted/Slope_1x2_Inverted_HollowBody.fbx"
            ],
            solid: [
              "Slopes/Slope_1x2_Inverted/Slope_1x2_Inverted_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0265992,
              -5752e-7,
              0
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6823e-7,
              0.0272387,
              0
            ],
            size: [
              0.1080677,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0198149,
              5684e-7,
              0
            ],
            size: [
              0.077565,
              0.0180568,
              0.0530404
            ],
            q: [
              0,
              0,
              -0.35323,
              0.9355366
            ]
          }
        ],
        rootBox: {
          c: [
            -5459e-7,
            -8015e-7,
            0
          ],
          size: [
            0.1077949,
            0.0613872,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -6823e-7,
              0.0272387,
              0
            ],
            size: [
              0.1080677,
              0.0101977,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -5459e-7,
              -8015e-7,
              0
            ],
            size: [
              0.1077949,
              0.0613872,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0191015,
              -599e-7,
              0
            ],
            size: [
              0.0756638,
              0.0180568,
              0.0530404
            ],
            q: [
              0,
              0,
              -0.35323,
              0.9355366
            ]
          },
          {
            c: [
              0.0265992,
              -5752e-7,
              0
            ],
            size: [
              0.0535047,
              0.0618398,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1-2_3Slope",
        display: "1x1 2/3 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          -90,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:62",
        model: {
          folder: "Slopes/Slope_1x1x2-3",
          name: "Slope_1x1x2-3",
          shape: "slope",
          size: [
            1,
            1
          ],
          heightPlates: 2,
          bottomPlates: -1.5,
          studs: [],
          complete: "BrickModels/Slopes/Slope_1x1x2-3/Slope_1x1x2-3_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x1x2-3/Slope_1x1x2-3_Complete.fbx"
            ],
            solid: [
              "Slopes/Slope_1x1x2-3/Slope_1x1x2-3_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0249625,
              -0.0137104,
              0
            ],
            size: [
              17834e-7,
              0.0401059,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -2718e-7,
              -0.0304913,
              0
            ],
            size: [
              0.0531682,
              89582e-7,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6961e-7,
              -0.0140537,
              34698e-7
            ],
            size: [
              0.0610568,
              58878e-7,
              0.0461008
            ],
            q: [
              0,
              0,
              0.2840153,
              0.9588197
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            29e-7,
            0
          ],
          size: [
            0.053169,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -2718e-7,
              -0.0304913,
              0
            ],
            size: [
              0.0531682,
              89582e-7,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0251071,
              -0.0130327,
              0
            ],
            size: [
              20726e-7,
              0.0414613,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -11183e-7,
              -0.0143279,
              34698e-7
            ],
            size: [
              0.0600499,
              58878e-7,
              0.0461008
            ],
            q: [
              0,
              0,
              0.2840153,
              0.9588197
            ]
          }
        ]
      },
      {
        prefab: "1x4-2_3Slope",
        display: "1x4 2/3 Slope",
        category: "slopes",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          -90,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:63",
        model: {
          folder: "Slopes/Slope_1x4x2-3",
          name: "Slope_1x4x2-3",
          shape: "slope",
          size: [
            1,
            4
          ],
          heightPlates: 2,
          bottomPlates: -1.5,
          studs: [],
          complete: "BrickModels/Slopes/Slope_1x4x2-3/Slope_1x4x2-3_Complete",
          files: {
            complete: [
              "Slopes/Slope_1x4x2-3/Slope_1x4x2-3_Complete.fbx"
            ],
            solid: [
              "Slopes/Slope_1x4x2-3/Slope_1x4x2-3_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "2",
            p: [
              0,
              -0.0362,
              0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0,
              -0.0362,
              -0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0.0841127
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0,
              -0.0362,
              -0.0280376
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0254486,
              -0.0130327,
              77e-6
            ],
            size: [
              27555e-7,
              0.0414613,
              0.216444
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -2718e-7,
              -0.0304913,
              8394e-7
            ],
            size: [
              0.0531682,
              89582e-7,
              0.2169927
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -10098e-7,
              -0.0142575,
              -714e-7
            ],
            size: [
              0.0603085,
              58878e-7,
              0.217541
            ],
            q: [
              0,
              0,
              0.2840153,
              0.9588197
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            -0.0112094,
            -4992e-7
          ],
          size: [
            0.053169,
            0.0413825,
            0.2164594
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -2718e-7,
              -0.0299535,
              8394e-7
            ],
            size: [
              0.0531682,
              78826e-7,
              0.2169927
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              -0.0112094,
              -4992e-7
            ],
            size: [
              0.053169,
              0.0413825,
              0.2164594
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              7237e-7,
              -0.0131317,
              -714e-7
            ],
            size: [
              0.0614658,
              58878e-7,
              0.217541
            ],
            q: [
              0,
              0,
              0.2840153,
              0.9588197
            ]
          },
          {
            c: [
              0.0254486,
              -0.0130327,
              77e-6
            ],
            size: [
              27555e-7,
              0.0414613,
              0.216444
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Window",
        display: "1x2 Window",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:64",
        model: {
          folder: "Windows/Window_1x2",
          name: "Window_1x2",
          shape: "window",
          size: [
            2,
            1
          ],
          heightPlates: 6,
          bottomPlates: -3,
          studs: "all",
          complete: "BrickModels/Windows/Window_1x2/Window_1x2_Complete",
          files: {
            complete: [
              "Windows/Window_1x2/Window_1x2_Complete.fbx"
            ],
            hollow: [
              "Windows/Window_1x2/Window_1x2_HollowBody.fbx"
            ],
            hollow_nobevel: [
              "Windows/Window_1x2/Window_1x2_HollowBody_NoBevel.fbx"
            ],
            solid: [
              "Windows/Window_1x2/Window_1x2_SolidBody.fbx"
            ],
            solid_nobevel: [
              "Windows/Window_1x2/Window_1x2_SolidBody_NoBevel.fbx"
            ]
          }
        },
        tile: false,
        window: true,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0695,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0813,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0695,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0813,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -5459e-7,
              -12162e-7,
              0
            ],
            size: [
              0.1077949,
              0.1295007,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -5459e-7,
            -12162e-7,
            0
          ],
          size: [
            0.1077949,
            0.1295007,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -5459e-7,
              -12162e-7,
              0
            ],
            size: [
              0.1077949,
              0.1295007,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "FlatPlant",
        display: "Flat Plant",
        category: "misc",
        picker: true,
        uiScale: 1.3,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:65",
        model: {
          folder: "Plants/Plant_Green_Flat",
          name: "Plant_Green_Flat",
          shape: "plant_flat",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Plants/Plant_Green_Flat",
          files: {
            complete: [
              "Plants/Plant_Green_Flat.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            385e-7,
            -4315e-7,
            -1271e-7
          ],
          size: [
            0.0526874,
            0.0202081,
            0.0531516
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "ThreeLeafedPlant",
        display: "3-Leafed Plant",
        category: "misc",
        picker: true,
        uiScale: 1.3,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:66",
        model: {
          folder: "Plants/Plant_Green_MediumHeight",
          name: "Plant_Green_MediumHeight",
          shape: "plant_three_leaf",
          size: [
            1,
            1
          ],
          heightPlates: 1,
          bottomPlates: -0.5,
          studs: [],
          complete: "BrickModels/Plants/Plant_Green_MediumHeight",
          files: {
            complete: [
              "Plants/Plant_Green_MediumHeight.fbx"
            ]
          }
        },
        tile: true,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.014,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            385e-7,
            -4315e-7,
            -1271e-7
          ],
          size: [
            0.0526874,
            0.0202081,
            0.0531516
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              385e-7,
              -4315e-7,
              -1271e-7
            ],
            size: [
              0.0526874,
              0.0202081,
              0.0531516
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1_1FaceSideStud",
        display: "1x1 (1 face)",
        category: "side_studs",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          180,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:67",
        model: {
          folder: "SideStudBricks/Brick_1x1_1FaceSideStud",
          name: "Brick_1x1_1FaceSideStud",
          shape: "box",
          size: [
            1,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/SideStudBricks/Brick_1x1_1FaceSideStud/Brick_1x1_1FaceSideStud_Complete",
          files: {
            complete: [
              "SideStudBricks/Brick_1x1_1FaceSideStud/Brick_1x1_1FaceSideStud_Complete.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "2",
            p: [
              0,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            29e-7,
            0
          ],
          size: [
            0.053169,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2_1FaceSideStud",
        display: "1x2 (1 face)",
        category: "side_studs",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          180,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:68",
        model: {
          folder: "SideStudBricks/Brick_1x2_1FaceSideStud",
          name: "Brick_1x2_1FaceSideStud",
          shape: "box",
          size: [
            2,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/SideStudBricks/Brick_1x2_1FaceSideStud/Brick_1x2_1FaceSideStud_Complete",
          files: {
            complete: [
              "SideStudBricks/Brick_1x2_1FaceSideStud/Brick_1x2_1FaceSideStud_Complete.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "4",
            p: [
              -0.0280376,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -3782e-7,
              29e-7,
              0
            ],
            size: [
              0.109642,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -3782e-7,
            29e-7,
            0
          ],
          size: [
            0.109642,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -3782e-7,
              29e-7,
              0
            ],
            size: [
              0.109642,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4_1FaceSideStud",
        display: "1x4 (1 face)",
        category: "side_studs",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          180,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:69",
        model: {
          folder: "SideStudBricks/Brick_1x4_1FaceSideStud",
          name: "Brick_1x4_1FaceSideStud",
          shape: "box",
          size: [
            4,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/SideStudBricks/Brick_1x4_1FaceSideStud/Brick_1x4_1FaceSideStud_Complete",
          files: {
            complete: [
              "SideStudBricks/Brick_1x4_1FaceSideStud/Brick_1x4_1FaceSideStud_Complete.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "2",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0280376,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              -0.0280376,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0841127,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "8",
            p: [
              -0.0841127,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -4419e-7,
              29e-7,
              0
            ],
            size: [
              0.221065,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -4419e-7,
            29e-7,
            0
          ],
          size: [
            0.221065,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -4419e-7,
              29e-7,
              0
            ],
            size: [
              0.221065,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x2Masonry",
        display: "1x2 Masonry",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:70",
        model: {
          folder: "Bricks_Masonry/Brick_1x2_Masonry",
          name: "Brick_1x2_Masonry",
          shape: "masonry",
          size: [
            2,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks_Masonry/Brick_1x2_Masonry/Brick_1x2_Masonry_Complete",
          files: {
            complete: [
              "Bricks_Masonry/Brick_1x2_Masonry/Brick_1x2_Masonry_Complete.fbx"
            ],
            hollow: [
              "Bricks_Masonry/Brick_1x2_Masonry/Brick_1x2_Masonry_HollowBody.fbx"
            ],
            solid: [
              "Bricks_Masonry/Brick_1x2_Masonry/Brick_1x2_Masonry_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              -5459e-7,
              4942e-7,
              0
            ],
            size: [
              0.1077949,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -5459e-7,
            4942e-7,
            0
          ],
          size: [
            0.1077949,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -5459e-7,
              4942e-7,
              0
            ],
            size: [
              0.1077949,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4Masonry",
        display: "1x4 Masonry",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:71",
        model: {
          folder: "Bricks_Masonry/Brick_1x4_Masonry",
          name: "Brick_1x4_Masonry",
          shape: "masonry",
          size: [
            4,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Bricks_Masonry/Brick_1x4_Masonry/Brick_1x4_Masonry_Complete",
          files: {
            complete: [
              "Bricks_Masonry/Brick_1x4_Masonry/Brick_1x4_Masonry_Complete.fbx"
            ],
            hollow: [
              "Bricks_Masonry/Brick_1x4_Masonry/Brick_1x4_Masonry_HollowBody.fbx"
            ],
            solid: [
              "Bricks_Masonry/Brick_1x4_Masonry/Brick_1x4_Masonry_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "4",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "5",
            p: [
              -0.0280376,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              4942e-7,
              0
            ],
            size: [
              0.2226001,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            4942e-7,
            0
          ],
          size: [
            0.2226001,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              4942e-7,
              0
            ],
            size: [
              0.2226001,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x3Arch",
        display: "1x3 Arch",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:72",
        model: {
          folder: "Arches/Brick_1x3_Arch",
          name: "Brick_1x3_Arch",
          shape: "arch",
          size: [
            3,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Arches/Brick_1x3_Arch/Brick_1x3_Arch_Complete",
          files: {
            complete: [
              "Arches/Brick_1x3_Arch/Brick_1x3_Arch_Complete.fbx"
            ],
            hollow: [
              "Arches/Brick_1x3_Arch/Brick_1x3_Arch_HollowBody.fbx"
            ],
            solid: [
              "Arches/Brick_1x3_Arch/Brick_1x3_Arch_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              -0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0560751,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "3",
            p: [
              0.0560751,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              -0.0560751,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0570046,
              -17093e-7,
              0
            ],
            size: [
              0.0511142,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6835e-7,
              0.0195216,
              0
            ],
            size: [
              0.1667901,
              0.0211546,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0568685,
              -17093e-7,
              0
            ],
            size: [
              0.0513865,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -6149e-7,
            29e-7,
            0
          ],
          size: [
            0.1648138,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.0568685,
              -17093e-7,
              0
            ],
            size: [
              0.0513865,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0570046,
              -17093e-7,
              0
            ],
            size: [
              0.0511142,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6149e-7,
              29e-7,
              0
            ],
            size: [
              0.1648138,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -6835e-7,
              0.0195216,
              0
            ],
            size: [
              0.1667901,
              0.0211546,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x4Arch",
        display: "1x4 Arch",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:73",
        model: {
          folder: "Arches/Brick_1x4_Arch",
          name: "Brick_1x4_Arch",
          shape: "arch",
          size: [
            4,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Arches/Brick_1x4_Arch/Brick_1x4_Arch_Complete",
          files: {
            complete: [
              "Arches/Brick_1x4_Arch/Brick_1x4_Arch_Complete.fbx"
            ],
            hollow: [
              "Arches/Brick_1x4_Arch/Brick_1x4_Arch_HollowBody.fbx"
            ],
            solid: [
              "Arches/Brick_1x4_Arch/Brick_1x4_Arch_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "6",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "4",
            p: [
              0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "6",
            p: [
              -0.0841127,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.0855069,
              -17093e-7,
              0
            ],
            size: [
              0.0511142,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              745e-7,
              0.023608,
              0
            ],
            size: [
              0.2227451,
              0.0129818,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.0853027,
              -17093e-7,
              0
            ],
            size: [
              0.0513865,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            4942e-7,
            0
          ],
          size: [
            0.2226001,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -0.0853027,
              -17093e-7,
              0
            ],
            size: [
              0.0513865,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              745e-7,
              0.023608,
              0
            ],
            size: [
              0.2227451,
              0.0129818,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.0855069,
              -17093e-7,
              0
            ],
            size: [
              0.0511142,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              4942e-7,
              0
            ],
            size: [
              0.2226001,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x6Arch",
        display: "1x6 Arch",
        category: "misc",
        picker: true,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          -0.03,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:74",
        model: {
          folder: "Arches/Brick_1x6_Arch",
          name: "Brick_1x6_Arch",
          shape: "arch",
          size: [
            6,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/Arches/Brick_1x6_Arch/Brick_1x6_Arch_Complete",
          files: {
            complete: [
              "Arches/Brick_1x6_Arch/Brick_1x6_Arch_Complete.fbx"
            ],
            hollow: [
              "Arches/Brick_1x6_Arch/Brick_1x6_Arch_HollowBody.fbx"
            ],
            solid: [
              "Arches/Brick_1x6_Arch/Brick_1x6_Arch_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "3",
            p: [
              -0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "2",
            p: [
              -0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "4",
            p: [
              -0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.0280376,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "6",
            p: [
              0.0841127,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "7",
            p: [
              0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "7",
            p: [
              0.1401878,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              -0.1401878,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0.1409227,
              -17093e-7,
              0
            ],
            size: [
              0.054292,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              298e-6,
              0.0195216,
              0
            ],
            size: [
              0.3317662,
              0.0211546,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.1397311,
              -17093e-7,
              0
            ],
            size: [
              0.0546529,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            -4012e-7,
            4942e-7,
            0
          ],
          size: [
            0.3316568,
            0.0639786,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              -4012e-7,
              4942e-7,
              0
            ],
            size: [
              0.3316568,
              0.0639786,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              298e-6,
              0.0195216,
              0
            ],
            size: [
              0.3317662,
              0.0211546,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              -0.1397311,
              -17093e-7,
              0
            ],
            size: [
              0.0546529,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0.1409227,
              -17093e-7,
              0
            ],
            size: [
              0.054292,
              0.064108,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1Pyramid",
        display: "1x1 Pyramid",
        category: "misc",
        picker: true,
        uiScale: 1.5,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Scripts/BrickData.cs:75",
        model: {
          folder: "Pyramids/Brick_1x1_Pyramid",
          name: "Brick_1x1_Pyramid",
          shape: "pyramid",
          size: [
            1,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: [],
          complete: "BrickModels/Pyramids/Brick_1x1_Pyramid/Brick_1x1_Pyramid_Complete",
          files: {
            complete: [
              "Pyramids/Brick_1x1_Pyramid/Brick_1x1_Pyramid_Complete.fbx"
            ],
            solid: [
              "Pyramids/Brick_1x1_Pyramid/Brick_1x1_Pyramid_SolidBody.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              806e-6,
              0
            ],
            size: [
              423e-5,
              85856e-7,
              423e-5
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              -0.0104028,
              0
            ],
            size: [
              0.0253802,
              93922e-7,
              0.0253802
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              -0.0297465,
              0
            ],
            size: [
              0.051536,
              94043e-7,
              0.051536
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            -0.0144419,
            0
          ],
          size: [
            0.053169,
            0.0349175,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              -0.0297465,
              0
            ],
            size: [
              0.051536,
              94043e-7,
              0.0538415
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              806e-6,
              0
            ],
            size: [
              423e-5,
              85856e-7,
              423e-5
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              -0.0104028,
              0
            ],
            size: [
              0.0253802,
              93922e-7,
              0.0253802
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          },
          {
            c: [
              0,
              -0.0144419,
              0
            ],
            size: [
              0.053169,
              0.0349175,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      },
      {
        prefab: "1x1_4FaceSideStud",
        display: "1x1 (4 side studs)",
        category: "side_studs",
        picker: false,
        uiScale: 1,
        spawnEuler: [
          0,
          0,
          0
        ],
        spawnOffset: [
          0,
          0,
          0
        ],
        source: "Assets/Resources/1x1_4FaceSideStud.prefab",
        model: {
          folder: "SideStudBricks/Brick_1x1_4FaceSideStud",
          name: "Brick_1x1_4FaceSideStud",
          shape: "box",
          size: [
            1,
            1
          ],
          heightPlates: 3,
          bottomPlates: -1.5,
          studs: "all",
          complete: "BrickModels/SideStudBricks/Brick_1x1_4FaceSideStud/Brick_1x1_4FaceSideStud_Complete",
          files: {
            complete: [
              "SideStudBricks/Brick_1x1_4FaceSideStud/Brick_1x1_4FaceSideStud_Complete.fbx"
            ]
          }
        },
        tile: false,
        window: false,
        heightOverride: 0,
        connectors: [
          {
            kind: "male",
            name: "4",
            p: [
              0,
              43681e-7,
              -0.043689
            ],
            q: [
              0,
              -0.7071068,
              0.7071068,
              0
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "5",
            p: [
              0.043689,
              43681e-7,
              0
            ],
            q: [
              -0.5,
              -0.5,
              0.5,
              -0.5
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "3",
            p: [
              -0.043689,
              43681e-7,
              0
            ],
            q: [
              0.5,
              -0.5,
              0.5,
              0.5
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "2",
            p: [
              0,
              0.0484,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "female",
            name: "1",
            p: [
              0,
              -0.0362,
              0
            ],
            q: [
              0,
              0,
              0,
              1
            ],
            scale: 0.04
          },
          {
            kind: "male",
            name: "1",
            p: [
              0,
              43681e-7,
              0.043689
            ],
            q: [
              0.7071068,
              0,
              0,
              0.7071068
            ],
            scale: 0.04
          }
        ],
        heldBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ],
        rootBox: {
          c: [
            0,
            29e-7,
            0
          ],
          size: [
            0.053169,
            0.063807,
            0.0530404
          ],
          q: [
            0,
            0,
            0,
            1
          ]
        },
        placedBoxes: [
          {
            c: [
              0,
              29e-7,
              0
            ],
            size: [
              0.053169,
              0.063807,
              0.0530404
            ],
            q: [
              0,
              0,
              0,
              1
            ]
          }
        ]
      }
    ]
  };

  // src/Lattice.ts
  var U_PER_STUD = 80;
  var U_PER_PLATE = 32;
  var UPSTREAM_WORLD_PER_U = 7e-4;
  var MESH_M_PER_U = 1e-4;
  function upstreamToU(v) {
    return [v[0] / UPSTREAM_WORLD_PER_U, v[1] / UPSTREAM_WORLD_PER_U, v[2] / UPSTREAM_WORLD_PER_U];
  }
  function qmul(a, b) {
    return [
      a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
      a[3] * b[1] + a[1] * b[3] + a[2] * b[0] - a[0] * b[2],
      a[3] * b[2] + a[2] * b[3] + a[0] * b[1] - a[1] * b[0],
      a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
    ];
  }
  function qinv(q) {
    return [-q[0], -q[1], -q[2], q[3]];
  }
  function qrot(q, v) {
    const [x, y, z, w] = q;
    const tx = 2 * (y * v[2] - z * v[1]);
    const ty = 2 * (z * v[0] - x * v[2]);
    const tz = 2 * (x * v[1] - y * v[0]);
    return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
  }
  function qnorm(q) {
    const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  }
  function qeuler(x, y, z) {
    const r = Math.PI / 360;
    const qx = [Math.sin(x * r), 0, 0, Math.cos(x * r)];
    const qy = [0, Math.sin(y * r), 0, Math.cos(y * r)];
    const qz = [0, 0, Math.sin(z * r), Math.cos(z * r)];
    return qmul(qmul(qy, qx), qz);
  }
  function qangle(a, b) {
    const dot = Math.min(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]), 1);
    return dot > 1 - 1e-6 ? 0 : Math.acos(dot) * 2 * 180 / Math.PI;
  }
  function qeulerAngles(q) {
    const [x, y, z, w] = q;
    const sinX = 2 * (w * x - y * z);
    let ex;
    let ey;
    let ez;
    if (Math.abs(sinX) > 0.9999995) {
      ex = Math.sign(sinX) * Math.PI / 2;
      ey = 2 * Math.atan2(y, w);
      ez = 0;
    } else {
      ex = Math.asin(sinX);
      ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
      ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
    }
    const wrap = (r) => {
      const d = r * 180 / Math.PI % 360;
      return d < 0 ? d + 360 : d;
    };
    return [wrap(ex), wrap(ey), wrap(ez)];
  }
  function qmatrix(q) {
    const [x, y, z, w] = q;
    return [
      1 - 2 * (y * y + z * z),
      2 * (x * y - z * w),
      2 * (x * z + y * w),
      2 * (x * y + z * w),
      1 - 2 * (x * x + z * z),
      2 * (y * z - x * w),
      2 * (x * z - y * w),
      2 * (y * z + x * w),
      1 - 2 * (x * x + y * y)
    ];
  }
  function mapply(m, v) {
    return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
  }
  function mmul(a, b) {
    const out = new Array(9).fill(0);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    return out;
  }
  var UPS = [qeuler(0, 0, 0), qeuler(90, 0, 0), qeuler(180, 0, 0), qeuler(-90, 0, 0), qeuler(0, 0, -90), qeuler(0, 0, 90)];
  function canonical(q) {
    const flip = q[3] < -1e-9 || Math.abs(q[3]) <= 1e-9 && (q[0] < -1e-9 || Math.abs(q[0]) <= 1e-9 && (q[1] < -1e-9 || Math.abs(q[1]) <= 1e-9 && q[2] < 0));
    const r = (n) => Math.abs(n) < 1e-12 ? 0 : n;
    return flip ? [r(-q[0]), r(-q[1]), r(-q[2]), r(-q[3])] : [r(q[0]), r(q[1]), r(q[2]), r(q[3])];
  }
  var ORIS = (() => {
    const out = [];
    for (let up = 0; up < 6; up++) {
      for (let yaw = 0; yaw < 4; yaw++) {
        const q = canonical(qnorm(qmul(UPS[up], qeuler(0, 90 * yaw, 0))));
        const m = qmatrix(q).map((v) => Math.round(v));
        out.push({ index: out.length, m, q });
      }
    }
    return out;
  })();
  var BY_MATRIX = new Map(ORIS.map((o) => [o.m.join(","), o.index]));
  function oriOfMatrix(m) {
    const i = BY_MATRIX.get(m.map((v) => Math.round(v)).join(","));
    if (i === void 0) throw new Error("not a cube rotation: " + m.join(","));
    return i;
  }
  function oriMul(a, b) {
    return oriOfMatrix(mmul(ORIS[a].m, ORIS[b].m));
  }
  function oriInv(a) {
    const m = ORIS[a].m;
    return oriOfMatrix([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
  }
  function nearestOri(q) {
    let best = 0;
    let bestDot = -1;
    for (const o of ORIS) {
      const d = Math.abs(o.q[0] * q[0] + o.q[1] * q[1] + o.q[2] * q[2] + o.q[3] * q[3]);
      if (d > bestDot + 1e-9) {
        bestDot = d;
        best = o.index;
      }
    }
    return best;
  }
  var ORI_Y180 = 2;
  function oriApply(o, v) {
    return mapply(ORIS[o].m, v);
  }
  function isUpright(o) {
    return o < 4;
  }
  function obbBounds(b) {
    const m = qmatrix(b.q);
    const e = [0, 0, 0];
    for (let r = 0; r < 3; r++) e[r] = Math.abs(m[r * 3]) * b.h[0] + Math.abs(m[r * 3 + 1]) * b.h[1] + Math.abs(m[r * 3 + 2]) * b.h[2];
    return { min: [b.c[0] - e[0], b.c[1] - e[1], b.c[2] - e[2]], max: [b.c[0] + e[0], b.c[1] + e[1], b.c[2] + e[2]] };
  }
  function obbOverlap(a, b, eps = 1e-6) {
    const A = qmatrix(a.q);
    const B = qmatrix(b.q);
    const ax = [[A[0], A[3], A[6]], [A[1], A[4], A[7]], [A[2], A[5], A[8]]];
    const bx = [[B[0], B[3], B[6]], [B[1], B[4], B[7]], [B[2], B[5], B[8]]];
    const t = [b.c[0] - a.c[0], b.c[1] - a.c[1], b.c[2] - a.c[2]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const R = [];
    const AbsR = [];
    for (let i = 0; i < 3; i++) {
      R.push([]);
      AbsR.push([]);
      for (let j = 0; j < 3; j++) {
        R[i].push(dot(ax[i], bx[j]));
        AbsR[i].push(Math.abs(R[i][j]) + 1e-9);
      }
    }
    const T = [dot(t, ax[0]), dot(t, ax[1]), dot(t, ax[2])];
    for (let i = 0; i < 3; i++) {
      const ra = a.h[i];
      const rb = b.h[0] * AbsR[i][0] + b.h[1] * AbsR[i][1] + b.h[2] * AbsR[i][2];
      if (Math.abs(T[i]) >= ra + rb - eps) return false;
    }
    for (let j = 0; j < 3; j++) {
      const ra = a.h[0] * AbsR[0][j] + a.h[1] * AbsR[1][j] + a.h[2] * AbsR[2][j];
      const rb = b.h[j];
      const tj = T[0] * R[0][j] + T[1] * R[1][j] + T[2] * R[2][j];
      if (Math.abs(tj) >= ra + rb - eps) return false;
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const i1 = (i + 1) % 3;
        const i2 = (i + 2) % 3;
        const j1 = (j + 1) % 3;
        const j2 = (j + 2) % 3;
        const ra = a.h[i1] * AbsR[i2][j] + a.h[i2] * AbsR[i1][j];
        const rb = b.h[j1] * AbsR[i][j2] + b.h[j2] * AbsR[i][j1];
        const tv = T[i2] * R[i1][j] - T[i1] * R[i2][j];
        if (Math.abs(tv) > ra + rb) return false;
      }
    }
    return true;
  }
  function placeObb(local, pos, q) {
    const c = qrot(q, local.c);
    return { c: [c[0] + pos[0], c[1] + pos[1], c[2] + pos[2]], h: local.h, q: qmul(q, local.q) };
  }

  // src/BrickData.ts
  var CONNECTOR_TRIGGER_HALF = 0.02 / 7e-4;
  var CONNECTOR_COVER_HALF = 0.01 / 7e-4;
  function snapLateral(v) {
    const half = U_PER_STUD / 2;
    const r = Math.round(v / half) * half;
    return Math.abs(r - v) <= 1 ? r : Math.round(v);
  }
  function toObb(b) {
    return { c: upstreamToU(b.c), h: [b.size[0] / 7e-4 / 2, b.size[1] / 7e-4 / 2, b.size[2] / 7e-4 / 2], q: [b.q[0], b.q[1], b.q[2], b.q[3]] };
  }
  function build(raw, type) {
    const size = [raw.model.size[0], raw.model.size[1]];
    const top = (raw.model.bottomPlates + raw.model.heightPlates) * U_PER_PLATE;
    const bottom = raw.model.bottomPlates * U_PER_PLATE;
    const half = [size[0] * U_PER_STUD / 2, 0, size[1] * U_PER_STUD / 2];
    const connectors = raw.connectors.map((c, index) => {
      const q = [c.q[0], c.q[1], c.q[2], c.q[3]];
      const ori = nearestOri(q);
      const up = oriApply(ori, [0, 1, 0]).map((v) => Math.round(v));
      const probe = upstreamToU(c.p).map((v) => Math.round(v * 100) / 100);
      const male = c.kind === "male";
      let mate;
      if (up[1] === 1 || up[1] === -1) {
        mate = [snapLateral(probe[0]), male ? top : bottom, snapLateral(probe[2])];
      } else {
        mate = [0, 0, 0];
        for (let i = 0; i < 3; i++) mate[i] = up[i] !== 0 ? up[i] * half[i] : snapLateral(probe[i]);
      }
      return { index, male, name: c.name, ori, up, mate, probe, q };
    });
    const placedBoxes = raw.placedBoxes.map(toObb);
    const heldBoxes = raw.heldBoxes.map(toObb);
    const boundsMin = [Infinity, Infinity, Infinity];
    const boundsMax = [-Infinity, -Infinity, -Infinity];
    for (const b of placedBoxes.length ? placedBoxes : heldBoxes) {
      const r = Math.hypot(b.h[0], b.h[1], b.h[2]);
      for (let i = 0; i < 3; i++) {
        boundsMin[i] = Math.min(boundsMin[i], b.c[i] - r);
        boundsMax[i] = Math.max(boundsMax[i], b.c[i] + r);
      }
    }
    return {
      type,
      prefab: raw.prefab,
      display: raw.display,
      category: raw.category,
      picker: raw.picker,
      uiScale: raw.uiScale,
      spawnEuler: [raw.spawnEuler[0], raw.spawnEuler[1], raw.spawnEuler[2]],
      spawnOffset: [raw.spawnOffset[0], raw.spawnOffset[1], raw.spawnOffset[2]],
      source: raw.source,
      size,
      heightPlates: raw.model.heightPlates,
      bottomPlates: raw.model.bottomPlates,
      tile: raw.tile,
      window: raw.window,
      meshes: { complete: raw.model.complete, files: raw.model.files },
      connectors,
      males: connectors.filter((c) => c.male),
      females: connectors.filter((c) => !c.male),
      heldBoxes,
      placedBoxes,
      boundsMin,
      boundsMax
    };
  }
  var RAW = catalogue_default.bricks;
  var BRICKS = RAW.map(build);
  var BY_PREFAB = new Map(BRICKS.map((b) => [b.prefab, b]));
  function BrickByPrefabName(prefabName) {
    return BY_PREFAB.get(prefabName) ?? null;
  }
  function BricksForCategory(category) {
    return BRICKS.filter((b) => b.picker && b.category === category);
  }
  var CATEGORIES = ["bricks", "plates", "tiles", "slopes", "side_studs", "misc"];

  // src/BrickLog.ts
  var BrickLog = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Author keys the records point at (index 0 is this log's author). */
      __publicField(this, "a", []);
      /** Records (BrickRecords.ts). */
      __publicField(this, "r", "");
    }
    OnDeserialization() {
      this.FindBehavioursOfType("BuildArea")[0]?.LogChanged();
    }
  };
  __publicField(BrickLog, "perPlayer", true);
  __publicField(BrickLog, "synced", ["a", "r"]);

  // src/BrickSegment.ts
  var BrickSegment = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Position in the archive (bindings field). */
      __publicField(this, "index", 0);
      __publicField(this, "a", []);
      __publicField(this, "r", "");
    }
    OnDeserialization() {
      this.FindBehavioursOfType("BuildArea")[0]?.SegmentChanged();
    }
  };
  __publicField(BrickSegment, "synced", ["a", "r"]);

  // src/BrickAttachDetector.ts
  function probeAt(pos, q, c) {
    const p = qrot(q, c.probe);
    return [p[0] + pos[0], p[1] + pos[1], p[2] + pos[2]];
  }
  function closest(probe, touching) {
    let partner = null;
    let distance = 100 / 7e-4;
    for (const t of touching) {
      const d = dist(probe, t.probe);
      if (d < distance) {
        partner = t;
        distance = d;
      }
    }
    return { partner, distance };
  }
  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
  function partnerKey(c) {
    return c.brick ? `${c.brick}/${c.index}` : `floor/${c.mate[0]},${c.mate[2]}`;
  }
  function withConnections(store, held, connectors) {
    const out = [];
    for (const c of connectors) {
      const probe = probeAt(held.pos, held.q, c);
      const touching = store.touching(probe, qmul(held.q, c.q), !c.male);
      const { partner, distance } = closest(probe, touching);
      if (partner) out.push({ connector: c, partner, distance, touching });
    }
    return out;
  }
  function ValidConnections(pairs) {
    if (pairs.length <= 1) return pairs;
    const map = /* @__PURE__ */ new Map();
    for (const pair of pairs) {
      const key = partnerKey(pair.partner);
      const seen = map.get(key);
      if (!seen || pair.distance < seen.distance) map.set(key, pair);
    }
    return [...map.values()];
  }
  function GetNewRot(partnerOri, heldFrame) {
    const candidates = [0, 1, 2, 3].map((k2) => oriMul(partnerOri, k2));
    const diffs = candidates.map((o) => qangle(ORIS[o].q, heldFrame));
    const maxDiff = Math.max(...diffs);
    const k = diffs.indexOf(maxDiff);
    return oriMul(candidates[k], 2);
  }
  function heldBoxesAt(type, pos, ori) {
    const q = ORIS[ori].q;
    return BRICKS[type].heldBoxes.map((b) => placeObb(b, pos, q));
  }
  function untilting(store, partner) {
    const b = partner.brick ? store.bricks.get(partner.brick) : void 0;
    if (!b) return (t) => t;
    const be = qeulerAngles(ORIS[b.ori].q);
    const ce = qeulerAngles(b.def.connectors[partner.index].q);
    const tilted = nearestOri(qeuler(-ce[0], be[1], -ce[2]));
    const back = oriInv(oriMul(tilted, oriInv(b.ori)));
    if (back === 0) return (t) => t;
    const P = b.pos;
    const move = (v) => {
      const r = oriApply(back, [v[0] - P[0], v[1] - P[1], v[2] - P[2]]);
      return [r[0] + P[0], r[1] + P[1], r[2] + P[2]];
    };
    return (t) => ({ ...t, mate: move(t.mate), probe: move(t.probe), ori: oriMul(back, t.ori), q: ORIS[oriMul(back, t.ori)].q });
  }
  function CheckIfCanConnect(store, held, allowed = true) {
    if (!allowed) return null;
    const def = BRICKS[held.type];
    if (!def) return null;
    const validFemale = ValidConnections(withConnections(store, held, def.females));
    const validMale = ValidConnections(withConnections(store, held, def.males));
    const downwards = validFemale.length > validMale.length;
    const use = downwards ? validFemale : validMale;
    if (use.length === 0) return null;
    const first = use[0];
    const c = first.connector;
    const frame = GetNewRot(first.partner.ori, qmul(held.q, c.q));
    const ori = oriMul(frame, oriInv(c.ori));
    const midOri = oriMul(oriMul(frame, ORI_Y180), oriInv(c.ori));
    const untilt = untilting(store, first.partner);
    const seen = first.touching.map((t) => t.brick === first.partner.brick ? t : untilt(t));
    const partner = closest(probeAt(held.pos, ORIS[midOri].q, c), seen).partner ?? first.partner;
    const m = oriApply(ori, c.mate);
    const pos = [partner.mate[0] - m[0], partner.mate[1] - m[1], partner.mate[2] - m[2]];
    const boxes = heldBoxesAt(held.type, pos, ori);
    if (!store.inside(boxes) || store.collides(boxes)) return null;
    return { pos, ori, downwards, connector: c.index, partner };
  }

  // src/ChunkedRenderer.ts
  var CHUNK_X = 16 * U_PER_STUD;
  var CHUNK_Y = 48 * U_PER_PLATE;
  var CHUNK_Z = 16 * U_PER_STUD;
  function chunkOf(pos) {
    return `${Math.floor(pos[0] / CHUNK_X)},${Math.floor(pos[1] / CHUNK_Y)},${Math.floor(pos[2] / CHUNK_Z)}`;
  }
  function renderBrick(b, performanceMode = false) {
    const def = BRICKS[b.type];
    let studs = 0;
    let key = def.prefab;
    def.males.forEach((c, i) => {
      if (b.covered[c.index]) studs |= 1 << i;
    });
    const allFemaleCovered = def.females.every((c) => b.covered[c.index]);
    if (performanceMode) {
      key += "perfmode";
    } else {
      for (const c of def.males) key += b.covered[c.index] ? "Y" : "N";
      if (allFemaleCovered || b.onFloor) key += "-bottomcovered";
    }
    return {
      id: b.id,
      type: b.type,
      pos: [b.pos[0], b.pos[1], b.pos[2]],
      rot: ORIS[b.ori].q,
      ori: b.ori,
      rgb: b.color & 16777215,
      texOffset: b.texOffset,
      studsCovered: performanceMode ? (1 << def.males.length) - 1 : studs,
      bottomClosed: performanceMode || allFemaleCovered || b.onFloor,
      tubesHidden: performanceMode || allFemaleCovered,
      cacheKey: key
    };
  }
  function renderChunk(key, bricks, performanceMode = false) {
    const sorted = bricks.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    return { key, bricks: sorted.map((b) => renderBrick(b, performanceMode)) };
  }

  // src/BrickStore.ts
  function isAligned(q) {
    const o = ORIS[nearestOri(q)].q;
    return Math.abs(o[0] * q[0] + o[1] * q[1] + o[2] * q[2] + o[3] * q[3]) > 1 - 1e-9;
  }
  function boxInfo(box) {
    const bb = obbBounds(box);
    return { box, min: bb.min, max: bb.max, aligned: isAligned(box.q) };
  }
  function infoOverlap(a, b, eps = 1e-6) {
    for (let i = 0; i < 3; i++) if (a.min[i] > b.max[i] - eps || b.min[i] > a.max[i] - eps) return false;
    if (a.aligned && b.aligned) return true;
    return obbOverlap(a.box, b.box, eps);
  }
  var FLOOR_PROBE_Y = 0.0148 / 7e-4;
  var CELL = 4 * U_PER_STUD;
  function cellKey(x, y, z) {
    return ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
  }
  function hashUnit(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return (h >>> 0) % 1e4 / 1e4;
  }
  function aabbOverlap(aMin, aMax, bMin, bMax) {
    return aMin[0] < bMax[0] && bMin[0] < aMax[0] && aMin[1] < bMax[1] && bMin[1] < aMax[1] && aMin[2] < bMax[2] && bMin[2] < aMax[2];
  }
  var BrickStore = class _BrickStore {
    constructor(bounds) {
      __publicField(this, "bricks", /* @__PURE__ */ new Map());
      __publicField(this, "bounds");
      __publicField(this, "cells", /* @__PURE__ */ new Map());
      __publicField(this, "stamp", 0);
      __publicField(this, "chunks", /* @__PURE__ */ new Map());
      __publicField(this, "dirty", /* @__PURE__ */ new Set());
      /** Work done, for the tests' budget checks. */
      __publicField(this, "stats", { boxTests: 0, coverUpdates: 0 });
      this.bounds = bounds;
    }
    get count() {
      return this.bricks.size;
    }
    // ---- building ---------------------------------------------------------------------------------------------------
    /** Where a brick of a type would be: its boxes, bounds and connectors (nothing is stored). */
    static shape(p) {
      const def = BRICKS[p.type];
      if (!def) throw new Error(`no brick type ${p.type}`);
      const q = ORIS[p.ori].q;
      const boxes = def.placedBoxes.map((b) => placeObb(b, p.pos, q));
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (const b of boxes) {
        const bb = obbBounds(b);
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i], bb.min[i]);
          max[i] = Math.max(max[i], bb.max[i]);
        }
      }
      const connectors = def.connectors.map((c) => {
        const m = oriApply(p.ori, c.mate);
        const pr = qrot(q, c.probe);
        const ori = oriMul(p.ori, c.ori);
        return {
          brick: p.id,
          index: c.index,
          male: c.male,
          mate: [m[0] + p.pos[0], m[1] + p.pos[1], m[2] + p.pos[2]],
          probe: [pr[0] + p.pos[0], pr[1] + p.pos[1], pr[2] + p.pos[2]],
          ori,
          q: ORIS[ori].q
        };
      });
      const r = CONNECTOR_TRIGGER_HALF * Math.sqrt(3);
      const reachMin = [min[0], min[1], min[2]];
      const reachMax = [max[0], max[1], max[2]];
      for (const c of connectors) {
        for (let i = 0; i < 3; i++) {
          reachMin[i] = Math.min(reachMin[i], c.probe[i] - r);
          reachMax[i] = Math.max(reachMax[i], c.probe[i] + r);
        }
      }
      return { def, boxes, infos: boxes.map(boxInfo), min, max, reachMin, reachMax, connectors };
    }
    /** Adds a placed brick (replacing one with the same id). `recalc` false defers cover updates to `recalculateAll`. */
    add(p, recalc = true) {
      if (this.bricks.has(p.id)) this.remove(p.id, recalc);
      const shape = _BrickStore.shape(p);
      const brick = {
        ...p,
        pos: [p.pos[0], p.pos[1], p.pos[2]],
        ...shape,
        covered: shape.connectors.map(() => false),
        onFloor: isUpright(p.ori) && p.pos[1] + shape.def.bottomPlates * U_PER_PLATE === 0,
        chunk: chunkOf(p.pos),
        texOffset: hashUnit(p.id),
        mark: 0
      };
      this.bricks.set(p.id, brick);
      this.forCells(brick.reachMin, brick.reachMax, (k) => {
        let list = this.cells.get(k);
        if (!list) this.cells.set(k, list = []);
        list.push(brick);
      });
      let members = this.chunks.get(brick.chunk);
      if (!members) this.chunks.set(brick.chunk, members = /* @__PURE__ */ new Set());
      members.add(p.id);
      this.dirty.add(brick.chunk);
      if (recalc) this.recalculateAround(brick.min, brick.max);
      return brick;
    }
    remove(id, recalc = true) {
      const brick = this.bricks.get(id);
      if (!brick) return null;
      this.bricks.delete(id);
      this.forCells(brick.reachMin, brick.reachMax, (k) => {
        const list = this.cells.get(k);
        if (list) {
          const at = list.indexOf(brick);
          if (at >= 0) list.splice(at, 1);
          if (!list.length) this.cells.delete(k);
        }
      });
      const members = this.chunks.get(brick.chunk);
      if (members) {
        members.delete(id);
        if (!members.size) this.chunks.delete(brick.chunk);
      }
      this.dirty.add(brick.chunk);
      if (recalc) this.recalculateAround(brick.min, brick.max);
      return brick;
    }
    clear() {
      for (const b of this.bricks.values()) this.dirty.add(b.chunk);
      this.bricks.clear();
      this.cells.clear();
      this.chunks.clear();
    }
    /** Every cover flag from scratch (after a bulk load). */
    recalculateAll() {
      for (const b of this.bricks.values()) this.recalculate(b);
    }
    // ---- queries ----------------------------------------------------------------------------------------------------
    /** Bricks whose box bounds (or, with `reach`, connector-trigger bounds) meet the box [min, max]. */
    near(min, max, reach = false) {
      const stamp = ++this.stamp;
      const list = [];
      const x0 = Math.floor(min[0] / CELL);
      const x1 = Math.floor(max[0] / CELL);
      const y0 = Math.floor(min[1] / CELL);
      const y1 = Math.floor(max[1] / CELL);
      const z0 = Math.floor(min[2] / CELL);
      const z1 = Math.floor(max[2] / CELL);
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          for (let z = z0; z <= z1; z++) {
            const cell = this.cells.get(cellKey(x, y, z));
            if (!cell) continue;
            for (const b of cell) {
              if (b.mark === stamp) continue;
              b.mark = stamp;
              if (reach ? aabbOverlap(min, max, b.reachMin, b.reachMax) : aabbOverlap(min, max, b.min, b.max)) list.push(b);
            }
          }
        }
      }
      return list;
    }
    /** BrickAttachDetector.CollidesWithBricks against placed bricks: does any box overlap a placed brick's colliders? */
    collides(boxes, ignore = null) {
      for (const box of boxes) {
        const info = boxInfo(box);
        for (const other of this.near(info.min, info.max)) {
          if (other.id === ignore) continue;
          for (const ob of other.infos) {
            this.stats.boxTests++;
            if (infoOverlap(info, ob)) return true;
          }
        }
      }
      return false;
    }
    /** Whether boxes stay inside the build area: within its footprint and height, and not below the carpet (4 u = 0.4 mm of slack). */
    inside(boxes) {
      const { halfX, halfZ, height } = this.bounds;
      for (const box of boxes) {
        const bb = obbBounds(box);
        if (bb.min[0] < -halfX - 1e-6 || bb.max[0] > halfX + 1e-6 || bb.min[2] < -halfZ - 1e-6 || bb.max[2] > halfZ + 1e-6) return false;
        if (bb.min[1] < (this.bounds.floor ?? -4) || bb.max[1] > height + 1e-6) return false;
      }
      return true;
    }
    /**
     * Connectors of placed bricks (and the floor's studs) whose trigger cube meets a cube of the same size around
     * `probe` turned by `q`: what LegoConnectorScript.connectorsCollidingWith would hold. Covered connectors are left
     * out: upstream switches their colliders off (LegoConnectorScript.cs:121-124).
     */
    touching(probe, q, wantMale) {
      const h = CONNECTOR_TRIGGER_HALF;
      const cube = { c: probe, h: [h, h, h], q };
      const reach = 2 * h * Math.SQRT2 + 1;
      const min = [probe[0] - reach, probe[1] - reach, probe[2] - reach];
      const max = [probe[0] + reach, probe[1] + reach, probe[2] + reach];
      const out = [];
      for (const b of this.near(min, max, true)) {
        for (const c of b.connectors) {
          if (c.male !== wantMale || b.covered[c.index]) continue;
          if (Math.abs(c.probe[0] - probe[0]) > reach || Math.abs(c.probe[1] - probe[1]) > reach || Math.abs(c.probe[2] - probe[2]) > reach) continue;
          if (obbOverlap(cube, { c: c.probe, h: [h, h, h], q: c.q })) out.push(c);
        }
      }
      if (wantMale) {
        const fx = Math.round(probe[0] / U_PER_STUD);
        const fz = Math.round(probe[2] / U_PER_STUD);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const x = (fx + dx) * U_PER_STUD;
            const z = (fz + dz) * U_PER_STUD;
            if (Math.abs(x) > this.bounds.halfX - U_PER_STUD / 2 || Math.abs(z) > this.bounds.halfZ - U_PER_STUD / 2) continue;
            const c = { brick: "", index: -1, male: true, mate: [x, 0, z], probe: [x, FLOOR_PROBE_Y, z], ori: 0, q: [0, 0, 0, 1] };
            if (obbOverlap(cube, { c: c.probe, h: [h, h, h], q: c.q })) out.push(c);
          }
        }
      }
      return out;
    }
    // ---- the renderer's side --------------------------------------------------------------------------------------
    /** Chunks whose bricks or brick looks changed since the last call. */
    get chunkCount() {
      return this.chunks.size;
    }
    takeDirtyChunks() {
      const out = [...this.dirty];
      this.dirty.clear();
      return out;
    }
    inChunk(key) {
      return [...this.chunks.get(key) ?? []].map((id) => this.bricks.get(id));
    }
    // ---- internals --------------------------------------------------------------------------------------------------
    forCells(min, max, fn) {
      const x0 = Math.floor(min[0] / CELL);
      const x1 = Math.floor(max[0] / CELL);
      const y0 = Math.floor(min[1] / CELL);
      const y1 = Math.floor(max[1] / CELL);
      const z0 = Math.floor(min[2] / CELL);
      const z1 = Math.floor(max[2] / CELL);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) fn(cellKey(x, y, z));
    }
    recalculateAround(min, max) {
      const pad = 2 * CONNECTOR_COVER_HALF + 40;
      for (const b of this.near([min[0] - pad, min[1] - pad, min[2] - pad], [max[0] + pad, max[1] + pad, max[2] + pad])) this.recalculate(b);
    }
    /** BrickAttach.RecalculateEnabledConnectors for one brick: LegoConnectorScript.RecalculateEnabled per connector. */
    recalculate(b) {
      let changed = false;
      const h = CONNECTOR_COVER_HALF;
      const neighbours = this.near(b.reachMin, b.reachMax).filter((o) => o.id !== b.id);
      for (const c of b.connectors) {
        const info = boxInfo({ c: c.probe, h: [h, h, h], q: c.q });
        let hit = false;
        for (const other of neighbours) {
          if (!aabbOverlap(info.min, info.max, other.min, other.max)) continue;
          for (const ob of other.infos) {
            this.stats.boxTests++;
            if (infoOverlap(info, ob)) {
              hit = true;
              break;
            }
          }
          if (hit) break;
        }
        if (b.covered[c.index] !== hit) {
          b.covered[c.index] = hit;
          changed = true;
        }
      }
      if (changed) {
        this.stats.coverUpdates++;
        this.dirty.add(b.chunk);
      }
    }
  };

  // src/ColorInt.ts
  function rgbOf(color) {
    return color & 16777215;
  }
  function argbOf(rgb) {
    return 255 << 24 | rgb & 16777215;
  }

  // src/BrickRecords.ts
  var PLACE_CHARS = 21;
  var TOMB_CHARS = 16;
  var MAX_SEQ = 16777215;
  var MAX_COORD = 32767;
  function recordId(r) {
    return `${r.author}#${r.seq}`;
  }
  function seqOf(id) {
    return Number(id.slice(id.lastIndexOf("#") + 1));
  }
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var DECODE = new Map([...ALPHABET].map((c, i) => [c, i]));
  function b64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const n = bytes[i] << 16 | (bytes[i + 1] ?? 0) << 8 | (bytes[i + 2] ?? 0);
      const left = bytes.length - i;
      out += ALPHABET[n >> 18 & 63] + ALPHABET[n >> 12 & 63];
      if (left > 1) out += ALPHABET[n >> 6 & 63];
      if (left > 2) out += ALPHABET[n & 63];
    }
    return out;
  }
  function unb64(text, count) {
    const bytes = [];
    for (let i = 0; i < text.length; i += 4) {
      let n = 0;
      for (let j = 0; j < 4; j++) {
        const v = i + j < text.length ? DECODE.get(text[i + j]) : 0;
        if (v === void 0) throw new Error("bad record character");
        n = n << 6 | v;
      }
      bytes.push(n >> 16 & 255, n >> 8 & 255, n & 255);
    }
    return bytes.slice(0, count);
  }
  var u24 = (v) => [v >> 16 & 255, v >> 8 & 255, v & 255];
  var i16 = (v) => [v + 32768 >> 8 & 255, v + 32768 & 255];
  var rd24 = (b, i) => b[i] << 16 | b[i + 1] << 8 | b[i + 2];
  var rd16s = (b, i) => (b[i] << 8 | b[i + 1]) - 32768;
  function placeable(type, ori, pos) {
    return type >= 0 && type < 256 && ori >= 0 && ori < 24 && pos.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_COORD);
  }
  function encode(records) {
    const authors = [];
    const index = /* @__PURE__ */ new Map();
    const ix = (a) => {
      let i = index.get(a);
      if (i === void 0) {
        if (authors.length >= 256) throw new Error("more than 256 authors in one packed list");
        index.set(a, i = authors.length);
        authors.push(a);
      }
      return i;
    };
    let r = "";
    for (const rec of records) {
      if (rec.kind === "P") {
        r += "P" + b64([ix(rec.author), ...u24(rec.seq), rec.type, rec.ori, ...i16(rec.pos[0]), ...i16(rec.pos[1]), ...i16(rec.pos[2]), ...u24(rec.rgb)]);
      } else {
        r += "T" + b64([ix(rec.author), ...u24(rec.seq), ix(rec.target), ...u24(rec.from), ...u24(rec.to)]);
      }
    }
    return { a: authors, r };
  }
  function decode(packed) {
    const out = [];
    if (!packed || typeof packed.r !== "string" || !Array.isArray(packed.a)) return out;
    const a = packed.a;
    const r = packed.r;
    let i = 0;
    try {
      while (i < r.length) {
        const k = r[i];
        if (k === "P") {
          if (i + PLACE_CHARS > r.length) break;
          const b = unb64(r.slice(i + 1, i + PLACE_CHARS), 15);
          const author = a[b[0]];
          if (typeof author !== "string") break;
          out.push({ kind: "P", author, seq: rd24(b, 1), type: b[4], ori: b[5], pos: [rd16s(b, 6), rd16s(b, 8), rd16s(b, 10)], rgb: rd24(b, 12) });
          i += PLACE_CHARS;
        } else if (k === "T") {
          if (i + TOMB_CHARS > r.length) break;
          const b = unb64(r.slice(i + 1, i + TOMB_CHARS), 11);
          const author = a[b[0]];
          const target = a[b[4]];
          if (typeof author !== "string" || typeof target !== "string") break;
          out.push({ kind: "T", author, seq: rd24(b, 1), target, from: rd24(b, 5), to: rd24(b, 8) });
          i += TOMB_CHARS;
        } else break;
      }
    } catch {
    }
    return out;
  }

  // src/BrickLedger.ts
  var SegmentSize = class {
    constructor(records = []) {
      __publicField(this, "authors", /* @__PURE__ */ new Set());
      __publicField(this, "authorBytes", 0);
      __publicField(this, "chars", 0);
      for (const r of records) this.add(r);
    }
    get bytes() {
      return 15 + this.authorBytes + Math.max(0, this.authors.size - 1) + this.chars;
    }
    grow(r) {
      const authors = [r.author];
      if (r.kind === "T") authors.push(r.target);
      return { authors: [...new Set(authors)].filter((a) => !this.authors.has(a)), chars: r.kind === "P" ? PLACE_CHARS : TOMB_CHARS };
    }
    /** The size with `r` added. */
    with(r) {
      const g = this.grow(r);
      const extra = g.authors.reduce((n, a) => n + JSON.stringify(a).length + 1, 0);
      return this.bytes + extra + g.chars;
    }
    add(r) {
      const g = this.grow(r);
      for (const a of g.authors) {
        this.authors.add(a);
        this.authorBytes += JSON.stringify(a).length;
      }
      this.chars += g.chars;
    }
  };
  function bySeq(a, b) {
    return a.author < b.author ? -1 : a.author > b.author ? 1 : a.seq - b.seq;
  }
  var BrickLedger = class _BrickLedger {
    constructor(bounds) {
      __publicField(this, "store");
      /** Every record seen, by id. */
      __publicField(this, "records", /* @__PURE__ */ new Map());
      /** Ids of the records in the archive as last read. */
      __publicField(this, "archived", /* @__PURE__ */ new Set());
      __publicField(this, "placesByAuthor", /* @__PURE__ */ new Map());
      __publicField(this, "tombsByTarget", /* @__PURE__ */ new Map());
      __publicField(this, "maxSeq", /* @__PURE__ */ new Map());
      /** Bumped whenever the placed bricks change. */
      __publicField(this, "version", 0);
      this.store = new BrickStore(bounds);
    }
    /** Highest seq seen from an author (0 for none). */
    lastSeq(author) {
      return this.maxSeq.get(author) ?? 0;
    }
    isDead(p) {
      const list = this.tombsByTarget.get(p.author);
      if (!list) return false;
      for (const t of list) if (p.seq >= t.from && p.seq <= t.to) return true;
      return false;
    }
    static placement(p) {
      return { id: recordId(p), type: p.type, ori: p.ori, pos: [p.pos[0], p.pos[1], p.pos[2]], color: argbOf(p.rgb) };
    }
    /**
     * Takes records in. `bulk` (late join, loading a save) defers the cover updates to one pass at the end.
     * Returns how many were new.
     */
    ingest(recs, bulk = false) {
      let fresh = 0;
      const touched = [];
      for (const r of recs) {
        const id = recordId(r);
        if (this.records.has(id)) continue;
        fresh++;
        this.records.set(id, r);
        if (r.seq > (this.maxSeq.get(r.author) ?? 0)) this.maxSeq.set(r.author, r.seq);
        if (r.kind === "P") {
          let m = this.placesByAuthor.get(r.author);
          if (!m) this.placesByAuthor.set(r.author, m = /* @__PURE__ */ new Map());
          m.set(r.seq, r);
          if (!this.isDead(r)) {
            this.store.add(_BrickLedger.placement(r), !bulk);
            touched.push(id);
          }
        } else {
          let list = this.tombsByTarget.get(r.target);
          if (!list) this.tombsByTarget.set(r.target, list = []);
          list.push(r);
          const places = this.placesByAuthor.get(r.target);
          if (places) {
            if (r.to - r.from < places.size) {
              for (let s = r.from; s <= r.to; s++) if (places.has(s) && this.store.remove(`${r.target}#${s}`, !bulk)) touched.push(id);
            } else {
              for (const s of places.keys()) if (s >= r.from && s <= r.to && this.store.remove(`${r.target}#${s}`, !bulk)) touched.push(id);
            }
          }
        }
      }
      if (bulk && fresh) this.store.recalculateAll();
      if (touched.length) this.version++;
      return fresh;
    }
    /** The archive as just read: its records join the set, and their ids are what authors may drop from their logs. */
    setArchive(segments, bulk = false) {
      const ids = /* @__PURE__ */ new Set();
      for (const seg of segments) for (const r of seg) ids.add(recordId(r));
      this.archived = ids;
      this.ingest(segments.flat(), bulk);
    }
    /**
     * Whether a record can leave the archive for good: a deleted brick that no present log holds, or a tombstone that
     * no present log holds, whose target author has gone (so nothing it covers can come back) and every brick of
     * which is itself collectable.
     */
    gcable(r, o) {
      const id = recordId(r);
      if (o.inLogs.has(id)) return false;
      if (r.kind === "P") return this.isDead(r);
      if (o.presentAuthors.has(r.target)) return false;
      const places = this.placesByAuthor.get(r.target);
      if (places) {
        for (const [s, p] of places) if (s >= r.from && s <= r.to && o.inLogs.has(recordId(p))) return false;
      }
      return true;
    }
    /**
     * The referee's archive step. Appends every record not archived yet (in author, seq order) to the last segment
     * with room; when the segments run out, or a quarter of the archive is collectable, rewrites them all without the
     * collectable records. Null when nothing needs writing.
     */
    planArchive(current, o) {
      const decoded = current.map((p) => decode(p));
      const inArchive = /* @__PURE__ */ new Set();
      let collectable = 0;
      let total = 0;
      for (const seg of decoded) {
        for (const r of seg) {
          inArchive.add(recordId(r));
          total++;
          if (this.gcable(r, o)) collectable++;
        }
      }
      const missing = [];
      for (const [id, r] of this.records) if (!inArchive.has(id) && !this.gcable(r, o)) missing.push(r);
      missing.sort(bySeq);
      const repackWanted = collectable >= 64 && collectable * 4 >= total;
      if (!missing.length && !repackWanted) return null;
      if (!repackWanted) {
        const segs2 = decoded.map((s) => s.slice());
        const sizes2 = segs2.map((s) => new SegmentSize(s));
        const changed2 = /* @__PURE__ */ new Set();
        let at2 = 0;
        for (let i = segs2.length - 1; i >= 0; i--) {
          if (segs2[i].length) {
            at2 = i;
            break;
          }
        }
        let ok = true;
        let added = 0;
        for (const r of missing) {
          while (at2 < segs2.length && sizes2[at2].with(r) > o.capacity) at2++;
          if (at2 >= segs2.length) {
            ok = false;
            break;
          }
          segs2[at2].push(r);
          sizes2[at2].add(r);
          changed2.add(at2);
          added++;
        }
        if (ok) {
          const segments2 = segs2.map((s, i) => changed2.has(i) ? encode(s) : current[i]);
          return { segments: segments2, changed: [...changed2].sort((a, b) => a - b), repacked: false, added, dropped: 0 };
        }
      }
      const keep = [];
      let dropped = 0;
      for (const r of this.records.values()) {
        if (this.gcable(r, o)) {
          if (inArchive.has(recordId(r))) dropped++;
        } else keep.push(r);
      }
      keep.sort(bySeq);
      const segs = current.map(() => []);
      const sizes = segs.map(() => new SegmentSize());
      let at = 0;
      for (const r of keep) {
        while (at < segs.length && segs[at].length && sizes[at].with(r) > o.capacity) at++;
        if (at >= segs.length) throw new Error(`the archive is full: ${keep.length} records do not fit ${segs.length} segments`);
        segs[at].push(r);
        sizes[at].add(r);
      }
      const segments = segs.map((s) => encode(s));
      const changed = segments.map((s, i) => s.r !== (current[i]?.r ?? "") || JSON.stringify(s.a) !== JSON.stringify(current[i]?.a ?? []) ? i : -1).filter((i) => i >= 0);
      return { segments, changed, repacked: true, added: keep.filter((r) => !inArchive.has(recordId(r))).length, dropped };
    }
    /** A text that is equal on two clients exactly when they show the same bricks. */
    digest() {
      const ids = [...this.store.bricks.keys()].sort();
      let h = 2166136261;
      const mix = (s) => {
        for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
      };
      for (const id of ids) {
        const b = this.store.bricks.get(id);
        mix(`${id}:${b.type}:${b.ori}:${b.pos.join(",")}:${b.color};`);
      }
      return `${ids.length}:${(h >>> 0).toString(16)}`;
    }
  };

  // src/BrickRenderer.ts
  var CHUNK_TEMPLATE = "@Area/Chunks/Template";
  function meshIndex(b) {
    const males = BRICKS[b.type].males.length;
    const allStudsCovered = males === 0 || b.studsCovered === (1 << males) - 1;
    return 1 + 4 * b.type + (allStudsCovered ? 2 : 0) + (b.bottomClosed ? 1 : 0);
  }
  function itemOf(b) {
    return `${meshIndex(b)},${Math.round(b.pos[0])},${Math.round(b.pos[1])},${Math.round(b.pos[2])},${b.ori},${b.rgb & 16777215}`;
  }
  var EMPTY_ITEM = "0,0,0,0,0,0";
  function chunkName(key) {
    return "C" + key.split(",").join("_");
  }
  var BrickRenderer = class {
    constructor(host) {
      __publicField(this, "chunks", /* @__PURE__ */ new Map());
      /** What the graph reported: chunk builds and their times (ms, Time.realtimeSinceStartup in Unity). */
      __publicField(this, "built", { ops: 0, records: 0, lastMs: 0, maxMs: 0, totalMs: 0, lastColliderMs: 0, maxColliderMs: 0, totalColliderMs: 0, lastRecords: 0, lastAt: 0 });
      __publicField(this, "sent", { ops: 0, records: 0, bytes: 0 });
      /** Records sent and not yet reported built, per chunk name. */
      __publicField(this, "waiting", /* @__PURE__ */ new Map());
      __publicField(this, "host");
      this.host = host;
    }
    /** Sends what changed in these chunks (BuildArea.RenderChunks). */
    update(chunks) {
      for (const chunk of chunks) {
        let slots = this.chunks.get(chunk.key);
        if (!slots) {
          slots = { name: chunkName(chunk.key), items: [], slotOf: /* @__PURE__ */ new Map(), free: [] };
          this.chunks.set(chunk.key, slots);
          this.host.spawn(CHUNK_TEMPLATE, slots.name);
        }
        const want = /* @__PURE__ */ new Map();
        for (const b of chunk.bricks) want.set(b.id, itemOf(b));
        const changed = /* @__PURE__ */ new Map();
        for (const [id, slot] of [...slots.slotOf]) {
          if (want.has(id)) continue;
          slots.slotOf.delete(id);
          slots.free.push(slot);
          if (slots.items[slot] !== EMPTY_ITEM) changed.set(slot, EMPTY_ITEM);
        }
        slots.free.sort((a, b) => b - a);
        for (const [id, item] of want) {
          let slot = slots.slotOf.get(id);
          if (slot === void 0) {
            slot = slots.free.length ? slots.free.pop() : slots.items.length + [...changed.keys()].filter((s) => s >= slots.items.length).length;
            slots.slotOf.set(id, slot);
          }
          if (slots.items[slot] !== item) changed.set(slot, item);
        }
        if (!changed.size) continue;
        const order = [...changed.keys()].sort((a, b) => a - b);
        const records = [];
        for (const slot of order) {
          slots.items[slot] = changed.get(slot);
          records.push(`${slot},${slots.items[slot]}`);
        }
        const text = records.join(";");
        this.host.op("bricks", `@Area/Chunks/${slots.name}`, [text]);
        this.sent.ops++;
        this.sent.records += records.length;
        this.sent.bytes += text.length;
        this.waiting.set(slots.name, (this.waiting.get(slots.name) ?? 0) + records.length);
      }
    }
    /** The graph's report of one `bricks` op: chunk name, milliseconds, records. */
    reported(name, ms, records, now, colliderMs = 0) {
      this.built.ops++;
      this.built.records += records;
      this.built.lastRecords = records;
      this.built.lastColliderMs = colliderMs;
      this.built.maxColliderMs = Math.max(this.built.maxColliderMs, colliderMs);
      this.built.totalColliderMs += colliderMs;
      this.built.lastMs = ms;
      this.built.maxMs = Math.max(this.built.maxMs, ms);
      this.built.totalMs += ms;
      this.built.lastAt = now;
      const left = (this.waiting.get(name) ?? 0) - records;
      if (left > 0) this.waiting.set(name, left);
      else this.waiting.delete(name);
    }
    /** True when every record sent has been reported built. */
    get idle() {
      return this.waiting.size === 0;
    }
    /** Bricks drawn (slots with a mesh) per chunk name. */
    counts() {
      const out = {};
      for (const c of this.chunks.values()) out[c.name] = c.slotOf.size;
      return out;
    }
    get chunkCount() {
      return this.chunks.size;
    }
  };

  // src/BuildArea.ts
  var LOG_CAPACITY = 12e3;
  var SEGMENT_CAPACITY = 14500;
  var ARCHIVE_SECONDS = 1;
  var SPAWNER_HOLD_SECONDS = 0.4;
  var HAMMER_MIN_RADIUS = 3 / 7e-4;
  var BuildArea = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "ledger");
      /** Mesh metres -> metres in the world (upstream shows meshes at 7x). */
      __publicField(this, "scale", 7);
      /** Upstream's "super ultra performance mode" (UserSettings.SuperUltraPerformanceMode), per client. */
      __publicField(this, "performanceMode", false);
      /** The ghost the held brick would snap to (ShowSnappableBrickPositions.cs), local only. */
      __publicField(this, "ghost", null);
      /** The type of the brick the ghost is for. */
      __publicField(this, "ghostType", -1);
      __publicField(this, "stats", { placed: 0, deleted: 0, refused: 0, archiveWrites: 0, logWrites: 0, repacks: 0, rebuildRecords: 0 });
      // ---- kit objects (bindings fields; null in a bench without a kit) ----
      /** The ghost: one child per brick prefab (Complete mesh, see-through), shown where a held brick would snap. */
      __publicField(this, "ghostObject", null);
      /** The area's sound source and its clips (Assets/Kit/Sounds, CC0, replacing upstream's lost Resources/Sounds). */
      __publicField(this, "audio", null);
      __publicField(this, "snapClips", []);
      __publicField(this, "carpetClips", []);
      __publicField(this, "clickClip", null);
      __publicField(this, "spawnClip", null);
      __publicField(this, "successClip", null);
      /** The picker's status line. */
      __publicField(this, "status", null);
      // ---- the local player's picker (upstream BrickPickerManager: per player, nothing synced) ----
      /** The brick type the picker has selected (desktop: what a click on the build places). */
      __publicField(this, "selectedType", 0);
      /** ARGB colour of the picker (BrickPickerManager's HSV sliders and save spots). */
      __publicField(this, "color", argbOf(13179401));
      /** Quarter turns about Y for what a click places (desktop). */
      __publicField(this, "yaw", 0);
      /** Desktop hammer: while on, a click on a placed brick removes it (the VR hammer is the grabbable one). */
      __publicField(this, "hammerMode", false);
      __publicField(this, "category", 0);
      __publicField(this, "hsv", { h: 0, s: 0.95, v: 0.79 });
      __publicField(this, "renderer", null);
      __publicField(this, "shownGhost", -1);
      __publicField(this, "statusText", "");
      /** Slots this player holds through AttachToHand (VR: a brick put straight into the hand), by hand side. */
      __publicField(this, "attached", /* @__PURE__ */ new Map());
      __publicField(this, "areaPos", Vector3.zero);
      __publicField(this, "areaRot", Quaternion.identity);
      __publicField(this, "segments", []);
      __publicField(this, "segSeen", []);
      __publicField(this, "logSeen", /* @__PURE__ */ new Map());
      __publicField(this, "logIds", /* @__PURE__ */ new Map());
      __publicField(this, "myLog", []);
      __publicField(this, "queue", []);
      __publicField(this, "nextSeq", 0);
      __publicField(this, "lastArchive", -1);
      __publicField(this, "started", false);
      __publicField(this, "spawners", /* @__PURE__ */ new Map());
    }
    // ---- start ------------------------------------------------------------------------------------------------------
    Start() {
      const num = (name, fallback) => {
        const v = Number(this.Settings.get(name));
        return Number.isFinite(v) && v > 0 ? v : fallback;
      };
      const width = Math.min(800, Math.round(num("width", 64)));
      const depth = Math.min(800, Math.round(num("depth", 64)));
      const height = Math.min(1e3, Math.round(num("height", 480)));
      this.scale = 7 * num("scale", 1);
      this.performanceMode = this.Settings.get("performance") === "true";
      this.ledger = new BrickLedger({ halfX: width * U_PER_STUD / 2, halfZ: depth * U_PER_STUD / 2, height: height * U_PER_PLATE });
      this.segments = this.FindBehavioursOfType("BrickSegment").sort((a, b) => a.index - b.index);
      void this.transform.Refresh().then(() => {
        this.areaPos = this.transform.position;
        this.areaRot = this.transform.rotation;
      });
      this.Poll(true);
      const mine = this.myLogBehaviour();
      if (mine) this.myLog = decode({ a: mine.a, r: mine.r }).filter((r) => r.author === this.author);
      this.renderer = new BrickRenderer(this.Host);
      this.RegisterGraphEvent("chunk", "ChunkBuilt");
      const k = 7 * 80 * 1e-4;
      this.Host.scale("@Area/Carpet", new Vector3(width * k, 0.02, depth * k));
      this.selectedType = BricksForCategory(CATEGORIES[0])[0]?.type ?? 0;
      this.ShowCategory(0);
      this.ShowColor();
      this.started = true;
      this.UpdateStatus();
    }
    /** The relay graph built a chunk: "<chunk name>|<ms merging>|<records>|<ms cooking its collider>". */
    ChunkBuilt(name, ms, records, colliderMs) {
      this.renderer?.reported(name, Number(ms), Number(records), this.Time.time, Number(colliderMs ?? 0));
    }
    get author() {
      const me = this.Networking.LocalPlayer;
      return `${me.uid}~${me.sid}`;
    }
    /** RoomOwnershipSync.IsUserAllowedToMakeChanges: unlocked, or the local player may write protected state. */
    CanBuild() {
      return !this.Protected.Get("locked", false) || this.Protected.CanWrite;
    }
    /** RoomOwnershipSync lock toggle: only the space's owner and moderators can (the room refuses anyone else). */
    SetLocked(locked) {
      this.Protected.Set("locked", locked);
    }
    // ---- reading the room -------------------------------------------------------------------------------------------
    LogChanged() {
      if (this.started) this.Poll(false);
    }
    SegmentChanged() {
      if (this.started) this.Poll(false);
    }
    /** Takes in whatever changed in the archive and in the logs of the players present. */
    Poll(bulk) {
      let segChanged = bulk;
      for (let i = 0; i < this.segments.length; i++) if (this.segments[i].r !== this.segSeen[i]) segChanged = true;
      if (segChanged) {
        this.segSeen = this.segments.map((s) => s.r);
        const decoded = this.segments.map((s) => decode({ a: s.a, r: s.r }));
        this.stats.rebuildRecords += decoded.reduce((n, s) => n + s.length, 0);
        this.ledger.setArchive(decoded, bulk);
      }
      const present = /* @__PURE__ */ new Set();
      const fresh = [];
      for (const log of this.PlayerBehaviours("BrickLog")) {
        const p = log.Player;
        if (!p) continue;
        const author = `${p.uid}~${p.sid}`;
        present.add(author);
        if (this.logSeen.get(log) === log.r) continue;
        this.logSeen.set(log, log.r);
        const recs = decode({ a: log.a, r: log.r });
        this.logIds.set(author, new Set(recs.map(recordId)));
        fresh.push(...recs);
      }
      for (const log of [...this.logSeen.keys()]) if (!log.Player || !present.has(`${log.Player.uid}~${log.Player.sid}`)) this.logSeen.delete(log);
      for (const author of [...this.logIds.keys()]) if (!present.has(author)) this.logIds.delete(author);
      if (fresh.length) this.ledger.ingest(fresh, bulk);
    }
    Update() {
      if (!this.started) return;
      this.Poll(false);
      this.renderer?.update(this.RenderChunks());
      this.ShowGhost();
      this.UpdateStatus();
      if (this.Networking.IsReferee && (this.lastArchive < 0 || this.Time.time - this.lastArchive >= ARCHIVE_SECONDS)) {
        this.lastArchive = this.Time.time;
        this.Archive();
      }
      this.FlushLog();
    }
    // ---- the referee: archive ---------------------------------------------------------------------------------------
    /** Copies every record not archived yet into the segments (and collects dead bricks when it pays). */
    Archive() {
      const presentAuthors = new Set(this.Networking.GetPlayers().map((p) => `${p.uid}~${p.sid}`));
      const inLogs = /* @__PURE__ */ new Set();
      for (const ids of this.logIds.values()) for (const id of ids) inLogs.add(id);
      for (const r of this.myLog) inLogs.add(recordId(r));
      for (const r of this.queue) inLogs.add(recordId(r));
      const current = this.segments.map((s) => ({ a: s.a, r: s.r }));
      const plan = this.ledger.planArchive(current, { capacity: SEGMENT_CAPACITY, presentAuthors, inLogs });
      if (!plan) return;
      for (const i of plan.changed) {
        const seg = this.segments[i];
        if (!this.Networking.IsOwner(seg.gameObject)) this.Networking.SetOwner(this.Networking.LocalPlayer, seg.gameObject);
        seg.a = plan.segments[i].a;
        seg.r = plan.segments[i].r;
        seg.RequestSerialization();
      }
      if (plan.repacked) this.stats.repacks++;
      this.stats.archiveWrites += plan.changed.length;
      this.segSeen = this.segments.map((s) => s.r);
      this.ledger.setArchive(plan.segments.map((p) => decode(p)));
    }
    // ---- the author: own log ----------------------------------------------------------------------------------------
    myLogBehaviour() {
      return this.PlayerBehaviour(this.Networking.LocalPlayer, "BrickLog");
    }
    /** Records not archived yet: waiting for room in the log, or in it. */
    get pending() {
      return this.queue.length + this.myLog.length;
    }
    /** Drops what the archive holds from the log, moves queued records in while they fit, and writes it if it changed. */
    FlushLog() {
      const archived = this.ledger.archived;
      const before = this.myLog.length;
      this.myLog = this.myLog.filter((r) => !archived.has(recordId(r)));
      this.queue = this.queue.filter((r) => !archived.has(recordId(r)));
      let changed = this.myLog.length !== before;
      let bytes = 15 + 4 * 80 + this.myLog.reduce((n, r) => n + (r.kind === "P" ? PLACE_CHARS : TOMB_CHARS), 0);
      while (this.queue.length) {
        const r = this.queue[0];
        const size = r.kind === "P" ? PLACE_CHARS : TOMB_CHARS + 80;
        if (bytes + size > LOG_CAPACITY) break;
        bytes += size;
        this.myLog.push(this.queue.shift());
        changed = true;
      }
      if (!changed) return;
      const log = this.myLogBehaviour();
      if (!log) return;
      const packed = encode(this.myLog);
      log.a = packed.a;
      log.r = packed.r;
      this.logSeen.set(log, log.r);
      this.logIds.set(this.author, new Set(this.myLog.map(recordId)));
      log.RequestSerialization();
      this.stats.logWrites++;
    }
    nextRecordSeq() {
      if (this.nextSeq === 0) this.nextSeq = this.ledger.lastSeq(this.author) + 1;
      if (this.nextSeq > MAX_SEQ) throw new Error("this session has written 16 million records");
      return this.nextSeq++;
    }
    publish(recs) {
      this.ledger.ingest(recs);
      this.queue.push(...recs);
    }
    // ---- actions ----------------------------------------------------------------------------------------------------
    /** A brick straight onto the lattice (loading a save, tests, a future click-to-place). Null when refused. */
    Place(type, ori, pos, color, check = true) {
      if (!this.CanBuild() || !BRICKS[type] || !placeable(type, ori, pos)) {
        this.stats.refused++;
        return null;
      }
      if (check) {
        const boxes = heldBoxesAt(type, pos, ori);
        if (!this.ledger.store.inside(boxes) || this.ledger.store.collides(boxes)) {
          this.stats.refused++;
          return null;
        }
      }
      const rec = { kind: "P", author: this.author, seq: this.nextRecordSeq(), type, ori, pos: [pos[0], pos[1], pos[2]], rgb: rgbOf(color) };
      this.publish([rec]);
      this.stats.placed++;
      return recordId(rec);
    }
    /** A held brick let go at a pose in the build area's space: snap and place it, as BrickAttachDetector.BrickReleased. */
    ReleaseLocal(held, color) {
      const snap = CheckIfCanConnect(this.ledger.store, held, this.CanBuild());
      if (!snap) return null;
      if (!this.Place(held.type, snap.ori, snap.pos, color, false)) return null;
      this.PlacedSound(snap.pos[1] + BRICKS[held.type].bottomPlates * U_PER_PLATE <= 1);
      return snap;
    }
    /** The same from a world pose (HeldBrick.OnDrop). */
    Release(type, color, position, rotation) {
      return this.ReleaseLocal(this.ToLocal(type, position, rotation), color);
    }
    /** Where the brick in the hand would go (the ghost), recomputed while it is held. */
    /** Nothing is held here any more: no ghost. */
    HeldGone() {
      this.ghost = null;
    }
    HeldMoved(slot) {
      this.ghostType = slot.t;
      this.ghost = CheckIfCanConnect(this.ledger.store, this.ToLocal(slot.t, slot.transform.position, slot.transform.rotation), this.CanBuild());
    }
    /** Removes placed bricks (anyone may, unless the area is locked). Returns how many went. */
    Delete(ids) {
      if (!this.CanBuild()) return 0;
      const recs = [];
      for (const id of ids) {
        if (!this.ledger.store.bricks.has(id)) continue;
        const seq = seqOf(id);
        recs.push({ kind: "T", author: this.author, seq: this.nextRecordSeq(), target: id.slice(0, id.lastIndexOf("#")), from: seq, to: seq });
      }
      this.publish(recs);
      this.stats.deleted += recs.length;
      return recs.length;
    }
    /** Empties the area: one range tombstone per author (new; upstream had no such button). */
    Clear() {
      if (!this.CanBuild()) return 0;
      const ranges = /* @__PURE__ */ new Map();
      for (const id of this.ledger.store.bricks.keys()) {
        const author = id.slice(0, id.lastIndexOf("#"));
        const seq = seqOf(id);
        const r = ranges.get(author);
        if (!r) ranges.set(author, [seq, seq]);
        else {
          r[0] = Math.min(r[0], seq);
          r[1] = Math.max(r[1], seq);
        }
      }
      const count = this.ledger.store.count;
      const recs = [...ranges].map(([target, [from, to]]) => ({ kind: "T", author: this.author, seq: this.nextRecordSeq(), target, from, to }));
      this.publish(recs);
      this.stats.deleted += count;
      return count;
    }
    /** Hammer.OnCollisionEnter: every placed brick within the radius of a point (area space, u) goes. */
    Hammer(center, radius) {
      const r = Math.max(radius, 0);
      const hits = this.ledger.store.near([center[0] - r, center[1] - r, center[2] - r], [center[0] + r, center[1] + r, center[2] + r]).filter((b) => Math.hypot(b.pos[0] - center[0], b.pos[1] - center[1], b.pos[2] - center[2]) <= r).map((b) => b.id);
      return this.Delete(hits);
    }
    /** The placed brick a point is in (a hand reaching into it), nearest centre first; null if none. */
    BrickAt(point, margin = 20) {
      let best = null;
      let bestD = Infinity;
      for (const b of this.ledger.store.near([point[0] - margin, point[1] - margin, point[2] - margin], [point[0] + margin, point[1] + margin, point[2] + margin])) {
        const d = Math.hypot(b.pos[0] - point[0], b.pos[1] - point[1], b.pos[2] - point[2]);
        if (d < bestD) {
          bestD = d;
          best = b.id;
        }
      }
      return best;
    }
    /** BrickSwapper.SwapToRealBrick: a placed brick becomes a held one where it was. Returns the slot, or null. */
    PickUp(id) {
      const b = this.ledger.store.bricks.get(id);
      if (!b || !this.CanBuild()) return null;
      if (!this.Delete([id])) return null;
      const { position, rotation } = this.ToWorld(b.pos, ORIS[b.ori].q);
      return this.Spawn(b.type, b.color, position, rotation);
    }
    /** A new brick in a free pool slot (BrickPickerBrick.Interact, HandBrickSpawner.HandleButtonPress). */
    Spawn(type, color, position, rotation) {
      const slots = this.FindBehavioursOfType("HeldBrick").sort((a, b) => a.index - b.index);
      if (!slots.length || !BRICKS[type]) return null;
      let h = 0;
      for (let i = 0; i < this.author.length; i++) h = h * 31 + this.author.charCodeAt(i) >>> 0;
      for (let k = 0; k < slots.length; k++) {
        const slot = slots[(h + k) % slots.length];
        if (slot.free) {
          slot.Claim(type, color, position, rotation);
          return slot;
        }
      }
      return null;
    }
    /** Another client claimed the same slot in the same moment and won: that brick is gone (logged). */
    SpawnLost(slot) {
      this.Debug.LogWarning(`pool slot ${slot.index} was taken by another player`);
    }
    // ---- input: grip a placed brick, the hand spawner -------------------------------------------------------------
    OnButtonPressed(button, side) {
      const hand = this.HandLocal(side);
      if (!hand) return;
      if (button === Button.Grip) {
        const id = this.BrickAt(hand);
        const slot = id ? this.PickUp(id) : null;
        if (slot) this.IntoHand(slot, side);
        return;
      }
      if (button === Button.Primary || button === Button.Secondary) this.spawner(button, side).downAt = this.Time.time;
    }
    OnButtonReleased(button, side) {
      if (button === Button.Grip) {
        const slot2 = this.attached.get(side);
        if (slot2) {
          this.attached.delete(side);
          slot2.LetGoOfHand();
        }
        return;
      }
      if (button !== Button.Primary && button !== Button.Secondary) return;
      const slot = this.spawner(button, side);
      if (slot.downAt < 0) return;
      const held = this.Time.time - slot.downAt;
      slot.downAt = -1;
      const hand = this.HandLocal(side);
      const poses = this.Input.Poses;
      if (!hand || !poses) return;
      if (held >= SPAWNER_HOLD_SECONDS) {
        const id = this.BrickAt(hand);
        const b = id ? this.ledger.store.bricks.get(id) : null;
        if (b) {
          slot.saved = { type: b.type, color: b.color };
          this.Input.Haptic(side, 0.5, 0.1);
        }
      } else if (slot.saved) {
        const pose2 = side === 0 ? poses.leftHand : poses.rightHand;
        const def = BRICKS[slot.saved.type];
        const rot = pose2.rotation.mul(Quaternion.Euler(def.spawnEuler[0], def.spawnEuler[1], def.spawnEuler[2]));
        this.Spawn(slot.saved.type, slot.saved.color, pose2.position, rot);
      }
    }
    spawner(button, side) {
      const key = `${side}/${button}`;
      let s = this.spawners.get(key);
      if (!s) this.spawners.set(key, s = { downAt: -1, saved: null });
      return s;
    }
    HandLocal(side) {
      const poses = this.Input.Poses;
      if (!poses) return null;
      const p = side === 0 ? poses.leftHand.position : poses.rightHand.position;
      return this.ToLocal(0, p, Quaternion.identity).pos;
    }
    // ---- space ------------------------------------------------------------------------------------------------------
    /** World pose -> area space (u). */
    ToLocal(type, position, rotation) {
      const inv = qinv([this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w]);
      const d = qrot(inv, [position.x - this.areaPos.x, position.y - this.areaPos.y, position.z - this.areaPos.z]);
      const k = 1 / (this.scale * MESH_M_PER_U);
      const q = qmul(inv, [rotation.x, rotation.y, rotation.z, rotation.w]);
      return { type, pos: [d[0] * k, d[1] * k, d[2] * k], q };
    }
    /** Area space (u) -> world pose. */
    ToWorld(pos, q) {
      const ar = [this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w];
      const k = this.scale * MESH_M_PER_U;
      const w = qrot(ar, [pos[0] * k, pos[1] * k, pos[2] * k]);
      const r = qmul(ar, q);
      return { position: new Vector3(w[0] + this.areaPos.x, w[1] + this.areaPos.y, w[2] + this.areaPos.z), rotation: new Quaternion(r[0], r[1], r[2], r[3]) };
    }
    // ---- the renderer -----------------------------------------------------------------------------------------------
    /** Chunks to re-mesh since the last call (ChunkedRenderer.ts). An empty chunk means: remove its mesh. */
    RenderChunks() {
      return this.ledger.store.takeDirtyChunks().map((key) => renderChunk(key, this.ledger.store.inChunk(key), this.performanceMode));
    }
    // ---- the picker, the palette, the tools (BrickPickerManager, ColorPickerSaveSpot, Hammer, RoomOwnershipSync) ------
    /** A picker tile was clicked: select that brick; in VR it also comes to the hand (BrickPickerBrick.Interact). */
    TileClicked(type) {
      if (!BRICKS[type]) return;
      this.selectedType = type;
      this.Play(this.clickClip);
      const side = this.Input.LastClickSide;
      const poses = this.Input.Poses;
      if (this.Input.IsVR && side !== null && poses) {
        const pose2 = side === 0 ? poses.leftHand : poses.rightHand;
        const def = BRICKS[type];
        const slot = this.Spawn(type, this.color, pose2.position, pose2.rotation.mul(Quaternion.Euler(def.spawnEuler[0], def.spawnEuler[1], def.spawnEuler[2])));
        if (slot) {
          this.Play(this.spawnClip);
          this.IntoHand(slot, side);
        }
      }
      this.UpdateStatus();
    }
    /** A category tab (SelectedCategoryManager): one group of tiles is shown. */
    ShowCategory(index) {
      if (index < 0 || index >= CATEGORIES.length) return;
      this.category = index;
      for (let k = 0; k < CATEGORIES.length; k++) {
        this.Host.setActive(`@Picker/Cat${k}`, k === index);
        this.Host.setActive(`@Picker/Tabs/Tab${k}/Marker`, k === index);
      }
    }
    /** A palette swatch (upstream's colour save spots): the picker's colour. */
    SetColorRgb(rgb) {
      this.color = argbOf(rgb & 16777215);
      const hsv = Color.RGBToHSV(this.rgbColor(rgb));
      this.hsv.h = hsv[0];
      this.hsv.s = hsv[1];
      this.hsv.v = hsv[2];
      this.Play(this.clickClip);
      this.ShowColor();
    }
    /** BrickPickerManager's HSV sliders: one of them moved (0 hue, 1 saturation, 2 value). */
    SetHsv(which, value) {
      const v = Math.min(1, Math.max(0, value));
      if (which === 0) this.hsv.h = v;
      else if (which === 1) this.hsv.s = v;
      else this.hsv.v = v;
      const c = Color.HSVToRGB(this.hsv.h, this.hsv.s, this.hsv.v, false);
      this.color = argbOf(Math.round(c.r * 255) << 16 | Math.round(c.g * 255) << 8 | Math.round(c.b * 255));
      this.ShowColor(false);
    }
    rgbColor(rgb) {
      return new Color((rgb >> 16 & 255) / 255, (rgb >> 8 & 255) / 255, (rgb & 255) / 255, 1);
    }
    /** The preview swatch and every picker tile show the colour (BrickPickerManager.UpdateBrickColors). */
    ShowColor(sliders = true) {
      const c = this.rgbColor(this.color);
      this.Host.op("tint", "@Picker/Preview", [c.r.toFixed(4), c.g.toFixed(4), c.b.toFixed(4)], "tint");
      if (sliders) {
        this.Host.uiSetSlider("@Picker/Sliders/Hue", this.hsv.h);
        this.Host.uiSetSlider("@Picker/Sliders/Saturation", this.hsv.s);
        this.Host.uiSetSlider("@Picker/Sliders/Value", this.hsv.v);
      }
    }
    HueChanged(value) {
      this.SetHsv(0, value);
    }
    SaturationChanged(value) {
      this.SetHsv(1, value);
    }
    ValueChanged(value) {
      this.SetHsv(2, value);
    }
    /** A tool button: "hammer" (desktop hammer mode), "rotate", "lock", "save", "load". */
    Tool(name) {
      this.Play(this.clickClip);
      if (name === "hammer") this.hammerMode = !this.hammerMode;
      else if (name === "rotate") this.yaw = (this.yaw + 1) % 4;
      else if (name === "lock" && this.Protected.CanWrite) this.SetLocked(!this.Protected.Get("locked", false));
      else if (name === "save") this.Save();
      else if (name === "load" && this.Load() >= 0) this.Play(this.successClip);
      this.Host.setActive("@Tools/HammerButton/On", this.hammerMode);
      this.UpdateStatus();
    }
    /**
     * A click on the carpet or on the build (desktop, or a VR laser): with the hammer on, the placed brick clicked goes;
     * else the selected brick goes on the face clicked, snapped as a brick let go just above it would be.
     */
    SurfaceClicked(detail) {
      if (!detail || !detail.point) return;
      const p = this.ToLocal(0, detail.point, Quaternion.identity).pos;
      const nWorld = detail.normal ?? Vector3.up;
      const inv = qinv([this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w]);
      const n = qrot(inv, [nWorld.x, nWorld.y, nWorld.z]);
      if (this.hammerMode) {
        const id = this.BrickAt([p[0] - n[0] * 12, p[1] - n[1] * 12, p[2] - n[2] * 12], 12);
        if (id && this.Delete([id])) this.Play(this.carpetClips[0] ?? null);
        return;
      }
      if (n[1] < 0.5) return;
      this.PlaceAt(this.selectedType, p, this.yaw, this.color);
    }
    /** A brick on a horizontal face at `p` (u): tried at the half-stud alignments nearest the point. */
    PlaceAt(type, p, yaw, color) {
      const def = BRICKS[type];
      if (!def) return null;
      const rootY = p[1] - def.bottomPlates * U_PER_PLATE + 4;
      const q = ORIS[yaw & 3].q;
      const half = U_PER_STUD / 2;
      const bx = Math.round(p[0] / half) * half;
      const bz = Math.round(p[2] / half) * half;
      const tries = [];
      for (const dx of [0, half, -half]) for (const dz of [0, half, -half]) tries.push([bx + dx, rootY, bz + dz]);
      tries.sort((a, b) => Math.hypot(a[0] - p[0], a[2] - p[2]) - Math.hypot(b[0] - p[0], b[2] - p[2]));
      for (const pos of tries) {
        const snap = this.ReleaseLocal({ type, pos, q }, color);
        if (snap) return snap;
      }
      return null;
    }
    /** The grabbable hammer's head hit the build (Hammer.OnCollisionEnter): the brick it is in goes. */
    HammerAt(world, radiusU = 30) {
      const p = this.ToLocal(0, world, Quaternion.identity).pos;
      const id = this.BrickAt(p, radiusU);
      if (!id) return 0;
      const n = this.Delete([id]);
      if (n) this.Play(this.carpetClips[1] ?? null);
      return n;
    }
    /** AttachToHand: the slot follows the hand until the grip is let go (XR's ForceSelect upstream). */
    IntoHand(slot, side) {
      this.attached.set(side, slot);
      slot.AttachTo(side);
    }
    Play(clip) {
      if (clip && this.audio) this.audio.PlayOneShot(clip);
    }
    /** A placement made by this player: upstream's snap sound (PlacedBrickCreator.cs:323-335), carpet or brick. */
    PlacedSound(onFloor) {
      const list = onFloor ? this.carpetClips : this.snapClips;
      if (list.length) this.Play(list[Math.floor(this.Random.value * list.length) % list.length]);
    }
    /** The ghost (ShowSnappableBrickPositions): where the held brick would snap, drawn see-through. */
    ShowGhost() {
      const g = this.ghost;
      const want = g && this.ghostObject && BRICKS[this.ghostType] ? this.ghostType : -1;
      if (want !== this.shownGhost) {
        if (this.shownGhost >= 0) this.Host.setActive(`@Ghost/${BRICKS[this.shownGhost].prefab}`, false);
        if (want >= 0) this.Host.setActive(`@Ghost/${BRICKS[want].prefab}`, true);
        this.shownGhost = want;
      }
      if (g && want >= 0 && this.ghostObject) {
        const { position, rotation } = this.ToWorld(g.pos, ORIS[g.ori].q);
        this.ghostObject.transform.SetPositionAndRotation(position, rotation);
      }
    }
    UpdateStatus() {
      if (!this.status) return;
      const def = BRICKS[this.selectedType];
      const locked = this.Protected.Get("locked", false);
      const text = `${def ? def.display : ""}   ${this.ledger ? this.ledger.store.count : 0} bricks` + (this.hammerMode ? "   HAMMER" : "") + (locked ? this.Protected.CanWrite ? "   locked (you may build)" : "   locked by the owner" : "");
      if (text !== this.statusText) {
        this.statusText = text;
        this.status.text = text;
      }
    }
    // ---- saving on the device ---------------------------------------------------------------------------------------
    /** The area's bricks, on this device (localStorage, per world, area and player). Returns the count, -1 on failure. */
    Save(name = "default") {
      const bricks = [...this.ledger.store.bricks.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      const recs = bricks.map((b, i) => ({ kind: "P", author: "save", seq: i + 1, type: b.type, ori: b.ori, pos: b.pos, rgb: rgbOf(b.color) }));
      const saved = { v: 1, b: encode(recs) };
      if (!this.Storage.set(`save.${name}`, saved)) return -1;
      const names = this.SaveNames();
      if (names.indexOf(name) < 0) this.Storage.set("saves", [...names, name]);
      return recs.length;
    }
    SaveNames() {
      return this.Storage.get("saves", []);
    }
    /** Puts a saved build back: by default empties the area first. Returns how many bricks were placed, -1 if none saved. */
    Load(name = "default", replace = true) {
      const saved = this.Storage.get(`save.${name}`, null);
      if (!saved || saved.v !== 1) return -1;
      if (replace) this.Clear();
      let n = 0;
      for (const r of decode(saved.b)) if (r.kind === "P" && this.Place(r.type, r.ori, r.pos, 255 << 24 | r.rgb)) n++;
      return n;
    }
  };

  // src/Controls.ts
  function areaOf(b) {
    return b.FindBehavioursOfType("BuildArea")[0] ?? null;
  }
  var PickerTile = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Brick type number (bindings field). */
      __publicField(this, "type", 0);
    }
    Interact() {
      areaOf(this)?.TileClicked(this.type);
    }
  };
  var PickerTab = class extends Behaviour {
    constructor() {
      super(...arguments);
      __publicField(this, "index", 0);
    }
    Interact() {
      areaOf(this)?.ShowCategory(this.index);
    }
  };
  var Swatch = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** 0xRRGGBB (bindings field). */
      __publicField(this, "rgb", 0);
    }
    Interact() {
      areaOf(this)?.SetColorRgb(this.rgb);
    }
  };
  var ToolButton = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** "hammer", "rotate", "lock", "save" or "load" (bindings field). */
      __publicField(this, "tool", "");
    }
    Interact() {
      areaOf(this)?.Tool(this.tool);
    }
  };
  var HAMMER_SWING_SPEED = 0.6;
  var Hammer = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** The head's centre in the hammer's own space (bindings field, metres). */
      __publicField(this, "head", new Vector3(0, 0.3, 0));
      __publicField(this, "held", false);
      __publicField(this, "last", null);
      __publicField(this, "lastTime", 0);
    }
    OnPickup() {
      this.held = true;
      this.last = null;
    }
    OnDrop() {
      this.held = false;
    }
    /** The head in the world. */
    HeadPosition() {
      return this.transform.position.add(this.transform.rotation.rotate(this.head));
    }
    Update() {
      if (!this.held) return;
      const p = this.HeadPosition();
      const now = this.Time.time;
      if (this.last && now > this.lastTime) {
        const speed = p.sub(this.last).magnitude / (now - this.lastTime);
        if (speed >= HAMMER_SWING_SPEED) areaOf(this)?.HammerAt(p);
      }
      this.last = p;
      this.lastTime = now;
    }
    /** The trigger of the hand holding it (bindings: heldTrigger): the brick under the head goes, swung or not. */
    Smash(_detail) {
      void this.transform.Refresh().then(() => areaOf(this)?.HammerAt(this.HeadPosition(), 60));
    }
  };

  // src/HeldBrick.ts
  var DESPAWN_SECONDS = 6;
  var HeldBrick = class extends Behaviour {
    constructor() {
      super(...arguments);
      /** Slot number (bindings field). */
      __publicField(this, "index", 0);
      /** Brick type, -1 when the slot is free. */
      __publicField(this, "t", -1);
      /** ARGB colour (BuildingBrickModel.color). */
      __publicField(this, "c", 0);
      /** 1 while it lies loose (dropped without snapping). */
      __publicField(this, "d", 0);
      /** True on the client whose hand holds it. */
      __publicField(this, "held", false);
      __publicField(this, "looseSince", -1);
      __publicField(this, "shown", -1);
      __publicField(this, "shownColor", -1);
      /** The hand this client attached it to (AttachToHand), or -1. */
      __publicField(this, "attachedSide", -1);
    }
    get area() {
      return this.FindBehavioursOfType("BuildArea")[0];
    }
    get free() {
      return this.t < 0;
    }
    /** BrickPickerBrick.Interact / HandBrickSpawner.HandleButtonPress: this slot becomes a new brick at a pose. */
    Claim(type, color, position, rotation) {
      this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
      this.t = type;
      this.c = color;
      this.d = 1;
      this.looseSince = this.Time.time;
      this.RequestSerialization();
      this.transform.SetPositionAndRotation(position, rotation);
      this.Show();
    }
    /** Back to the pool. */
    Free() {
      if (this.t < 0) return;
      if (!this.Networking.IsOwner(this.gameObject)) this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
      this.t = -1;
      this.d = 0;
      this.held = false;
      this.looseSince = -1;
      this.RequestSerialization();
      this.Show();
    }
    OnPickup() {
      if (this.t < 0) return;
      this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
      this.held = true;
      this.d = 0;
      this.looseSince = -1;
      this.RequestSerialization();
    }
    /**
     * The local hand holds it through AttachToHand (BS.AttachedObject: the brick follows the hand, no grab), as upstream
     * puts a brick taken from the build or the picker straight into the gripping hand (XR ForceSelect).
     */
    AttachTo(side) {
      if (this.t < 0) return;
      this.OnPickup();
      this.attachedSide = side;
      this.gameObject.AttachToHand(side);
    }
    /** The grip that holds an attached brick was let go: it is released where it is (snaps, or lies loose). */
    LetGoOfHand() {
      if (this.attachedSide < 0) return;
      this.attachedSide = -1;
      this.gameObject.Detach();
      void this.transform.Refresh().then(() => this.OnDrop());
    }
    /** BrickAttachDetector.BrickReleased. */
    OnDrop() {
      if (!this.held || this.t < 0) return;
      this.held = false;
      this.area.HeldGone();
      const snapped = this.area.Release(this.t, this.c, this.transform.position, this.transform.rotation);
      if (snapped) {
        this.Free();
      } else {
        this.d = 1;
        this.looseSince = this.Time.time;
        this.RequestSerialization();
      }
    }
    OnDeserialization(result) {
      if (result.isRollback) this.area.SpawnLost(this);
      if (this.d === 1 && this.looseSince < 0) this.looseSince = this.Time.time;
      if (this.d === 0) this.looseSince = -1;
      this.Show();
    }
    Update() {
      if (this.t >= 0 && this.d === 1 && !this.held && this.looseSince >= 0 && this.Time.time - this.looseSince >= DESPAWN_SECONDS && this.Networking.IsOwner(this.gameObject)) {
        this.Free();
      }
      if (this.held && this.t >= 0) this.area.HeldMoved(this);
    }
    /** The slot's object is on while it is a brick, and shows that brick's mesh. */
    Show() {
      const path = this.gameObject.key ? `@Pool/Held${this.index}` : "";
      if (this.t >= 0 && path && (this.shown !== this.t || this.shownColor !== this.c)) {
        const rgb = this.c & 16777215;
        this.Host.setColor(`${path}/${BRICKS[this.t].prefab}/Model`, "_BaseColor", new Color((rgb >> 16 & 255) / 255, (rgb >> 8 & 255) / 255, (rgb & 255) / 255, 1));
        this.shownColor = this.c;
      }
      if (this.shown === this.t) return;
      if (this.shown >= 0 && path) this.Host.setActive(`${path}/${BRICKS[this.shown].prefab}`, false);
      if (this.t >= 0 && path) this.Host.setActive(`${path}/${BRICKS[this.t].prefab}`, true);
      this.gameObject.SetActive(this.t >= 0);
      this.shown = this.t;
    }
  };
  __publicField(HeldBrick, "synced", ["t", "c", "d"]);

  // src/index.ts
  function plannedBuild(count) {
    const brick = BrickByPrefabName("2x2").type;
    const plate = BrickByPrefabName("2x2Plate").type;
    const out = [];
    for (let column = 0; out.length < count; column++) {
      const cx = column % 24 - 12;
      const cz = Math.floor(column / 24) - 12;
      let y = 0;
      for (let k = 0; k < 12 && out.length < count; k++) {
        const isPlate = (column + k) % 3 === 0;
        const h = isPlate ? 32 : 96;
        const rgb = (column * 37 & 255) << 16 | (k * 61 & 255) << 8 | column * k * 13 & 255;
        out.push({ type: isPlate ? plate : brick, ori: (column + k) % 4, pos: [cx * 160 + 80, y + h / 2, cz * 160 + 80], rgb });
        y += h;
      }
    }
    return out;
  }
  var game = {
    slug: "brick-builder",
    behaviours: { BuildArea, BrickLog, BrickSegment, HeldBrick, PickerTile, PickerTab, Swatch, ToolButton, Hammer },
    debug: (instance) => {
      const area = () => instance.behaviour("area");
      return {
        bricks: () => area().ledger.store.count,
        /** The placed bricks' digest (BrickLedger: equal on clients that show the same bricks). */
        bricksDigest: () => area().ledger.digest(),
        me: () => area().Networking.LocalPlayer.sid,
        /** What the renderer sent and what the graph reported built. */
        render: () => {
          const r = area().renderer;
          return r ? { built: { ...r.built }, sent: { ...r.sent }, idle: r.idle, chunks: r.chunkCount, counts: r.counts() } : null;
        },
        /** The picker's local state. */
        picker: () => ({ type: area().selectedType, prefab: BRICKS[area().selectedType]?.prefab, color: area().color & 16777215, hammer: area().hammerMode, category: area().category, yaw: area().yaw }),
        /** Places the planned build straight onto the lattice (the spike's 2,000 bricks). Returns how many went in. */
        build: (count) => {
          let n = 0;
          for (const p of plannedBuild(count)) if (area().Place(p.type, p.ori, p.pos, 255 << 24 | p.rgb)) n++;
          return n;
        },
        /** Spike option (a): the same build as one object per brick, spawned from per-type templates (no records). */
        spikeObjects: (count, colour) => {
          for (const p of plannedBuild(count)) {
            instance.host.op("bspawn", `@Area/Spike/Templates/${BRICKS[p.type].prefab}`, [p.pos[0], p.pos[1], p.pos[2], p.ori, colour ? p.rgb : -1]);
          }
          return count;
        },
        /** Ids and lattice positions of the placed bricks (tests: where to click). */
        placed: () => [...area().ledger.store.bricks.values()].map((b) => ({ id: b.id, type: b.type, prefab: BRICKS[b.type].prefab, ori: b.ori, pos: b.pos, color: b.color & 16777215 })),
        /** One brick straight onto the lattice (the spike's single placements). Returns its id or null. */
        placeOne: (prefab, ori, x, y, z, rgb) => {
          const def = BrickByPrefabName(prefab);
          return def ? area().Place(def.type, ori, [x, y, z], 255 << 24 | rgb) : null;
        },
        /** A lattice point (u) in the world (tests: where to point). */
        toWorld: (x, y, z) => {
          const w = area().ToWorld([x, y, z], [0, 0, 0, 1]).position;
          return [w.x, w.y, w.z];
        },
        locked: () => area().Protected.Get("locked", false),
        canWrite: () => area().Protected.CanWrite,
        /** A held brick from the pool at a lattice point (tests: something to grab). Returns its slot index or -1. */
        spawn: (prefab, x, y, z) => {
          const def = BrickByPrefabName(prefab);
          if (!def) return -1;
          const w = area().ToWorld([x, y, z], [0, 0, 0, 1]);
          const slot = area().Spawn(def.type, area().color, w.position, w.rotation);
          return slot ? slot.index : -1;
        },
        /** AttachToHand on a pool slot (tests: does it follow the hand in Play mode), and let go again. */
        attach: (index, side) => {
          const slot = area().FindBehavioursOfType("HeldBrick").find((h) => h.index === index);
          if (slot) area().IntoHand(slot, side);
          return !!slot;
        },
        letGo: (side) => area().OnButtonReleased(Button.Grip, side),
        slot: (index) => {
          const h = area().FindBehavioursOfType("HeldBrick").find((x) => x.index === index);
          return h ? { t: h.t, c: h.c & 16777215, d: h.d, held: h.held } : null;
        }
      };
    }
  };
  var src_default = game;

  // bindings.json
  var bindings_default = {
    behaviours: [
      {
        fields: {
          index: 0
        },
        id: "h00",
        object: "held0",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 1
        },
        id: "h01",
        object: "held1",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 2
        },
        id: "h02",
        object: "held2",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 3
        },
        id: "h03",
        object: "held3",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 4
        },
        id: "h04",
        object: "held4",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 5
        },
        id: "h05",
        object: "held5",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 6
        },
        id: "h06",
        object: "held6",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 7
        },
        id: "h07",
        object: "held7",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 8
        },
        id: "h08",
        object: "held8",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 9
        },
        id: "h09",
        object: "held9",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 10
        },
        id: "h10",
        object: "held10",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 11
        },
        id: "h11",
        object: "held11",
        type: "HeldBrick"
      },
      {
        fields: {
          index: 0
        },
        id: "b1",
        object: "tab0",
        type: "PickerTab"
      },
      {
        fields: {
          index: 1
        },
        id: "b2",
        object: "tab1",
        type: "PickerTab"
      },
      {
        fields: {
          index: 2
        },
        id: "b3",
        object: "tab2",
        type: "PickerTab"
      },
      {
        fields: {
          index: 3
        },
        id: "b4",
        object: "tab3",
        type: "PickerTab"
      },
      {
        fields: {
          index: 4
        },
        id: "b5",
        object: "tab4",
        type: "PickerTab"
      },
      {
        fields: {
          index: 5
        },
        id: "b6",
        object: "tab5",
        type: "PickerTab"
      },
      {
        fields: {
          type: 0
        },
        id: "b7",
        object: "tile_1x1",
        type: "PickerTile"
      },
      {
        fields: {
          type: 1
        },
        id: "b8",
        object: "tile_1x2",
        type: "PickerTile"
      },
      {
        fields: {
          type: 2
        },
        id: "b9",
        object: "tile_1x3",
        type: "PickerTile"
      },
      {
        fields: {
          type: 3
        },
        id: "b10",
        object: "tile_1x4",
        type: "PickerTile"
      },
      {
        fields: {
          type: 4
        },
        id: "b11",
        object: "tile_1x6",
        type: "PickerTile"
      },
      {
        fields: {
          type: 5
        },
        id: "b12",
        object: "tile_1x8",
        type: "PickerTile"
      },
      {
        fields: {
          type: 6
        },
        id: "b13",
        object: "tile_1x10",
        type: "PickerTile"
      },
      {
        fields: {
          type: 7
        },
        id: "b14",
        object: "tile_2x2",
        type: "PickerTile"
      },
      {
        fields: {
          type: 8
        },
        id: "b15",
        object: "tile_2x3",
        type: "PickerTile"
      },
      {
        fields: {
          type: 9
        },
        id: "b16",
        object: "tile_4x2",
        type: "PickerTile"
      },
      {
        fields: {
          type: 10
        },
        id: "b17",
        object: "tile_2x6",
        type: "PickerTile"
      },
      {
        fields: {
          type: 11
        },
        id: "b18",
        object: "tile_2x8",
        type: "PickerTile"
      },
      {
        fields: {
          type: 12
        },
        id: "b19",
        object: "tile_2x2Corner",
        type: "PickerTile"
      },
      {
        fields: {
          type: 27
        },
        id: "b20",
        object: "tile_1x1Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 28
        },
        id: "b21",
        object: "tile_1x2Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 29
        },
        id: "b22",
        object: "tile_1x3Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 30
        },
        id: "b23",
        object: "tile_1x4Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 31
        },
        id: "b24",
        object: "tile_1x6Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 32
        },
        id: "b25",
        object: "tile_1x8Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 33
        },
        id: "b26",
        object: "tile_1x10Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 34
        },
        id: "b27",
        object: "tile_2x2Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 35
        },
        id: "b28",
        object: "tile_2x3Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 36
        },
        id: "b29",
        object: "tile_2x4Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 37
        },
        id: "b30",
        object: "tile_2x6Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 38
        },
        id: "b31",
        object: "tile_2x8Plate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 39
        },
        id: "b32",
        object: "tile_2x2CornerPlate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 40
        },
        id: "b33",
        object: "tile_1x2Plate1Stud",
        type: "PickerTile"
      },
      {
        fields: {
          type: 41
        },
        id: "b34",
        object: "tile_2x2Plate1Stud",
        type: "PickerTile"
      },
      {
        fields: {
          type: 42
        },
        id: "b35",
        object: "tile_1x1RoundPlate",
        type: "PickerTile"
      },
      {
        fields: {
          type: 13
        },
        id: "b36",
        object: "tile_1x1Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 14
        },
        id: "b37",
        object: "tile_1x2Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 15
        },
        id: "b38",
        object: "tile_1x3Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 16
        },
        id: "b39",
        object: "tile_1x4Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 17
        },
        id: "b40",
        object: "tile_1x6Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 18
        },
        id: "b41",
        object: "tile_1x8Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 19
        },
        id: "b42",
        object: "tile_1x10Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 20
        },
        id: "b43",
        object: "tile_2x2Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 21
        },
        id: "b44",
        object: "tile_2x3Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 22
        },
        id: "b45",
        object: "tile_2x4Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 23
        },
        id: "b46",
        object: "tile_2x6Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 24
        },
        id: "b47",
        object: "tile_2x8Tile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 25
        },
        id: "b48",
        object: "tile_2x2CornerTile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 26
        },
        id: "b49",
        object: "tile_1x1RoundTile",
        type: "PickerTile"
      },
      {
        fields: {
          type: 43
        },
        id: "b50",
        object: "tile_1x2Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 44
        },
        id: "b51",
        object: "tile_1x3Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 45
        },
        id: "b52",
        object: "tile_1x4Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 46
        },
        id: "b53",
        object: "tile_2x2Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 47
        },
        id: "b54",
        object: "tile_2x2CornerSlope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 48
        },
        id: "b55",
        object: "tile_3x3CornerSlope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 49
        },
        id: "b56",
        object: "tile_4x4CornerSlope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 50
        },
        id: "b57",
        object: "tile_1x2SlopeInverted",
        type: "PickerTile"
      },
      {
        fields: {
          type: 51
        },
        id: "b58",
        object: "tile_1x1_2_3Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 52
        },
        id: "b59",
        object: "tile_1x4_2_3Slope",
        type: "PickerTile"
      },
      {
        fields: {
          type: 56
        },
        id: "b60",
        object: "tile_1x1_1FaceSideStud",
        type: "PickerTile"
      },
      {
        fields: {
          type: 57
        },
        id: "b61",
        object: "tile_1x2_1FaceSideStud",
        type: "PickerTile"
      },
      {
        fields: {
          type: 58
        },
        id: "b62",
        object: "tile_1x4_1FaceSideStud",
        type: "PickerTile"
      },
      {
        fields: {
          type: 53
        },
        id: "b63",
        object: "tile_1x2Window",
        type: "PickerTile"
      },
      {
        fields: {
          type: 54
        },
        id: "b64",
        object: "tile_FlatPlant",
        type: "PickerTile"
      },
      {
        fields: {
          type: 55
        },
        id: "b65",
        object: "tile_ThreeLeafedPlant",
        type: "PickerTile"
      },
      {
        fields: {
          type: 59
        },
        id: "b66",
        object: "tile_1x2Masonry",
        type: "PickerTile"
      },
      {
        fields: {
          type: 60
        },
        id: "b67",
        object: "tile_1x4Masonry",
        type: "PickerTile"
      },
      {
        fields: {
          type: 61
        },
        id: "b68",
        object: "tile_1x3Arch",
        type: "PickerTile"
      },
      {
        fields: {
          type: 62
        },
        id: "b69",
        object: "tile_1x4Arch",
        type: "PickerTile"
      },
      {
        fields: {
          type: 63
        },
        id: "b70",
        object: "tile_1x6Arch",
        type: "PickerTile"
      },
      {
        fields: {
          type: 64
        },
        id: "b71",
        object: "tile_1x1Pyramid",
        type: "PickerTile"
      },
      {
        fields: {
          rgb: 13179401
        },
        id: "b72",
        object: "swatch0",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 16681496
        },
        id: "b73",
        object: "swatch1",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 15912247
        },
        id: "b74",
        object: "swatch2",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 4955978
        },
        id: "b75",
        object: "swatch3",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 21951
        },
        id: "b76",
        object: "swatch4",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 8454267
        },
        id: "b77",
        object: "swatch5",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 16777215
        },
        id: "b78",
        object: "swatch6",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 10199453
        },
        id: "b79",
        object: "swatch7",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 332573
        },
        id: "b80",
        object: "swatch8",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 5777938
        },
        id: "b81",
        object: "swatch9",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 14994846
        },
        id: "b82",
        object: "swatch10",
        type: "Swatch"
      },
      {
        fields: {
          rgb: 16553900
        },
        id: "b83",
        object: "swatch11",
        type: "Swatch"
      },
      {
        fields: {
          tool: "hammer"
        },
        id: "b84",
        object: "hammerButton",
        type: "ToolButton"
      },
      {
        fields: {
          tool: "rotate"
        },
        id: "b85",
        object: "rotateButton",
        type: "ToolButton"
      },
      {
        fields: {
          tool: "lock"
        },
        id: "b86",
        object: "lockButton",
        type: "ToolButton"
      },
      {
        fields: {
          tool: "save"
        },
        id: "b87",
        object: "saveButton",
        type: "ToolButton"
      },
      {
        fields: {
          tool: "load"
        },
        id: "b88",
        object: "loadButton",
        type: "ToolButton"
      },
      {
        fields: {
          head: {
            $v3: [0, 0.19, 0]
          }
        },
        id: "b89",
        object: "hammer",
        type: "Hammer"
      },
      {
        fields: {
          audio: {
            $comp: "area",
            kind: "AudioSource"
          },
          carpetClips: [
            {
              $clip: 3,
              on: "area"
            },
            {
              $clip: 4,
              on: "area"
            },
            {
              $clip: 5,
              on: "area"
            }
          ],
          clickClip: {
            $clip: 6,
            on: "area"
          },
          ghostObject: {
            $obj: "ghost"
          },
          snapClips: [
            {
              $clip: 0,
              on: "area"
            },
            {
              $clip: 1,
              on: "area"
            },
            {
              $clip: 2,
              on: "area"
            }
          ],
          spawnClip: {
            $clip: 7,
            on: "area"
          },
          status: {
            $comp: "status",
            kind: "TMP"
          },
          successClip: {
            $clip: 8,
            on: "area"
          }
        },
        id: "area",
        object: "area",
        type: "BuildArea"
      },
      {
        fields: {},
        id: "log",
        object: "area",
        type: "BrickLog"
      },
      {
        fields: {
          index: 0
        },
        id: "s00",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 1
        },
        id: "s01",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 2
        },
        id: "s02",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 3
        },
        id: "s03",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 4
        },
        id: "s04",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 5
        },
        id: "s05",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 6
        },
        id: "s06",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 7
        },
        id: "s07",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 8
        },
        id: "s08",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 9
        },
        id: "s09",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 10
        },
        id: "s10",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 11
        },
        id: "s11",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 12
        },
        id: "s12",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 13
        },
        id: "s13",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 14
        },
        id: "s14",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 15
        },
        id: "s15",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 16
        },
        id: "s16",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 17
        },
        id: "s17",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 18
        },
        id: "s18",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 19
        },
        id: "s19",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 20
        },
        id: "s20",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 21
        },
        id: "s21",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 22
        },
        id: "s22",
        object: "area",
        type: "BrickSegment"
      },
      {
        fields: {
          index: 23
        },
        id: "s23",
        object: "area",
        type: "BrickSegment"
      }
    ],
    bundles: {
      android: "",
      windows: ""
    },
    events: [
      {
        behaviour: "b89",
        kind: "heldTrigger",
        method: "Smash",
        object: "hammer"
      },
      {
        behaviour: "area",
        kind: "click",
        method: "SurfaceClicked",
        object: "carpet"
      },
      {
        behaviour: "area",
        kind: "click",
        method: "SurfaceClicked",
        object: "chunks"
      },
      {
        behaviour: "area",
        kind: "uiSlider",
        method: "HueChanged",
        object: "hue"
      },
      {
        behaviour: "area",
        kind: "uiSlider",
        method: "SaturationChanged",
        object: "saturation"
      },
      {
        behaviour: "area",
        kind: "uiSlider",
        method: "ValueChanged",
        object: "value"
      }
    ],
    hash: "c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9",
    objects: {
      area: {
        click: false,
        grab: false,
        path: "Area",
        seat: false,
        sync: "none"
      },
      carpet: {
        click: true,
        grab: false,
        path: "Area/Carpet",
        seat: false,
        sync: "none"
      },
      cat1: {
        active: false,
        click: false,
        grab: false,
        path: "Picker/Cat1",
        seat: false,
        sync: "none"
      },
      cat2: {
        active: false,
        click: false,
        grab: false,
        path: "Picker/Cat2",
        seat: false,
        sync: "none"
      },
      cat3: {
        active: false,
        click: false,
        grab: false,
        path: "Picker/Cat3",
        seat: false,
        sync: "none"
      },
      cat4: {
        active: false,
        click: false,
        grab: false,
        path: "Picker/Cat4",
        seat: false,
        sync: "none"
      },
      cat5: {
        active: false,
        click: false,
        grab: false,
        path: "Picker/Cat5",
        seat: false,
        sync: "none"
      },
      chunks: {
        click: true,
        grab: false,
        path: "Area/Chunks",
        seat: false,
        sync: "none"
      },
      ghost: {
        click: false,
        grab: false,
        path: "Ghost",
        seat: false,
        sync: "none"
      },
      hammer: {
        click: false,
        grab: true,
        path: "Hammer",
        seat: false,
        sync: "transform"
      },
      hammerButton: {
        click: true,
        grab: false,
        path: "Tools/HammerButton",
        seat: false,
        sync: "none"
      },
      held0: {
        click: false,
        grab: true,
        path: "Pool/Held0",
        seat: false,
        sync: "transform"
      },
      held1: {
        click: false,
        grab: true,
        path: "Pool/Held1",
        seat: false,
        sync: "transform"
      },
      held10: {
        click: false,
        grab: true,
        path: "Pool/Held10",
        seat: false,
        sync: "transform"
      },
      held11: {
        click: false,
        grab: true,
        path: "Pool/Held11",
        seat: false,
        sync: "transform"
      },
      held2: {
        click: false,
        grab: true,
        path: "Pool/Held2",
        seat: false,
        sync: "transform"
      },
      held3: {
        click: false,
        grab: true,
        path: "Pool/Held3",
        seat: false,
        sync: "transform"
      },
      held4: {
        click: false,
        grab: true,
        path: "Pool/Held4",
        seat: false,
        sync: "transform"
      },
      held5: {
        click: false,
        grab: true,
        path: "Pool/Held5",
        seat: false,
        sync: "transform"
      },
      held6: {
        click: false,
        grab: true,
        path: "Pool/Held6",
        seat: false,
        sync: "transform"
      },
      held7: {
        click: false,
        grab: true,
        path: "Pool/Held7",
        seat: false,
        sync: "transform"
      },
      held8: {
        click: false,
        grab: true,
        path: "Pool/Held8",
        seat: false,
        sync: "transform"
      },
      held9: {
        click: false,
        grab: true,
        path: "Pool/Held9",
        seat: false,
        sync: "transform"
      },
      hue: {
        click: false,
        grab: false,
        path: "Picker/Sliders/Hue",
        seat: false,
        sync: "none"
      },
      loadButton: {
        click: true,
        grab: false,
        path: "Tools/LoadButton",
        seat: false,
        sync: "none"
      },
      lockButton: {
        click: true,
        grab: false,
        path: "Tools/LockButton",
        seat: false,
        sync: "none"
      },
      rotateButton: {
        click: true,
        grab: false,
        path: "Tools/RotateButton",
        seat: false,
        sync: "none"
      },
      saturation: {
        click: false,
        grab: false,
        path: "Picker/Sliders/Saturation",
        seat: false,
        sync: "none"
      },
      saveButton: {
        click: true,
        grab: false,
        path: "Tools/SaveButton",
        seat: false,
        sync: "none"
      },
      status: {
        click: false,
        grab: false,
        path: "Picker/Status",
        seat: false,
        sync: "none"
      },
      swatch0: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S0",
        seat: false,
        sync: "none"
      },
      swatch1: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S1",
        seat: false,
        sync: "none"
      },
      swatch10: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S10",
        seat: false,
        sync: "none"
      },
      swatch11: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S11",
        seat: false,
        sync: "none"
      },
      swatch2: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S2",
        seat: false,
        sync: "none"
      },
      swatch3: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S3",
        seat: false,
        sync: "none"
      },
      swatch4: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S4",
        seat: false,
        sync: "none"
      },
      swatch5: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S5",
        seat: false,
        sync: "none"
      },
      swatch6: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S6",
        seat: false,
        sync: "none"
      },
      swatch7: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S7",
        seat: false,
        sync: "none"
      },
      swatch8: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S8",
        seat: false,
        sync: "none"
      },
      swatch9: {
        click: true,
        grab: false,
        path: "Picker/Swatches/S9",
        seat: false,
        sync: "none"
      },
      tab0: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab0",
        seat: false,
        sync: "none"
      },
      tab1: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab1",
        seat: false,
        sync: "none"
      },
      tab2: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab2",
        seat: false,
        sync: "none"
      },
      tab3: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab3",
        seat: false,
        sync: "none"
      },
      tab4: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab4",
        seat: false,
        sync: "none"
      },
      tab5: {
        click: true,
        grab: false,
        path: "Picker/Tabs/Tab5",
        seat: false,
        sync: "none"
      },
      tile_1x1: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x1",
        seat: false,
        sync: "none"
      },
      tile_1x10: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x10",
        seat: false,
        sync: "none"
      },
      tile_1x10Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x10Plate",
        seat: false,
        sync: "none"
      },
      tile_1x10Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x10Tile",
        seat: false,
        sync: "none"
      },
      tile_1x1Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x1Plate",
        seat: false,
        sync: "none"
      },
      tile_1x1Pyramid: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x1Pyramid",
        seat: false,
        sync: "none"
      },
      tile_1x1RoundPlate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x1RoundPlate",
        seat: false,
        sync: "none"
      },
      tile_1x1RoundTile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x1RoundTile",
        seat: false,
        sync: "none"
      },
      tile_1x1Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x1Tile",
        seat: false,
        sync: "none"
      },
      tile_1x1_1FaceSideStud: {
        click: true,
        grab: false,
        path: "Picker/Cat4/Tile_1x1_1FaceSideStud",
        seat: false,
        sync: "none"
      },
      tile_1x1_2_3Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x1-2_3Slope",
        seat: false,
        sync: "none"
      },
      tile_1x2: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x2",
        seat: false,
        sync: "none"
      },
      tile_1x2Masonry: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x2Masonry",
        seat: false,
        sync: "none"
      },
      tile_1x2Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x2Plate",
        seat: false,
        sync: "none"
      },
      tile_1x2Plate1Stud: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x2Plate1Stud",
        seat: false,
        sync: "none"
      },
      tile_1x2Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x2Slope",
        seat: false,
        sync: "none"
      },
      tile_1x2SlopeInverted: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x2SlopeInverted",
        seat: false,
        sync: "none"
      },
      tile_1x2Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x2Tile",
        seat: false,
        sync: "none"
      },
      tile_1x2Window: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x2Window",
        seat: false,
        sync: "none"
      },
      tile_1x2_1FaceSideStud: {
        click: true,
        grab: false,
        path: "Picker/Cat4/Tile_1x2_1FaceSideStud",
        seat: false,
        sync: "none"
      },
      tile_1x3: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x3",
        seat: false,
        sync: "none"
      },
      tile_1x3Arch: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x3Arch",
        seat: false,
        sync: "none"
      },
      tile_1x3Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x3Plate",
        seat: false,
        sync: "none"
      },
      tile_1x3Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x3Slope",
        seat: false,
        sync: "none"
      },
      tile_1x3Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x3Tile",
        seat: false,
        sync: "none"
      },
      tile_1x4: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x4",
        seat: false,
        sync: "none"
      },
      tile_1x4Arch: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x4Arch",
        seat: false,
        sync: "none"
      },
      tile_1x4Masonry: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x4Masonry",
        seat: false,
        sync: "none"
      },
      tile_1x4Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x4Plate",
        seat: false,
        sync: "none"
      },
      tile_1x4Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x4Slope",
        seat: false,
        sync: "none"
      },
      tile_1x4Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x4Tile",
        seat: false,
        sync: "none"
      },
      tile_1x4_1FaceSideStud: {
        click: true,
        grab: false,
        path: "Picker/Cat4/Tile_1x4_1FaceSideStud",
        seat: false,
        sync: "none"
      },
      tile_1x4_2_3Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_1x4-2_3Slope",
        seat: false,
        sync: "none"
      },
      tile_1x6: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x6",
        seat: false,
        sync: "none"
      },
      tile_1x6Arch: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_1x6Arch",
        seat: false,
        sync: "none"
      },
      tile_1x6Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x6Plate",
        seat: false,
        sync: "none"
      },
      tile_1x6Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x6Tile",
        seat: false,
        sync: "none"
      },
      tile_1x8: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_1x8",
        seat: false,
        sync: "none"
      },
      tile_1x8Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_1x8Plate",
        seat: false,
        sync: "none"
      },
      tile_1x8Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_1x8Tile",
        seat: false,
        sync: "none"
      },
      tile_2x2: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_2x2",
        seat: false,
        sync: "none"
      },
      tile_2x2Corner: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_2x2Corner",
        seat: false,
        sync: "none"
      },
      tile_2x2CornerPlate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x2CornerPlate",
        seat: false,
        sync: "none"
      },
      tile_2x2CornerSlope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_2x2CornerSlope",
        seat: false,
        sync: "none"
      },
      tile_2x2CornerTile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x2CornerTile",
        seat: false,
        sync: "none"
      },
      tile_2x2Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x2Plate",
        seat: false,
        sync: "none"
      },
      tile_2x2Plate1Stud: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x2Plate1Stud",
        seat: false,
        sync: "none"
      },
      tile_2x2Slope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_2x2Slope",
        seat: false,
        sync: "none"
      },
      tile_2x2Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x2Tile",
        seat: false,
        sync: "none"
      },
      tile_2x3: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_2x3",
        seat: false,
        sync: "none"
      },
      tile_2x3Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x3Plate",
        seat: false,
        sync: "none"
      },
      tile_2x3Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x3Tile",
        seat: false,
        sync: "none"
      },
      tile_2x4Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x4Plate",
        seat: false,
        sync: "none"
      },
      tile_2x4Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x4Tile",
        seat: false,
        sync: "none"
      },
      tile_2x6: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_2x6",
        seat: false,
        sync: "none"
      },
      tile_2x6Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x6Plate",
        seat: false,
        sync: "none"
      },
      tile_2x6Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x6Tile",
        seat: false,
        sync: "none"
      },
      tile_2x8: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_2x8",
        seat: false,
        sync: "none"
      },
      tile_2x8Plate: {
        click: true,
        grab: false,
        path: "Picker/Cat1/Tile_2x8Plate",
        seat: false,
        sync: "none"
      },
      tile_2x8Tile: {
        click: true,
        grab: false,
        path: "Picker/Cat2/Tile_2x8Tile",
        seat: false,
        sync: "none"
      },
      tile_3x3CornerSlope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_3x3CornerSlope",
        seat: false,
        sync: "none"
      },
      tile_4x2: {
        click: true,
        grab: false,
        path: "Picker/Cat0/Tile_4x2",
        seat: false,
        sync: "none"
      },
      tile_4x4CornerSlope: {
        click: true,
        grab: false,
        path: "Picker/Cat3/Tile_4x4CornerSlope",
        seat: false,
        sync: "none"
      },
      tile_FlatPlant: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_FlatPlant",
        seat: false,
        sync: "none"
      },
      tile_ThreeLeafedPlant: {
        click: true,
        grab: false,
        path: "Picker/Cat5/Tile_ThreeLeafedPlant",
        seat: false,
        sync: "none"
      },
      value: {
        click: false,
        grab: false,
        path: "Picker/Sliders/Value",
        seat: false,
        sync: "none"
      }
    },
    refs: ["area", "ghost", "status", "hammer", "hue", "saturation", "value"],
    schema: 1,
    slug: "brick-builder"
  };

  // portkit/src/platform/bs.ts
  function pageEnv() {
    const g = globalThis;
    let storage = null;
    try {
      storage = g.localStorage ?? null;
    } catch {
      storage = null;
    }
    return {
      get BS() {
        return g.BS;
      },
      win: g.window,
      doc: g.document,
      MutationObserver: g.MutationObserver,
      storage,
      crypto: g.crypto,
      setTimeout: (fn, ms) => g.setTimeout(fn, ms),
      clearTimeout: (handle) => g.clearTimeout(handle),
      now: () => g.performance.now(),
      wallMs: () => g.Date.now(),
      random: () => g.Math.random(),
      console: g.console
    };
  }
  var DEFAULT_BS_OPTIONS = { joinTimeoutMs: 3e4, kitTimeoutMs: 12e4, kitFindMs: 2e4, userFlushMs: 200, verbose: false };
  var HOST_EVENTS = {
    click: "click",
    grab: "grab",
    drop: "drop",
    triggerEnter: "trigger-enter",
    triggerExit: "trigger-exit",
    collisionEnter: "collision-enter",
    collisionExit: "collision-exit"
  };
  var DELIMITER_CODES = [182, 167, 124, 8253, 164];
  function hasDelimiter(text) {
    for (let i = 0; i < text.length; i++) if (DELIMITER_CODES.indexOf(text.charCodeAt(i)) >= 0) return true;
    return false;
  }
  var BsPlatform = class {
    constructor(env2, options = {}) {
      __publicField(this, "clock");
      __publicField(this, "limits", { ...DEFAULT_LIMITS });
      __publicField(this, "storage");
      __publicField(this, "crypto");
      __publicField(this, "env");
      __publicField(this, "options");
      __publicField(this, "scene", null);
      __publicField(this, "readyPromise", null);
      __publicField(this, "mirror", /* @__PURE__ */ new Map());
      __publicField(this, "snapshot", deferred());
      __publicField(this, "fullSeen", false);
      __publicField(this, "stateHandlers", []);
      __publicField(this, "errorHandlers", []);
      __publicField(this, "userHandlers", []);
      __publicField(this, "oneShotHandlers", []);
      __publicField(this, "playerHandlers", []);
      __publicField(this, "sessionHandlers", []);
      __publicField(this, "snippetHandlers", []);
      __publicField(this, "poseHandlers", []);
      __publicField(this, "inputHandlers", []);
      __publicField(this, "wrappers", /* @__PURE__ */ new WeakMap());
      /** uid -> the page's UserData object for everyone in the room. */
      __publicField(this, "roster", /* @__PURE__ */ new Map());
      __publicField(this, "pendingPublic", null);
      __publicField(this, "pendingProtected", null);
      __publicField(this, "pendingUser", /* @__PURE__ */ new Map());
      __publicField(this, "userTimer", 0);
      __publicField(this, "userLastFlush", -Infinity);
      __publicField(this, "userBackoff", 0);
      /** Own user state when the app has no user state to offer (Play mode on your own). */
      __publicField(this, "localUser", null);
      __publicField(this, "ownUser", /* @__PURE__ */ new Map());
      __publicField(this, "sessionId", "");
      __publicField(this, "keyNames", null);
      __publicField(this, "observer", null);
      this.env = env2;
      this.options = { ...DEFAULT_BS_OPTIONS, ...options };
      this.crypto = env2.crypto;
      this.clock = {
        now: () => env2.now(),
        wallSeconds: () => env2.wallMs() / 1e3,
        setTimeout: (fn, ms) => env2.setTimeout(fn, ms),
        clearTimeout: (handle) => env2.clearTimeout(handle)
      };
      const store = env2.storage;
      this.storage = {
        get: (key) => store ? store.getItem(key) : null,
        set: (key, value) => {
          if (!store) throw new Error("no storage on this page");
          store.setItem(key, value);
        },
        remove: (key) => store?.removeItem(key),
        keys: (prefix) => {
          const out = [];
          if (!store) return out;
          for (let i = 0; i < store.length; i++) {
            const key = store.key(i);
            if (key !== null && key.startsWith(prefix)) out.push(key);
          }
          return out;
        }
      };
    }
    random() {
      return this.env.random();
    }
    log(level, message) {
      if (level === "debug" && !this.options.verbose) return;
      const text = "[pk1] " + message;
      if (level === "error") this.env.console.error(text);
      else if (level === "warn") this.env.console.warn(text);
      else this.env.console.log(text);
    }
    // ---- the page registry --------------------------------------------------------------------------------------
    /** `window.__pk1`: made by whichever game script comes first, shared by all of them, so kept small and stable. */
    registry() {
      const win = this.env.win;
      let registry = win.__pk1;
      if (!registry || typeof registry !== "object" || !registry.holders) {
        const made = {
          v: 1,
          games: {},
          holders: {},
          debug: {},
          clock(key, id, seconds) {
            const holder = made.holders[key];
            if (holder) holder.clock(String(id), String(seconds));
          },
          event(key, name, args) {
            const holder = made.holders[key];
            if (holder) holder.event(String(name), args === void 0 || args === null ? "" : String(args));
          }
        };
        registry = made;
        win.__pk1 = made;
      }
      return registry;
    }
    claimGame(slug, info) {
      const registry = this.registry();
      if (Object.prototype.hasOwnProperty.call(registry.games, slug)) return false;
      registry.games[slug] = info;
      return true;
    }
    expose(key, hooks) {
      const registry = this.registry();
      if (hooks) registry.debug[key] = hooks;
      else delete registry.debug[key];
    }
    onRelay(key, handlers) {
      const registry = this.registry();
      const holder = {
        clock: (id, seconds) => handlers.clock(id, Number(seconds)),
        event: (name, args) => handlers.event(name, parseEventArgs(args))
      };
      registry.holders[key] = holder;
      return () => {
        if (registry.holders[key] === holder) delete registry.holders[key];
      };
    }
    relaySend(payload) {
      this.attempt("relay", () => this.scene.SendToVisualScripting(TAG, payload));
    }
    // ---- ready --------------------------------------------------------------------------------------------------
    whenReady() {
      if (!this.readyPromise) this.readyPromise = this.becomeReady();
      return this.readyPromise;
    }
    async becomeReady() {
      const { env: env2 } = this;
      const loaded = deferred();
      env2.win.addEventListener("bs-loaded", () => loaded.resolve());
      await loaded.promise;
      this.scene = env2.BS.Scene.GetInstance();
      this.listen();
      const started = env2.now();
      let warned = false;
      while (!this.joined()) {
        if (env2.now() - started > this.options.joinTimeoutMs) {
          if (!warned) this.log("warn", "the local player has not joined a room; carrying on as the only player");
          warned = true;
          break;
        }
        await this.sleep(100);
      }
      this.sessionId = this.local().sid;
      this.seedMirror();
      this.watchSession();
      this.observeSnippets();
    }
    /** The local user exists and has a real session id (it reads "local" until the room is joined). */
    joined() {
      const user = this.scene.localUser;
      return !!user && typeof user.id === "string" && user.id !== "" && user.id !== "local";
    }
    sleep(ms) {
      return new Promise((resolve) => this.env.setTimeout(resolve, ms));
    }
    watchSession() {
      const check = () => {
        const now = this.local().sid;
        if (now !== this.sessionId) {
          this.sessionId = now;
          for (const handler of this.sessionHandlers.slice()) this.attempt("session handler", handler);
        }
        this.env.setTimeout(check, 1e3);
      };
      this.env.setTimeout(check, 1e3);
    }
    listen() {
      const scene = this.scene;
      const present = scene.users ?? {};
      for (const uid of Object.keys(present)) this.roster.set(uid, present[uid]);
      const on = (name, handler) => scene.On(name, (event) => {
        try {
          handler(event ? event.detail : void 0);
        } catch (error) {
          this.log("error", `${name} handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      on("space-state", (detail) => this.onSpaceState(detail));
      on("space-state-changed", (detail) => {
        if (this.fullSeen || !detail || !Array.isArray(detail.changes)) return;
        for (const change of detail.changes) {
          if (typeof change.property !== "string" || !change.property.startsWith(TAG + ".")) continue;
          this.applyChange(change.property, typeof change.newValue === "string" ? change.newValue : void 0);
        }
      });
      on("space-state-error", (detail) => this.onStateErrorEvent(detail));
      on("user-state-error", (detail) => this.onStateErrorEvent(detail));
      on("one-shot", (detail) => {
        if (!detail || typeof detail.data !== "string") return;
        for (const handler of this.oneShotHandlers.slice()) handler(String(detail.fromId ?? ""), detail.data);
      });
      on("user-joined", (user) => this.emitPlayer("join", user));
      on("user-left", (user) => this.emitPlayer("leave", user));
      on("user-state", (detail) => {
        if (!detail || !Array.isArray(detail.changes)) return;
        const sid = String(detail.id ?? detail.user?.id ?? "");
        for (const change of detail.changes) {
          if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
          const value = change.deleted || typeof change.value !== "string" ? void 0 : change.value;
          if (sid === this.local().sid) {
            if (value === void 0) this.ownUser.delete(change.path);
            else this.ownUser.set(change.path, value);
          }
          this.emitUser(sid, change.path, value);
        }
      });
      on("pose-update", (detail) => {
        if (!detail || !detail.head) return;
        const poses = { head: pose(detail.head), leftHand: pose(detail.leftHand), rightHand: pose(detail.rightHand) };
        for (const handler of this.poseHandlers.slice()) handler(poses);
      });
      const input = (event) => {
        for (const handler of this.inputHandlers.slice()) handler(event);
      };
      on("button-pressed", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: true }));
      on("button-released", (d) => input({ type: "button", button: clampInt(d.button, 4), side: clampInt(d.side, 1), pressed: false }));
      on("controller-axis-update", (d) => input({ type: "thumbstick", side: clampInt(d.hand, 1), x: Number(d.x) || 0, y: Number(d.y) || 0 }));
      on("trigger-axis-update", (d) => input({ type: "trigger", side: clampInt(d.hand, 1), value: Number(d.value) || 0 }));
      on("key-press", (d) => input({ type: "key", key: this.keyName(d.key), pressed: true }));
      on("key-release", (d) => input({ type: "key", key: this.keyName(d.key), pressed: false }));
    }
    keyName(code) {
      if (!this.keyNames) {
        this.keyNames = {};
        const codes = this.env.BS.KeyCode ?? {};
        for (const name of Object.keys(codes)) if (typeof codes[name] === "number") this.keyNames[codes[name]] = name;
      }
      return this.keyNames[Number(code)] ?? String(code);
    }
    // ---- players ------------------------------------------------------------------------------------------------
    toPlayer(user) {
      return { sid: String(user.id ?? ""), uid: String(user.uid ?? ""), name: String(user.name ?? ""), isLocal: user.isLocal === true, isAdmin: user.isSpaceAdmin === true };
    }
    local() {
      const user = this.scene?.localUser;
      if (!user) return { sid: "local", uid: "local", name: "", isLocal: true, isAdmin: false };
      const player = this.toPlayer(user);
      player.isLocal = true;
      if (!player.sid) player.sid = "local";
      return player;
    }
    /**
     * Who is in the room. The page keeps `scene.users` keyed by user id (so two sessions of one account show as
     * one player), and it removes a leaver only after `user-left` has been dispatched: the list is kept here, and
     * each player's fields are read live, because a session id is filled in after the fact.
     */
    players() {
      const out = [];
      let sawLocal = false;
      for (const user of this.roster.values()) {
        const player = this.toPlayer(user);
        if (player.isLocal) {
          sawLocal = true;
          if (!player.sid) player.sid = "local";
        } else if (!player.sid || player.sid === "local") continue;
        out.push(player);
      }
      if (!sawLocal) out.push(this.local());
      return out;
    }
    onPlayers(handler) {
      return subscribe(this.playerHandlers, handler);
    }
    onSessionChanged(handler) {
      return subscribe(this.sessionHandlers, handler);
    }
    emitPlayer(kind, user) {
      if (!user) return;
      const uid = String(user.uid ?? "");
      if (kind === "join") this.roster.set(uid, user);
      else this.roster.delete(uid);
      const player = this.toPlayer(user);
      for (const handler of this.playerHandlers.slice()) this.attempt("player handler", () => handler(kind, player));
    }
    // ---- space state --------------------------------------------------------------------------------------------
    onSpaceState(detail) {
      if (!detail || !Array.isArray(detail.changes)) return;
      if (detail.full) {
        const next = /* @__PURE__ */ new Map();
        for (const change of detail.changes) {
          if (typeof change.path === "string" && change.path.startsWith(TAG + ".") && !change.deleted && typeof change.value === "string") next.set(change.path, change.value);
        }
        this.replaceMirror(next);
        this.fullSeen = true;
        this.snapshot.resolve(true);
        return;
      }
      for (const change of detail.changes) {
        if (typeof change.path !== "string" || !change.path.startsWith(TAG + ".")) continue;
        this.applyChange(change.path, change.deleted || typeof change.value !== "string" ? void 0 : change.value);
      }
    }
    replaceMirror(next) {
      const gone = [...this.mirror.keys()].filter((path) => !next.has(path));
      for (const path of gone) this.applyChange(path, void 0);
      for (const [path, value] of next) this.applyChange(path, value);
    }
    /** Applies one change to the mirror and tells the listeners, unless the mirror already says so. */
    applyChange(path, value) {
      const before = this.mirror.get(path);
      if (before === value) return;
      if (value === void 0) this.mirror.delete(path);
      else this.mirror.set(path, value);
      for (const handler of this.stateHandlers.slice()) {
        if (!path.startsWith(handler.prefix)) continue;
        try {
          handler.fn(path, value);
        } catch (error) {
          this.log("error", `state handler: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    /**
     * The mirror at the moment the adapter became ready. When the snapshot's own event was missed (the script
     * arrived after it), the page's copy of the state is asked for instead.
     */
    seedMirror() {
      if (this.fullSeen) return;
      const take = (entries) => {
        if (this.fullSeen || !entries) return;
        const next = new Map(this.mirror);
        for (const scope of ["public", "protected"]) {
          const map = entries[scope];
          if (!map) continue;
          for (const path of Object.keys(map)) if (path.startsWith(TAG + ".") && typeof map[path] === "string") next.set(path, map[path]);
        }
        this.replaceMirror(next);
      };
      take(this.scene.spaceStateJson);
      if (!this.joined()) return;
      this.attemptAsync("SpaceStateGetAll", async () => {
        const all = await this.scene.SpaceStateGetAll();
        take(all);
        this.snapshot.resolve(true);
      }).then((ok) => {
        if (!ok) this.snapshot.resolve(true);
      });
    }
    whenSnapshot(timeoutMs) {
      if (this.snapshot.settled) return this.snapshot.promise;
      const gate = deferred();
      const timer = this.env.setTimeout(() => gate.resolve(false), timeoutMs);
      this.snapshot.promise.then((ok) => {
        this.env.clearTimeout(timer);
        gate.resolve(ok);
      });
      return gate.promise;
    }
    stateGet(path) {
      return this.mirror.get(path);
    }
    stateEntries(prefix) {
      const out = [];
      for (const [path, value] of this.mirror) if (path.startsWith(prefix)) out.push([path, value]);
      return out;
    }
    /**
     * Writes go through the page's string calls (SetPublicSpaceProps / SetProtectedSpaceProps): those are the ones
     * the app queues, merges per key, sends as one batch every 0.2 s for a single rate-limit token, and retries
     * when the bucket is empty. The JSON calls (SpaceStateSet) are sent one by one and are refused outright when
     * the bucket is empty. (Runtime/LocalMultiplayer/State/SpaceStateService.cs.)
     */
    stateSet(path, value) {
      this.queueSet(path, value, false);
    }
    stateSetProtected(path, value) {
      this.queueSet(path, value, true);
    }
    queueSet(path, value, isProtected) {
      if (hasDelimiter(value) || hasDelimiter(path)) {
        this.log("error", `a state value for ${path} holds a bridge delimiter character and was not sent`);
        this.emitError(path, "invalid_value", true);
        return;
      }
      const first = this.pendingPublic === null && this.pendingProtected === null;
      if (isProtected) (this.pendingProtected ?? (this.pendingProtected = {}))[path] = value;
      else (this.pendingPublic ?? (this.pendingPublic = {}))[path] = value;
      if (!first) return;
      Promise.resolve().then(() => {
        const pub = this.pendingPublic;
        const prot = this.pendingProtected;
        this.pendingPublic = null;
        this.pendingProtected = null;
        if (pub) this.attempt("SetPublicSpaceProps", () => this.scene.SetPublicSpaceProps(pub));
        if (prot) this.attempt("SetProtectedSpaceProps", () => this.scene.SetProtectedSpaceProps(prot));
      });
    }
    async stateDelete(path) {
      let delay = 250;
      for (let tries = 0; tries < 8; tries++) {
        try {
          await this.scene.SpaceStateDelete(path);
          return;
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") return;
          if (code !== "rate_limited" && code !== "timeout") {
            this.emitError(path, code, true);
            return;
          }
          this.emitError(path, code, false);
          await this.sleep(delay);
          delay = Math.min(delay * 2, 4e3);
        }
      }
      this.emitError(path, "rate_limited", true);
    }
    onState(prefix, handler) {
      return subscribe(this.stateHandlers, { prefix, fn: handler });
    }
    onStateError(prefix, handler) {
      return subscribe(this.errorHandlers, { prefix, fn: handler });
    }
    onStateErrorEvent(detail) {
      if (!detail || typeof detail.key !== "string") return;
      if (detail.key.startsWith(TAG + ".")) this.emitError(detail.key, String(detail.code ?? "internal"), true);
    }
    emitError(path, code, final) {
      for (const handler of this.errorHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("state error handler", () => handler.fn(path, code, final));
      }
    }
    // ---- user state ---------------------------------------------------------------------------------------------
    /**
     * Own user state goes through the JSON calls (UserStateSet / UserStateDelete), which answer per write. They
     * are sent one by one from a separate rate bucket, so writes are merged per leaf here and sent at most every
     * 0.2 s. Where the app offers no user state at all (Play mode on your own), the values are kept locally.
     */
    userSet(path, value) {
      if (this.localUser) {
        this.setLocalUser(path, value);
        return;
      }
      this.pendingUser.set(path, value);
      this.scheduleUserFlush();
    }
    scheduleUserFlush() {
      if (this.userTimer) return;
      const wait = Math.max(0, this.userLastFlush + Math.max(this.options.userFlushMs, this.userBackoff) - this.env.now());
      this.userTimer = this.env.setTimeout(() => {
        this.userTimer = 0;
        void this.flushUser();
      }, wait);
    }
    async flushUser() {
      this.userLastFlush = this.env.now();
      const batch = [...this.pendingUser];
      this.pendingUser.clear();
      let limited = false;
      for (const [path, value] of batch) {
        if (this.localUser) {
          this.setLocalUser(path, value);
          continue;
        }
        try {
          if (value === null) await this.scene.UserStateDelete(path);
          else await this.scene.UserStateSet(path, value);
        } catch (error) {
          const code = errorCode(error);
          if (code === "not_found") continue;
          if (code === "app_unavailable") {
            this.log("info", "no user state in this session: keeping the local player's own values locally");
            this.localUser = /* @__PURE__ */ new Map();
            this.setLocalUser(path, value);
          } else if (code === "rate_limited" || code === "timeout") {
            limited = true;
            if (!this.pendingUser.has(path)) this.pendingUser.set(path, value);
            this.emitError(path, code, false);
          } else this.emitError(path, code, true);
        }
      }
      this.userBackoff = limited ? Math.min(Math.max(this.userBackoff * 2, 250), 4e3) : 0;
      if (this.pendingUser.size) this.scheduleUserFlush();
    }
    setLocalUser(path, value) {
      const store = this.localUser;
      if (value === null) store.delete(path);
      else store.set(path, value);
      const sid = this.local().sid;
      Promise.resolve().then(() => this.emitUser(sid, path, value === null ? void 0 : value));
    }
    userGet(sid, path) {
      if (sid === this.local().sid) {
        if (this.localUser) return this.localUser.get(path);
        const own = this.ownUser.get(path);
        if (own !== void 0) return own;
      }
      for (const user of this.roster.values()) {
        if (user && user.id === sid) {
          const value = user.state ? user.state[path] : void 0;
          return typeof value === "string" ? value : void 0;
        }
      }
      return void 0;
    }
    onUser(prefix, handler) {
      return subscribe(this.userHandlers, { prefix, fn: handler });
    }
    emitUser(sid, path, value) {
      for (const handler of this.userHandlers.slice()) {
        if (path.startsWith(handler.prefix)) this.attempt("user state handler", () => handler.fn(sid, path, value));
      }
    }
    // ---- one-shots ----------------------------------------------------------------------------------------------
    oneShot(data) {
      if (utf8Length(data) > this.limits.oneShotMaxBytes) return false;
      this.attempt("OneShot", () => this.scene.OneShot(data));
      return true;
    }
    onOneShot(handler) {
      return subscribe(this.oneShotHandlers, handler);
    }
    // ---- kit ----------------------------------------------------------------------------------------------------
    async loadKit(spec) {
      const BS = this.env.BS;
      const holder = new BS.GameObject(spec.holderName);
      await holder.Async();
      const placement = {};
      if (spec.position) placement.localPosition = toBs3(BS, spec.position);
      if (spec.rotation) placement.localEulerAngles = toBs3(BS, spec.rotation);
      if (spec.scale) placement.localScale = toBs3(BS, spec.scale);
      if (Object.keys(placement).length) await holder.SetTransform(placement);
      await holder.AddComponent(new BS.AssetBundle(spec.windows, "", "", spec.android, "", "", false, false));
      const item = new BS.KitItem("*");
      const loaded = deferred();
      item.On("loaded", () => loaded.resolve(true));
      await holder.AddComponent(item);
      if (item.isLoaded) loaded.resolve(true);
      const timer = this.env.setTimeout(() => loaded.resolve(false), this.options.kitTimeoutMs);
      const ok = await loaded.promise;
      this.env.clearTimeout(timer);
      if (!ok) this.log("error", `kit ${spec.holderName}: the kit item never reported loaded`);
      const scene = this.scene;
      const childrenOf = (parent) => {
        const id = String(parent.unityId);
        return Object.values(scene.objects ?? {}).filter((o) => String(o.parent) === id && !o.destroyed);
      };
      const byPath = (root, path) => {
        let at = root;
        if (path === "") return at;
        for (const name of path.split("/")) {
          at = childrenOf(at).find((o) => o.name === name);
          if (!at) return null;
        }
        return at;
      };
      const found = /* @__PURE__ */ new Map();
      let waiting = spec.objects.slice();
      const deadline = this.env.now() + this.options.kitFindMs;
      for (; ; ) {
        const roots = childrenOf(holder);
        const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
        if (root) {
          waiting = waiting.filter((object) => {
            const go = byPath(root, object.path);
            if (go) found.set(object.key, go);
            return !go;
          });
        }
        if (!waiting.length || this.env.now() >= deadline) break;
        await this.sleep(200);
      }
      for (const object of waiting) {
        try {
          const go = await holder.AddInlineObject(spec.rootName + "/" + object.path);
          if (go) found.set(object.key, go);
        } catch {
        }
      }
      const objects = /* @__PURE__ */ new Map();
      const missing = [];
      const prepare = async (object) => {
        const go = found.get(object.key);
        if (!go) {
          missing.push(object.key);
          return;
        }
        try {
          if (object.networkId) await go.SetNetworkId(object.networkId);
          let synced = null;
          let seat = null;
          if (object.sync === "transform") {
            synced = await go.AddComponent(
              new BS.SyncedObject({
                syncPosition: true,
                syncRotation: true,
                takeOwnershipOnCollision: false,
                takeOwnershipOnProximity: false,
                takeOwnershipOnGrab: object.grab,
                kinematicIfNotOwned: false
              })
            );
          }
          if (object.seat) seat = await go.AddComponent(new BS.Seat({}));
          objects.set(object.key, new BsHostObject(this, object.key, object.path, go, synced, seat));
        } catch (error) {
          this.log("warn", `kit object ${object.key} (${object.path}): ${describe(error)}`);
          missing.push(object.key);
        }
      };
      await Promise.all(spec.objects.map(prepare));
      return {
        objects,
        missing,
        find: async (path) => {
          const roots = childrenOf(holder);
          const root = roots.find((o) => o.name === spec.rootName) ?? roots[0];
          const known = root ? byPath(root, path) : null;
          if (known) return new BsHostObject(this, "", path, known, null, null);
          try {
            const go = await holder.AddInlineObject(spec.rootName + "/" + path);
            return go ? new BsHostObject(this, "", path, go, null, null) : null;
          } catch {
            return null;
          }
        },
        destroy: () => {
          try {
            holder.Destroy();
          } catch {
          }
        }
      };
    }
    bundles(slug) {
      const table = this.env.win.__pk1_bundles;
      const entry = table ? table[slug] : void 0;
      if (!entry) return null;
      const address = (value) => typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : "";
      const out = { windows: address(entry.windows), android: address(entry.android) };
      return out.windows || out.android ? out : null;
    }
    // ---- snippets -----------------------------------------------------------------------------------------------
    snippets(slug) {
      const all = Array.from(this.env.doc.querySelectorAll("bs-snippet"));
      const mine = all.filter((el) => (el.getAttribute("name") || "") === slug);
      return mine.map((el, index) => this.wrap(el, slug, index, mine));
    }
    wrap(el, slug, index, sameName) {
      let wrapper = this.wrappers.get(el);
      if (!wrapper) {
        const made = {
          _index: index,
          _peers: sameName,
          getAttribute: (name) => el.getAttribute(name),
          attributeNames: () => typeof el.getAttributeNames === "function" ? el.getAttributeNames() : [],
          get connected() {
            return el.isConnected !== false;
          },
          get active() {
            const single = el.getAttribute("single");
            if (single === null || single === "false") return true;
            if ("ownsSingleton" in el) return el.ownsSingleton === slug;
            return made._peers.indexOf(el) === 0;
          },
          get index() {
            return made._index;
          }
        };
        wrapper = made;
        this.wrappers.set(el, made);
      }
      wrapper._index = index;
      wrapper._peers = sameName;
      return wrapper;
    }
    onSnippetsChanged(handler) {
      return subscribe(this.snippetHandlers, handler);
    }
    observeSnippets() {
      if (this.observer || !this.env.MutationObserver) return;
      let queued = false;
      const observer = new this.env.MutationObserver(() => {
        if (queued) return;
        queued = true;
        this.env.setTimeout(() => {
          queued = false;
          for (const handler of this.snippetHandlers.slice()) this.attempt("snippet handler", handler);
        }, 0);
      });
      observer.observe(this.env.doc.documentElement, { childList: true, subtree: true });
      this.observer = observer;
    }
    // ---- the local player ---------------------------------------------------------------------------------------
    async isVR() {
      try {
        return await this.scene.IsVR() === true;
      } catch {
        return false;
      }
    }
    async raycast(origin, direction, maxDistance, layerMask) {
      const BS = this.env.BS;
      const reply = await this.scene.Raycast(toBs3(BS, origin), toBs3(BS, direction), maxDistance, layerMask);
      if (typeof reply !== "string") return null;
      const parts = reply.split("\xB6");
      if (parts.length < 8) return null;
      const n = parts.slice(2, 8).map(Number);
      return { objectId: parts[1], point: new Vector3(n[0], n[1], n[2]), normal: new Vector3(n[3], n[4], n[5]) };
    }
    onPose(handler) {
      return subscribe(this.poseHandlers, handler);
    }
    onInput(handler) {
      return subscribe(this.inputHandlers, handler);
    }
    haptic(side, strength, seconds) {
      this.attempt("SendHapticImpulse", () => this.scene.SendHapticImpulse(strength, seconds, side));
    }
    teleport(position, yDegrees, stopMovement) {
      this.attempt("TeleportTo", () => this.scene.TeleportTo(toBs3(this.env.BS, position), yDegrees, stopMovement));
    }
    setAbility(ability, allowed) {
      this.attempt("SetCan" + ability, () => this.scene["SetCan" + ability](allowed));
    }
    setBlock(control, blocked) {
      this.attempt("SetBlock" + control, () => this.scene["SetBlock" + control](blocked));
    }
    // ---- helpers ------------------------------------------------------------------------------------------------
    /** Runs a bridge call whose result nobody waits for; a failure is logged, never thrown into game code. */
    attempt(what, call) {
      try {
        const result = call();
        if (result && typeof result.then === "function") {
          result.then(void 0, (error) => this.log("warn", `${what} failed: ${describe(error)}`));
        }
      } catch (error) {
        this.log("warn", `${what} failed: ${describe(error)}`);
      }
    }
    async attemptAsync(what, call) {
      try {
        await call();
        return true;
      } catch (error) {
        this.log("debug", `${what} failed: ${describe(error)}`);
        return false;
      }
    }
    /** @internal for BsHostObject */
    get api() {
      return this.env.BS;
    }
    /** @internal for BsHostObject */
    userSession(user) {
      return user && typeof user.id === "string" ? user.id : void 0;
    }
  };
  var BsHostObject = class {
    constructor(platform, key, path, go, synced, seat) {
      __publicField(this, "key");
      __publicField(this, "path");
      __publicField(this, "platform");
      __publicField(this, "go");
      __publicField(this, "synced");
      __publicField(this, "seat");
      __publicField(this, "watchers", []);
      __publicField(this, "watching", false);
      __publicField(this, "attached", null);
      this.platform = platform;
      this.key = key;
      this.path = path;
      this.go = go;
      this.synced = synced;
      this.seat = seat;
    }
    on(kind, handler) {
      const name = HOST_EVENTS[kind];
      if (!name) return () => {
      };
      const listener = (event) => {
        const d = event && event.detail ? event.detail : {};
        const detail = {};
        if (d.point) detail.point = from3(d.point);
        if (d.normal) detail.normal = from3(d.normal);
        if (typeof d.side === "number") detail.side = d.side;
        if (typeof d.name === "string") detail.otherName = d.name;
        const sid = this.platform.userSession(d.user);
        if (sid) detail.playerSid = sid;
        handler(detail);
      };
      this.go.On(name, listener);
      return () => this.go.Off(name, listener);
    }
    setTransform(patch) {
      const BS = this.platform.api;
      const out = {};
      if (patch.position) out.position = toBs3(BS, patch.position);
      if (patch.localPosition) out.localPosition = toBs3(BS, patch.localPosition);
      if (patch.localScale) out.localScale = toBs3(BS, patch.localScale);
      if (patch.rotation) out.rotation = new BS.Quaternion(patch.rotation.x, patch.rotation.y, patch.rotation.z, patch.rotation.w);
      if (patch.localRotation) out.localRotation = new BS.Quaternion(patch.localRotation.x, patch.localRotation.y, patch.localRotation.z, patch.localRotation.w);
      this.platform.attempt("SetTransform", () => this.go.SetTransform(out));
    }
    /**
     * Asking to watch a transform makes the host push its current value before it answers
     * (BSScene.WatchJsTransform calls SyncProperties(true)), so one round trip is a fresh read.
     * UNVERIFIED in the app: that the push reaches the page before the answer does.
     */
    async readTransform() {
      const PN = this.platform.api.PN ?? this.platform.api.PropertyName;
      try {
        await this.go.WatchTransform([PN.position, PN.rotation], () => this.report());
        this.watching = true;
      } catch {
        return null;
      }
      return this.current();
    }
    watchTransform(handler) {
      this.watchers.push(handler);
      if (!this.watching) void this.readTransform();
      return () => {
        const at = this.watchers.indexOf(handler);
        if (at >= 0) this.watchers.splice(at, 1);
      };
    }
    current() {
      const t = this.go.transform;
      if (!t || !t.position) return null;
      const r = t.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
      return { position: from3(t.position), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
    }
    report() {
      const now = this.current();
      if (now) for (const watcher of this.watchers.slice()) watcher(now);
    }
    setActive(active) {
      this.platform.attempt("SetActive", () => this.go.SetActive(active));
    }
    setLayer(layer) {
      this.platform.attempt("SetLayer", () => this.go.SetLayer(layer));
    }
    takeOwnership() {
      if (this.synced) this.platform.attempt("TakeOwnership", () => this.synced.TakeOwnership());
    }
    async doIOwn() {
      if (!this.synced) return false;
      try {
        return await this.synced.DoIOwn() === true;
      } catch {
        return false;
      }
    }
    /** UNVERIFIED: that a kit object's own BSAudioSource is known to the page once the object is. */
    playClip(index) {
      const BS = this.platform.api;
      const source = this.go.GetComponent ? this.go.GetComponent((BS.CT ?? BS.ComponentType).AudioSource) : null;
      if (source) this.platform.attempt("PlayOneShot", () => source.PlayOneShot(index));
      else this.platform.log("warn", `no audio source known on ${this.path}`);
    }
    sit() {
      if (this.seat) this.platform.attempt("Sit", () => this.seat.Sit());
    }
    stand() {
      if (this.seat) this.platform.attempt("Stand", () => this.seat.Stand());
    }
    /** UNVERIFIED in Play mode: BS.AttachedObject added to a kit object, attachment point set, then Attach(local user id). */
    attachToHand(side, position, rotation) {
      const BS = this.platform.api;
      const uid = this.platform.local().uid;
      void (async () => {
        try {
          if (!this.attached) {
            this.attached = await this.go.AddComponent(
              new BS.AttachedObject({
                uid,
                attachmentPosition: new BS.Vector3(position.x, position.y, position.z),
                attachmentRotation: new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
                attachmentType: 1,
                // NonPhysics
                attachmentPoint: side === 0 ? 1 : 2,
                // LeftHand, RightHand
                autoSync: false,
                jointAvatar: false
              })
            );
          } else {
            this.attached.attachmentPoint = side === 0 ? 1 : 2;
            this.attached.attachmentPosition = new BS.Vector3(position.x, position.y, position.z);
            this.attached.attachmentRotation = new BS.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
          }
          await this.attached.Attach(uid);
        } catch (error) {
          this.platform.log("warn", `AttachedObject on ${this.path}: ${String(error)}`);
        }
      })();
    }
    detach() {
      if (!this.attached) return;
      const uid = this.platform.local().uid;
      this.platform.attempt("Detach", () => this.attached.Detach(uid));
    }
    releaseGrab() {
      this.platform.attempt("ReleaseGrab", () => this.go.ReleaseGrab());
    }
  };
  function subscribe(list, item) {
    list.push(item);
    return () => {
      const at = list.indexOf(item);
      if (at >= 0) list.splice(at, 1);
    };
  }
  function toBs3(BS, v) {
    return new BS.Vector3(v.x, v.y, v.z);
  }
  function from3(v) {
    return new Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0);
  }
  function pose(source) {
    const p = source?.position ?? {};
    const r = source?.rotation ?? {};
    return { position: from3(p), rotation: new Quaternion(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0, r.w === void 0 ? 1 : Number(r.w)) };
  }
  function clampInt(value, max) {
    const n = Math.trunc(Number(value) || 0);
    return n < 0 ? 0 : n > max ? max : n;
  }
  function errorCode(error) {
    if (error && typeof error === "object" && typeof error.code === "string") return error.code;
    return "internal";
  }
  function describe(error) {
    if (error instanceof Error) return error.message;
    return typeof error === "string" ? error : JSON.stringify(error);
  }

  // pk-brick-builder.entry.ts
  var env = pageEnv();
  var claimed = env.win.__pk1 && env.win.__pk1.games && Object.prototype.hasOwnProperty.call(env.win.__pk1.games, src_default.slug);
  if (!claimed) boot(new BsPlatform(env), src_default, bindings_default);
})();
