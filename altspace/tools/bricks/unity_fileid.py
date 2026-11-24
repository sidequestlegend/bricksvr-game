"""Unity model-importer sub-asset fileIDs (ModelImporter fileIdsGeneration: 2).

Unity derives the local fileID of an imported FBX mesh from its name:

    fileID = int64( xxHash64( "Type:Mesh->" + <FBX Model node name> + "0", seed=0 ) )

(the trailing "0" is the occurrence index of that name). Verified against five
known (name, fileID) pairs from Unity 6000.3's built-in packages (UVSphere.fbx
"Sphere" -> 4711208715938537054, icecube.fbx "IceCube" -> -1918741649104114524,
Island.fbx, waterPlane2x2.fbx "Plane001", FrameSide.fbx) and against 167 of the
upstream brick references (e.g. "Brick_1x2_Complete" -> -9031240278408722307).

Pure Python, no dependencies (usable from Blender's bundled Python).
"""
import struct

_M = (1 << 64) - 1
_P1, _P2, _P3, _P4, _P5 = (11400714785074694791, 14029467366897019727, 1609587929392839161,
                          9650029242287828579, 2870177450012600261)


def _rot(x, k):
    return ((x << k) | (x >> (64 - k))) & _M


def _round(acc, inp):
    acc = (acc + inp * _P2) & _M
    return (_rot(acc, 31) * _P1) & _M


def xxh64(data, seed=0):
    n, p = len(data), 0
    if n >= 32:
        v1, v2, v3, v4 = (seed + _P1 + _P2) & _M, (seed + _P2) & _M, seed, (seed - _P1) & _M
        while p <= n - 32:
            a, b, c, d = struct.unpack_from('<4Q', data, p)
            v1, v2, v3, v4 = _round(v1, a), _round(v2, b), _round(v3, c), _round(v4, d)
            p += 32
        h = (_rot(v1, 1) + _rot(v2, 7) + _rot(v3, 12) + _rot(v4, 18)) & _M
        for v in (v1, v2, v3, v4):
            h ^= _round(0, v)
            h = (h * _P1 + _P4) & _M
    else:
        h = (seed + _P5) & _M
    h = (h + n) & _M
    while p + 8 <= n:
        h ^= _round(0, struct.unpack_from('<Q', data, p)[0])
        h = (_rot(h, 27) * _P1 + _P4) & _M
        p += 8
    if p + 4 <= n:
        h ^= (struct.unpack_from('<I', data, p)[0] * _P1) & _M
        h = (_rot(h, 23) * _P2 + _P3) & _M
        p += 4
    while p < n:
        h ^= (data[p] * _P5) & _M
        h = (_rot(h, 11) * _P1) & _M
        p += 1
    h ^= h >> 33
    h = (h * _P2) & _M
    h ^= h >> 29
    h = (h * _P3) & _M
    h ^= h >> 32
    return h


def mesh_file_id(name, index=0):
    """Signed 64-bit fileID Unity gives a Mesh named `name` inside an FBX."""
    v = xxh64(f"Type:Mesh->{name}{index}".encode("utf-8"))
    return v - (1 << 64) if v >= (1 << 63) else v


assert xxh64(b"") == 0xEF46DB3751D8E999
assert mesh_file_id("Sphere") == 4711208715938537054
assert mesh_file_id("Brick_1x2_Complete") == -9031240278408722307
