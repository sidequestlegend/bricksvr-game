// The brick-builder kit: a build area, its chunk renderer, the held-brick pool, the ghost, the picker with its palette,
// the tools and the hammer. BricksVR's prefabs are Normcore and XR Interaction Toolkit objects; the kit is built here
// from the brick catalogue (ts/render.json, written from ts/src/catalogue.json by `npm run render-info`) and the
// regenerated brick models, which the importer lays in at Assets/Upstream/Assets/Resources/BrickModels with the
// upstream GUIDs. What changes against upstream, and why, is in altspace/PORT.md (sections 6 and 10).
//
// Kit units are metres at upstream's size: the brick meshes are drawn at 7x (as upstream's CombinedModel), so one
// lattice unit (0.1 mm of mesh) is 0.7 mm here, and a stud 5.6 cm. The snippet's `scale` scales the whole kit.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using PortKit;
using TMPro;
using Unity.VisualScripting;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using Object = UnityEngine.Object;

namespace BrickBuilder
{
    public sealed class BrickKitBuilder : KitBuilder
    {
        public const string Models = "Assets/Upstream/Assets/Resources/";
        const string MeshFolder = "Assets/Kit/Meshes";
        const string MaterialFolder = "Assets/Kit/Materials";
        const string SoundFolder = "Assets/Kit/Sounds";
        public const string RenderInfo = "ts/render.json";
        /// <summary>Kit metres per lattice unit: 0.1 mm of mesh, meshes drawn at 7x.</summary>
        public const float U = 7e-4f;
        public const float MeshScale = 7f;
        public const int Slots = 12;
        public const int Segments = 24;
        public const string MeshesVariable = "PkMeshes";
        public const string OrisVariable = "PkOris";
        public const string ItemsVariable = "PkItems";
        public const string TintVariable = "PkTint";
        public const string ColliderVariable = "PkCollider";

        public override string Slug => "brick-builder";
        public override string Title => "Brick Builder";
        public override string Summary => "Build with snapping bricks together: 65 bricks, any colour, a hammer. A port of BricksVR.";
        public override string Description =>
            "A shared build area: pick a brick and a colour, put bricks on the carpet and on each other and they snap to the studs, " +
            "take them off again or knock them out with the hammer. Everyone in the world builds on the same area, late arrivals see " +
            "the whole build, and the build stays for a day (and can be saved on your device). In VR take bricks from the picker " +
            "and put them where you like; on a desktop click a brick in the picker, then click the carpet or a brick to place it. " +
            "A port of BricksVR by BricksVR Studios (MIT); the brick models are regenerated plain shapes.";
        public override IReadOnlyList<(string name, string value)> SnippetSettings => new[]
        {
            ("room", ""), ("width", "64"), ("depth", "64"), ("height", "480"), ("performance", "false"),
        };

        JObject info;
        readonly Dictionary<string, Material> materials = new Dictionary<string, Material>();

        static readonly int[] Palette =
        {
            0xC91A09, 0xFE8A18, 0xF2CD37, 0x4B9F4A, 0x0055BF, 0x81007B, 0xFFFFFF, 0x9BA19D, 0x05131D, 0x582A12, 0xE4CD9E, 0xFC97AC,
        };

        // ------------------------------------------------------------------ compose

