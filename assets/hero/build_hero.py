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

# Coconut: 2.2 tall, 0.95 round, spanning z -1.1..1.1 like the reference rig.
HALF_HEIGHT = 1.1
RADIUS = 0.95
# The machete cut across the top, on the coconut's local height axis.
CUT_Z = 0.5
CUT_JITTER = 0.035

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


def material(name, color, roughness, metallic=0.0, image=None):
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
    """Pushes a unit-sphere direction out to the young green coconut's surface."""
    d = direction.normalized()
    z = d.z
    ring = math.sqrt(max(0.0, 1 - z * z))
    phi = math.atan2(d.y, d.x)
    # Broad, slightly flattened at the stem end; the far end narrows to a point.
    taper = 1 - 0.06 * max(z, 0) ** 2 - 0.32 * max(-z, 0) ** 1.5
    # Three ridges give the triangular section of a coco verde, strongest towards the point.
    ridges = 1 + (0.03 + 0.04 * max(-z, 0)) * math.cos(3 * phi + 0.4) * ring
    bumps = 1 + 0.012 * noise.noise(d * 3.1) + 0.004 * noise.noise(d * 11.0)
    r = RADIUS * taper * ridges * bumps
    height = HALF_HEIGHT * (0.9 if z > 0 else 1 + 0.08 * max(-z, 0) ** 8)
    return Vector((d.x * r, d.y * r, z * height * (1 + 0.004 * noise.noise(d * 5.0))))


def coconut_radius_at(z, phi):
    """Distance from the axis to the surface at height z, by bisection."""
    lo, hi = -math.pi / 2, math.pi / 2
    for _ in range(40):
        mid = (lo + hi) / 2
        d = Vector((math.cos(mid) * math.cos(phi), math.cos(mid) * math.sin(phi), math.sin(mid)))
        if coconut_point(d).z < z:
            lo = mid
        else:
            hi = mid
    p = coconut_point(Vector((math.cos(lo) * math.cos(phi), math.cos(lo) * math.sin(phi), math.sin(lo))))
    return Vector((p.x, p.y)).length


def husk_texture(size=1024):
    """Equirectangular husk colour: Casca greens, fine fibres, the calyx crown and the tip."""
    u = (np.arange(size) + 0.5) / size
    v = (np.arange(size) + 0.5) / size
    uu, vv = np.meshgrid(u, v)
    tau = 2 * np.pi
    # Every term has a whole number of periods around u, so the texture meets at its seam.
    low = np.zeros_like(uu)
    for k, fv, amp in [(2, 1.3, 0.5), (3, 2.1, 0.35), (5, 3.7, 0.25), (9, 6.3, 0.15)]:
        low += amp * np.sin(tau * k * uu + fv * tau * vv + random.uniform(0, tau))
    fibres = np.sin(tau * 140 * uu + 3 * np.sin(tau * 4 * vv + tau * 3 * uu)) * 0.5 + 0.5
    base = np.array(srgb_to_linear("#73A03A"))
    light = np.array(srgb_to_linear("#9DBF55"))
    deep = np.array(srgb_to_linear("#557F28"))
    t = np.clip(0.5 + 0.35 * low, 0, 1)[..., None]
    color = base * (1 - t) + light * t
    color = color * (1 - 0.18 * fibres[..., None] ** 6) + deep * 0.18 * fibres[..., None] ** 6
    # Yellowing towards the stem end, where the coconut hung in the sun.
    top = np.clip((vv - 0.7) / 0.25, 0, 1)[..., None]
    color = color * (1 - 0.35 * top) + np.array(srgb_to_linear("#B8BD58")) * 0.35 * top
    # Calyx: a three-pointed beige-brown crown at the stem.
    crown = 0.935 - 0.03 * np.cos(3 * tau * uu + 0.4)
    calyx = np.clip((vv - crown) / 0.012, 0, 1)[..., None]
    color = color * (1 - calyx) + np.array(srgb_to_linear("#8E7448")) * calyx
    stem = np.clip((vv - 0.985) / 0.01, 0, 1)[..., None]
    color = color * (1 - stem) + np.array(srgb_to_linear("#5C4428")) * stem
    # The dry tip at the far end.
    tip = np.clip((0.025 - vv) / 0.015, 0, 1)[..., None]
    color = color * (1 - tip) + np.array(srgb_to_linear("#6B5634")) * tip

    srgb = np.where(color <= 0.0031308, color * 12.92, 1.055 * np.power(color, 1 / 2.4) - 0.055)
    rgba = np.concatenate([np.clip(srgb, 0, 1), np.ones((size, size, 1))], axis=2)
    image = bpy.data.images.new("Husk", size, size, alpha=False)
    image.pixels.foreach_set(rgba.astype(np.float32).ravel())
    image.filepath_raw = str(OUT / "husk.png")
    image.file_format = "PNG"
    image.save()
    return image


