// Golden vectors: BricksVR's own BrickAttachDetector.cs, LegoConnectorScript.cs and ColorInt.cs, compiled unchanged
// against BrickStubs.cs, driven over generated situations; the results go to ../vectors/upstream.json and
// test/golden.test.ts plays the same inputs through the TypeScript.
//
// Bricks are built from the upstream prefabs themselves (PrefabYaml.cs: Assets/Resources/<name>.prefab held,
// "<name> - Placed.prefab" placed), not from the port's catalogue: the held brick's _maleConnectors /
// _femaleConnectors are the prefab's serialized lists, colliders keep m_Enabled, transforms keep Unity's child order.
// src/catalogue.json only chooses the situations (which type, near which connector). Positions are lattice units (u)
// times 7e-4 upstream world units. What Unity's trigger callbacks would have put in
// LegoConnectorScript.connectorsCollidingWith is filled in by the same oriented-box overlap the stubs use for CheckBox,
// over the connectors whose colliders are enabled (not covered).

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using UnityEngine;

public static class Harness
{
    const float W = 7e-4f; // upstream world units per u

    class Conn { public string kind; public string name; public float[] p; public float[] q; }
    class Box { public float[] c; public float[] size; public float[] q; }
    class Brick
    {
        public string prefab; public bool picker; public bool tile; public bool window; public float heightOverride;
        public List<Conn> connectors; public List<Box> heldBoxes; public Box rootBox; public List<Box> placedBoxes;
        public float bottomPlates; public float heightPlates;
    }

    static List<Brick> Catalogue;
    static Random Rng;

    static Vector3 V(float[] a) => new Vector3(a[0], a[1], a[2]);
    static Quaternion Q(float[] a) => new Quaternion(a[0], a[1], a[2], a[3]);
    static float R(double lo, double hi) => (float)(lo + (hi - lo) * Rng.NextDouble());

    static List<Brick> Load(string path)
    {
        var doc = JsonDocument.Parse(File.ReadAllText(path));
        var list = new List<Brick>();
        foreach (var b in doc.RootElement.GetProperty("bricks").EnumerateArray())
        {
            float[] F(JsonElement e) => e.EnumerateArray().Select(x => (float)x.GetDouble()).ToArray();
            Box B(JsonElement e) => new Box { c = F(e.GetProperty("c")), size = F(e.GetProperty("size")), q = F(e.GetProperty("q")) };
            var model = b.GetProperty("model");
            list.Add(new Brick
            {
                prefab = b.GetProperty("prefab").GetString(),
                picker = b.GetProperty("picker").GetBoolean(),
                tile = b.GetProperty("tile").GetBoolean(),
                window = b.GetProperty("window").GetBoolean(),
                heightOverride = (float)b.GetProperty("heightOverride").GetDouble(),
                connectors = b.GetProperty("connectors").EnumerateArray().Select(c => new Conn { kind = c.GetProperty("kind").GetString(), name = c.GetProperty("name").GetString(), p = F(c.GetProperty("p")), q = F(c.GetProperty("q")) }).ToList(),
                heldBoxes = b.GetProperty("heldBoxes").EnumerateArray().Select(B).ToList(),
                rootBox = b.GetProperty("rootBox").ValueKind == JsonValueKind.Null ? null : B(b.GetProperty("rootBox")),
                placedBoxes = b.GetProperty("placedBoxes").EnumerateArray().Select(B).ToList(),
                bottomPlates = (float)model.GetProperty("bottomPlates").GetDouble(),
                heightPlates = (float)model.GetProperty("heightPlates").GetDouble(),
            });
        }
        return list;
    }

    class Built
    {
        public GameObject root;
        public List<LegoConnectorScript> male = new List<LegoConnectorScript>();
        public List<LegoConnectorScript> female = new List<LegoConnectorScript>();
        public List<LegoConnectorScript> all = new List<LegoConnectorScript>();
        public List<BoxCollider> colliders = new List<BoxCollider>();
        public PrefabYaml.Instance inst;
    }