        protected override void Compose(KitStage stage)
        {
            if (!File.Exists(RenderInfo)) throw new Exception($"{RenderInfo} is missing: run `npm run render-info` in ts/");
            info = JObject.Parse(File.ReadAllText(RenderInfo));
            var bricks = ((JArray)info["bricks"]).Cast<JObject>().ToList();
            MakeMaterials();
            var completes = bricks.Select(b => LoadMesh((string)b["complete"] + ".fbx")).ToList();

            // ---- the root's variables: the renderer's meshes and the 24 orientations (ts/src/Lattice.ts ORIS) ----
            var rootVariables = stage.Root.AddComponent<Variables>();
            var meshes = new AotList { EmptyMesh() };
            foreach (var b in bricks) foreach (var m in RenderMeshes(b)) meshes.Add(m);
            rootVariables.declarations.Set(MeshesVariable, meshes);
            var oris = new AotList();
            foreach (JArray q in (JArray)info["oris"]) oris.Add(new Quaternion((float)q[0], (float)q[1], (float)q[2], (float)q[3]));
            rootVariables.declarations.Set(OrisVariable, oris);
            stage.Report.AppendLine($"   renderer: {meshes.Count} meshes (1 empty + 4 per type), {oris.Count} orientations");

            // ---- the build area ----
            var area = stage.Create("Area");
            stage.Object(area, key: "area");
            stage.Ref(area);
            var carpet = stage.Primitive(PrimitiveType.Cube, "Carpet", area.transform);
            carpet.transform.localPosition = new Vector3(0f, -0.01f, 0f);
            carpet.transform.localScale = new Vector3(64 * 80 * U, 0.02f, 64 * 80 * U);
            carpet.GetComponent<MeshRenderer>().sharedMaterial = materials["Carpet"];
            Quiet(carpet);

            var chunks = stage.Create("Chunks", area.transform);
            var template = stage.Create("Template", chunks.transform);
            template.AddComponent<MeshFilter>();
            Quiet(template.AddComponent<MeshRenderer>().gameObject).GetComponent<MeshRenderer>().sharedMaterial = materials["Chunk"];
            template.SetActive(false);

            // spike option (a): one object per brick, copied from a template per type (Assets/Kit/.. TESTS.md, rendering spike)
            var spike = stage.Create("Spike", area.transform);
            var spikeTemplates = stage.Create("Templates", spike.transform);
            stage.Create("Out", spike.transform);
            for (int i = 0; i < bricks.Count; i++)
            {
                var t = stage.Create((string)bricks[i]["prefab"], spikeTemplates.transform);
                t.AddComponent<MeshFilter>().sharedMesh = (Mesh)meshes[1 + 4 * i];
                Quiet(t.AddComponent<MeshRenderer>().gameObject).GetComponent<MeshRenderer>().sharedMaterial = materials["Instanced"];
                t.transform.localScale = Vector3.one * MeshScale;
                t.SetActive(false);
            }

            // the area's sounds (CC0 replacements of upstream's lost Resources/Sounds, THIRD-PARTY-NOTICES.md)
            var clip = Clips(stage, area, "snap1", "snap2", "snap3", "carpet1", "carpet2", "carpet3", "menuclick", "spawnset", "success");
            var areaSource = area.GetComponent<AudioSource>();
            areaSource.spatialBlend = 0.6f;
            areaSource.playOnAwake = false;

            // ---- the ghost: one see-through child per brick ----
            var ghost = stage.Create("Ghost");
            stage.Object(ghost, key: "ghost");
            stage.Ref(ghost);
            for (int i = 0; i < bricks.Count; i++)
            {
                var g = stage.Create((string)bricks[i]["prefab"], ghost.transform);
                g.AddComponent<MeshFilter>().sharedMesh = completes[i];
                Quiet(g.AddComponent<MeshRenderer>().gameObject).GetComponent<MeshRenderer>().sharedMaterial = materials["Ghost"];
                g.transform.localScale = Vector3.one * MeshScale;
                g.SetActive(false);
            }

            // ---- the held-brick pool: 12 synced, grabbable slots, each with every brick as a child ----
            var pool = stage.Create("Pool");
            for (int s = 0; s < Slots; s++)
            {
                var slot = stage.Create("Held" + s, pool.transform);
                slot.transform.localPosition = new Vector3(0f, 0.5f, 0f);
                var anchor = slot.AddComponent<SphereCollider>();             // keeps the kit builder from boxing all 66 children
                anchor.radius = 0.004f;
                var body = slot.AddComponent<Rigidbody>();
                body.mass = 0.05f;
                body.interpolation = RigidbodyInterpolation.Interpolate;
                body.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
                for (int i = 0; i < bricks.Count; i++)
                {
                    var c = stage.Create((string)bricks[i]["prefab"], slot.transform);
                    var model = stage.Create("Model", c.transform);
                    model.AddComponent<MeshFilter>().sharedMesh = completes[i];
                    Quiet(model.AddComponent<MeshRenderer>().gameObject).GetComponent<MeshRenderer>().sharedMaterial = materials["Held"];
                    model.transform.localScale = Vector3.one * MeshScale;
                    foreach (JObject box in (JArray)bricks[i]["heldBoxes"])
                    {
                        var holder = stage.Create("Collider", c.transform);
                        holder.transform.localPosition = V3(box["c"]);
                        var q = (JArray)box["q"];
                        holder.transform.localRotation = new Quaternion((float)q[0], (float)q[1], (float)q[2], (float)q[3]);
                        holder.AddComponent<BoxCollider>().size = V3(box["size"]);
                        holder.layer = 20;
                    }
                    c.layer = 20;
                    model.layer = 20;
                    c.SetActive(false);
                }
                stage.Object(slot, key: "held" + s, sync: "transform", grab: true);
                stage.Behaviour(slot, "HeldBrick", new JObject { ["index"] = s });
            }

            // ---- the picker panel (BrickPickerManager), in front of the area's near edge, read from -Z ----
            var picker = stage.Create("Picker");
            picker.transform.localPosition = new Vector3(-0.75f, 0f, -2.15f);
            var panel = stage.Primitive(PrimitiveType.Cube, "Panel", picker.transform);
            panel.transform.localPosition = new Vector3(0f, 1.15f, 0.02f);
            panel.transform.localScale = new Vector3(1.62f, 1.06f, 0.02f);
            panel.GetComponent<MeshRenderer>().sharedMaterial = materials["Panel"];
            Object.DestroyImmediate(panel.GetComponent<Collider>());
            Quiet(panel);

            var categories = ((JArray)info["categories"]).Select(c => (string)c).ToList();
            var tabs = stage.Create("Tabs", picker.transform);
            for (int k = 0; k < categories.Count; k++)
            {
                var tab = Button(stage, tabs.transform, "Tab" + k, new Vector3(-0.66f + k * 0.264f, 1.62f, 0f), new Vector2(0.25f, 0.07f), CategoryTitle(categories[k]), materials["Button"]);
                var marker = stage.Primitive(PrimitiveType.Cube, "Marker", tab.transform);
                Object.DestroyImmediate(marker.GetComponent<Collider>());
                marker.transform.localPosition = new Vector3(0f, -0.045f, 0f);
                marker.transform.localScale = new Vector3(0.24f, 0.012f, 0.012f);
                marker.GetComponent<MeshRenderer>().sharedMaterial = materials["Marker"];
                Quiet(marker);
                marker.SetActive(k == 0);
                stage.Behaviour(tab, "PickerTab", new JObject { ["index"] = k });
                stage.Object(tab, key: "tab" + k, click: true);
            }

            for (int k = 0; k < categories.Count; k++)
            {
                var group = stage.Create("Cat" + k, picker.transform);
                var members = Enumerable.Range(0, bricks.Count).Where(i => (bool)bricks[i]["picker"] && (string)bricks[i]["category"] == categories[k]).ToList();
                for (int n = 0; n < members.Count; n++)
                {
                    int i = members[n];
                    var b = bricks[i];
                    var pos = new Vector3(-0.66f + (n % 6) * 0.264f, 1.47f - (n / 6) * 0.22f, 0f);
                    var tile = Button(stage, group.transform, "Tile_" + (string)b["prefab"], pos, new Vector2(0.24f, 0.2f), null, materials["Tile"]);
                    var model = stage.Create("Model", tile.transform);
                    model.AddComponent<MeshFilter>().sharedMesh = completes[i];
                    Quiet(model.AddComponent<MeshRenderer>().gameObject).GetComponent<MeshRenderer>().sharedMaterial = materials["Picker"];
                    var bounds = completes[i].bounds;
                    float fit = 0.13f / Mathf.Max(bounds.size.x, bounds.size.y, bounds.size.z);
                    model.transform.localScale = Vector3.one * fit;
                    model.transform.localRotation = Quaternion.Euler(-25f, 35f, 0f);
                    model.transform.localPosition = new Vector3(0f, 0.025f, -0.05f) - model.transform.localRotation * (bounds.center * fit);
                    Label(stage, tile.transform, (string)b["display"], new Vector3(0f, -0.075f, -0.016f), 0.24f, 0.32f);
                    stage.Behaviour(tile, "PickerTile", new JObject { ["type"] = (int)b["type"] });
                    stage.Object(tile, key: "tile_" + Key((string)b["prefab"]), click: true);
                }
                group.SetActive(k == 0);                                       // the script shows one category
            }

            // ---- the palette: swatches, the preview, the HSV sliders ----
            var swatches = stage.Create("Swatches", picker.transform);
            for (int n = 0; n < Palette.Length; n++)
            {
                var swatch = Button(stage, swatches.transform, "S" + n, new Vector3(-0.72f + n * 0.09f, 0.82f, 0f), new Vector2(0.08f, 0.08f), null, SwatchMaterial(Palette[n]));
                stage.Behaviour(swatch, "Swatch", new JObject { ["rgb"] = Palette[n] });
                stage.Object(swatch, key: "swatch" + n, click: true);
            }
            var preview = stage.Primitive(PrimitiveType.Cube, "Preview", picker.transform);
            Object.DestroyImmediate(preview.GetComponent<Collider>());
            preview.transform.localPosition = new Vector3(0.62f, 0.82f, -0.02f);
            preview.transform.localScale = new Vector3(0.16f, 0.08f, 0.02f);
            preview.GetComponent<MeshRenderer>().sharedMaterial = materials["Picker"];
            Quiet(preview);
            var sliders = Sliders(stage, picker.transform, area);

            var status = stage.Create("Status", picker.transform);
            var statusText = status.AddComponent<TextMeshPro>();
            Text(statusText, "", 0.6f, TextAlignmentOptions.Left);
            statusText.rectTransform.sizeDelta = new Vector2(1.5f, 0.07f);
            status.transform.localPosition = new Vector3(0f, 0.66f, -0.012f);
            stage.Ref(status);

            // the credits line (the plan: every game shows its credits in the world)
            var credits = stage.Create("Credits", picker.transform);
            var creditsText = credits.AddComponent<TextMeshPro>();
            Text(creditsText, CreditsText, 0.32f, TextAlignmentOptions.TopLeft);
            creditsText.textWrappingMode = TextWrappingModes.Normal;
            creditsText.overflowMode = TextOverflowModes.Truncate;
            creditsText.color = new Color(0.8f, 0.82f, 0.85f);
            creditsText.rectTransform.sizeDelta = new Vector2(1.58f, 0.12f);
            credits.transform.localPosition = new Vector3(0f, 0.53f, -0.012f);
            var creditsBack = stage.Primitive(PrimitiveType.Cube, "CreditsPanel", picker.transform);
            Object.DestroyImmediate(creditsBack.GetComponent<Collider>());
            creditsBack.transform.localPosition = new Vector3(0f, 0.53f, 0.02f);
            creditsBack.transform.localScale = new Vector3(1.62f, 0.14f, 0.02f);
            creditsBack.GetComponent<MeshRenderer>().sharedMaterial = materials["Panel"];
            Quiet(creditsBack);

            // ---- the tools ----
            var tools = stage.Create("Tools");
            tools.transform.localPosition = new Vector3(0.45f, 0f, -2.15f);
            var toolNames = new[] { ("HammerButton", "hammer", "Hammer"), ("RotateButton", "rotate", "Rotate"), ("LockButton", "lock", "Lock"), ("SaveButton", "save", "Save"), ("LoadButton", "load", "Load") };
            for (int n = 0; n < toolNames.Length; n++)
            {
                var (name, tool, label) = toolNames[n];
                var button = Button(stage, tools.transform, name, new Vector3(0f, 1.55f - n * 0.12f, 0f), new Vector2(0.3f, 0.09f), label, materials["Button"]);
                stage.Behaviour(button, "ToolButton", new JObject { ["tool"] = tool });
                stage.Object(button, key: tool + "Button", click: true);
                if (tool == "hammer")
                {
                    var on = stage.Primitive(PrimitiveType.Cube, "On", button.transform);
                    Object.DestroyImmediate(on.GetComponent<Collider>());
                    on.transform.localPosition = new Vector3(0.17f, 0f, 0f);
                    on.transform.localScale = new Vector3(0.025f, 0.08f, 0.025f);
                    on.GetComponent<MeshRenderer>().sharedMaterial = materials["Marker"];
                    Quiet(on);
                    on.SetActive(false);
                }
            }

            // ---- the hammer (Hammer.cs): grabbable, kinematic (stays where it is let go) ----
            var hammer = stage.Create("Hammer");
            hammer.transform.localPosition = new Vector3(0.95f, 0.9f, -2.15f);
            hammer.transform.localRotation = Quaternion.Euler(0f, 0f, 20f);
            var handle = stage.Primitive(PrimitiveType.Cylinder, "Handle", hammer.transform);
            handle.transform.localScale = new Vector3(0.035f, 0.17f, 0.035f);
            handle.GetComponent<MeshRenderer>().sharedMaterial = materials["Handle"];
            var head = stage.Primitive(PrimitiveType.Cube, "Head", hammer.transform);
            head.transform.localPosition = new Vector3(0f, 0.19f, 0f);
            head.transform.localScale = new Vector3(0.16f, 0.08f, 0.08f);
            head.GetComponent<MeshRenderer>().sharedMaterial = materials["Metal"];
            foreach (var part in new[] { handle, head }) { Quiet(part); part.layer = 20; Object.DestroyImmediate(part.GetComponent<Collider>()); }
            var hammerBody = hammer.AddComponent<Rigidbody>();
            hammerBody.isKinematic = true;
            var hammerBox = hammer.AddComponent<BoxCollider>();                  // around handle and head
            hammerBox.center = new Vector3(0f, 0.07f, 0f);
            hammerBox.size = new Vector3(0.16f, 0.42f, 0.08f);
            var hammerToken = stage.Behaviour(hammer, "Hammer", new JObject { ["head"] = new JObject { ["$v3"] = new JArray(0.0, 0.19, 0.0) } });
            stage.Object(hammer, key: "hammer", sync: "transform", grab: true);
            stage.Event(hammer, "heldTrigger", hammerToken, "Smash");

            // ---- the area's behaviours (BuildArea, the per-player log, the archive) ----
            var areaToken = stage.Behaviour(area, "BuildArea", new JObject
            {
                ["ghostObject"] = stage.ObjectValue(ghost),
                ["audio"] = stage.ComponentValue(area, "AudioSource"),
                ["snapClips"] = new JArray(clip("snap1"), clip("snap2"), clip("snap3")),
                ["carpetClips"] = new JArray(clip("carpet1"), clip("carpet2"), clip("carpet3")),
                ["clickClip"] = clip("menuclick"),
                ["spawnClip"] = clip("spawnset"),
                ["successClip"] = clip("success"),
                ["status"] = stage.ComponentValue(status, "TMP"),
            });
            stage.Behaviour(area, "BrickLog");
            for (int i = 0; i < Segments; i++) stage.Behaviour(area, "BrickSegment", new JObject { ["index"] = i });
            stage.Object(carpet, key: "carpet", click: true);
            stage.Event(carpet, "click", areaToken, "SurfaceClicked");
            // a click on a chunk's collider: heard if the SDK reports a click to the nearest object the page knows (TESTS.md)
            var chunksHolder = chunks.AddComponent<BoxCollider>();
            chunksHolder.size = Vector3.zero;
            chunksHolder.center = new Vector3(0f, -50f, 0f);
            stage.Object(chunks, key: "chunks", click: true);
            stage.Event(chunks, "click", areaToken, "SurfaceClicked");
            stage.Event(sliders[0], "uiSlider", areaToken, "HueChanged");
            stage.Event(sliders[1], "uiSlider", areaToken, "SaturationChanged");
            stage.Event(sliders[2], "uiSlider", areaToken, "ValueChanged");
        }

