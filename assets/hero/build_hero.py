"""Builds the Hero's 3D assets headlessly, from nothing but this script and stage.json.

    blender --background --factory-startup --python build_hero.py -- <out_dir> <label_png>

Writes <out_dir>/coconut.glb (Coconut, Coconut_Top, Coconut_Bottom), <out_dir>/can.glb
(Can with a Body_Label material, plus its Tab) and <out_dir>/poster.png, the first 3D frame.
Run it through `bun run assets:hero`, which also optimises the GLBs. ADR 0002 sets the
route, budgets and licensing; the coconut is procedural, so it is our own work.

Blender is Z up; glTF and three.js are Y up. The exporter maps Blender (x, y, z) to
three.js (x, z, -y), so the three.js camera at +Z sits at Blender -Y, and a three.js
rotation about Y is a Blender rotation about Z.
"""

import json
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector, noise

HERE = Path(__file__).resolve().parent
STAGE = json.loads((HERE / "stage.json").read_text())
OUT = Path(sys.argv[sys.argv.index("--") + 1])
LABEL_PNG = Path(sys.argv[sys.argv.index("--") + 2])

random.seed(25)
RNG = np.random.default_rng(25)

# Coconut: a mature brown coconut lying on its side, its long axis on X.
# Half-length (x), half-depth (y) and half-height (z).
COCONUT = (1.6, 1.25, 1.15)
# Segments around and along it: fine enough for the husk's grooves to be real geometry.
COCONUT_SEGMENTS = (256, 128)
# How deep the husk's grooves cut into the mesh, and how deep its finer relief reads in the normal map.
GROOVE_DEPTH = 0.07
RELIEF_DEPTH = 0.012
# Husk colour and normal map sizes (u around, v end to end).
HUSK_TEXTURE = (4096, 2048)
HUSK_NORMAL = (2048, 1024)
HUSK_THICKNESS = 0.16
SHELL_THICKNESS = 0.03
FLESH_THICKNESS = 0.07
# The crack that splits it, across the middle: a zigzag of uneven teeth.
CUT_Z = 0.1
TEETH = 16
TOOTH_HEIGHT = 0.11
# The coconut water: where it rests, and the highest a slosh may lift it, just under the crack's lowest point.
LIQUID_Z = CUT_Z - TOOTH_HEIGHT * 1.3 - 0.07
LIQUID_TOP = CUT_Z - TOOTH_HEIGHT * 1.3 - 0.015

# Can: a 350 ml can is 66 mm across and 122 mm tall, with about 100 mm printed.
CAN_RADIUS = 0.66
LABEL_BOTTOM, LABEL_TOP = -1.0, 1.0
CAN_SEGMENTS = 64


def to_blender(v):
    """A three.js (Y up) vector in Blender's Z-up space."""
    x, y, z = v
    return Vector((x, -z, y))


