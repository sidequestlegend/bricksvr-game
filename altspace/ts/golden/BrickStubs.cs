// Stand-ins for the parts of Unity, XR Interaction Toolkit and Normcore that BricksVR's snapping code calls, so that
// Assets/Scripts/BrickAttachDetector.cs, LegoConnectorScript.cs and ColorInt.cs compile UNCHANGED with dotnet 8,
// outside Unity (the pattern of portkit/golden/UdonStubs.cs and UnityStubs.cs; see Golden.csproj for why this game
// keeps its own set).
//
// What is modelled with care, because the upstream math depends on it:
//   - Transform: a parent chain of local position / rotation / scale; world getters and setters; setting `parent`
//     keeps the world pose (as Unity does); eulerAngles in Unity's Z-X-Y convention; RotateAround; TransformPoint.
//   - Quaternion: Unity's Euler, multiplication, Angle (with its 1e-6 "same rotation" shortcut), AngleAxis.
//   - Physics: CheckBox and OverlapBoxNonAlloc as exact oriented-box overlap (separating axes) against every enabled
//     BoxCollider on an active object, honouring layers and QueryTriggerInteraction.Ignore.
// Everything else (haptics, ownership, interactables) is an inert stub.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace UnityEngine
{
    public class Object
    {
        public string name = "";
        public static implicit operator bool(Object o) => o != null && o.alive;
        internal bool alive = true;
        public static void Destroy(Object o) { if (o != null) o.alive = false; }
    }

    public class Component : Object
    {
        public GameObject gameObject;
        public Transform transform => gameObject.transform;
        public T GetComponent<T>() where T : class => gameObject.GetComponent<T>();
        public T GetComponentInParent<T>() where T : class => gameObject.GetComponentInParent<T>();
        public bool CompareTag(string t) => gameObject.tag == t;
        public string tag { get => gameObject.tag; set => gameObject.tag = value; }
    }

    public class Behaviour : Component { public bool enabled = true; }
    public class MonoBehaviour : Behaviour { }

    public sealed class GameObject : Object
    {
        public readonly List<Component> components = new List<Component>();
        public readonly Transform transform;
        public string tag = "Untagged";
        public int layer;
        public bool activeSelf = true;
        public static readonly Dictionary<string, GameObject> Tagged = new Dictionary<string, GameObject>();

        public GameObject(string name = "GameObject")
        {
            this.name = name;
            transform = new Transform { gameObject = this };
            components.Add(transform);
        }

        public T AddComponent<T>() where T : Component, new()
        {
            var c = new T { gameObject = this };
            components.Add(c);
            if (c is Collider col) Physics.All.Add(col);
            return c;
        }

        public T GetComponent<T>() where T : class => components.OfType<T>().FirstOrDefault();
        public T GetComponentInParent<T>() where T : class
        {
            for (Transform t = transform; t != null; t = t.parent)
            {
                var c = t.gameObject.GetComponent<T>();
                if (c != null) return c;
            }
            return null;
        }
        public bool CompareTag(string t) => tag == t;
        public static GameObject FindWithTag(string tag) => Tagged.TryGetValue(tag, out var g) ? g : null;
        public void SetActive(bool v) { activeSelf = v; }
        public bool activeInHierarchy { get { for (Transform t = transform; t != null; t = t.parent) if (!t.gameObject.activeSelf) return false; return true; } }
    }

    public class Transform : Component, IEnumerable
    {
        private Transform _parent;
        public readonly List<Transform> children = new List<Transform>();
        public Vector3 localPosition = Vector3.zero;
        public Quaternion localRotation = Quaternion.identity;
        public Vector3 localScale = Vector3.one;

        public Transform parent
        {
            get => _parent;
            set
            {
                Vector3 p = position;
                Quaternion r = rotation;
                _parent?.children.Remove(this);
                _parent = value;
                _parent?.children.Add(this);
                position = p;
                rotation = r;
            }
        }

        public void SetParentKeepLocal(Transform p)
        {
            _parent?.children.Remove(this);
            _parent = p;
            _parent?.children.Add(this);
        }

        public Vector3 lossyScale => _parent == null ? localScale : Vector3.Scale(_parent.lossyScale, localScale);

        public Quaternion rotation
        {
            get => _parent == null ? localRotation : _parent.rotation * localRotation;
            set => localRotation = _parent == null ? value : Quaternion.Inverse(_parent.rotation) * value;
        }

        public Vector3 position
        {
            get => _parent == null ? localPosition : _parent.TransformPoint(localPosition);
            set => localPosition = _parent == null ? value : _parent.InverseTransformPoint(value);
        }

        public Vector3 eulerAngles { get => rotation.eulerAngles; set => rotation = Quaternion.Euler(value); }
        public Vector3 localEulerAngles { get => localRotation.eulerAngles; set => localRotation = Quaternion.Euler(value); }
        public Vector3 up => rotation * Vector3.up;

        public Vector3 TransformPoint(Vector3 p) => position + rotation * Vector3.Scale(lossyScale, p);

        public Vector3 InverseTransformPoint(Vector3 p)
        {
            Vector3 d = Quaternion.Inverse(rotation) * (p - position);
            Vector3 s = lossyScale;
            return new Vector3(d.x / s.x, d.y / s.y, d.z / s.z);
        }

        public void RotateAround(Vector3 point, Vector3 axis, float angle)
        {
            Quaternion q = Quaternion.AngleAxis(angle, axis);
            Vector3 p = position;
            position = point + q * (p - point);
            rotation = q * rotation;
        }

        public IEnumerator GetEnumerator() => children.ToList().GetEnumerator();
    }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero => new Vector3(0, 0, 0);
        public static Vector3 one => new Vector3(1, 1, 1);
        public static Vector3 up => new Vector3(0, 1, 0);
        public static Vector3 down => new Vector3(0, -1, 0);
        public static Vector3 operator +(Vector3 a, Vector3 b) => new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
        public static Vector3 operator -(Vector3 a, Vector3 b) => new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
        public static Vector3 operator -(Vector3 a) => new Vector3(-a.x, -a.y, -a.z);
        public static Vector3 operator *(Vector3 a, float k) => new Vector3(a.x * k, a.y * k, a.z * k);
        public static Vector3 operator *(float k, Vector3 a) => new Vector3(a.x * k, a.y * k, a.z * k);
        public static Vector3 operator /(Vector3 a, float k) => new Vector3(a.x / k, a.y / k, a.z / k);
        public static bool operator ==(Vector3 a, Vector3 b) => (a - b).sqrMagnitude < 9.99999944E-11f;
        public static bool operator !=(Vector3 a, Vector3 b) => !(a == b);
        public override bool Equals(object o) => o is Vector3 v && v == this;
        public override int GetHashCode() => 0;
        public float sqrMagnitude => x * x + y * y + z * z;
        public float magnitude => (float)Math.Sqrt(sqrMagnitude);
        public Vector3 normalized { get { float m = magnitude; return m > 1e-5f ? this / m : zero; } }
        public static Vector3 Scale(Vector3 a, Vector3 b) => new Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
        public static float Distance(Vector3 a, Vector3 b) => (a - b).magnitude;
        public static float Dot(Vector3 a, Vector3 b) => a.x * b.x + a.y * b.y + a.z * b.z;
        public override string ToString() => $"({x}, {y}, {z})";
    }

    public struct Quaternion
    {
        public float x, y, z, w;
        public Quaternion(float x, float y, float z, float w) { this.x = x; this.y = y; this.z = z; this.w = w; }
        public static Quaternion identity => new Quaternion(0, 0, 0, 1);

        public static Quaternion operator *(Quaternion a, Quaternion b) => new Quaternion(
            a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
            a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
            a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z);

        public static Vector3 operator *(Quaternion q, Vector3 v)
        {
            float tx = 2 * (q.y * v.z - q.z * v.y), ty = 2 * (q.z * v.x - q.x * v.z), tz = 2 * (q.x * v.y - q.y * v.x);
            return new Vector3(v.x + q.w * tx + (q.y * tz - q.z * ty), v.y + q.w * ty + (q.z * tx - q.x * tz), v.z + q.w * tz + (q.x * ty - q.y * tx));
        }

        public static Quaternion Inverse(Quaternion q) => new Quaternion(-q.x, -q.y, -q.z, q.w);

        public static Quaternion Euler(float ex, float ey, float ez)
        {
            double hx = ex * Math.PI / 360, hy = ey * Math.PI / 360, hz = ez * Math.PI / 360;
            double sx = Math.Sin(hx), cx = Math.Cos(hx), sy = Math.Sin(hy), cy = Math.Cos(hy), sz = Math.Sin(hz), cz = Math.Cos(hz);
            return new Quaternion((float)(cy * sx * cz + sy * cx * sz), (float)(sy * cx * cz - cy * sx * sz), (float)(cy * cx * sz - sy * sx * cz), (float)(cy * cx * cz + sy * sx * sz));
        }
        public static Quaternion Euler(Vector3 e) => Euler(e.x, e.y, e.z);

        public static Quaternion AngleAxis(float degrees, Vector3 axis)
        {
            Vector3 n = axis.normalized;
            double h = degrees * Math.PI / 360;
            float s = (float)Math.Sin(h);
            return new Quaternion(n.x * s, n.y * s, n.z * s, (float)Math.Cos(h));
        }

        public static float Dot(Quaternion a, Quaternion b) => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

        public static float Angle(Quaternion a, Quaternion b)
        {
            float dot = Math.Min(Math.Abs(Dot(a, b)), 1f);
            return dot > 0.999999f ? 0f : (float)(Math.Acos(dot) * 2.0 * 180.0 / Math.PI);
        }

        public Vector3 eulerAngles
        {
            get
            {
                double sinX = 2 * (w * x - y * z), ex, ey, ez;
                if (Math.Abs(sinX) > 0.9999995) { ex = Math.Sign(sinX) * Math.PI / 2; ey = 2 * Math.Atan2(y, w); ez = 0; }
                else
                {
                    ex = Math.Asin(sinX);
                    ey = Math.Atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
                    ez = Math.Atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
                }
                float Wrap(double r) { double d = (r * 180 / Math.PI) % 360; return (float)(d < 0 ? d + 360 : d); }
                return new Vector3(Wrap(ex), Wrap(ey), Wrap(ez));
            }
        }
    }

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b, float a = 1) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static implicit operator Color(Color32 c) => new Color(c.r / 255f, c.g / 255f, c.b / 255f, c.a / 255f);
    }

    public struct Color32
    {
        public byte r, g, b, a;
        public Color32(byte r, byte g, byte b, byte a) { this.r = r; this.g = g; this.b = b; this.a = a; }
    }

    public static class Mathf
    {
        public static float Abs(float v) => Math.Abs(v);
        public static float Max(params float[] v) => v.Max();
        public static float Clamp(float v, float a, float b) => Math.Max(a, Math.Min(b, v));
        public static int Clamp(int v, int a, int b) => Math.Max(a, Math.Min(b, v));
    }

    public static class Debug { public static void Log(object o) { } public static void LogError(object o) { } }
    public static class Application { public static bool isPlaying = true; public static bool isEditor = false; }
    public static class Gizmos { public static void DrawWireCube(Vector3 c, Vector3 s) { } }
    public static class Time { public static int frameCount; }

    public class Collider : Component { public bool enabled = true; public bool isTrigger; }
    public class BoxCollider : Collider { public Vector3 size = Vector3.one; public Vector3 center = Vector3.zero; }
    public class Rigidbody : Component { public bool isKinematic; public bool useGravity; }
    public class HideInInspector : Attribute { }

    public enum QueryTriggerInteraction { UseGlobal, Ignore, Collide }

    public static class LayerMask
    {
        public static readonly string[] Names = { "Default", "TransparentFX", "Ignore Raycast", "", "Water", "UI", "", "", "teleport", "Ignore ARCamera", "bow", "arrow", "lego", "button", "controller", "connector", "placed connector", "placed lego" };
        public static int GetMask(params string[] names) => names.Aggregate(0, (m, n) => m | (1 << Array.IndexOf(Names, n)));
        public static int NameToLayer(string n) => Array.IndexOf(Names, n);
    }

    public static class Physics
    {
        public static readonly List<Collider> All = new List<Collider>();
        public static int Queries;

        public static void IgnoreCollision(Collider a, Collider b) { }

        static Vector3[] Axes(Quaternion q) => new[] { q * new Vector3(1, 0, 0), q * new Vector3(0, 1, 0), q * new Vector3(0, 0, 1) };

        /// <summary>Separating-axis test of two oriented boxes (centre, half extents, rotation).</summary>
        public static bool Overlap(Vector3 ca, Vector3 ha, Quaternion qa, Vector3 cb, Vector3 hb, Quaternion qb)
        {
            Vector3[] A = Axes(qa), B = Axes(qb);
            float[] ea = { ha.x, ha.y, ha.z }, eb = { hb.x, hb.y, hb.z };
            Vector3 t = cb - ca;
            var axes = new List<Vector3>(A);
            axes.AddRange(B);
            foreach (var u in A) foreach (var v in B)
            {
                var c = new Vector3(u.y * v.z - u.z * v.y, u.z * v.x - u.x * v.z, u.x * v.y - u.y * v.x);
                if (c.sqrMagnitude > 1e-8f) axes.Add(c.normalized);
            }
            foreach (var ax in axes)
            {
                float ra = 0, rb = 0;
                for (int i = 0; i < 3; i++) { ra += ea[i] * Math.Abs(Vector3.Dot(A[i], ax)); rb += eb[i] * Math.Abs(Vector3.Dot(B[i], ax)); }
                if (Math.Abs(Vector3.Dot(t, ax)) >= ra + rb - 1e-7f) return false;
            }
            return true;
        }

        static IEnumerable<Collider> Hits(Vector3 center, Vector3 half, Quaternion rot, int mask, QueryTriggerInteraction q)
        {
            Queries++;
            foreach (var c in All)
            {
                if (!(c is BoxCollider b) || !b.enabled || !c.gameObject.activeInHierarchy || !c.gameObject.alive) continue;
                if ((mask & (1 << c.gameObject.layer)) == 0) continue;
                if (c.isTrigger && q == QueryTriggerInteraction.Ignore) continue;
                Vector3 cc = b.transform.TransformPoint(b.center);
                Vector3 hh = Vector3.Scale(b.size / 2, b.transform.lossyScale);
                if (Overlap(center, half, rot, cc, hh, b.transform.rotation)) yield return c;
            }
        }

        public static bool CheckBox(Vector3 center, Vector3 halfExtents, Quaternion orientation, int layerMask, QueryTriggerInteraction q) =>
            Hits(center, halfExtents, orientation, layerMask, q).Any();

        public static int OverlapBoxNonAlloc(Vector3 center, Vector3 halfExtents, Collider[] results, Quaternion orientation, int mask, QueryTriggerInteraction q)
        {
            int n = 0;
            foreach (var c in Hits(center, halfExtents, orientation, mask, q)) { if (n >= results.Length) break; results[n++] = c; }
            return n;
        }
    }
}