        // ------------------------------------------------------------------ relay ops of this game (README op table)

        public override void RelayOps(RelayGraph.Ops ops)
        {
            var g = ops.g;
            // bricks | @Area/Chunks/<chunk> | "<slot>,<mesh>,<x>,<y>,<z>,<ori>,<rgb>;..." | 1 or 0  (ts/src/BrickRenderer.ts)
            // Sets or appends CombineInstances in the chunk's list, merges the list into the chunk's mesh, reports
            // window.__pk1.event(inst, "chunk", "<chunk>|<ms>|<records>").
            ops.Add("bricks", () =>
            {
                var t0 = g.Keep(g.Get(typeof(Time), "realtimeSinceStartup"));
                var chunk = g.Keep(ops.Target);
                g.If(g.Not(g.IsDefined(chunk, ItemsVariable)), () => g.SetObjVar(ItemsVariable, new Val(g, g.Add(new CreateList { inputCount = 0 }).valueOutputs["list"], typeof(System.Collections.IList)), chunk, typeof(System.Collections.IList)));
                var items = g.Keep(g.ObjVarOf(chunk, ItemsVariable, typeof(System.Collections.IList)));
                var meshes = g.Keep(g.ObjVarOf(g.KitRoot(), MeshesVariable, typeof(System.Collections.IList)));
                var oris = g.Keep(g.ObjVarOf(g.KitRoot(), OrisVariable, typeof(System.Collections.IList)));
                var records = g.Keep(g.Split(ops.Arg(0), ";"));
                g.ForEach(records, typeof(string), record =>
                {
                    var f = g.Keep(g.Split(record, ","));
                    var slot = g.Keep(g.ParseInt(g.ListItem(f, 0, typeof(string))));
                    var position = g.V3(g.ParseInt(g.ListItem(f, 2, typeof(string))) * U, g.ParseInt(g.ListItem(f, 3, typeof(string))) * U, g.ParseInt(g.ListItem(f, 4, typeof(string))) * U);
                    var rotation = g.ListItem(oris, g.ParseInt(g.ListItem(f, 5, typeof(string))), typeof(Quaternion));
                    var matrix = g.Call(typeof(Matrix4x4), "TRS", new[] { typeof(Vector3), typeof(Quaternion), typeof(Vector3) }, null, position, rotation, Vector3.one * MeshScale);
                    var rgb = g.ParseInt(g.ListItem(f, 6, typeof(string)));
                    var offset = g.Call(typeof(Vector4), ".ctor", new[] { typeof(float), typeof(float), typeof(float), typeof(float) }, null, 0f, 0f, rgb, 0f);
                    var instance = Struct(g, typeof(CombineInstance));
                    instance = SetField(g, typeof(CombineInstance), "mesh", instance, g.ListItem(meshes, g.ParseInt(g.ListItem(f, 1, typeof(string))), typeof(Mesh)));
                    instance = SetField(g, typeof(CombineInstance), "transform", instance, matrix);
                    instance = g.Keep(SetField(g, typeof(CombineInstance), "lightmapScaleOffset", instance, offset));
                    g.If(g.Less(slot, g.Count(items)), () => SetListItem(g, items, slot, instance), () => g.ListAdd(items, instance));
                });
                var filter = g.Keep(g.ComponentOf(chunk, typeof(MeshFilter)));
                g.IfNotNull(g.Get(typeof(MeshFilter), "sharedMesh", filter), () => { }, () =>
                {
                    var made = g.Keep(g.Call(typeof(Mesh), ".ctor", Type.EmptyTypes, null));
                    g.Set(typeof(Mesh), "indexFormat", made, IndexFormat.UInt32);
                    g.Do(typeof(Mesh), "MarkDynamic", Type.EmptyTypes, made);
                    g.Set(typeof(MeshFilter), "sharedMesh", filter, made);
                });
                var mesh = g.Keep(g.Get(typeof(MeshFilter), "sharedMesh", filter));
                g.Do(typeof(Mesh), "CombineMeshes", new[] { typeof(CombineInstance[]), typeof(bool), typeof(bool), typeof(bool) }, mesh, items, true, true, true);
                g.Set(typeof(MeshFilter), "sharedMesh", filter, mesh);
                var t1 = g.Keep(g.Get(typeof(Time), "realtimeSinceStartup"));
                // The chunk's collider lives on Area/Chunks itself (one MeshCollider per chunk on that one bound, clickable
                // object): a click on the build then reaches the page as a click on `chunks`, with its point and normal.
                // Arg 1 is "1" while the chunk holds a brick ("0": no collider; PhysX refuses a mesh of empty slots).
                var holder = g.Keep(g.Get(typeof(Transform), "gameObject", g.Get(typeof(Transform), "parent", g.Get(typeof(GameObject), "transform", chunk))));
                g.If(g.Not(g.IsDefined(chunk, ColliderVariable)), () =>
                    g.SetObjVar(ColliderVariable, g.Call(typeof(GameObject), "AddComponent", new[] { typeof(Type) }, holder, g.TypeOf(typeof(MeshCollider))), chunk, typeof(Component)));
                var collider = g.Keep(g.ObjVarOf(chunk, ColliderVariable, typeof(MeshCollider)));
                g.Set(typeof(MeshCollider), "sharedMesh", collider, g.Null(typeof(Mesh)));
                g.If(g.Same(ops.Arg(1), "1"), () => g.Set(typeof(MeshCollider), "sharedMesh", collider, mesh));
                var t2 = g.Keep(g.Get(typeof(Time), "realtimeSinceStartup"));
                g.PageEvent("chunk", g.Get(typeof(GameObject), "name", chunk), g.InvariantText((t1 - t0) * 1000f), g.InvariantText(g.Count(records)), g.InvariantText((t2 - t1) * 1000f));
            });

            // bspawn | @Area/Spike/Templates/<prefab> | x | y | z | ori | rgb (-1: no colour of its own)   spike option (a)
            ops.Add("bspawn", () =>
            {
                var oris = g.Keep(g.ObjVarOf(g.KitRoot(), OrisVariable, typeof(System.Collections.IList)));
                var templateT = g.Keep(g.Get(typeof(GameObject), "transform", ops.Target));
                var outParent = g.Keep(g.Call(typeof(Transform), "GetChild", new[] { typeof(int) }, g.Get(typeof(Transform), "parent", g.Get(typeof(Transform), "parent", templateT)), 1));
                var copy = g.Keep(g.Call(typeof(GameObject), "Instantiate", new[] { typeof(Object), typeof(Transform) }, null, ops.Target, outParent));
                var position = g.V3(ops.Number(0) * U, ops.Number(1) * U, ops.Number(2) * U);
                g.Do(typeof(Transform), "SetLocalPositionAndRotation", new[] { typeof(Vector3), typeof(Quaternion) }, g.Get(typeof(GameObject), "transform", copy),
                    position, g.ListItem(oris, ops.Whole(3), typeof(Quaternion)));
                g.If(g.Not(g.Same(ops.Arg(4), "-1")), () =>
                {
                    var rgb = g.Keep(ops.Whole(4));
                    var material = g.Get(typeof(Renderer), "material", g.ComponentOf(copy, typeof(MeshRenderer)));
                    var colour = g.Rgba(Channel(g, rgb, 16), Channel(g, rgb, 8), Channel(g, rgb, 0), 1f);
                    g.Do(typeof(Material), "SetColor", new[] { typeof(string), typeof(Color) }, material, "_BaseColor", colour);
                });
                g.Do(typeof(GameObject), "SetActive", new[] { typeof(bool) }, copy, true);
            });

            // tint | @Picker/Preview | r | g | b: the colour of every picker tile and the preview (one material of this kit copy's own)
            ops.Add("tint", () =>
            {
                var pickerRoot = g.Keep(g.Get(typeof(Transform), "gameObject", g.Get(typeof(Transform), "parent", g.Get(typeof(GameObject), "transform", ops.Target))));
                g.If(g.Not(g.IsDefined(pickerRoot, TintVariable)), () =>
                {
                    var renderers = g.Keep(g.Call(typeof(GameObject), "GetComponentsInChildren", new[] { typeof(Type), typeof(bool) }, pickerRoot, g.TypeOf(typeof(MeshRenderer)), true));
                    var own = g.Keep(g.Call(typeof(Material), ".ctor", new[] { typeof(Material) }, null, g.Get(typeof(Renderer), "sharedMaterial", g.ComponentOf(ops.Target, typeof(MeshRenderer)))));
                    g.SetObjVar(TintVariable, own, pickerRoot, typeof(Material));
                    g.ForEach(renderers, typeof(Renderer), r =>
                        g.If(g.Same(g.Get(typeof(Material), "name", g.Get(typeof(Renderer), "sharedMaterial", r)), "BrickPicker"), () => g.Set(typeof(Renderer), "sharedMaterial", r, own)));
                });
                var tint = g.ObjVarOf(pickerRoot, TintVariable, typeof(Material));
                g.Do(typeof(Material), "SetColor", new[] { typeof(string), typeof(Color) }, tint, "_BaseColor", g.Rgba(ops.Number(0), ops.Number(1), ops.Number(2), 1f));
            });
        }