def srgb_to_linear(hex_color):
    c = [int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def reset_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def node_tree(owner):
    if owner.node_tree is None:
        owner.use_nodes = True
    return owner.node_tree


def material(name, color, roughness, metallic=0.0, image=None, normal=None):
    mat = bpy.data.materials.new(name)
    tree = node_tree(mat)
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*srgb_to_linear(color), 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if image is not None:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if normal is not None:
        tex = tree.nodes.new("ShaderNodeTexImage")
        tex.image = normal
        normal_map = tree.nodes.new("ShaderNodeNormalMap")
        tree.links.new(tex.outputs["Color"], normal_map.inputs["Color"])
        tree.links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def link(name, bm, materials, location=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for mat in materials:
        mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mark_sharp(bm, degrees):
    for edge in bm.edges:
        if len(edge.link_faces) == 2 and edge.calc_face_angle(0) > math.radians(degrees):
            edge.smooth = False


# --- Coconut -----------------------------------------------------------------


def coconut_point(direction):
    """Pushes a unit-sphere direction, poles on X, out to the coconut's surface under the husk's grooves."""
    d = direction.normalized()
    # An egg on its side: fuller at the stem end (+X), a little narrower at the far end.
    girth = 1 + 0.04 * d.x - 0.03 * max(-d.x, 0) ** 2
    # The nut inside is three-sided, so the husk swells into three soft ridges end to end.
    ridges = 1 + 0.02 * math.cos(3 * math.atan2(d.z, d.y) + 0.6) * (1 - d.x * d.x)
    lumps = 1 + 0.04 * noise.noise(d * 1.4) + 0.015 * noise.noise(d * 3.7)
    s = lumps * ridges
    return Vector((COCONUT[0] * d.x * s, COCONUT[1] * d.y * girth * s, COCONUT[2] * d.z * girth * s))


def value_noise(u, v, cells_u, cells_v):
    """Smooth value noise at texture coordinates (u, v), periodic around u so the seam meets."""
    grid = RNG.random((cells_v + 1, cells_u))
    gu, gv = u * cells_u, np.clip(v, 0, 1) * cells_v
    i0 = np.floor(gu).astype(int)
    j0 = np.minimum(np.floor(gv).astype(int), cells_v - 1)
    fu, fv = gu - i0, gv - j0
    fu, fv = fu * fu * (3 - 2 * fu), fv * fv * (3 - 2 * fv)
    i0 %= cells_u
    i1 = (i0 + 1) % cells_u
    top = grid[j0, i0] * (1 - fu) + grid[j0, i1] * fu
    bottom = grid[j0 + 1, i0] * (1 - fu) + grid[j0 + 1, i1] * fu
    return (top * (1 - fv) + bottom * fv).astype(np.float32)


def value_noise_3d(points, cells):
    """Smooth value noise at 3D points (..., 3), `cells` lattice cells per unit."""
    table = RNG.random((64, 64, 64)).astype(np.float32)
    g = points * cells + 32
    i = np.floor(g).astype(np.int64)
    f = g - i
    f = f * f * (3 - 2 * f)
    total = 0
    for corner in range(8):
        offset = [(corner >> axis) & 1 for axis in range(3)]
        weight = 1
        for axis in range(3):
            weight = weight * (f[..., axis] if offset[axis] else 1 - f[..., axis])
        cell = (i + offset) % 64
        total = total + weight * table[cell[..., 0], cell[..., 1], cell[..., 2]]
    return total.astype(np.float32)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def texel_grid(width, height):
    """(u, v) at every texel centre, rows running from v = 0."""
    return np.meshgrid((np.arange(width, dtype=np.float32) + 0.5) / width, (np.arange(height, dtype=np.float32) + 0.5) / height)


def save_image(name, rgb, srgb):
    """A generated image, written beside the GLB so the exporter can embed it."""
    height, width, _ = rgb.shape
    if srgb:
        rgb = np.where(rgb <= 0.0031308, rgb * 12.92, 1.055 * np.power(np.maximum(rgb, 0), 1 / 2.4) - 0.055)
    rgba = np.concatenate([np.clip(rgb, 0, 1), np.ones((height, width, 1))], axis=2)
    image = bpy.data.images.new(name, width, height, alpha=False)
    # Before the pixels: changing a generated image's colour space regenerates it.
    if not srgb:
        image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(rgba.astype(np.float32).ravel())
    image.filepath_raw = str(OUT / f"{name.lower()}.png")
    image.file_format = "PNG"
    image.save()
    return image


def box(layer, radius, axis):
    """A box blur along one axis: wrapping around u (axis 1), clamped at the ends (axis 0)."""
    n = layer.shape[axis]
    pad = [(0, 0), (0, 0)]
    pad[axis] = (radius + 1, radius)
    total = np.cumsum(np.pad(layer, pad, mode="wrap" if axis == 1 else "edge"), axis=axis, dtype=np.float64)
    upper = np.take(total, np.arange(2 * radius + 1, 2 * radius + 1 + n), axis=axis)
    lower = np.take(total, np.arange(n), axis=axis)
    return ((upper - lower) / (2 * radius + 1)).astype(np.float32)


def blur(layer, sigma_u, sigma_v=0.0):
    """A near-Gaussian blur of about sigma texels (three box passes per axis)."""
    for axis, sigma in ((1, sigma_u), (0, sigma_v)):
        radius = round((math.sqrt(4 * sigma * sigma + 1) - 1) / 2)
        for _ in range(3 if radius else 0):
            layer = box(layer, radius, axis)
    return layer


def sample(layer, u, v):
    """Bilinear lookup of a (v, u) layer at texture coordinates, wrapping around u."""
    height, width = layer.shape
    x, y = u * width - 0.5, min(max(v * height - 0.5, 0), height - 1)
    x0, y0 = math.floor(x), min(math.floor(y), height - 2)
    fx, fy = x - x0, y - y0
    x0, x1 = x0 % width, (x0 + 1) % width
    top = layer[y0, x0] * (1 - fx) + layer[y0, x1] * fx
    bottom = layer[y0 + 1, x0] * (1 - fx) + layer[y0 + 1, x1] * fx
    return float(top * (1 - fy) + bottom * fy)


def fibre_flow(width, height):
    """How far the husk's grain runs off the coconut's length at each texel, in radians: combed, but wandering."""
    uu, vv = texel_grid(width, height)
    return 0.55 * (value_noise(uu, vv, 5, 3) - 0.5) + 0.35 * (value_noise(uu, vv, 16, 6) - 0.5)


def strands(flow, count, length, jitter, curl):
    """Rasterises `count` fibre strands into a (v, u) layer, each following the flow field.

    length is a (min, max) in texels, jitter how far (radians) each strand's own heading
    strays from the flow, and curl how much that heading wanders per texel. Strands wrap around u.
    """
    height, width = flow.shape
    lengths = RNG.uniform(*length, count)
    x = RNG.uniform(0, width, count)
    y = RNG.uniform(0, height, count)
    way = RNG.choice([-1.0, 1.0], count)
    own = RNG.normal(0, jitter, count)
    cells, weights = [], []
    for step in range(int(length[1])):
        alive = lengths > step
        col = x[alive].astype(np.int64) % width
        row = np.clip(y[alive].astype(np.int64), 0, height - 1)
        cells.append(row * width + col)
        # Thinning out at both tips.
        weights.append(np.sqrt(np.sin(np.pi * step / lengths[alive])))
        angle = flow[row, col] + own[alive]
        x[alive] += way[alive] * np.sin(angle)
        y[alive] += way[alive] * np.cos(angle)
        own[alive] += RNG.normal(0, curl, int(alive.sum()))
    layer = np.bincount(np.concatenate(cells), np.concatenate(weights), minlength=height * width)
    return layer.reshape(height, width).astype(np.float32)


def strand_layer(flow, count, length, jitter, width, curl=0.02, density=1.2):
    """How thickly strands `width` texels across cover each texel, 0 bare to 1 covered."""
    layer = strands(flow, count, length, jitter, curl)
    sigma = width / 2.5
    if sigma >= 0.5:
        # Scaled so a single strand peaks at 1 whatever its width.
        line = np.zeros((4, 64), np.float32)
        line[:, 32] = 1
        layer = blur(layer, sigma) / blur(line, sigma).max()
    return 1 - np.exp(-density * layer)


def husk_textures():
    """The brown husk, painted on the coconut's UVs (u around it, v end to end, so the fibre runs along v).

    Returns the colour and normal images, and the grooves (about -1 deep to 1 proud) the mesh is displaced by.
    """
    width, height = HUSK_TEXTURE
    uu, vv = texel_grid(width, height)
    flow = fibre_flow(width, height)
    # The fibre converges on the two ends, so it gives way to a matted cap there. The cap is
    # noise in 3D, where the ends are points like any other, so nothing pinches into a star.
    ends = smoothstep(0.0, 0.12, vv) * smoothstep(1.0, 0.88, vv)
    polar, around = np.pi * vv, 2 * np.pi * uu
    direction = np.stack([np.cos(polar), np.sin(polar) * np.cos(around), np.sin(polar) * np.sin(around)], axis=-1)
    matted = 0.5 * value_noise_3d(direction, 7) + 0.3 * value_noise_3d(direction, 20) + 0.2 * value_noise_3d(direction, 60)
    del direction

    # Deep fissures between the bundles, and wide, shallow furrows the mesh itself follows.
    fissures = strand_layer(flow, 70, (300, 1200), 0.02, 9, curl=0.005, density=1.6)
    furrows = strand_layer(flow, 60, (700, 1900), 0.02, 40, curl=0.005, density=1.8)
    # Rope-like bundles of fibre, the coarser cords on them and fine fibre over everything.
    bundles = strand_layer(flow, 2600, (80, 520), 0.1, 11)
    cords = strand_layer(flow, 14_000, (30, 180), 0.14, 3)
    fibres = strand_layer(flow, 220_000, (8, 50), 0.22, 1.2, density=0.9)
    # Loose frizz lifting off the surface every which way.
    frizz = strand_layer(flow, 30_000, (5, 26), 1.3, 1.3, curl=0.15, density=0.8)

    mottle = 0.6 * value_noise(uu, vv, 240, 120) + 0.4 * value_noise(uu, vv, 60, 30)
    patches = value_noise(uu, vv, 9, 5)
    shine = value_noise(uu, vv, 120, 30)
    # Torn patches, where the top fibre has come away from the dark, matted husk under it.
    torn = smoothstep(0.68, 0.8, value_noise(uu, vv, 34, 10))
    # Worn patches, rubbed pale and flat.
    worn = smoothstep(0.72, 0.9, value_noise(uu, vv, 22, 5))
    # Chips where the husk is broken through to the pale pith.
    chips = np.zeros_like(uu)
    for cu, cv, ru, rv in [(0.33, 0.47, 34, 44), (0.71, 0.62, 16, 22), (0.06, 0.35, 12, 18)]:
        du = (uu - cu + 0.5) % 1 - 0.5
        reach = np.hypot(du * width / ru, (vv - cv) * height / rv) + 0.5 * (mottle - 0.5)
        chips = np.maximum(chips, smoothstep(1.0, 0.7, reach))

    top = (1 - 0.7 * torn) * (1 - chips)
    relief = (0.7 * bundles + 0.3 * cords) * top + 0.12 * fibres + 0.08 * frizz - 0.8 * fissures - 1.2 * furrows + 0.2 * mottle - 0.5 * chips
    relief = (relief - relief.mean()) / relief.std()
    relief = relief * ends + 2.5 * (matted - 0.5) * (1 - ends)

    # Shadowed hollows: how far each texel sits below its surroundings, near and wide.
    hollow = np.maximum(blur(relief, 5, 5) - relief, 0) + 0.7 * np.maximum(blur(relief, 24, 24) - relief, 0)
    occlusion = np.exp(-0.55 * hollow)

    def mix(a, b, t):
        return a + (b - a) * t[..., None]

    def rgb(hex_color):
        return np.array(srgb_to_linear(hex_color), np.float32)

    # Matted red-brown husk, nearly black where the bundles part.
    color = mix(rgb("#3C1408"), rgb("#6A2610"), patches)
    color = mix(color, rgb("#1C0703"), 0.8 * (1 - bundles))
    color = mix(color, mix(rgb("#7A3216"), rgb("#A44E26"), mottle), 0.9 * bundles * top)
    color = mix(color, rgb("#B35E2E"), 0.5 * cords * top)
    color = mix(color, mix(rgb("#8E3F1E"), rgb("#D08A55"), shine), 0.5 * fibres * (0.4 + 0.6 * top))
    color = mix(color, rgb("#E29A62"), 0.5 * frizz * ends)
    color = mix(color, rgb("#8E5E48"), 0.3 * worn * (1 - fissures))
    color = mix(color, rgb("#1A0603"), 0.7 * fissures)
    color = color * occlusion[..., None] * (0.8 + 0.4 * mottle[..., None])
    color = mix(color, mix(rgb("#DCCBB2"), rgb("#A88A6E"), mottle), chips * (1 - 0.6 * fibres))
    # The ends: matted, darker fibre.
    color = mix(mix(rgb("#2A0D05"), rgb("#7A3216"), matted) * occlusion[..., None], color, ends)

    # Tangent-space normals from the relief, at the normal map's size: x along u, y along v,
    # as glTF and Blender both read them. Each texel's width shrinks towards the ends.
    factor = width // HUSK_NORMAL[0]
    small = relief.reshape(height // factor, factor, width // factor, factor).mean(axis=(1, 3))
    span_u = 2 * math.pi * 0.5 * (COCONUT[1] + COCONUT[2]) / small.shape[1]
    span_v = math.pi * 0.5 * (COCONUT[0] + 0.5 * (COCONUT[1] + COCONUT[2])) / small.shape[0]
    shrink = np.maximum(np.sin(np.pi * vv[::factor, ::factor]), 0.15)
    du = (np.roll(small, -1, axis=1) - np.roll(small, 1, axis=1)) / 2 * RELIEF_DEPTH / (span_u * shrink)
    dv = np.gradient(small, axis=0) * RELIEF_DEPTH / span_v
    normal = np.stack([-du, -dv, np.ones_like(small)], axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)

    # What the mesh follows: the wide relief only, faded out on the ends so the poles stay closed.
    grooves = blur(relief, 12, 6) * smoothstep(0.0, 0.1, vv) * smoothstep(1.0, 0.9, vv)
    grooves /= 3 * grooves.std()
    return save_image("Husk", color, srgb=True), save_image("Husk_Normal", normal * 0.5 + 0.5, srgb=False), grooves


def uv_sphere(u_segments, v_segments):
    bm = bmesh.new()
    # calc_uvs writes into an existing layer only.
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=u_segments, v_segments=v_segments, radius=1, calc_uvs=True)
    return bm


def whole_coconut(mats, grooves):
    bm = uv_sphere(*COCONUT_SEGMENTS)
    # Poles on X, so the fibres in the texture run along the coconut's length.
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"))
    uv = bm.loops.layers.uv.active
    for vert in bm.verts:
        p = coconut_point(vert.co)
        # Into the grooves, along the ellipsoid's normal there.
        outward = Vector((p.x / COCONUT[0] ** 2, p.y / COCONUT[1] ** 2, p.z / COCONUT[2] ** 2)).normalized()
        u, v = vert.link_loops[0][uv].uv
        vert.co = p + outward * GROOVE_DEPTH * sample(grooves, u, v)
    for face in bm.faces:
        face.smooth = True
        face.material_index = 0
    return link("Coconut", bm, [mats["Husk"], mats["Husk_Inner"], mats["Shell"], mats["Flesh"]])


def ellipsoid(radii, inside_out=False, segments=(48, 24)):
    bm = uv_sphere(*segments)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * radii[0], vert.co.y * radii[1], vert.co.z * radii[2]))
    if inside_out:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    for face in bm.faces:
        face.smooth = True
    return bm


