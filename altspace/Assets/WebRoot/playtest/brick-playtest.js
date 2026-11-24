// Play-mode tests of Brick Builder (TESTS.md): the rendering spike, rung 3 (one player, real input through the SDK's
// desktop player with portkit's InputSim, Unity read back with probe / renderstats) and rung 4 (two Local Multiplayer
// players, late join by reload). Not part of the snippet: the test page loads it before the snippet.
//
// window.__brickPlan: "spike" (2,000 bricks through the chunk renderer, then single placements, then a late join by
// reload), "spikeA" / "spikeA2" (spike option (a): 2,000 objects from per-type templates, with and without a colour of
// their own), "single" (rung 3), "multi" (rung 4).
(function () {
  "use strict";
  const KEY = "brick-builder:0";
  const HOLDER = "pk1:brick-builder:0";
  const say = (kind, what, detail) => console.log("PKTEST " + kind + " " + what + (detail !== undefined ? ": " + detail : ""));
  const check = (ok, what, detail) => {
    say(ok ? "PASS" : "FAIL", what, detail);
    return ok;
  };
  const replies = new Map();
  let count = 0;
  window.__pktest = Object.assign(window.__pktest || {}, {
    reply(id, text) {
      const resolve = replies.get(id);
      if (resolve) {
        replies.delete(id);
        resolve(text);
      }
    },
  });
  const cmd = (line, ms) =>
    new Promise((resolve) => {
      const id = "b" + ++count + "_" + Math.floor(Math.random() * 1e6);
      replies.set(id, resolve);
      console.log("PKTEST CMD " + id + " " + line);
      setTimeout(() => {
        if (replies.delete(id)) resolve("error: no reply");
      }, ms || 30000);
    });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(test, ms, step) {
    const end = Date.now() + ms;
    for (;;) {
      let value = false;
      try {
        value = test();
      } catch (e) {
        value = false;
      }
      if (value) return value;
      if (Date.now() > end) return false;
      await sleep(step || 100);
    }
  }
  const debug = () => window.__pk1 && window.__pk1.debug && window.__pk1.debug[KEY];
  const probe = (what, path, extra) => cmd("probe " + HOLDER + " " + what + " " + path.replace(/ /g, "%20") + (extra ? " " + extra : ""));
  const stats = async () => {
    const text = await cmd("renderstats " + HOLDER, 60000);
    const out = { text };
    const parts = text.split(" ");
    for (let i = 0; i + 1 < parts.length; i += 2) out[parts[i]] = Number(parts[i + 1]);
    return out;
  };
  const vec = (a) => a.map((v) => v.toFixed(4)).join(" ");
  const flag = (name, value) => {
    try {
      if (value === undefined) return sessionStorage.getItem(name);
      if (value === null) sessionStorage.removeItem(name);
      else sessionStorage.setItem(name, value);
    } catch (e) {
      return null;
    }
    return null;
  };
  const median = (xs) => {
    const s = xs.slice().sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : NaN;
  };

  async function waitStarted() {
    const ok = await until(() => debug() && debug().render() !== null, 120000, 200);
    check(!!ok, "the kit loads from a hand-written bs-snippet and the instance starts", ok ? "at " + Math.round(performance.now()) + " ms after the page opened" : "no instance");
    return !!ok;
  }

  async function aim(lattice) {
    const w = debug().toWorld(lattice[0], lattice[1], lattice[2]);
    await cmd("look " + vec(w));
    return vec(w);
  }

  async function clickPath(path, what) {
    const pos = await probe("pos", path);
    await cmd("look " + pos);
    const r = await cmd("click " + pos);
    say("INFO", "click " + what, r + " at " + pos);
    return r.startsWith("ok");
  }

  // ---- the rendering spike, option (b): records to the chunk renderer ---------------------------------------------------
  async function spike() {
    const back = flag("brickSpikeReload") === "1";
    if (!(await waitStarted())) return;
    if (back) {
      flag("brickSpikeReload", null);
      const want = Number(flag("brickSpikeCount") || "0");
      const start = performance.now();
      const done = await until(() => debug().bricks() === want && debug().render().idle && debug().render().built.ops > 0, 60000, 20);
      const at = performance.now();
      const s = await stats();
      const r = debug().render();
      check(!!done && s.drawn === want, "late join by reload: every brick is rebuilt and drawn",
        `${s.drawn} drawn of ${want}; the page opened ${Math.round(at)} ms before the last chunk was built (instance started at ${Math.round(start)} ms); ${r.built.ops} chunk ops, merge ${r.built.totalMs.toFixed(1)} ms in all (worst ${r.built.maxMs.toFixed(1)}), colliders ${r.built.totalColliderMs.toFixed(1)} ms (worst ${r.built.maxColliderMs.toFixed(1)})`);
      check(at < 5000 + 0 && done, "late join within 5 s of opening the page (plan's pass rule)", `${Math.round(at)} ms`);
      check(debug().bricksDigest() === flag("brickSpikeDigest"), "the reloaded page holds the same bricks (digest)", debug().bricksDigest());
      say("INFO", "renderstats after the late join", s.text);
      say("INFO", "frame time", await cmd("framems 120"));
      return;
    }
    await aim([0, 0, -400]);
    const before = await stats();
    say("INFO", "renderstats before any brick", before.text);
    const t0 = performance.now();
    const placed = debug().build(2000);
    const built = await until(() => debug().render().idle && debug().render().built.ops >= debug().render().chunks, 60000, 10);
    const t1 = performance.now();
    const r = debug().render();
    const s = await stats();
    check(placed === 2000 && !!built && s.drawn === 2000 && s.emptySlots === 0, "2,000 bricks placed and every one drawn (no lost bricks)", `placed ${placed}, drawn ${s.drawn}, empty slots ${s.emptySlots}, chunks ${s.chunks}`);
    say("INFO", "first build of 2,000 bricks", `${Math.round(t1 - t0)} ms on the page from the first Place to the last chunk built; ${r.sent.ops} ops, ${r.sent.records} records, ${r.sent.bytes} bytes; merge ${r.built.totalMs.toFixed(1)} ms in all, worst chunk ${r.built.maxMs.toFixed(1)} ms; colliders ${r.built.totalColliderMs.toFixed(1)} ms, worst ${r.built.maxColliderMs.toFixed(1)} ms`);
    const brickBatches = s.batches - before.batches;
    check(brickBatches <= 100, "draw batches for the bricks at most 100 (plan's pass rule)", `${s.batches} batches with the bricks, ${before.batches} without: ${brickBatches} for 2,000 bricks; draw calls ${s.drawCalls - before.drawCalls}, SetPass ${s.setPassCalls}, triangles ${s.triangles}, merged vertices ${s.chunkVertices}`);
    say("INFO", "renderstats with 2,000 bricks", s.text);
    say("INFO", "frame time with 2,000 bricks", await cmd("framems 120"));

    // single placements: one brick on a column's top, the chunk rebuilt from the records that changed
    const merges = [];
    const colliders = [];
    const latencies = [];
    const tops = new Map();
    for (const b of debug().placed()) {
      const k = b.pos[0] + "," + b.pos[2];
      if (!tops.has(k) || tops.get(k).pos[1] < b.pos[1]) tops.set(k, b);
    }
    const columns = [...tops.values()].slice(0, 10);
    for (let i = 0; i < columns.length; i++) {
      const top = columns[i];
      const ops = debug().render().built.ops;
      const t = performance.now();
      const id = debug().placeOne("2x2", 0, top.pos[0], top.pos[1] + (top.prefab === "2x2" ? 48 : 16) + 48, top.pos[2], 0x2050c0);
      const ok = await until(() => debug().render().built.ops > ops && debug().render().idle, 5000, 5);
      latencies.push(performance.now() - t);
      merges.push(debug().render().built.lastMs);
      colliders.push(debug().render().built.lastColliderMs);
      if (!id || !ok) say("INFO", "placement " + i + " did not go in", String(id));
    }
    const s2 = await stats();
    check(merges.length === 10 && Math.max(...merges) <= 8, "chunk rebuild within 8 ms after a placement (plan's pass rule; merge, in Unity)",
      `merge median ${median(merges).toFixed(2)} ms, worst ${Math.max(...merges).toFixed(2)} ms over ${merges.length} placements; collider cooking median ${median(colliders).toFixed(2)}, worst ${Math.max(...colliders).toFixed(2)} ms; page-to-built latency median ${median(latencies).toFixed(0)} ms`);
    check(s2.drawn === debug().bricks(), "after the placements every brick is still drawn", `${s2.drawn} drawn, ${debug().bricks()} placed`);
    // the late join: reload this page
    flag("brickSpikeReload", "1");
    flag("brickSpikeCount", String(debug().bricks()));
    await sleep(2500); // the referee archives once a second; let the log drain
    flag("brickSpikeDigest", debug().bricksDigest());
    say("INFO", "reloading the page for the late join", debug().bricksDigest());
    await sleep(300);
    location.reload();
    await sleep(120000);
  }

  // ---- spike option (a): one object per brick ------------------------------------------------------------------------------
  async function spikeObjects(colour) {
    if (!(await waitStarted())) return;
    await aim([0, 0, -400]);
    const before = await stats();
    const t0 = performance.now();
    debug().spikeObjects(2000, colour);
    let s = null;
    for (let i = 0; i < 600; i++) {
      s = await stats();
      if (s.spikeObjects >= 2000) break;
      await sleep(200);
    }
    const t1 = performance.now();
    check(s && s.spikeObjects === 2000, `option (a)${colour ? "" : " without colours"}: 2,000 objects from per-type templates`, `${s ? s.spikeObjects : 0} objects in ${Math.round(t1 - t0)} ms (the page sent 2,000 bspawn records in one tick)`);
    say("INFO", `option (a)${colour ? " (a material of its own per brick, renderer.material)" : " (the shared GPU-instancing material)"}: batches`, `${s.batches - before.batches} for the bricks (${s.batches} with, ${before.batches} without); draw calls ${s.drawCalls - before.drawCalls}; instanced batches ${s.instancedBatches}; ${s.text}`);
    say("INFO", "frame time", await cmd("framems 120"));
  }

  window.__brickRun = async function (plan) {
    try {
      if (plan === "spike") await spike();
      else if (plan === "spikeA") await spikeObjects(true);
      else if (plan === "spikeA2") await spikeObjects(false);
      else if (plan === "single" && window.__brickSingle) await window.__brickSingle({ say, check, cmd, sleep, until, debug, probe, stats, vec, flag, aim, clickPath, waitStarted });
      else if (plan === "multi" && window.__brickMulti) await window.__brickMulti({ say, check, cmd, sleep, until, debug, probe, stats, vec, flag, aim, clickPath, waitStarted });
    } catch (e) {
      check(false, "the test ran to its end", e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : String(e));
    }
    console.log("PKTEST DONE");
  };
  if (window.__brickPlan) setTimeout(() => window.__brickRun(window.__brickPlan), 0);
})();