namespace UnityEngine.Serialization
{
    public class FormerlySerializedAsAttribute : System.Attribute { public FormerlySerializedAsAttribute(string s) { } }
}

namespace UnityEngine.Events
{
    public class UnityEvent<T>
    {
        public void AddListener(System.Action<T> a) { }
        public void RemoveListener(System.Action<T> a) { }
    }
}

namespace UnityEngine.XR.Interaction.Toolkit
{
    public class XRBaseInteractor : UnityEngine.MonoBehaviour { }
    public class XRInteractionManager { public void ForceHoverExit(XRBaseInteractor a, XRBaseInteractable b) { } }
    public class XRBaseInteractable : UnityEngine.MonoBehaviour
    {
        public UnityEngine.Events.UnityEvent<XRBaseInteractor> onSelectEnter = new UnityEngine.Events.UnityEvent<XRBaseInteractor>();
        public UnityEngine.Events.UnityEvent<XRBaseInteractor> onSelectExit = new UnityEngine.Events.UnityEvent<XRBaseInteractor>();
        public XRInteractionManager interactionManager = new XRInteractionManager();
        public bool isSelected;
    }
    public class XRGrabInteractable : XRBaseInteractable { }
}

namespace UnityEngine.XR.Interaction.Toolkit.AR { }