# Inside the husk: the hard brown shell, the white flesh lining it, and the flesh's inner wall.
SHELL = tuple(r - HUSK_THICKNESS for r in COCONUT)
MEAT = tuple(r - SHELL_THICKNESS for r in SHELL)
FLESH_WALL = tuple(r - FLESH_THICKNESS for r in MEAT)


def cavity(mats):
    """What the husk is hollowed out by, so the shell fits inside it."""
    return link("Cavity", ellipsoid(SHELL), [mats["Shell"]])


def layer(name, outer, inner, mat):
    """A closed shell between two ellipsoids, its inner wall facing inwards."""
    bm = ellipsoid(outer)
    shell = ellipsoid(inner, inside_out=True)
    mesh = bpy.data.meshes.new("tmp")
    shell.to_mesh(mesh)
    shell.free()
    bm.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    return link(name, bm, [mat])


def crack_profile():
    """(angle, height) at each valley and peak of the crack, the teeth a little uneven."""
    points = []
    for k in range(TEETH):
        valley = (k + random.uniform(-0.12, 0.12)) / TEETH
        peak = (k + 0.5 + random.uniform(-0.15, 0.15)) / TEETH
        points.append((2 * math.pi * valley, CUT_Z - TOOTH_HEIGHT * random.uniform(0.7, 1.3)))
        points.append((2 * math.pi * peak, CUT_Z + TOOTH_HEIGHT * random.uniform(0.7, 1.3)))
    return points