    static void Call(object o, string method) =>
        o.GetType().GetMethod(method, BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public).Invoke(o, null);

    static string Resources;

    static Built Make(Brick def, bool held, Vector3 pos, Quaternion rot, string id)
    {
        var path = Path.Combine(Resources, def.prefab + (held ? "" : " - Placed") + ".prefab");
        var inst = PrefabYaml.Instantiate(path, held, pos, rot, id);
        var b = new Built { root = inst.root, inst = inst };
        b.male.AddRange(inst.male);
        b.female.AddRange(inst.female);
        b.all.AddRange(inst.all);
        b.colliders.AddRange(inst.colliders);
        return b;
    }

    static Built Floor(int range)
    {
        var b = new Built();
        var root = new GameObject("Floor");
        var parent = new GameObject("FloorConnectors");
        parent.transform.SetParentKeepLocal(root.transform);
        for (int i = -range; i <= range; i++)
            for (int j = -range; j <= range; j++)
            {
                var g = new GameObject("Floor") { layer = 15, tag = "Connector-Male" };
                g.transform.SetParentKeepLocal(parent.transform);
                g.transform.localPosition = new Vector3(i * 80 * W, 0.0148f, j * 80 * W);
                g.transform.localScale = new Vector3(0.04f, 0.04f, 0.04f);
                var col = g.AddComponent<BoxCollider>();
                col.isTrigger = true;
                var s = g.AddComponent<LegoConnectorScript>();
                s.connectorsCollidingWith = new List<GameObject>();
                Call(s, "Awake");
                b.male.Add(s);
                b.all.Add(s);
            }
        return b;
    }

    static bool TriggersTouch(LegoConnectorScript a, LegoConnectorScript b)
    {
        var ca = a.GetComponent<BoxCollider>();
        var cb = b.GetComponent<BoxCollider>();
        if (!cb.enabled || !ca.enabled) return false;
        return Physics.Overlap(a.transform.TransformPoint(ca.center), Vector3.Scale(ca.size / 2, a.transform.lossyScale), a.transform.rotation,
            b.transform.TransformPoint(cb.center), Vector3.Scale(cb.size / 2, b.transform.lossyScale), b.transform.rotation);
    }

    // ---- one situation ------------------------------------------------------------------------------------------

    class Placed { public int type; public int yaw; public int[] pos; }

    static string Num(float v) => v.ToString("R", System.Globalization.CultureInfo.InvariantCulture);
    static string Arr(IEnumerable<float> v) => "[" + string.Join(",", v.Select(Num)) + "]";

