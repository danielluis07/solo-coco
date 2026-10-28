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
HUSK_THICKNESS = 0.16
FLESH_THICKNESS = 0.07
# The crack that splits it, across the middle: a zigzag of uneven teeth.
CUT_Z = 0.1
TEETH = 16
TOOTH_HEIGHT = 0.11
# The coconut water stands just under the lowest point of the crack.
LIQUID_Z = CUT_Z - TOOTH_HEIGHT * 1.3 - 0.05

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
    """Pushes a unit-sphere direction, poles on X, out to the mature coconut's surface."""
    d = direction.normalized()
    # An egg on its side: fuller at the stem end (+X), a little narrower at the far end.
    girth = 1 + 0.04 * d.x - 0.03 * max(-d.x, 0) ** 2
    lumps = 1 + 0.035 * noise.noise(d * 1.7) + 0.01 * noise.noise(d * 4.3)
    # Bundles of fibre run end to end as ridges, so this noise is stretched along X.
    ridges = (
        1
        + 0.024 * noise.noise(Vector((d.x * 1.0, d.y * 4.5, d.z * 4.5)))
        + 0.007 * noise.noise(Vector((d.x * 1.5, d.y * 11.0, d.z * 11.0)))
    )
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
    return top * (1 - fv) + bottom * fv


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


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


def strands(shape, count, length, spread, wobble):
    """Rasterises `count` fibre strands into a (v, u) layer, mostly running along v.

    length is a (min, max) in pixels, spread the angle's standard deviation off the v axis
    in radians, and wobble how far a strand bows sideways, in pixels. Strands wrap around u.
    """
    height, width = shape
    steps = int(length[1])
    t = np.linspace(0, 1, steps)[None, :]
    lengths = RNG.uniform(*length, count)[:, None]
    angle = RNG.normal(0, spread, count)[:, None]
    bend = wobble * np.sin(np.pi * t * RNG.uniform(1, 3, (count, 1)) + RNG.uniform(0, 2 * np.pi, (count, 1)))
    along = t * lengths
    u = RNG.uniform(0, width, (count, 1)) + along * np.sin(angle) + bend * np.cos(angle)
    v = RNG.uniform(0, height, (count, 1)) + along * np.cos(angle)
    # About one sample per pixel whatever the length, thinning out at both tips.
    weight = np.sqrt(np.sin(np.pi * t)) * lengths / steps
    rows = np.clip(np.round(v).astype(int), 0, height - 1)
    cols = np.round(u).astype(int) % width
    layer = np.bincount((rows * width + cols).ravel(), np.broadcast_to(weight, rows.shape).ravel(), minlength=height * width)
    return layer.reshape(shape)


def widen(layer, passes):
    """Blurs a layer across u, so its strands are a few pixels wide."""
    for _ in range(passes):
        layer = 0.25 * np.roll(layer, 1, axis=1) + 0.5 * layer + 0.25 * np.roll(layer, -1, axis=1)
    return layer


def coverage(layer, density):
    return 1 - np.exp(-density * layer)


def husk_textures(width=2048, height=1024):
    """Colour and normal maps of the brown husk: coarse fibre along v, frizz across it, creases."""
    shape = (height, width)
    u = (np.arange(width) + 0.5) / width
    v = (np.arange(height) + 0.5) / height
    uu, vv = np.meshgrid(u, v)

    fibres = coverage(widen(strands(shape, 80_000, (8, 40), 0.18, 1.0), 1), 0.9)
    cords = coverage(widen(strands(shape, 6_000, (40, 140), 0.1, 3.0), 2), 0.9)
    frizz = coverage(widen(strands(shape, 7_000, (6, 28), 0.7, 1.0), 1), 0.8)
    creases = coverage(widen(strands(shape, 1_200, (150, 600), 0.04, 6.0), 4), 2.5)
    # Wide bundles of fibre that catch the light, with darker, sparser husk between them.
    wander = 0.01 * (value_noise(uu, vv, 6, 4) - 0.5)
    bundles = smoothstep(0.4, 0.75, value_noise(uu + wander, vv, 130, 28))
    # Matted, mottled husk, broken up at every scale.
    mottle = 0.6 * value_noise(uu, vv, 220, 110) + 0.4 * value_noise(uu, vv, 70, 35)
    patches = value_noise(uu, vv, 10, 6)
    worn = smoothstep(0.7, 0.9, value_noise(uu, vv, 40, 5))
    # The strands converge at the two ends, so soften them there rather than pinch.
    ends = smoothstep(0.0, 0.12, vv) * smoothstep(1.0, 0.88, vv)

    def mix(a, b, t):
        return a + (b - a) * t[..., None]

    def rgb(hex_color):
        return np.array(srgb_to_linear(hex_color))

    # Red-brown husk, dark where the fibres part, tan where they lie on top.
    color = mix(rgb("#3F1A0B"), rgb("#7A361B"), patches)
    color = mix(color, rgb("#1F0B04"), 0.85 * (1 - fibres) * (1 - cords) * (1 - 0.5 * bundles) * ends)
    color = mix(color, mix(rgb("#8A4322"), rgb("#CB8650"), bundles), 0.85 * fibres * ends)
    color = mix(color, rgb("#8A4524"), 0.6 * cords)
    color = mix(color, rgb("#C88A58"), 0.45 * frizz * ends)
    color = mix(color, rgb("#1C0B05"), 0.85 * creases)
    color = color * (0.7 + 0.6 * mottle[..., None])
    # Rubbed patches, where the fibre is worn pale and flat.
    color = mix(color, rgb("#8C6450"), 0.3 * worn * (1 - creases))

    relief = (0.3 * fibres + 0.3 * cords + 0.15 * frizz + 0.4 * bundles + 0.3 * mottle - 0.9 * creases) * (0.3 + 0.7 * ends) * (1 - 0.5 * worn)

    # Tangent-space normals from the relief: x along u, y along v, as glTF and Blender both read them.
    # At half the colour's size: normal maps ship as UASTC, the heavier KTX2 format.
    relief = relief.reshape(height // 2, 2, width // 2, 2).mean(axis=(1, 3))
    du = (np.roll(relief, -1, axis=1) - np.roll(relief, 1, axis=1)) / 2
    dv = np.gradient(relief, axis=0)
    strength = 2.5
    normal = np.stack([-strength * du, -strength * dv, np.ones_like(relief)], axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    return save_image("Husk", color, srgb=True), save_image("Husk_Normal", normal * 0.5 + 0.5, srgb=False)


def uv_sphere(u_segments, v_segments):
    bm = bmesh.new()
    # calc_uvs writes into an existing layer only.
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=u_segments, v_segments=v_segments, radius=1, calc_uvs=True)
    return bm


def whole_coconut(mats):
    bm = uv_sphere(112, 60)
    # Poles on X, so the fibres in the texture run along the coconut's length.
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"))
    for vert in bm.verts:
        vert.co = coconut_point(vert.co)
    for face in bm.faces:
        face.smooth = True
        face.material_index = 0
    return link("Coconut", bm, [mats["Husk"], mats["Husk_Inner"], mats["Flesh"]])


def ellipsoid(radii, inside_out=False, segments=(40, 20)):
    bm = uv_sphere(*segments)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * radii[0], vert.co.y * radii[1], vert.co.z * radii[2]))
    if inside_out:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    for face in bm.faces:
        face.smooth = True
    return bm