def disc(z_of, rings, angles, radii):
    """A fan of rings around the Z axis, facing up. z_of(x, y, s, angle) sets each vertex's height."""
    bm = bmesh.new()
    center = bm.verts.new((0, 0, z_of(0, 0, 0, None)))
    grid = []
    for s in rings:
        ring = []
        for t in angles:
            x, y = s * radii[0] * math.cos(t), s * radii[1] * math.sin(t)
            ring.append(bm.verts.new((x, y, z_of(x, y, s, t))))
        grid.append(ring)
    n = len(angles)
    for j in range(n):
        k = (j + 1) % n
        bm.faces.new((center, grid[0][j], grid[0][k]))
        for inner, outer in zip(grid, grid[1:]):
            bm.faces.new((inner[j], outer[j], outer[k], inner[k]))
    return bm


def cutter(mats):
    """A block whose underside is the zigzag crack; everything above it is the cap."""
    heights = dict(crack_profile())
    # Each spoke keeps its height out to the rim, so the crack zigzags across the husk.
    bm = disc(
        lambda x, y, s, angle: CUT_Z if angle is None else heights[angle],
        rings=(0.3, 0.6, 0.85, 1.1, 1.4),
        angles=list(heights),
        radii=COCONUT,
    )
    bottom = list(bm.faces)
    extruded = bmesh.ops.extrude_face_region(bm, geom=bottom, use_keep_orig=True)
    for vert in (g for g in extruded["geom"] if isinstance(g, bmesh.types.BMVert)):
        vert.co.z = CUT_Z + 3.0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link("Cutter", bm, [mats["Husk_Inner"]])


