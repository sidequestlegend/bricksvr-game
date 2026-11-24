// Builds a brick the way Unity loads it: straight from the upstream prefab YAML (Assets/Resources/<name>.prefab or
// "<name> - Placed.prefab"), not from the port's catalogue. So the golden vectors check the catalogue instead of
// sharing it: the order of BrickAttachDetector._maleConnectors / _femaleConnectors is the serialized list in the
// prefab, colliders keep their m_Enabled and m_IsTrigger, every transform keeps its local pose and Unity's child order.
//
// Read: GameObject (1: name, tag, layer, active), Transform (4: local pose, children, father), BoxCollider (65:
// enabled, trigger, size, center) and the MonoBehaviours (114) LegoConnectorScript, BrickAttachDetector and BrickAttach,
// told apart by their script GUID (Assets/Scripts/*.cs.meta). Nothing else of the prefab matters to the snapping math.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;

public static class PrefabYaml
{
    const string GuidLegoConnector = "67ea36d9ddf5b49c18d5cfef6e451564";
    const string GuidAttachDetector = "763a1fbad94d3481a936f7bdf5d5d9d0";
    const string GuidBrickAttach = "e3e28962bfed04fc5a40359e4ab562c0";

    static readonly Regex DocHead = new Regex(@"^--- !u!(\d+) &(-?\d+)(?: stripped)?\s*$", RegexOptions.Multiline);

    class Doc { public int type; public string id; public string body; }

    public class Instance
    {
        public GameObject root;
        /// <summary>Connectors in prefab order (depth first, Unity's child order).</summary>
        public List<LegoConnectorScript> all = new List<LegoConnectorScript>();
        public List<LegoConnectorScript> male = new List<LegoConnectorScript>();
        public List<LegoConnectorScript> female = new List<LegoConnectorScript>();
        /// <summary>The serialized BrickAttachDetector fields of a held prefab (null for a placed one).</summary>
        public List<GameObject> maleList, femaleList;
        public GameObject maleParent, femaleParent;
        public List<BoxCollider> colliders = new List<BoxCollider>();
        public bool tile, window;
        public float heightOverride;
    }

    static readonly Dictionary<string, List<Doc>> Cache = new Dictionary<string, List<Doc>>();

    static List<Doc> Read(string path)
    {
        if (Cache.TryGetValue(path, out var docs)) return docs;
        string txt = File.ReadAllText(path);
        var ms = DocHead.Matches(txt);
        docs = new List<Doc>();
        for (int i = 0; i < ms.Count; i++)
        {
            int end = i + 1 < ms.Count ? ms[i + 1].Index : txt.Length;
            docs.Add(new Doc { type = int.Parse(ms[i].Groups[1].Value), id = ms[i].Groups[2].Value, body = txt.Substring(ms[i].Index + ms[i].Length, end - ms[i].Index - ms[i].Length) });
        }
        Cache[path] = docs;
        return docs;
    }

    static string Field(string body, string name)
    {
        var m = Regex.Match(body, @"\n  " + Regex.Escape(name) + @": ?(.*)");
        return m.Success ? m.Groups[1].Value.Trim() : null;
    }

    static float F(string s) => float.Parse(s, NumberStyles.Float, CultureInfo.InvariantCulture);

    static Dictionary<string, float> Map(string s) =>
        Regex.Matches(s ?? "", @"(\w+): (-?[\d.eE+-]+)").Cast<Match>().ToDictionary(m => m.Groups[1].Value, m => F(m.Groups[2].Value));

    static Vector3 V(string s) { var d = Map(s); return new Vector3(d["x"], d["y"], d["z"]); }
    static Quaternion Q(string s) { var d = Map(s); return new Quaternion(d["x"], d["y"], d["z"], d["w"]); }
    static string Ref(string s) => s == null ? "0" : Regex.Match(s, @"fileID: (-?\d+)").Groups[1].Value;

    /// <summary>The fileIDs of a serialized list field ("  name:\n  - {fileID: ...}\n  - ...").</summary>
    static List<string> RefList(string body, string name)
    {
        var at = body.IndexOf("\n  " + name + ":", StringComparison.Ordinal);
        var list = new List<string>();
        if (at < 0) return list;
        foreach (var line in body.Substring(at + 1).Split('\n').Skip(1))
        {
            if (!line.StartsWith("  - ")) break;
            list.Add(Ref(line));
        }
        return list;
    }