        /// <summary>(rgb >> shift) & 255, as a fraction of 255, from whole-number nodes the allow list has.</summary>
        static Val Channel(GraphWriter g, Val rgb, int shift)
        {
            var shifted = g.Call(typeof(Mathf), "Floor", new[] { typeof(float) }, null, rgb / (float)(1 << shift));
            var high = g.Call(typeof(Mathf), "Floor", new[] { typeof(float) }, null, shifted / 256f) * 256f;
            return (shifted - high) / 255f;
        }

        // ------------------------------------------------------------------ graph helpers the port kit does not have

        /// <summary>A default struct value (VS "Create Struct").</summary>
        static Val Struct(GraphWriter g, Type type)
        {
            var unit = g.Add(new CreateStruct(type));
            return new Val(g, unit.valueOutputs["output"], type);
        }

        /// <summary>Sets a field of a struct value and returns the changed copy (VS Set Member's target output).</summary>
        static Val SetField(GraphWriter g, Type owner, string name, Val target, object value)
        {
            var unit = g.Add(new SetMember(new Member(owner, name)) { chainable = true });
            g.usedMembers.Add(owner.FullName + "." + name);
            g.Feed(unit, "target", target);
            g.Feed(unit, "input", value);
            g.Chain(unit, "assign", "assigned");
            return new Val(g, unit.valueOutputs["targetOutput"], owner);
        }