def uv_sphere(u_segments, v_segments):
    bm = bmesh.new()
    # calc_uvs writes into an existing layer only.
    bm.loops.layers.uv.new("UVMap")
    bmesh.ops.create_uvsphere(bm, u_segments=u_segments, v_segments=v_segments, radius=1, calc_uvs=True)
    return bm


def whole_coconut(mats):
    bm = uv_sphere(96, 56)
    for vert in bm.verts:
        vert.co = coconut_point(vert.co)
    for face in bm.faces:
        face.smooth = True
        face.material_index = 0
    return link("Coconut", bm, [mats["Husk"], mats["Husk_Inner"], mats["Flesh"]])


def ellipsoid(name, radii, center, inside_out=False, segments=(40, 20)):
    bm = uv_sphere(*segments)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * radii[0], vert.co.y * radii[1], vert.co.z * radii[2])) + Vector(center)
    if inside_out:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    for face in bm.faces:
        face.smooth = True
    return bm


CAVITY = {"radii": (0.58, 0.58, 0.68), "center": (0, 0, 0.12)}
FLESH_THICKNESS = 0.06


def cavity(mats):
    bm = ellipsoid("Cavity", CAVITY["radii"], CAVITY["center"])
    return link("Cavity", bm, [mats["Flesh"]])


def flesh_shell(mats):
    """The white flesh lining the cavity: a closed shell, its inner wall facing inwards."""
    outer = CAVITY["radii"]
    inner = tuple(r - FLESH_THICKNESS for r in outer)
    bm = ellipsoid("Flesh", outer, CAVITY["center"])
    shell = ellipsoid("FleshInner", inner, CAVITY["center"], inside_out=True)
    mesh = bpy.data.meshes.new("tmp")
    shell.to_mesh(mesh)
    shell.free()
    bm.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    return link("FleshShell", bm, [mats["Flesh"]])


def cutter(mats):
    """A block whose underside is the jagged machete cut; everything above it is the cap."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=28, y_segments=28, size=1)
    extent = max(abs(v.co.x) for v in bm.verts)
    for vert in bm.verts:
        vert.co.x *= 1.4 / extent
        vert.co.y *= 1.4 / extent
    for vert in bm.verts:
        edge = abs(vert.co.x) > 1.39 or abs(vert.co.y) > 1.39
        # Short chops along one stroke direction, like a facão taken at a slight angle.
        chop = 0.5 * math.sin(vert.co.x * 9 + vert.co.y * 2)
        vert.co.z = CUT_Z + (0 if edge else CUT_JITTER * (chop + random.uniform(-0.5, 0.5)))
    bottom = list(bm.faces)
    extruded = bmesh.ops.extrude_face_region(bm, geom=bottom, use_keep_orig=True)
    top_verts = [g for g in extruded["geom"] if isinstance(g, bmesh.types.BMVert)]
    for vert in top_verts:
        vert.co.z = CUT_Z + 2.0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link("Cutter", bm, [mats["Husk_Inner"]])


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
    """Cap and body cut from the whole coconut, hollowed and lined with white flesh."""
    hollow, shell, blade = cavity(mats), flesh_shell(mats), cutter(mats)
    order = ["Husk", "Husk_Inner", "Flesh"]
    # Both halves pivot on the crack line at the back, so the cap can hinge open or lift off.
    pivot = Vector((0, coconut_radius_at(CUT_Z, math.pi / 2), CUT_Z))
    pieces = {}
    for name, op in [("Coconut_Top", "INTERSECT"), ("Coconut_Bottom", "DIFFERENCE")]:
        bm = bmesh.new()
        into(bm, boolean(whole, [("DIFFERENCE", hollow), (op, blade)]), mats, order)
        # The flesh's own cut face is flesh too, not husk.
        into(bm, boolean(shell, [(op, blade)]), mats, order, force="Flesh")
        bmesh.ops.translate(bm, verts=bm.verts, vec=-pivot)
        for face in bm.faces:
            face.smooth = face.material_index != 1
        mark_sharp(bm, 50)
        pieces[name] = link(name, bm, [mats[n] for n in order], location=pivot)
    for helper in (hollow, shell, blade):
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
    mats = {
        "Husk": material("Husk", "#73A03A", 0.6, image=husk_texture()),
        # Cut husk of a young coconut: cream fibre.
        "Husk_Inner": material("Husk_Inner", "#ECE4C8", 0.85),
        "Flesh": material("Flesh", "#FAFAF5", 0.45),
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
    print(f"build_hero: can {can_tris} triangles; poster {STAGE['posterSize']}px")


main()
