// Editor-side checks of the brick models and Play-mode test commands of the rendering spike. Editor code only: never in
// a bundle.
//
//   PortKit/Bricks/Check Models      -> Logs/brick_models.txt: the 269 regenerated FBX import; the 18 meshes whose upstream
//                                       fileIDs are mapped through internalIDToNameTable resolve to those fileIDs; every
//                                       mesh reference in the imported upstream prefabs resolves (but the BrickComponents
//                                       ones, whose GUIDs never existed); slopes face the way their studs say; the plant
//                                       and pyramid meshes match upstream's BrickObjs vertex dumps as imported.
//   PKTEST CMD <id> renderstats <holder>   UnityStats (batches, draw calls, SetPass calls, triangles) after a few frames,
//                                       and what the chunk renderer holds: chunks, bricks drawn (CombineInstances with a
//                                       mesh), merged vertices; the spike's per-brick objects.
//   PKTEST CMD <id> framems <frames>    the mean and worst frame time over that many frames.
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json.Linq;
using PortKit;
using Unity.VisualScripting;
using UnityEditor;
using UnityEngine;

namespace BrickBuilder
{
    [InitializeOnLoad]
    public static class BrickChecks
    {
        const string GeneratedManifest = "GeneratedBrickModels/manifest.json";
        const string ModelRoot = BrickKitBuilder.Models + "BrickModels/";

        static BrickChecks()
        {
            KitPlayTest.Commands["renderstats"] = RenderStats;
            KitPlayTest.Commands["framems"] = FrameMs;
        }

        static HashSet<string> upstreamGuids;

        /// <summary>Every GUID a .meta file of the upstream repository (the fork's Assets, not altspace/) declares.</summary>
        static HashSet<string> UpstreamGuids()
        {
            if (upstreamGuids != null) return upstreamGuids;
            upstreamGuids = new HashSet<string>();
            foreach (var meta in Directory.GetFiles("../Assets", "*.meta", SearchOption.AllDirectories))
                using (var reader = new StreamReader(meta))
                    for (int i = 0; i < 4; i++)
                    {
                        var line = reader.ReadLine();
                        if (line == null) break;
                        if (line.StartsWith("guid: ")) { upstreamGuids.Add(line.Substring(6).Trim()); break; }
                    }
            return upstreamGuids;
        }

        static string F(double v) => v.ToString("0.###", CultureInfo.InvariantCulture);