        /// <summary>list[index] = item, as a step (a stock "Set List Item" unit).</summary>
        static void SetListItem(GraphWriter g, Val list, Val index, Val item)
        {
            var unit = g.Add(new SetListItem());
            g.Feed(unit, "list", list);
            g.Feed(unit, "index", index);
            g.Feed(unit, "item", item);
            g.Chain(unit, "enter", "exit");
        }

        // ------------------------------------------------------------------ meshes

        static Mesh LoadMesh(string resourcePath)
        {
            string path = Models + resourcePath;
            var mesh = AssetDatabase.LoadAllAssetsAtPath(path).OfType<Mesh>().FirstOrDefault();
            if (mesh == null) throw new Exception($"no mesh in {path} (run altspace/tools/import_upstream_bricks.py)");
            return mesh;
        }

        static Mesh SaveMesh(Mesh mesh, string name)
        {
            Directory.CreateDirectory(MeshFolder);
            string path = $"{MeshFolder}/{name}.asset";
            mesh.name = name;
            var existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (existing != null)
            {
                EditorUtility.CopySerialized(mesh, existing);
                existing.name = name;
                EditorUtility.SetDirty(existing);
                return existing;
            }
            AssetDatabase.CreateAsset(mesh, path);
            return mesh;
        }

        static Mesh EmptyMesh()
        {
            var mesh = new Mesh { vertices = new[] { Vector3.zero, Vector3.zero, Vector3.zero }, triangles = new[] { 0, 1, 2 } };
            mesh.normals = new[] { Vector3.up, Vector3.up, Vector3.up };
            mesh.uv = new Vector2[3];
            mesh.uv2 = new Vector2[3];
            return SaveMesh(mesh, "Empty");
        }