def liquid(mats):
    """The coconut water's vessel: the flesh's hollow, a hair inside it, up to the highest a slosh may reach.

    The live scene draws the water's surface inside it (lib/hero-liquid.ts). Its origin is the
    still surface's centre, and it carries the hollow's ellipsoid in three.js axes for that.
    """
    inset = tuple(r - 0.01 for r in FLESH_WALL)
    bm = ellipsoid(inset, segments=(64, 32))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, LIQUID_TOP), plane_no=(0, 0, 1), clear_outer=True)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, -LIQUID_Z))
    water = link("Liquid", bm, [mats["Liquid"]])
    water["center"] = [0, -LIQUID_Z, 0]
    water["radii"] = [inset[0], inset[2], inset[1]]
    water["top"] = LIQUID_TOP - LIQUID_Z
    return water


def boolean(base, steps):
    """The evaluated mesh of `base` after each (operation, operand) Boolean in turn."""
    for i, (operation, operand) in enumerate(steps):
        mod = base.modifiers.new(f"bool{i}", "BOOLEAN")
        mod.operation = operation
        mod.object = operand
        mod.solver = "EXACT"
        mod.material_mode = "TRANSFER"
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(base.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph)
    base.modifiers.clear()
    return mesh


def into(bm, mesh, mats, order, force=None):
    """Appends `mesh` to `bm`, remapping its materials onto the shared slot `order`."""
    index = {name: i for i, name in enumerate(order)}
    remap = [index[force or (m.name.split(".")[0] if m else order[0])] for m in mesh.materials]
    start = len(bm.faces)
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    for face in bm.faces[start:]:
        face.material_index = remap[face.material_index] if remap else 0