        [MenuItem("PortKit/Bricks/Check Models")]
        public static void CheckModels()
        {
            var report = new StringBuilder();
            int failed = 0;
            void Line(bool ok, string what) { if (!ok) failed++; report.AppendLine((ok ? "PASS " : "FAIL ") + what); }
            try
            {
                var manifest = JArray.Parse(File.ReadAllText(GeneratedManifest));
                int loaded = 0, missing = 0;
                var patched = new List<string>();
                foreach (JObject entry in manifest)
                {
                    string path = ModelRoot + (string)entry["file"];
                    var meshes = AssetDatabase.LoadAllAssetsAtPath(path).OfType<Mesh>().ToList();
                    if (meshes.Count == 0) { missing++; report.AppendLine("   no mesh: " + path); continue; }
                    loaded++;
                    var ids = ((JArray)entry["upstream_mesh_file_ids"] ?? new JArray()).Select(v => (long)v).ToList();
                    var have = new List<long>();
                    foreach (var m in meshes)
                        if (AssetDatabase.TryGetGUIDAndLocalFileIdentifier(m, out string _, out long local)) have.Add(local);
                    bool all = ids.All(have.Contains);
                    if ((bool?)entry["meta_patched"] == true)
                        patched.Add($"{(all ? "ok" : "MISSING")} {entry["file"]}: mesh '{meshes[0].name}', upstream fileID {string.Join(",", ids)}, imported {string.Join(",", have)}");
                    else if (!all) report.AppendLine($"   fileID not found: {entry["file"]} wants {string.Join(",", ids)}, has {string.Join(",", have)}");
                }
                Line(missing == 0, $"regenerated models import: {loaded} of {manifest.Count} FBX give a mesh");
                Line(patched.Count == 18 && patched.All(p => p.StartsWith("ok")), $"the {patched.Count} meshes mapped through internalIDToNameTable resolve to their upstream fileIDs");
                foreach (var p in patched) report.AppendLine("   " + p);
                Line(manifest.Cast<JObject>().All(e => ((JArray)e["upstream_mesh_file_ids"] ?? new JArray()).All(id =>
                    AssetDatabase.LoadAllAssetsAtPath(ModelRoot + (string)e["file"]).OfType<Mesh>().Any(m =>
                        AssetDatabase.TryGetGUIDAndLocalFileIdentifier(m, out string _, out long l) && l == (long)id))),
                    "every upstream fileID of every regenerated model resolves");

                // every mesh reference of the imported prefabs
                int refs = 0, resolved = 0, componentRefs = 0;
                var broken = new List<string>();
                var neverIn = new List<string>();
                var componentGuids = Directory.GetFiles(BrickKitBuilder.Models + "../Prefabs/BrickComponents", "*.prefab.meta")
                    .Select(f => File.ReadAllText(f)).ToList();
                foreach (var file in Directory.GetFiles("Assets/Upstream/Assets", "*.prefab", SearchOption.AllDirectories))
                {
                    var text = File.ReadAllText(file);
                    foreach (System.Text.RegularExpressions.Match m in System.Text.RegularExpressions.Regex.Matches(text, @"m_Mesh: \{fileID: (-?\d+), guid: ([0-9a-f]{32}), type: 3\}"))
                    {
                        refs++;
                        string guid = m.Groups[2].Value;
                        long id = long.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture);
                        string asset = AssetDatabase.GUIDToAssetPath(guid);
                        bool ok = !string.IsNullOrEmpty(asset) && AssetDatabase.LoadAllAssetsAtPath(asset).OfType<Mesh>()
                            .Any(x => AssetDatabase.TryGetGUIDAndLocalFileIdentifier(x, out string _, out long l) && l == id);
                        if (ok) resolved++;
                        else if (!UpstreamGuids().Contains(guid)) { componentRefs++; neverIn.Add(Path.GetFileName(file)); }
                        else broken.Add($"{Path.GetFileName(file)} -> {guid}:{id} ({(string.IsNullOrEmpty(asset) ? "no asset with that GUID" : asset)})");
                    }
                }
                Line(broken.Count == 0, $"mesh references in the imported upstream prefabs: {resolved} of {refs} resolve; {componentRefs} point at GUIDs no file of the upstream repository has (in {string.Join(", ", neverIn.Distinct().OrderBy(n => n))}: the kit rebuilds those from bricks.json); broken references to upstream files: {broken.Count}");
                foreach (var b in broken.Distinct().Take(40)) report.AppendLine("   " + b);

                // slopes: the high side and the studs are at +X (tools/bricks/README.md, "Asymmetric parts"), as the
                // held prefab's male connectors say
                var info = JObject.Parse(File.ReadAllText(BrickKitBuilder.RenderInfo));
                foreach (JObject b in (JArray)info["bricks"])
                {
                    string prefab = (string)b["prefab"];
                    if (!prefab.Contains("Slope")) continue;
                    var mesh = AssetDatabase.LoadAllAssetsAtPath(BrickKitBuilder.Models + (string)b["complete"] + ".fbx").OfType<Mesh>().First();
                    var v = mesh.vertices;
                    float top = v.Max(p => p.y), bottom = v.Min(p => p.y);
                    var high = v.Where(p => p.y > top - 0.15f * (top - bottom)).ToList();
                    var studs = ((JArray)b["studs"]).Select(s => (float)s[0]).ToList();
                    float highX = high.Average(p => p.x), highZ = high.Average(p => p.z);
                    // inverted slopes keep their full depth (the wide underside) at +X; corner slopes have the stud at (+X, +Z)
                    bool inverted = prefab.Contains("Inverted");
                    bool corner = prefab.Contains("Corner");
                    bool alongZ = prefab.StartsWith("1x4-2_3");
                    float studX = studs.Count > 0 ? studs.Average() : 0f;
                    bool ok;
                    string why;
                    if (inverted)
                    {
                        var low = v.Where(p => p.y < bottom + 0.15f * (top - bottom)).ToList();
                        ok = low.Average(p => p.x) > 0f && studX >= 0f;
                        why = $"underside centre x {F(low.Average(p => p.x))}, studs x {F(studX)}";
                    }
                    else if (studs.Count == 0)
                    {
                        // the 2/3 wedges have no studs: their upright wall collider (the tallest unrotated held box) is the high side
                        var wall = ((JArray)b["heldBoxes"]).Cast<JObject>().Where(h => Mathf.Abs((float)h["q"][3] - 1f) < 1e-4f)
                            .OrderByDescending(h => (float)h["size"][1] / Mathf.Max(1e-6f, (float)h["size"][0])).First();
                        float wallX = (float)wall["c"][0];
                        ok = Mathf.Sign(highX) == Mathf.Sign(wallX) && Mathf.Abs(highX) > 0.0005f;
                        why = $"top centre ({F(highX)}, {F(highZ)}), the held prefab's upright wall collider at x {F(wallX)}{(alongZ ? " (runs along Z)" : "")}";
                    }
                    else
                    {
                        ok = highX > 0f && (studs.Count == 0 || studX > 0f) && (!corner || highZ > 0f);
                        why = $"top centre ({F(highX)}, {F(highZ)}), studs at x {string.Join(" ", studs.Select(s => F(s)))}";
                    }
                    Line(ok, $"slope {prefab} faces the way its studs say after import: {why}");
                }

                // the models rebuilt from upstream's vertex dumps (bricks.json "pobj"): as Unity imports them, every vertex
                // within 1 um of the dump (Assets/Editor/GenerateObjs.cs wrote the meshes as Unity had loaded them)
                var catalog = JObject.Parse(File.ReadAllText("tools/bricks/bricks.json"));
                foreach (JObject b in (JArray)catalog["bricks"])
                {
                    if (b["pobj"] == null) continue;
                    var dump = File.ReadAllLines("../" + (string)b["pobj"]).Where(l => l.StartsWith("v "))
                        .Select(l => l.Split(' ')).Select(p => new Vector3(float.Parse(p[1], CultureInfo.InvariantCulture), float.Parse(p[2], CultureInfo.InvariantCulture), float.Parse(p[3], CultureInfo.InvariantCulture))).ToList();
                    foreach (JObject file in (JArray)b["files"])
                    {
                        var mesh = AssetDatabase.LoadAllAssetsAtPath(ModelRoot + (string)file["file"]).OfType<Mesh>().First();
                        var v = mesh.vertices;
                        float Far(Vector3 a, IList<Vector3> set) => set.Min(q => Mathf.Max(Mathf.Abs(a.x - q.x), Mathf.Abs(a.y - q.y), Mathf.Abs(a.z - q.z)));
                        float worst = Mathf.Max(dump.Max(a => Far(a, v)), v.Max(a => Far(a, dump)));
                        Line(worst < 1e-6f, $"{file["file"]} as imported matches upstream's {b["pobj"]}: worst vertex {F(worst * 1e6)} um; bounds {mesh.bounds.min.ToString("F5")} .. {mesh.bounds.max.ToString("F5")}");
                    }
                }
            }
            catch (Exception e)
            {
                failed++;
                report.AppendLine("FAIL " + e);
            }
            report.AppendLine(failed == 0 ? "DONE" : "FAILED");
            Directory.CreateDirectory("Logs");
            File.WriteAllText("Logs/brick_models.txt", report.ToString());
        }