    static string RunCase(string kind, List<Placed> placed, int heldType, Vector3 heldPosU, Quaternion heldRot)
    {
        Physics.All.Clear();
        GameObject.Tagged.Clear();
        var rosGo = new GameObject("RoomOwnershipSync");
        rosGo.AddComponent<RoomOwnershipSync>();
        GameObject.Tagged["RoomOwnershipSync"] = rosGo;

        var bricks = new List<Built>();
        for (int i = 0; i < placed.Count; i++)
        {
            var p = placed[i];
            bricks.Add(Make(Catalogue[p.type], false, new Vector3(p.pos[0] * W, p.pos[1] * W, p.pos[2] * W), Quaternion.Euler(0, 90 * p.yaw, 0), "b" + i));
        }
        // LegoConnectorScript.RecalculateEnabled on every placed connector (BrickAttach.RecalculateEnabledConnectors)
        foreach (var b in bricks) foreach (var s in b.all) s.RecalculateEnabled();
        var floor = Floor(14);

        var held = Make(Catalogue[heldType], true, heldPosU * W, heldRot, "held");
        var det = held.root.AddComponent<BrickAttachDetector>();
        held.root.AddComponent<GrabShim>();
        // The prefab's serialized fields, as Unity deserializes them (not recomputed by OnValidate).
        det.maleConnectorParent = held.inst.maleParent;
        det.femaleConnectorParent = held.inst.femaleParent;
        det._maleConnectors = held.inst.maleList;
        det._femaleConnectors = held.inst.femaleList;
        det.colliders = held.inst.colliders.ToArray();
        det.tile = held.inst.tile;
        det.window = held.inst.window;
        det.heightOverride = held.inst.heightOverride;
        Call(det, "Awake");
        Call(det, "Start");

        // What the trigger callbacks would have collected.
        var targetsMale = bricks.SelectMany(b => b.male).Concat(floor.male).ToList();
        var targetsFemale = bricks.SelectMany(b => b.female).ToList();
        foreach (var s in held.female) foreach (var t in targetsMale) if (TriggersTouch(s, t)) s.connectorsCollidingWith.Add(t.gameObject);
        foreach (var s in held.male) foreach (var t in targetsFemale) if (TriggersTouch(s, t)) s.connectorsCollidingWith.Add(t.gameObject);

        var (can, pos, rot, dir) = det.CheckIfCanConnect();

        var sb = new StringBuilder();
        sb.Append("{\"kind\":\"").Append(kind).Append("\",\"placed\":[");
        sb.Append(string.Join(",", placed.Select(p => $"{{\"type\":{p.type},\"ori\":{p.yaw},\"pos\":[{p.pos[0]},{p.pos[1]},{p.pos[2]}]}}")));
        sb.Append("],\"held\":{\"type\":").Append(heldType).Append(",\"pos\":").Append(Arr(new[] { heldPosU.x, heldPosU.y, heldPosU.z }))
          .Append(",\"q\":").Append(Arr(new[] { heldRot.x, heldRot.y, heldRot.z, heldRot.w })).Append("},");
        sb.Append("\"upstream\":{\"can\":").Append(can ? "true" : "false");
        if (can)
            sb.Append(",\"pos\":").Append(Arr(new[] { pos.x / W, pos.y / W, pos.z / W })).Append(",\"q\":").Append(Arr(new[] { rot.x, rot.y, rot.z, rot.w }))
              .Append(",\"down\":").Append(dir.y < 0 ? "true" : "false");
        // Cover flags by connector: "m|f:x,y,z", the connector's position in its brick's space rounded to whole u, so the
        // test matches them without sharing any order or name (the placed 2x4 plate names its connectors differently
        // from the held one).
        string Key(Built b, LegoConnectorScript s)
        {
            Vector3 l = b.root.transform.InverseTransformPoint(s.transform.position) / W;
            int Rn(float v) => (int)Math.Round(v, MidpointRounding.AwayFromZero);
            return $"{(s.female ? "f" : "m")}:{Rn(l.x)},{Rn(l.y)},{Rn(l.z)}";
        }
        sb.Append(",\"covered\":[").Append(string.Join(",", bricks.Select(b => "{" + string.Join(",", b.all.Select(s => $"\"{Key(b, s)}\":{(s.covered ? "true" : "false")}")) + "}"))).Append("]");
        sb.Append(",\"pairs\":").Append(held.female.Concat(held.male).Sum(s => s.connectorsCollidingWith.Count));
        sb.Append("}}");
        return sb.ToString();
    }

    // ---- situations -------------------------------------------------------------------------------------------

    static int[] RoundedOffset(Brick def, Conn c, int yaw)
    {
        // The connector's lateral offset from the brick's centre, turned by the yaw, on the half-stud grid.
        Vector3 v = Quaternion.Euler(0, 90 * yaw, 0) * new Vector3(c.p[0] / W, 0, c.p[2] / W);
        return new[] { (int)Math.Round(v.x / 40) * 40, (int)Math.Round(v.z / 40) * 40 };
    }

    static Placed OnFloor(int type, int yaw, int i, int j)
    {
        var def = Catalogue[type];
        var f = def.connectors.FirstOrDefault(c => c.kind == "female" && Math.Abs(c.q[3]) > 0.999f) ?? def.connectors[0];
        var o = RoundedOffset(def, f, yaw);
        return new Placed { type = type, yaw = yaw, pos = new[] { i * 80 - o[0], (int)Math.Round(-def.bottomPlates * 32), j * 80 - o[1] } };
    }