def halves(whole, mats):
    """Cap and body cut from the whole coconut, each lined with the brown shell and white flesh.

    The body carries the coconut water's vessel as a child, Liquid.
    """
    hollow, blade = cavity(mats), cutter(mats)
    shell = layer("NutShell", SHELL, MEAT, mats["Shell"])
    flesh = layer("FleshShell", MEAT, FLESH_WALL, mats["Flesh"])
    order = ["Husk", "Husk_Inner", "Shell", "Flesh"]
    # Both halves pivot on the crack line at the back, so the cap can hinge open or lift off.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    _, back, *_ = whole.ray_cast(Vector((0, 5, CUT_Z)), Vector((0, -1, 0)), depsgraph=depsgraph)
    pivot = Vector((0, back.y, CUT_Z))
    pieces = {}
    for name, op in [("Coconut_Top", "INTERSECT"), ("Coconut_Bottom", "DIFFERENCE")]:
        bm = bmesh.new()
        into(bm, boolean(whole, [("DIFFERENCE", hollow), (op, blade)]), mats, order)
        # Each layer's own cut face is that layer, not husk.
        into(bm, boolean(shell, [(op, blade)]), mats, order, force="Shell")
        into(bm, boolean(flesh, [(op, blade)]), mats, order, force="Flesh")
        bmesh.ops.translate(bm, verts=bm.verts, vec=-pivot)
        for face in bm.faces:
            face.smooth = face.material_index != 1
        mark_sharp(bm, 50)
        pieces[name] = link(name, bm, [mats[n] for n in order], location=pivot)
    water = liquid(mats)
    water.parent = pieces["Coconut_Bottom"]
    water.location = Vector((0, 0, LIQUID_Z)) - pivot
    pieces["Liquid"] = water
    for helper in (hollow, blade, shell, flesh):
        bpy.data.objects.remove(helper, do_unlink=True)
    return pieces


# --- Can ---------------------------------------------------------------------

# Lathe profile (radius, height), bottom dome to lid. The label strip is one segment, split into rows.
CAN_PROFILE = [
    (0.0, -1.12),
    (0.28, -1.14),
    (0.46, -1.20),
    (0.53, -1.22),
    (0.60, -1.19),
    (0.645, -1.10),
    (0.66, -1.02),
    (CAN_RADIUS, LABEL_BOTTOM),
    *[(CAN_RADIUS, LABEL_BOTTOM + (LABEL_TOP - LABEL_BOTTOM) * i / 6) for i in range(1, 6)],
    (CAN_RADIUS, LABEL_TOP),
    (0.66, 1.02),
    (0.62, 1.10),
    (0.56, 1.17),
    (0.545, 1.21),
    (0.55, 1.235),
    (0.535, 1.245),
    (0.52, 1.225),
    (0.51, 1.185),
    (0.40, 1.18),
    (0.38, 1.172),
    (0.36, 1.18),
    (0.0, 1.185),
]


