// Rung 3 (one player) and rung 4 (two Local Multiplayer players) of Brick Builder, driven through the SDK's desktop
// player with portkit's InputSim (real clicks and grabs; the SDK casts its own rays), Unity read back with probe and
// renderstats. Loaded before brick-playtest.js, which calls window.__brickSingle / window.__brickMulti with its helpers.
(function () {
  "use strict";

  /** A click on the carpet or a brick face at a lattice point (u), aimed from the desktop player's camera. */
  async function clickLattice(t, p, what) {
    const w = t.vec(t.debug().toWorld(p[0], p[1], p[2]));
    await t.cmd("look " + w);
    const r = await t.cmd("click " + w);
    t.say("INFO", "click " + what, r + " at " + w);
    return r;
  }

  async function placeOnCarpet(t, p, what) {
    const n = t.debug().bricks();
    await clickLattice(t, p, what);
    return !!(await t.until(() => t.debug().bricks() === n + 1, 4000, 50));
  }

  window.__brickSingle = async function (t) {
    const { say, check, cmd, sleep, until, debug, probe, stats, flag, clickPath, waitStarted } = t;
    const back = flag("brickRung3Reload") === "1";
    if (!(await waitStarted())) return;
    if (back) {
      flag("brickRung3Reload", null);
      const want = Number(flag("brickRung3Count"));
      const ok = await until(() => debug().bricks() === want && debug().render().idle && debug().render().built.ops > 0, 30000, 50);
      const s = await stats();
      check(!!ok && debug().bricksDigest() === flag("brickRung3Digest"), "after a reload the build is there again (late join from room state)", `${debug().bricks()} of ${want} bricks, digest ${debug().bricksDigest()}`);
      check(s.drawn === want, "and every brick of it is drawn", `${s.drawn} drawn; ${s.text}`);
      // the save on this device: Load replaces the build with what Save kept (one brick fewer than now, see below)
      await clickPath("Tools/LoadButton", "Load");
      const loaded = await until(() => debug().bricks() === Number(flag("brickRung3Saved")), 8000, 100);
      check(!!loaded, "Load puts back the build saved on this device", `${debug().bricks()} bricks, saved ${flag("brickRung3Saved")}`);
      await sleep(1000);
      await until(() => debug().render().idle, 5000, 50);
      const s2 = await stats();
      check(s2.drawn === debug().bricks(), "the loaded build is drawn", `${s2.drawn} drawn`);
      await cmd("shot loaded 0 1.8 -3.2 0 0.2 0 50");
      return;
    }
    // the editor's local relay keeps room state between Play sessions (a build stays: whenEmpty "keep"): start empty
    if (debug().bricks() > 0) {
      const had = debug().bricks();
      debug().clear();
      await until(() => debug().bricks() === 0 && debug().render().idle, 10000, 100);
      say("INFO", "cleared what an earlier session left in the room", `${had} bricks`);
    }
    // the first grab of a Play session lets go by itself (portkit RESULTS.md, S6): use it up on the hammer
    const hammerPos = await probe("pos", "Hammer");
    await cmd("look " + hammerPos);
    await cmd("press " + hammerPos);
    await cmd("wait 10");
    await cmd("release");
    await sleep(800);

    // the picker: a category tab, a brick, a colour
    await clickPath("Picker/Tabs/Tab1", "the Plates tab");
    const plates = await until(() => debug().picker().category === 1, 3000, 50);
    await sleep(700); // the relay ops go with the next tick and run in a later frame
    const shown = [await probe("active", "Picker/Cat1"), await probe("active", "Picker/Cat0")];
    check(!!plates && shown[0] === "True" && shown[1] === "False", "a category tab shows its bricks", `category ${debug().picker().category}; Cat1 active ${shown[0]}, Cat0 active ${shown[1]}`);
    await clickPath("Picker/Tabs/Tab0", "the Bricks tab");
    await until(() => debug().picker().category === 0, 3000, 50);
    await clickPath("Picker/Cat0/Tile_2x2", "the 2x2 brick");
    check(await until(() => debug().picker().prefab === "2x2", 3000, 50), "a click on a picker tile selects that brick", JSON.stringify(debug().picker()));
    await clickPath("Picker/Swatches/S4", "the blue swatch");
    const blue = await until(() => debug().picker().color === 0x0055bf, 3000, 50);
    await sleep(500);
    const tint = await probe("color", "Picker/Cat0/Tile_2x2/Model", "_BaseColor");
    check(!!blue && tint.startsWith("0.000 0.333 0.749"), "a swatch sets the colour; the picker's bricks show it (relay op tint)", `colour ${debug().picker().color.toString(16)}, tile ${tint}`);

    // three bricks on the carpet, one on top of another
    const spots = [[-400, 0, -800], [0, 0, -800], [400, 0, -800]];
    let placed = 0;
    for (let i = 0; i < spots.length; i++) if (await placeOnCarpet(t, spots[i], "the carpet " + i)) placed++;
    const onCarpet = debug().placed();
    check(placed === 3 && onCarpet.every((b) => b.pos[1] === 48 && b.pos[0] % 40 === 0 && b.pos[2] % 40 === 0 && b.color === 0x0055bf),
      "clicks on the carpet place the selected brick in the selected colour, snapped to the studs", JSON.stringify(onCarpet.map((b) => [b.prefab, b.pos, b.color.toString(16)])));
    await clickPath("Picker/Swatches/S2", "the yellow swatch");
    await until(() => debug().picker().color === 0xf2cd37, 3000, 50);
    const first = onCarpet[0];
    const before = debug().bricks();
    await clickLattice(t, [first.pos[0] + 4, 96, first.pos[2] - 4], "the top of the first brick");
    const stacked = await until(() => debug().bricks() === before + 1, 4000, 50);
    say("INFO", "the click on the brick reached the page as", JSON.stringify(debug().lastClick()));
    const top = debug().placed().find((b) => b.pos[1] === 144);
    check(!!stacked && !!top && top.pos[0] === first.pos[0] && top.pos[2] === first.pos[2], "a click on a brick's top puts the next brick on its studs (the build is clickable)",
      top ? JSON.stringify([top.prefab, top.pos, top.color.toString(16)]) : "nothing stacked (" + debug().bricks() + " bricks)");
    await until(() => debug().render().idle, 4000, 50);
    const s = await stats();
    check(s.drawn === debug().bricks() && s.chunks >= 1, "every placed brick is drawn by the chunk renderer", `${s.drawn} drawn of ${debug().bricks()}; ${s.text}`);
    await cmd("shot built 0 1.8 -3.2 0 0.2 -0.5 50");

    // a held brick from the pool: grab it, let go just above the carpet, it snaps
    const slotIndex = debug().spawn("1x4", 800, 60, -400);
    await sleep(800);
    const slotPath = "Pool/Held" + slotIndex;
    const slotPos = await probe("pos", slotPath);
    const n0 = debug().bricks();
    await cmd("look " + slotPos);
    await cmd("press " + slotPos);
    await cmd("wait 15");
    await cmd("release");
    const snapped = await until(() => debug().bricks() === n0 + 1, 4000, 50);
    check(slotIndex >= 0 && !!snapped && debug().slot(slotIndex).t === -1, "a held brick grabbed and let go above the carpet snaps, and its pool slot is free again",
      `slot ${slotIndex} at ${slotPos}; bricks ${n0} -> ${debug().bricks()}; slot ${JSON.stringify(debug().slot(slotIndex))}`);

    // AttachToHand (portkit: unverified in Play mode): a brick put straight into the hand follows it
    const attachIndex = debug().spawn("2x2", 0, 400, -1200);
    await sleep(600);
    const p0 = await probe("pos", "Pool/Held" + attachIndex);
    debug().attach(attachIndex, 1);
    await sleep(800);
    const p1 = await probe("pos", "Pool/Held" + attachIndex);
    await cmd("look 1.5 1 0");
    await sleep(800);
    const p2 = await probe("pos", "Pool/Held" + attachIndex);
    const moved = p0 !== p1 || p1 !== p2;
    say("INFO", "AttachToHand in Play mode", `before ${p0}, attached ${p1}, after turning ${p2}: ${moved ? "it moved with the player" : "it did not move"}`);
    debug().letGo(1);
    await sleep(1500);
    say("INFO", "after letting go", JSON.stringify(debug().slot(attachIndex)));

    // the hammer (desktop: hammer mode, then a click on a brick)
    await clickPath("Tools/HammerButton", "Hammer");
    const on = await until(() => debug().picker().hammer, 3000, 50);
    await sleep(700);
    const marker = await probe("active", "Tools/HammerButton/On");
    const n1 = debug().bricks();
    const victim = debug().placed().find((b) => b.pos[1] === 144) || debug().placed()[0];
    await clickLattice(t, [victim.pos[0] + 10, victim.pos[1] + 48, victim.pos[2] + 10], "the stacked brick with the hammer");
    say("INFO", "the hammer click reached the page as", JSON.stringify(debug().lastClick()));
    const gone = await until(() => debug().bricks() === n1 - 1 && !debug().placed().some((b) => b.id === victim.id), 4000, 50);
    await until(() => debug().render().idle, 4000, 50);
    const s3 = await stats();
    check(!!on && marker === "True" && !!gone && s3.drawn === debug().bricks(), "the hammer removes the brick it hits, for the renderer too", `hammer ${on}, marker ${marker}; ${n1} -> ${debug().bricks()} bricks; drawn ${s3.drawn}`);
    await clickPath("Tools/HammerButton", "Hammer off");
    await until(() => !debug().picker().hammer, 3000, 50);

    // the hammer in the hand: grab it and pull its trigger (key 3) over nothing: the page hears it, nothing is removed
    const hp = await probe("pos", "Hammer");
    const n2 = debug().bricks();
    await cmd("look " + hp);
    await cmd("press " + hp);
    await cmd("wait 10");
    const trig = await cmd("key Digit3 tap");
    await cmd("wait 10");
    await cmd("release");
    await sleep(800);
    check(debug().bricks() === n2, "the hammer's trigger away from the build removes nothing", `${trig}; ${debug().bricks()} bricks`);

    // the lock (world owner and moderators only)
    const canWrite = debug().canWrite();
    await clickPath("Tools/LockButton", "Lock");
    await sleep(1500);
    const lockedNow = debug().locked();
    const status = await probe("text", "Picker/Status");
    if (canWrite) {
      check(lockedNow === true && status.indexOf("locked") >= 0, "the owner locks the area (protected state); the status line says so", `locked ${lockedNow}; status '${status}'`);
      await clickPath("Tools/LockButton", "Unlock");
      await until(() => debug().locked() === false, 3000, 50);
      check(debug().locked() === false, "and unlocks it again", String(debug().locked()));
    } else {
      check(lockedNow === false, "a player who is not the owner cannot lock the area", `locked ${lockedNow}, can write ${canWrite}`);
    }

    // save on the device, then one more brick, then reload: the room state brings back the build (with the extra brick),
    // and Load brings back the saved one
    await clickPath("Tools/SaveButton", "Save");
    flag("brickRung3Saved", String(debug().bricks()));
    await placeOnCarpet(t, [-800, 0, -1200], "the carpet once more");
    await sleep(2500);
    flag("brickRung3Count", String(debug().bricks()));
    flag("brickRung3Digest", debug().bricksDigest());
    flag("brickRung3Reload", "1");
    say("INFO", "reloading the page", `${debug().bricks()} bricks, digest ${debug().bricksDigest()}`);
    await sleep(300);
    location.reload();
    await sleep(120000);
  };

  // ---- two players ------------------------------------------------------------------------------------------------------
  const heard = [];
  function channel() {
    const scene = window.BS.Scene.GetInstance();
    scene.On("one-shot", (e) => {
      const data = e && e.detail && e.detail.data;
      if (typeof data !== "string" || data.indexOf("brickTest") < 0) return;
      try {
        heard.push(JSON.parse(data));
      } catch (x) {
        /* not ours */
      }
    });
    return (message) => scene.OneShot(JSON.stringify(Object.assign({ brickTest: 1 }, message)));
  }

  window.__brickMulti = async function (t) {
    const { say, check, cmd, sleep, until, debug, stats, flag, waitStarted } = t;
    const back = flag("brickRung4Reload") === "1";
    if (!(await waitStarted())) return;
    const send = channel();
    const two = await until(() => debug().players().length >= 2, 90000, 500);
    check(!!two, "two players in the room", JSON.stringify(debug().players()));
    if (!two) return;
    const me = debug().me();
    if (back) {
      flag("brickRung4Reload", null);
      const want = Number(flag("brickRung4Count"));
      const ok = await until(() => debug().bricks() >= want && debug().render().idle && debug().render().built.ops > 0, 30000, 50);
      const s = await stats();
      check(!!ok && s.drawn === debug().bricks(), "late join by reload: the build is rebuilt and drawn", `${debug().bricks()} bricks (had ${want}), drawn ${s.drawn}`);
      send({ kind: "back", digest: debug().bricksDigest(), bricks: debug().bricks() });
      return;
    }
    await sleep(3000);
    const others = debug().players().filter((p) => p.sid !== me);
    const first = me < others[0].sid;
    if (first && debug().bricks() > 0) {
      const had = debug().bricks();
      debug().clear();
      say("INFO", "cleared what an earlier session left in the room", `${had} bricks`);
    }
    await until(() => debug().bricks() === 0, 15000, 100);
    await sleep(1000);
    say("INFO", (first ? "A" : "B") + " is " + me);
    // the first grab of a session lets go by itself; a click is not a grab, but keep the two players' timing alike
    await sleep(first ? 0 : 150);
    // both place three bricks at once, each in a row of its own
    const z = first ? -1200 : -400;
    let mine = 0;
    for (const x of [-800, -320, 160]) {
      const n = debug().bricks();
      const w = t.vec(debug().toWorld(x, 0, z));
      await cmd("look " + w);
      await cmd("click " + w);
      if (await until(() => debug().bricks() > n, 4000, 50)) mine++;
    }
    check(mine === 3, "this player placed three bricks by clicking the carpet", `${mine}`);
    const all = await until(() => debug().bricks() === 6, 20000, 100);
    await until(() => debug().render().idle, 5000, 50);
    const s = await stats();
    check(!!all && s.drawn === 6, "both players' bricks arrive on this page and are drawn", `${debug().bricks()} bricks, ${s.drawn} drawn`);
    await sleep(2500);
    send({ kind: "digest", digest: debug().bricksDigest(), who: me });
    const theirs = await until(() => heard.find((m) => m.kind === "digest"), 20000, 100);
    check(!!theirs && theirs.digest === debug().bricksDigest(), "both pages show identical builds (digests)", theirs ? `${theirs.digest} / ${debug().bricksDigest()}` : "no digest heard");
    if (!first) {
      flag("brickRung4Reload", "1");
      flag("brickRung4Count", String(debug().bricks()));
      say("INFO", "B reloads its page");
      await sleep(500);
      location.reload();
      await sleep(120000);
      return;
    }
    // A: while B is away, one more brick; B must see it after coming back
    await sleep(1500);
    const n = debug().bricks();
    const w = t.vec(debug().toWorld(640, 0, -1200));
    await cmd("look " + w);
    await cmd("click " + w);
    await until(() => debug().bricks() === n + 1, 4000, 50);
    const backMsg = await until(() => heard.find((m) => m.kind === "back"), 120000, 250);
    await sleep(1000);
    check(!!backMsg && backMsg.digest === debug().bricksDigest() && backMsg.bricks === debug().bricks(), "the reloaded page rebuilds everything, the brick placed while it was away too (digests)",
      backMsg ? `${backMsg.bricks} bricks, ${backMsg.digest} / ${debug().bricks()} bricks, ${debug().bricksDigest()}` : "no word from B");
  };
})();