    static Vector3 ConnWorldU(Placed p, Conn c) =>
        new Vector3(p.pos[0], p.pos[1], p.pos[2]) + Quaternion.Euler(0, 90 * p.yaw, 0) * (V(c.p) / W);

    static Quaternion SmallTilt(float deg) => Quaternion.Euler(R(-deg, deg), 0, R(-deg, deg));

    static List<int> Types(Func<Brick, bool> ok) => Enumerable.Range(0, Catalogue.Count).Where(i => Catalogue[i].picker && ok(Catalogue[i])).ToList();
    static T Pick<T>(List<T> l) => l[Rng.Next(l.Count)];
    static bool Upright(Conn c) => Math.Abs(Math.Abs(c.q[3]) - 1) < 1e-4 || Math.Abs(Math.Abs(c.q[1]) - 1) < 1e-4;

    public static void Main(string[] args)
    {
        string here = AppContext.BaseDirectory;
        string root = Path.GetFullPath(Path.Combine(here, "..", "..", "..", ".."));
        if (!File.Exists(Path.Combine(root, "src", "catalogue.json"))) root = Directory.GetCurrentDirectory();
        Catalogue = Load(Path.Combine(root, "src", "catalogue.json"));
        Resources = Path.GetFullPath(Path.Combine(root, "..", "..", "Assets", "Resources"));
        Rng = new Random(20261124);
        var cases = new List<string>();
        var withFemales = Types(b => b.connectors.Any(c => c.kind == "female" && Upright(c)));
        var withMales = Types(b => b.connectors.Any(c => c.kind == "male" && Upright(c)));
        var sideStud = Types(b => b.connectors.Any(c => c.kind == "male" && !Upright(c)));

        // V1: let go above the carpet
        for (int n = 0; n < 150; n++)
        {
            int ht = Pick(withFemales);
            var f = Pick(Catalogue[ht].connectors.Where(c => c.kind == "female" && Upright(c)).ToList());
            Quaternion rot = Quaternion.Euler(0, R(0, 360), 0) * SmallTilt(8);
            var stud = new Vector3(Rng.Next(-6, 7) * 80, 0.0148f / W, Rng.Next(-6, 7) * 80);
            var probe = stud + new Vector3(R(-18, 18), R(4, 22), R(-18, 18));
            var pos = probe - rot * (V(f.p) / W);
            cases.Add(RunCase("floor", new List<Placed>(), ht, pos, rot));
        }
        // V2: onto a placed brick (sometimes with a second brick stacked on it, covering studs and in the way)
        for (int n = 0; n < 220; n++)
        {
            int tt = Pick(withMales);
            var target = OnFloor(tt, Rng.Next(4), Rng.Next(-3, 4), Rng.Next(-3, 4));
            var placed = new List<Placed> { target };
            if (Rng.NextDouble() < 0.4)
            {
                var cover = Pick(withFemales);
                var top = OnFloor(cover, Rng.Next(4), Rng.Next(-4, 5), Rng.Next(-4, 5));
                top.pos[1] += (int)Math.Round((Catalogue[tt].bottomPlates + Catalogue[tt].heightPlates) * 32);
                placed.Add(top);
            }
            var m = Pick(Catalogue[tt].connectors.Where(c => c.kind == "male" && Upright(c)).ToList());
            int ht = Pick(withFemales);
            var f = Pick(Catalogue[ht].connectors.Where(c => c.kind == "female" && Upright(c)).ToList());
            Quaternion rot = Quaternion.Euler(0, R(0, 360), 0) * SmallTilt(8);
            var probe = ConnWorldU(target, m) + new Vector3(R(-18, 18), R(-22, -4), R(-18, 18));
            cases.Add(RunCase("brick", placed, ht, probe - rot * (V(f.p) / W), rot));
        }
        // V3: up into the sockets of a brick held above the carpet (a placed brick resting on another placed brick)
        for (int n = 0; n < 80; n++)
        {
            int tt = Pick(withFemales);
            var target = OnFloor(tt, Rng.Next(4), Rng.Next(-3, 4), Rng.Next(-3, 4));
            target.pos[1] += 6 * 96;
            var fc = Pick(Catalogue[tt].connectors.Where(c => c.kind == "female" && Upright(c)).ToList());
            int ht = Pick(withMales);
            var m = Pick(Catalogue[ht].connectors.Where(c => c.kind == "male" && Upright(c)).ToList());
            Quaternion rot = Quaternion.Euler(0, R(0, 360), 0) * SmallTilt(8);
            var probe = ConnWorldU(target, fc) + new Vector3(R(-18, 18), R(-24, -6), R(-18, 18));
            cases.Add(RunCase("under", new List<Placed> { target }, ht, probe - rot * (V(m.p) / W), rot));
        }
        // V4: onto a side stud
        for (int n = 0; n < 80; n++)
        {
            int tt = Pick(sideStud);
            var target = OnFloor(tt, Rng.Next(4), Rng.Next(-3, 4), Rng.Next(-3, 4));
            var m = Pick(Catalogue[tt].connectors.Where(c => c.kind == "male" && !Upright(c)).ToList());
            int ht = Pick(withFemales);
            var f = Pick(Catalogue[ht].connectors.Where(c => c.kind == "female" && Upright(c)).ToList());
            Quaternion frame = Quaternion.Euler(0, 90 * target.yaw, 0) * Q(m.q);
            Quaternion rot = frame * Quaternion.Euler(0, R(0, 360), 0) * SmallTilt(6);
            var probe = ConnWorldU(target, m) + frame * new Vector3(R(-15, 15), R(-20, -4), R(-15, 15));
            cases.Add(RunCase("side", new List<Placed> { target }, ht, probe - rot * (V(f.p) / W), rot));
        }
        // V5: anywhere near a small build, any rotation (mostly "does not attach", some odd pairs)
        for (int n = 0; n < 120; n++)
        {
            var placed = new List<Placed> { OnFloor(Pick(withMales), Rng.Next(4), 0, 0), OnFloor(Pick(withMales), Rng.Next(4), 2, 1) };
            int ht = Pick(Types(b => true));
            Quaternion rot = Quaternion.Euler(R(0, 360), R(0, 360), R(0, 360));
            var pos = new Vector3(R(-160, 240), R(0, 200), R(-160, 200));
            cases.Add(RunCase("random", placed, ht, pos, rot));
        }

        // ColorInt
        var colors = new List<string>();
        for (int n = 0; n < 64; n++)
        {
            var c = new Color(R(0, 1), R(0, 1), R(0, 1), n % 8 == 0 ? R(0, 1) : 1f);
            int i = ColorInt.ColorToInt(c);
            var c32 = ColorInt.IntToColor32(i);
            colors.Add($"{{\"rgba\":{Arr(new[] { c.r, c.g, c.b, c.a })},\"int\":{i},\"c32\":[{c32.r},{c32.g},{c32.b},{c32.a}],\"back\":{ColorInt.Color32ToInt(c32)}}}");
        }

        string outPath = args.Length > 0 ? args[0] : Path.Combine(root, "vectors", "upstream.json");
        File.WriteAllText(outPath, "{\"schema\":1,\"source\":\"Assets/Scripts/BrickAttachDetector.cs, LegoConnectorScript.cs, ColorInt.cs (unchanged), dotnet 8\",\n\"snap\":[\n" +
            string.Join(",\n", cases) + "\n],\n\"color\":[\n" + string.Join(",\n", colors) + "\n]}\n");
        Console.WriteLine($"{cases.Count} snap cases ({cases.Count(c => c.Contains("\"can\":true"))} attach), {colors.Count} colour cases -> {outPath}");
    }
}

// XRGrabInteractable under another name, so the harness can add it as BrickAttachDetector.Awake expects.
public class GrabShim : UnityEngine.XR.Interaction.Toolkit.XRGrabInteractable { }