def can(mats):
    """Lathed can. u = 0 on the can's left (-X), front at u = 0.25 (towards the camera), back at 0.75."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rings = []
    for r, z in CAN_PROFILE:
        if r == 0:
            rings.append([bm.verts.new((0, 0, z))])
            continue
        ring = []
        for j in range(CAN_SEGMENTS):
            a = math.pi + 2 * math.pi * j / CAN_SEGMENTS
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)

    label_rows = {i for i, (r, z) in enumerate(CAN_PROFILE) if r == CAN_RADIUS and LABEL_BOTTOM <= z < LABEL_TOP}

    def v_of(z):
        return (z - LABEL_BOTTOM) / (LABEL_TOP - LABEL_BOTTOM)

    for i in range(len(rings) - 1):
        lower, upper = rings[i], rings[i + 1]
        for j in range(CAN_SEGMENTS):
            k = (j + 1) % CAN_SEGMENTS
            if len(lower) == 1:
                verts = [lower[0], upper[k], upper[j]]
            elif len(upper) == 1:
                verts = [lower[j], lower[k], upper[0]]
            else:
                verts = [lower[j], lower[k], upper[k], upper[j]]
            # Counter-clockwise seen from outside, so normals face out.
            face = bm.faces.new(verts)
            face.smooth = True
            if i in label_rows:
                face.material_index = 0
                us = {lower[j]: j, upper[j]: j, lower[k]: j + 1, upper[k]: j + 1}
                for loop in face.loops:
                    loop[uv].uv = (us[loop.vert] / CAN_SEGMENTS, v_of(loop.vert.co.z))
            else:
                face.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mark_sharp(bm, 35)
    tri_count = sum(len(f.verts) - 2 for f in bm.faces)
    can_obj = link("Can", bm, [mats["Body_Label"], mats["Metal"]])

    # The tab: a rounded plate on the lid, with its rivet, pointing to the front.
    tab = bmesh.new()
    outline = []
    w, h, rad = 0.13, 0.075, 0.05
    for cx, cy, start in [(w, h, 0), (-w, h, 90), (-w, -h, 180), (w, -h, 270)]:
        for s in range(5):
            a = math.radians(start + s * 22.5)
            outline.append((cx * (1 - rad / w) + rad * math.cos(a), cy * (1 - rad / h) + rad * math.sin(a)))
    bottom = [tab.verts.new((x, y, 0)) for x, y in outline]
    face = tab.faces.new(bottom)
    ext = bmesh.ops.extrude_face_region(tab, geom=[face])
    for vert in (g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)):
        vert.co.z += 0.014
    bmesh.ops.recalc_face_normals(tab, faces=tab.faces)
    rivet = bmesh.ops.create_cone(tab, cap_ends=True, segments=12, radius1=0.035, radius2=0.03, depth=0.02)
    bmesh.ops.translate(tab, verts=rivet["verts"], vec=(0.07, 0, 0.004))
    tri_count += sum(len(f.verts) - 2 for f in tab.faces)
    bmesh.ops.rotate(tab, verts=tab.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Z"))
    for f in tab.faces:
        f.material_index = 0
    mark_sharp(tab, 35)
    tab_obj = link("Tab", tab, [mats["Metal"]], location=(0, 0.07, 1.188))
    tab_obj.parent = can_obj
    return can_obj, tri_count


# --- Export and poster ---------------------------------------------------------


def export(path, objects, images):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_image_format="AUTO" if images else "NONE",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        # Custom properties, such as the coconut water's ellipsoid, become node extras.
        export_extras=True,
    )


def stage_lighting():
    """The live scene's hemisphere and directional light, in Cycles terms.

    three.js lights a Lambert surface with albedo * I * cos / pi for a directional light of
    intensity I, which a Cycles sun of strength I matches. Its hemisphere light gives
    albedo * H / pi, which a world of radiance H / pi matches, blended sky to ground by height.
    """
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Stage")
    scene.world = world
    tree = node_tree(world)
    for n in list(tree.nodes):
        tree.nodes.remove(n)
    hemi = STAGE["hemisphere"]
    coords = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    blend = tree.nodes.new("ShaderNodeMapRange")
    blend.inputs["From Min"].default_value = -1
    mix = tree.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    socket = lambda sockets, identifier: next(s for s in sockets if s.identifier == identifier)
    socket(mix.inputs, "A_Color").default_value = (*srgb_to_linear(hemi["ground"]), 1)
    socket(mix.inputs, "B_Color").default_value = (*srgb_to_linear(hemi["sky"]), 1)
    background = tree.nodes.new("ShaderNodeBackground")
    background.inputs["Strength"].default_value = hemi["intensity"] / math.pi
    output = tree.nodes.new("ShaderNodeOutputWorld")
    tree.links.new(coords.outputs["Generated"], split.inputs["Vector"])
    tree.links.new(split.outputs["Z"], blend.inputs["Value"])
    tree.links.new(blend.outputs["Result"], socket(mix.inputs, "Factor_Float"))
    tree.links.new(socket(mix.outputs, "Result_Color"), background.inputs["Color"])
    tree.links.new(background.outputs["Background"], output.inputs["Surface"])

    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = STAGE["sun"]["intensity"]
    sun_data.angle = math.radians(0.5)
    sun = bpy.data.objects.new("Sun", sun_data)
    toward = -to_blender(STAGE["sun"]["position"]).normalized()
    sun.rotation_euler = toward.to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(sun)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens_unit = "FOV"
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle = math.radians(STAGE["camera"]["fov"])
    camera = bpy.data.objects.new("Camera", cam_data)
    camera.location = to_blender(STAGE["camera"]["position"])
    camera.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(camera)
    scene.camera = camera


def render_poster(coconut, hidden):
    scene = bpy.context.scene
    stage_lighting()
    pose = STAGE["coconut"]
    coconut.scale = (pose["scale"],) * 3
    coconut.rotation_euler = (0, 0, pose["rotY"])
    for obj in hidden:
        obj.hide_render = True
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = STAGE["posterSize"]
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(OUT / "poster.png")
    bpy.ops.render.render(write_still=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    reset_scene()
    label = bpy.data.images.load(str(LABEL_PNG))
    husk_color, husk_normal, grooves = husk_textures()
    mats = {
        "Husk": material("Husk", "#7A361B", 0.9, image=husk_color, normal=husk_normal),
        # The cut husk of a mature coconut: tan-brown fibre.
        "Husk_Inner": material("Husk_Inner", "#7A4A2A", 0.95),
        # The hard nut shell between the husk and the flesh.
        "Shell": material("Shell", "#3A2416", 0.6),
        "Flesh": material("Flesh", "#FAFAF5", 0.45),
        # Only names the coconut water's vessel: the live scene draws the water (lib/hero-liquid.ts).
        "Liquid": material("Liquid", "#E8ECE6", 0.05),
        # The label image is applied at runtime per Flavour (flipY = false, sRGB); the GLB carries none.
        "Body_Label": material("Body_Label", "#FFFFFF", 0.35, metallic=0.15, image=label),
        "Metal": material("Metal", "#C9CED2", 0.3, metallic=0.6),
    }

    whole = whole_coconut(mats, grooves)
    pieces = halves(whole, mats)
    export(OUT / "coconut.glb", [whole, *pieces.values()], images=True)

    can_obj, can_tris = can(mats)
    export(OUT / "can.glb", [can_obj, *can_obj.children], images=False)

    render_poster(whole, [*pieces.values(), can_obj, *can_obj.children])
    render_cards(can_obj, [whole, *pieces.values()], mats["Body_Label"])
    print(f"build_hero: can {can_tris} triangles; poster {STAGE['posterSize']}px")


def render_cards(can_obj, hidden, label_material):
    """The exact Hero can mesh and UVs; one fixed camera, pose and lighting for all labels."""
    scene = bpy.context.scene
    for obj in hidden:
        obj.hide_render = True
    can_obj.hide_render = False
    for obj in can_obj.children:
        obj.hide_render = False
    can_obj.rotation_euler = (math.radians(-7), math.radians(-8), math.radians(-6))
    camera = scene.camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 3.25
    camera.location = (0, -6, 1.8)
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.resolution_x = 360
    scene.render.resolution_y = 520
    scene.cycles.samples = 64
    texture = next(n for n in label_material.node_tree.nodes if n.type == "TEX_IMAGE")
    for slug in json.loads((OUT / "flavours.json").read_text()):
        texture.image = bpy.data.images.load(str(OUT / f"label-{slug}.png"), check_existing=True)
        scene.render.filepath = str(OUT / f"can-{slug}.png")
        bpy.ops.render.render(write_still=True)


main()