    public static Instance Instantiate(string path, bool held, Vector3 pos, Quaternion rot, string uuid)
    {
        var docs = Read(path);
        var gos = new Dictionary<string, GameObject>();
        var trOf = new Dictionary<string, Doc>();         // transform doc by its fileID
        var trOfGo = new Dictionary<string, string>();    // GameObject fileID -> transform fileID
        foreach (var d in docs.Where(d => d.type == 1))
        {
            var g = new GameObject(Field(d.body, "m_Name") ?? "")
            {
                tag = Field(d.body, "m_TagString"),
                layer = int.Parse(Field(d.body, "m_Layer")),
                activeSelf = Field(d.body, "m_IsActive") == "1",
            };
            gos[d.id] = g;
        }
        foreach (var d in docs.Where(d => d.type == 4))
        {
            trOf[d.id] = d;
            trOfGo[Ref(Field(d.body, "m_GameObject"))] = d.id;
        }
        var inst = new Instance();
        string rootTr = trOf.Keys.First(k => Ref(Field(trOf[k].body, "m_Father")) == "0");
        var order = new List<string>(); // GameObject fileIDs, depth first in m_Children order
        void Walk(string tk, Transform parent)
        {
            var d = trOf[tk];
            var g = gos[Ref(Field(d.body, "m_GameObject"))];
            order.Add(gos.First(kv => kv.Value == g).Key);
            if (parent != null) g.transform.SetParentKeepLocal(parent);
            g.transform.localPosition = V(Field(d.body, "m_LocalPosition"));
            g.transform.localRotation = Q(Field(d.body, "m_LocalRotation"));
            g.transform.localScale = V(Field(d.body, "m_LocalScale"));
            foreach (var c in RefList(d.body, "m_Children")) Walk(c, g.transform);
        }
        Walk(rootTr, null);
        inst.root = gos[Ref(Field(trOf[rootTr].body, "m_GameObject"))];
        inst.root.transform.localPosition = pos;
        inst.root.transform.localRotation = rot;

        var colliderOf = new Dictionary<string, BoxCollider>();
        var connectorOf = new Dictionary<string, LegoConnectorScript>(); // by GameObject fileID
        Doc detector = null;
        // Components in document order per object (GetComponent<T> returns the first, as Unity's does in practice).
        foreach (var d in docs)
        {
            if (d.type != 65 && d.type != 114) continue;
            var goId = Ref(Field(d.body, "m_GameObject"));
            if (!gos.TryGetValue(goId, out var g)) continue;
            if (d.type == 65)
            {
                var c = g.AddComponent<BoxCollider>();
                c.enabled = Field(d.body, "m_Enabled") == "1";
                c.isTrigger = Field(d.body, "m_IsTrigger") == "1";
                c.size = V(Field(d.body, "m_Size"));
                c.center = V(Field(d.body, "m_Center"));
                colliderOf[d.id] = c;
                continue;
            }
            var script = Regex.Match(Field(d.body, "m_Script") ?? "", @"guid: (\w+)").Groups[1].Value;
            if (script == GuidLegoConnector)
            {
                var s = g.AddComponent<LegoConnectorScript>();
                s.female = Field(d.body, "female") == "1";
                s.placed = Field(d.body, "placed") == "1";
                s.connectorsCollidingWith = new List<GameObject>();
                connectorOf[goId] = s;
            }
            else if (script == GuidBrickAttach) g.AddComponent<BrickAttach>().uuid = uuid;
            else if (script == GuidAttachDetector) detector = d;
        }
        foreach (var id in order)
        {
            if (!connectorOf.TryGetValue(id, out var s)) continue;
            inst.all.Add(s);
            (s.female ? inst.female : inst.male).Add(s);
        }
        foreach (var s in inst.all) Call(s, "Awake");
        if (detector != null)
        {
            inst.maleList = RefList(detector.body, "_maleConnectors").Select(id => gos[id]).ToList();
            inst.femaleList = RefList(detector.body, "_femaleConnectors").Select(id => gos[id]).ToList();
            inst.maleParent = gos[Ref(Field(detector.body, "maleConnectorParent"))];
            inst.femaleParent = gos[Ref(Field(detector.body, "femaleConnectorParent"))];
            inst.colliders = RefList(detector.body, "colliders").Select(id => colliderOf[id]).ToList();
            inst.tile = Field(detector.body, "tile") == "1";
            inst.window = Field(detector.body, "window") == "1";
            inst.heightOverride = F(Field(detector.body, "heightOverride"));
        }
        if (held)
        {
            // BrickAttachDetector.BrickGrabbed: the held brick's colliders become triggers while it is in the hand.
            foreach (var c in inst.colliders) c.isTrigger = true;
        }
        return inst;
    }

    static void Call(object o, string method) =>
        o.GetType().GetMethod(method, System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public).Invoke(o, null);
}