namespace Normal.Realtime
{
    public class Realtime { public int clientID; }
    public class RealtimeView : UnityEngine.MonoBehaviour { }
    public class RealtimeTransform : UnityEngine.MonoBehaviour
    {
        public int ownerID = -1;
        public bool isOwnedLocallySelf;
        public Realtime realtime = new Realtime();
        public void RequestOwnership() { }
    }
}

// Upstream scene singletons and components that BrickAttachDetector touches but whose code is not part of the math.
public class RoomOwnershipSync : UnityEngine.MonoBehaviour { public bool allowed = true; public bool IsUserAllowedToMakeChanges() => allowed; }
public class HapticsManager { static readonly HapticsManager I = new HapticsManager(); public static HapticsManager GetInstance() => I; public void PlayHaptics(float a, float b, float c, bool r, bool l) { } }
public class OwnedPhysicsBricksStore { static readonly OwnedPhysicsBricksStore I = new OwnedPhysicsBricksStore(); public static OwnedPhysicsBricksStore GetInstance() => I; public void AddBrick(UnityEngine.GameObject g) { } }
public class ShowSnappableBrickPositions : UnityEngine.MonoBehaviour { public void ResetAndDisable() { enabled = false; } }
public static class Wait { public static void ForFrames(int n, System.Action a) { } }
public class BrickAttach : UnityEngine.MonoBehaviour
{
    public string uuid = "";
    public string GetUuid() => uuid;
    public bool ConnectBricks(UnityEngine.Vector3 p, UnityEngine.Quaternion r, UnityEngine.Vector3 d) => true;
}