        /// <summary>
        /// The four placed-brick meshes of one type, in MESH_VARIANTS order (ts/src/BrickRenderer.ts): hollow body + studs,
        /// solid body + studs, hollow body, solid body. Upstream combined a body (`Body` or `FlatBody` of the scene's
        /// ModularBrickObjects) with one `Stud` per uncovered stud (BrickAttach.RecalculateRenderedGeometry); here studs are
        /// all or nothing: a partly covered brick keeps its covered studs, hidden inside the brick above. Bodies are the
        /// NoBevel files where they exist; a type with no body files uses its Complete mesh (studs included) throughout.
        /// </summary>
        IEnumerable<Mesh> RenderMeshes(JObject b)
        {
            var files = (JObject)b["files"];
            string First(params string[] keys) => keys.Select(k => files[k] is JArray a && a.Count > 0 ? (string)a[0] : null).FirstOrDefault(f => f != null);
            string complete = (string)b["complete"] + ".fbx";
            string hollowFile = First("hollow_nobevel", "hollow");
            string solidFile = First("solid_nobevel", "solid");
            Mesh hollow = hollowFile != null ? LoadMesh("BrickModels/" + hollowFile) : LoadMesh(complete);
            bool hollowHasStuds = hollowFile == null;
            Mesh solid = solidFile != null ? LoadMesh("BrickModels/" + solidFile) : hollow;
            bool solidHasStuds = solidFile == null && hollowHasStuds;
            var studs = ((JArray)b["studs"]).Select(s => V3(s)).ToList();
            var stud = LoadMesh("BrickModels/z_Extras/Stud.fbx");
            string prefab = (string)b["prefab"];
            Mesh Make(Mesh body, bool addStuds, int variant)
            {
                var parts = new List<CombineInstance> { new CombineInstance { mesh = body, transform = Matrix4x4.identity } };
                if (addStuds) parts.AddRange(studs.Select(p => new CombineInstance { mesh = stud, transform = Matrix4x4.Translate(p) }));
                var mesh = new Mesh { indexFormat = IndexFormat.UInt16 };
                mesh.CombineMeshes(parts.ToArray(), true, true, false);
                mesh.uv2 = new Vector2[mesh.vertexCount];                   // the renderer's colour channel (BrickColor.shader)
                mesh.RecalculateBounds();
                return SaveMesh(mesh, $"{Key(prefab)}_v{variant}");
            }
            yield return Make(hollow, !hollowHasStuds, 0);
            yield return Make(solid, !solidHasStuds, 1);
            yield return Make(hollow, false, 2);
            yield return Make(solid, false, 3);
        }