        static IEnumerator RenderStats(string[] a, Action<string> reply)
        {
            for (int i = 0; i < 5; i++) yield return null;
            var holder = GameObject.Find(a.Length > 0 ? a[0] : "pk1:brick-builder:0");
            int chunks = 0, drawn = 0, empty = 0, vertices = 0, spikeObjects = 0;
            if (holder != null && holder.transform.childCount > 0)
            {
                var root = holder.transform.GetChild(0);
                var chunkParent = root.Find("Area/Chunks");
                if (chunkParent != null)
                    foreach (Transform c in chunkParent)
                    {
                        if (c.name == "Template") continue;
                        chunks++;
                        var mesh = c.GetComponent<MeshFilter>()?.sharedMesh;
                        if (mesh != null) vertices += mesh.vertexCount;
                        var vars = c.GetComponent<Variables>();
                        if (vars != null && vars.declarations.IsDefined(BrickKitBuilder.ItemsVariable) && vars.declarations.Get(BrickKitBuilder.ItemsVariable) is IList items)
                            foreach (var item in items)
                                if (item is CombineInstance ci && ci.mesh != null && ci.mesh.name != "Empty") drawn++;
                                else empty++;
                    }
                var spike = root.Find("Area/Spike/Out");
                if (spike != null) spikeObjects = spike.childCount;
            }
            reply($"batches {UnityStats.batches} drawCalls {UnityStats.drawCalls} setPass {UnityStats.setPassCalls} triangles {UnityStats.triangles} " +
                  $"vertices {UnityStats.vertices} instancedBatches {UnityStats.instancedBatches} chunks {chunks} drawn {drawn} emptySlots {empty} " +
                  $"chunkVertices {vertices} spikeObjects {spikeObjects}");
        }

        static IEnumerator FrameMs(string[] a, Action<string> reply)
        {
            int frames = a.Length > 0 ? int.Parse(a[0], CultureInfo.InvariantCulture) : 60;
            double sum = 0, worst = 0;
            for (int i = 0; i < frames; i++)
            {
                yield return null;
                double dt = Time.unscaledDeltaTime * 1000.0;
                sum += dt;
                worst = Math.Max(worst, dt);
            }
            reply($"mean {F(sum / frames)} worst {F(worst)} over {frames}");
        }
    }
}