# The cavity inside the husk, and the inner wall of the white flesh lining it.
CAVITY = tuple(r - HUSK_THICKNESS for r in COCONUT)
FLESH_WALL = tuple(r - FLESH_THICKNESS for r in CAVITY)


def cavity(mats):
    return link("Cavity", ellipsoid(CAVITY), [mats["Flesh"]])


def flesh_shell(mats):
    """The white flesh lining the cavity: a closed shell, its inner wall facing inwards."""
    bm = ellipsoid(CAVITY)
    shell = ellipsoid(FLESH_WALL, inside_out=True)
    mesh = bpy.data.meshes.new("tmp")
    shell.to_mesh(mesh)
    shell.free()
    bm.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    return link("FleshShell", bm, [mats["Flesh"]])


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
    """The coconut water in the bottom half: a slow swell, its rim tucked into the flesh."""
    across = math.sqrt(1 - (LIQUID_Z / FLESH_WALL[2]) ** 2)
    radii = (FLESH_WALL[0] * across + 0.02, FLESH_WALL[1] * across + 0.02)
    bm = disc(
        lambda x, y, s, angle: LIQUID_Z + 0.025 * noise.noise(Vector((x * 1.6, y * 1.6, 0.5))) * (1 - s**4),
        # Rings bunched towards the centre, so the fan there doesn't pinch the reflections.
        rings=[(i / 14) ** 1.3 for i in range(1, 15)],
        angles=[2 * math.pi * j / 72 for j in range(72)],
        radii=radii,
    )
    for face in bm.faces:
        face.smooth = True
    return link("Liquid", bm, [mats["Liquid"]])


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
    """Cap and body cut from the whole coconut, lined with white flesh; the body holds the coconut water."""
    hollow, shell, blade, water = cavity(mats), flesh_shell(mats), cutter(mats), liquid(mats)
    order = ["Husk", "Husk_Inner", "Flesh", "Liquid"]
    # Both halves pivot on the crack line at the back, so the cap can hinge open or lift off.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    _, back, *_ = whole.ray_cast(Vector((0, 5, CUT_Z)), Vector((0, -1, 0)), depsgraph=depsgraph)
    pivot = Vector((0, back.y, CUT_Z))
    pieces = {}
    for name, op in [("Coconut_Top", "INTERSECT"), ("Coconut_Bottom", "DIFFERENCE")]:
        bm = bmesh.new()
        into(bm, boolean(whole, [("DIFFERENCE", hollow), (op, blade)]), mats, order)
        # The flesh's own cut face is flesh too, not husk.
        into(bm, boolean(shell, [(op, blade)]), mats, order, force="Flesh")
        if name == "Coconut_Bottom":
            into(bm, water.data, mats, order)
        bmesh.ops.translate(bm, verts=bm.verts, vec=-pivot)
        for face in bm.faces:
            face.smooth = face.material_index != 1
        mark_sharp(bm, 50)
        pieces[name] = link(name, bm, [mats[n] for n in order], location=pivot)
    for helper in (hollow, shell, blade, water):
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
    husk_color, husk_normal = husk_textures()
    mats = {
        "Husk": material("Husk", "#7A361B", 0.85, image=husk_color, normal=husk_normal),
        # Cut husk and shell of a mature coconut: tan-brown fibre.
        "Husk_Inner": material("Husk_Inner", "#6B3E24", 0.95),
        "Flesh": material("Flesh", "#FAFAF5", 0.45),
        # Milky and glossy. Its reflections, added in the live scene (lib/hero-assets.ts), bring it up to white.
        "Liquid": material("Liquid", "#9E9A93", 0.08),
        # The label image is applied at runtime per Flavour (flipY = false, sRGB); the GLB carries none.
        "Body_Label": material("Body_Label", "#FFFFFF", 0.35, metallic=0.15, image=label),
        "Metal": material("Metal", "#C9CED2", 0.3, metallic=0.6),
    }

    whole = whole_coconut(mats)
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