        // ------------------------------------------------------------------ materials, sounds, UI pieces

        void MakeMaterials()
        {
            Directory.CreateDirectory(MaterialFolder);
            var brick = AssetDatabase.LoadAssetAtPath<Shader>("Assets/Kit/Shaders/BrickColor.shader") ?? throw new Exception("Assets/Kit/Shaders/BrickColor.shader is missing");
            var lit = Shader.Find("Universal Render Pipeline/Lit") ?? throw new Exception("URP Lit not found");
            var unlit = Shader.Find("Universal Render Pipeline/Unlit") ?? throw new Exception("URP Unlit not found");
            materials["Chunk"] = Brick(brick, "BrickChunk", Color.white, true, false);
            materials["Held"] = Brick(brick, "BrickHeld", Color.white, false, false);
            materials["Instanced"] = Brick(brick, "BrickInstanced", new Color(0.8f, 0.1f, 0.05f), false, true);
            materials["Picker"] = Brick(brick, "BrickPicker", new Color(0.79f, 0.10f, 0.04f), false, false);
            materials["Carpet"] = Lit(lit, "Carpet", new Color(0.30f, 0.36f, 0.33f), 0.1f);
            materials["Panel"] = Lit(lit, "Panel", new Color(0.13f, 0.14f, 0.16f), 0.2f);
            materials["Button"] = Lit(lit, "Button", new Color(0.32f, 0.36f, 0.42f), 0.3f);
            materials["Tile"] = Lit(lit, "Tile", new Color(0.22f, 0.24f, 0.27f), 0.2f);
            materials["Marker"] = Lit(lit, "Marker", new Color(0.98f, 0.78f, 0.2f), 0.4f);
            materials["Handle"] = Lit(lit, "Handle", new Color(0.45f, 0.28f, 0.14f), 0.3f);
            materials["Metal"] = Lit(lit, "Metal", new Color(0.55f, 0.57f, 0.6f), 0.7f);
            var ghost = Save(new Material(unlit) { name = "Ghost" });
            ghost.SetColor("_BaseColor", new Color(0.55f, 0.85f, 1f, 0.35f));
            ghost.SetFloat("_Surface", 1f);
            ghost.SetFloat("_Blend", 0f);
            ghost.SetOverrideTag("RenderType", "Transparent");
            ghost.SetFloat("_SrcBlend", (float)BlendMode.SrcAlpha);
            ghost.SetFloat("_DstBlend", (float)BlendMode.OneMinusSrcAlpha);
            ghost.SetFloat("_SrcBlendAlpha", (float)BlendMode.One);
            ghost.SetFloat("_DstBlendAlpha", (float)BlendMode.OneMinusSrcAlpha);
            ghost.SetFloat("_ZWrite", 0f);
            ghost.renderQueue = (int)RenderQueue.Transparent;
            UnityEditor.BaseShaderGUI.SetMaterialKeywords(ghost);                // URP's own setup (chess: without it bundles grow)
            materials["Ghost"] = ghost;
            foreach (var m in materials.Values)
            {
                if (m.shader == lit) UnityEditor.BaseShaderGUI.SetMaterialKeywords(m, UnityEditor.Rendering.Universal.ShaderGUI.LitGUI.SetMaterialKeywords);
                EditorUtility.SetDirty(m);
            }
            AssetDatabase.SaveAssets();
        }

        Material SwatchMaterial(int rgb)
        {
            var c = new Color(((rgb >> 16) & 255) / 255f, ((rgb >> 8) & 255) / 255f, (rgb & 255) / 255f);
            string name = "Swatch" + rgb.ToString("X6");
            if (!materials.TryGetValue(name, out var m))
                materials[name] = m = Brick(AssetDatabase.LoadAssetAtPath<Shader>("Assets/Kit/Shaders/BrickColor.shader"), name, c, false, false);
            return m;
        }

        static Material Save(Material m)
        {
            string path = $"{MaterialFolder}/{m.name}.mat";
            var existing = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (existing != null)
            {
                existing.shader = m.shader;
                existing.CopyPropertiesFromMaterial(m);
                existing.shaderKeywords = m.shaderKeywords;
                return existing;
            }
            AssetDatabase.CreateAsset(m, path);
            return m;
        }

        static Material Brick(Shader shader, string name, Color colour, bool fromUv1, bool instancing)
        {
            var m = Save(new Material(shader) { name = name });
            m.SetColor("_BaseColor", colour);
            m.SetFloat("_ColorFromUV1", fromUv1 ? 1f : 0f);
            m.enableInstancing = instancing;
            EditorUtility.SetDirty(m);
            return m;
        }

        static Material Lit(Shader shader, string name, Color colour, float smoothness)
        {
            var m = Save(new Material(shader) { name = name });
            m.SetColor("_BaseColor", colour);
            m.SetFloat("_Smoothness", smoothness);
            m.enableInstancing = false;
            return m;
        }

        /// <summary>A clickable flat button (a thin box) with an optional label, under `parent`.</summary>
        static GameObject Button(KitStage stage, Transform parent, string name, Vector3 position, Vector2 size, string label, Material material)
        {
            var go = stage.Primitive(PrimitiveType.Cube, name, parent);
            go.transform.localPosition = position;
            go.transform.localScale = Vector3.one;
            Object.DestroyImmediate(go.GetComponent<BoxCollider>());
            Object.DestroyImmediate(go.GetComponent<MeshRenderer>());
            Object.DestroyImmediate(go.GetComponent<MeshFilter>());
            go.AddComponent<BoxCollider>().size = new Vector3(size.x, size.y, 0.02f);
            var face = stage.Primitive(PrimitiveType.Cube, "Face", go.transform);
            Object.DestroyImmediate(face.GetComponent<Collider>());
            face.transform.localScale = new Vector3(size.x, size.y, 0.015f);
            face.GetComponent<MeshRenderer>().sharedMaterial = material;
            Quiet(face);
            if (label != null) Label(stage, go.transform, label, new Vector3(0f, 0f, -0.009f), size.x, 0.5f);
            return go;
        }

        static void Label(KitStage stage, Transform parent, string text, Vector3 position, float width, float size)
        {
            var go = stage.Create("Label", parent);
            var tmp = go.AddComponent<TextMeshPro>();
            Text(tmp, text, size, TextAlignmentOptions.Center);
            tmp.rectTransform.sizeDelta = new Vector2(width, 0.06f);
            go.transform.localPosition = position;
        }

        static void Text(TextMeshPro tmp, string text, float size, TextAlignmentOptions alignment)
        {
            tmp.font = KitText.DefaultFont();
            tmp.text = text;
            tmp.fontSize = size;
            tmp.color = Color.white;
            tmp.alignment = alignment;
            tmp.textWrappingMode = TextWrappingModes.NoWrap;
            tmp.overflowMode = TextOverflowModes.Ellipsis;
        }

        /// <summary>Three uGUI sliders (hue, saturation, value) on a world-space canvas, read from -Z (uGUI's facing).</summary>
        static GameObject[] Sliders(KitStage stage, Transform picker, GameObject area)
        {
            var root = stage.Create("Sliders", picker);
            root.transform.localPosition = new Vector3(0.1f, 0.74f, -0.014f);
            var canvasRect = root.AddComponent<RectTransform>();
            canvasRect.sizeDelta = new Vector2(600f, 40f);
            root.transform.localScale = Vector3.one * 0.002f;
            var canvas = root.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            root.AddComponent<UnityEngine.UI.GraphicRaycaster>();
            var made = new GameObject[3];
            string[] names = { "Hue", "Saturation", "Value" };
            for (int i = 0; i < 3; i++)
            {
                var slider = UnityEngine.UI.DefaultControls.CreateSlider(new UnityEngine.UI.DefaultControls.Resources());
                slider.name = names[i];
                slider.transform.SetParent(root.transform, false);
                var rect = slider.GetComponent<RectTransform>();
                rect.sizeDelta = new Vector2(180f, 20f);
                rect.anchoredPosition = new Vector2(-200f + i * 200f, 0f);
                var s = slider.GetComponent<UnityEngine.UI.Slider>();
                s.minValue = 0f;
                s.maxValue = 1f;
                s.value = i == 0 ? 0f : 0.9f;
                foreach (var image in slider.GetComponentsInChildren<UnityEngine.UI.Image>(true)) image.color = image.name == "Handle" ? Color.white : new Color(0.5f, 0.55f, 0.6f);
                made[i] = slider;
            }
            return made;
        }

        /// <summary>The area's sound source and its clip list; returns a "$clip" value maker by file name.</summary>
        static Func<string, JObject> Clips(KitStage stage, GameObject holder, params string[] names)
        {
            holder.AddComponent<AudioSource>().playOnAwake = false;
            var audio = holder.AddComponent(GraphTypes.Find("BS.BSAudioSource"));
            var so = new SerializedObject(audio);
            var clips = so.FindProperty("clips");
            clips.arraySize = names.Length;
            var mirror = new AotList();
            for (int i = 0; i < names.Length; i++)
            {
                var clip = AssetDatabase.LoadAssetAtPath<AudioClip>($"{SoundFolder}/{names[i]}.ogg") ?? throw new Exception($"{SoundFolder}/{names[i]}.ogg is missing");
                clips.GetArrayElementAtIndex(i).objectReferenceValue = clip;
                mirror.Add(clip);
            }
            var playOnAwake = so.FindProperty("playOnAwake");
            if (playOnAwake != null) playOnAwake.boolValue = false;
            so.ApplyModifiedPropertiesWithoutUndo();
            var variables = holder.GetComponent<Variables>() ?? holder.AddComponent<Variables>();
            variables.declarations.Set(RelayGraph.ClipsVariable, mirror);
            stage.Ref(holder);
            return name => new JObject { ["$clip"] = Array.IndexOf(names, name), ["on"] = "area" };
        }

        static GameObject Quiet(GameObject go)
        {
            var r = go.GetComponent<MeshRenderer>();
            if (r != null)
            {
                r.shadowCastingMode = ShadowCastingMode.Off;
                r.receiveShadows = false;
                r.lightProbeUsage = LightProbeUsage.Off;
                r.reflectionProbeUsage = ReflectionProbeUsage.Off;
            }
            return go;
        }

        const string CreditsText =
            "Brick Builder: a port of BricksVR by BricksVR Studios (github.com/d12/bricksvr-game, MIT; the BricksVR name and logos are " +
            "not used). The script holds the portkit runtime (MIT). Brick models regenerated as plain shapes. Sounds: Kenney (kenney.nl), " +
            "CC0. Text: Liberation Sans (SIL OFL 1.1). Not affiliated with BricksVR or any toy maker.";

        static Vector3 V3(JToken a) => new Vector3((float)a[0], (float)a[1], (float)a[2]);
        static string Key(string prefab) => new string(prefab.Select(c => char.IsLetterOrDigit(c) ? c : '_').ToArray());
        static string CategoryTitle(string category) => category == "side_studs" ? "Side studs" : char.ToUpperInvariant(category[0]) + category.Substring(1);
    }
}
