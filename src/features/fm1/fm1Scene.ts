// Thin three.js wrapper for the FM1_Kz proxy GLB. No React in here.
// Parts are shown/hidden and tinted by name (see PART_NAMING_v0.4.md).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { bezelId, NO_BEZEL, SLOTS, type Fm1Build, type Slot } from "./fm1Code.ts";
import { logoColor } from "./fm1Color.ts";
import { loadLogo, logoCanvas } from "./fm1Logo.ts";
import { firmwareById } from "../../data/firmwares.ts";

export type FocusTarget = Slot | "faceplate" | null;
/** What a 3D click or hover resolves to: one editable part. */
export type Pick =
  | { k: "knob"; slot: Slot; part: "body" | "cap" }
  | { k: "fp"; part: "body" | "accent" | "side" | "bezel" | "logo" };
export interface SceneLayout {
  /** faceplate bounds on the XZ plane, meters */
  plate: { minX: number; maxX: number; minZ: number; maxZ: number };
  knobs: Record<Slot, { x: number; z: number }>;
}
export interface Factory { body: string; keys: string }

const KNOB_RE = /^knob_(\w+?)_(classic|groove)_(short|long)_(body|cap|inner)(?:_(slot|pointer|drop))?$/;   // inner = the black core seen through translucent knobs
const HOME = { pos: new THREE.Vector3(0, 0.15, 0.19), target: new THREE.Vector3(0, 0, 0) };

export class Fm1Scene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.01, 5);
  private controls: OrbitControls;
  private meshes: THREE.Mesh[] = [];
  private mats: Record<string, THREE.MeshStandardMaterial> = {};
  private layout!: SceneLayout;
  private raf = 0;
  private resizeObs: ResizeObserver;
  private resumeTimer = 0;
  private tween: { t: number; fromP: THREE.Vector3; fromT: THREE.Vector3; toP: THREE.Vector3; toT: THREE.Vector3 } | null = null;
  private last = performance.now();
  private base: Record<string, THREE.Color> = {};
  // Selection hint: four corner brackets on the screen-space bounding box of the part being edited
  private hl: string[] = [];
  private applied: { b: Fm1Build; f: Factory } | null = null;   // to redraw when a logo finishes loading
  private logoTex = new Map<string, THREE.CanvasTexture>();
  private logoQuad: THREE.Mesh | null = null;
  private deviceShadow: THREE.Mesh | null = null;   // soft fake shadow under the device
  private contactShadows: THREE.Mesh[] = [];          // a soft dark spot on the plate under each knob
  private overlay!: SVGSVGElement;
  private brSel!: { halo: SVGPathElement; light: SVGPathElement };     // the part being edited
  private brHover!: { halo: SVGPathElement; light: SVGPathElement };   // the part under the mouse (2D or 3D)
  onPick: (p: Pick | null) => void = () => {};
  onHover: (p: Pick | null) => void = () => {};
  private hoverNames = new Set<string>();
  private ghostEdges: THREE.LineSegments[] = [];   // outline of the device, shown in the knobs-only x-ray look

  private el: HTMLElement;
  constructor(el: HTMLElement) {
    this.el = el;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    el.appendChild(this.renderer.domElement);
    // overlay for the selection brackets (follows the part every frame, never takes the mouse)
    el.style.position = "relative";
    const ns = "http://www.w3.org/2000/svg";
    this.overlay = document.createElementNS(ns, "svg");
    this.overlay.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none");
    const mk = (haloW: string, lightW: string, opacity: string) => {
      const halo = document.createElementNS(ns, "path");
      const light = document.createElementNS(ns, "path");
      for (const [p, stroke, w, op] of [[halo, "#0D0D0C", haloW, ".7"], [light, "#F8F6F0", lightW, opacity]] as const) {
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", stroke);
        p.setAttribute("stroke-width", w);
        p.setAttribute("stroke-opacity", op);
        p.setAttribute("stroke-linecap", "square");
        this.overlay.appendChild(p);
      }
      return { halo, light };
    };
    this.brHover = mk("4", "2", ".75");   // drawn first, thinner and softer
    this.brSel = mk("5", "2.5", "1");
    el.appendChild(this.overlay);
    this.renderer.domElement.style.touchAction = "none";
    this.scene.background = new THREE.Color("#1f2125");
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    // soft environment for fill, one strong key light from above-left so top faces are clearly brighter than the
    // front ones (the case had almost no volume when the environment did all the lighting), a weak rim from the right
    this.scene.environmentIntensity = 0.5;
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-0.12, 0.5, 0.1);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 0.5);
    rim.position.set(0.3, 0.15, 0.25);
    this.scene.add(rim);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.06;
    this.controls.maxDistance = 0.6;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    // idle turntable pauses on touch, resumes after a few quiet seconds
    this.controls.addEventListener("start", () => {
      this.controls.autoRotate = false;
      this.tween = null;
      window.clearTimeout(this.resumeTimer);
    });
    this.controls.addEventListener("end", () => {
      this.resumeTimer = window.setTimeout(() => (this.controls.autoRotate = true), 4000);
    });

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(el);
    this.bindPick();
    this.resize();
    this.camera.position.copy(HOME.pos);
    this.controls.target.copy(HOME.target);
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.step();
    };
    loop();
  }

  async load(url: string, overrideUrl?: string): Promise<SceneLayout> {
    const gltf = await new GLTFLoader().loadAsync(url);
    gltf.scene.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const m = o as THREE.Mesh;
      this.meshes.push(m);
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.roughness = 0.5;
      // the factory body and the case sides share the bottom plane (y = -19.5 mm): push the body back so the case wins and the two stop z-fighting
      if (mat.name === "mat_fm1_device_body") { mat.polygonOffset = true; mat.polygonOffsetFactor = 2; mat.polygonOffsetUnits = 2; }
      this.mats[mat.name] = mat;
    });
    this.scene.add(gltf.scene);
    if (overrideUrl) await this.mergeOverrides(overrideUrl, gltf.scene);
    // thin outlines for the parts that turn into a ghost in knobs-only mode
    for (const m of this.meshes) {
      if (!["fm1_device_body", "fm1_keys", "fm1_screen"].includes(m.name)) continue;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry, 25),
        new THREE.LineBasicMaterial({ color: 0xb8bcc4, transparent: true, opacity: 0.6 }),
      );
      edges.visible = false;
      edges.userData.owner = m;
      m.add(edges);
      this.ghostEdges.push(edges);
    }
    const box = (name: string) =>
      new THREE.Box3().setFromObject(this.meshes.find((m) => m.name === name)!);
    this.addDeviceShadow();
    const fp = box("faceplate_body");
    const knobs = {} as SceneLayout["knobs"];
    for (const s of SLOTS) {
      const b = new THREE.Box3();
      this.meshes.filter((m) => m.name.startsWith(`knob_${s}_`)).forEach((m) => b.expandByObject(m));
      const c = b.getCenter(new THREE.Vector3());
      knobs[s] = { x: c.x, z: c.z };
    }
    this.addContactShadows(knobs);
    this.layout = {
      plate: { minX: fp.min.x, maxX: fp.max.x, minZ: fp.min.z, maxZ: fp.max.z },
      knobs,
    };
    return this.layout;
  }

  /** A soft dark spot on the plate around the base of every knob (a fake contact shadow: one textured plane per knob,
   *  nearly free, on for every device). It sits on the plate, under the knob, and is never picked. */
  private addContactShadows(knobs: SceneLayout["knobs"]) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,0.85)");
    g.addColorStop(0.45, "rgba(0,0,0,0.45)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(1, 1);
    for (const s of SLOTS) {
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.scale.set(0.02, 0.02, 1);                    // about 2 cm: a little wider than the biggest knob
      m.position.set(knobs[s].x, 0.0006, knobs[s].z);
      m.renderOrder = 1;
      this.scene.add(m);
      this.contactShadows.push(m);
    }
  }

  /** A soft blurred dark square under the device (a fake shadow, one textured plane): it lifts the device, and the color of
   *  its sides, off the dark background. Costs nothing, so it is on for every device. */
  private addDeviceShadow() {
    const body = this.meshes.find((m) => m.name === "faceplate_side") ?? this.meshes.find((m) => m.name === "faceplate_body");
    if (!body) return;
    const box = new THREE.Box3().setFromObject(body);
    const size = box.getSize(new THREE.Vector3());
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    // the blur comes from shadowBlur (works in every browser, unlike ctx.filter); the rectangle is drawn off screen
    x.shadowColor = "rgba(0,0,0,1)";
    x.shadowBlur = 34;
    x.shadowOffsetX = 1000;
    x.fillStyle = "#000";
    const inner = 256 * 0.56;                       // the plate itself takes 56% of the texture, the rest is the soft edge
    x.fillRect((256 - inner) / 2 - 1000, (256 - inner) / 2, inner, inner);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.rotation.x = -Math.PI / 2;
    const k = 1 / 0.56;                              // so the plate's footprint lands on the 56% core
    m.scale.set(size.x * k * 1.04, size.z * k * 1.04, 1);
    m.position.set((box.min.x + box.max.x) / 2, box.min.y - 0.0012, (box.min.z + box.max.z) / 2 + size.z * 0.015);
    m.renderOrder = -1;
    this.scene.add(m);
    this.deviceShadow = m;
  }

  /** Optional test file: parts with the name of a base part replace it (the base material stays, so color still works),
   *  parts with a new name are added as they are. Lets one try a few new parts without exporting the whole device.
   *  A missing or broken file is ignored. */
  private async mergeOverrides(url: string, root: THREE.Object3D) {
    let ov;
    try { ov = await new GLTFLoader().loadAsync(url); } catch { return; }
    ov.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(ov.scene);
    const unit = box.getSize(new THREE.Vector3()).length() > 1 ? 0.01 : 1;   // exported in cm instead of meters
    const incoming: THREE.Mesh[] = [];
    ov.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) incoming.push(o as THREE.Mesh); });
    for (const m of incoming) {
      const geo = m.geometry.clone();
      geo.applyMatrix4(m.matrixWorld);                 // bake the node transform: the part keeps its place
      if (unit !== 1) geo.scale(unit, unit, unit);
      geo.computeBoundingBox();
      const base = this.meshes.find((x) => x.name === m.name);
      if (base) {
        base.geometry.dispose();
        base.geometry = geo;
        base.position.set(0, 0, 0); base.rotation.set(0, 0, 0); base.scale.set(1, 1, 1);
      } else {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.roughness = 0.5;
        const nm = new THREE.Mesh(geo, mat);
        nm.name = m.name;
        root.add(nm);
        this.meshes.push(nm);
        this.mats[mat.name || `mat_${m.name}`] = mat;
      }
    }
  }

  apply(b: Fm1Build, f: Factory) {
    this.applied = { b, f };
    const set = (n: string, hex: string) => {
      if (!this.mats[n]) return;
      // a pure white base color blows out under the key light and the part loses all its volume: very bright colors are
      // scaled down to a soft white (hue kept), so the shading still shows
      const c = new THREE.Color(hex);
      const peak = Math.max(c.r, c.g, c.b);
      if (peak > 0.68) c.multiplyScalar(0.68 / peak);
      this.base[n] = c;
      this.mats[n].color.copy(this.base[n]);
    };
    const { hex } = this.colorOf;
    const seeThrough = (n: string, id: string) => {            // translucent filament: the material lets light and what is behind through
      const m = this.mats[n]; if (!m) return;
      const t = this.colorOf.translucent(id);
      if (t && !m.userData.falloff) {
        // a little falloff, like real translucent plastic: clearer where you look straight through it, denser at the edges
        m.userData.falloff = true;
        m.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <normal_fragment_maps>",
            "#include <normal_fragment_maps>\n  float fres = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n  diffuseColor.a *= mix(0.45, 1.6, pow(fres, 1.4));",
          );
        };
        m.customProgramCacheKey = () => "fm1-falloff";
        m.needsUpdate = true;
      }
      if (m.transparent !== t) m.needsUpdate = true;
      m.transparent = t; m.opacity = t ? 0.69 : 1; m.depthWrite = !t;   // 15% more opaque than before (0.6)
    };
    // v0.5 GLB: faceplate_side wraps the sides, so the factory body color only shows through the holes.
    set("mat_fm1_device_body", f.body);
    set("mat_fm1_keys", f.keys);
    set("mat_faceplate_body", hex(b.body));
    set("mat_faceplate_side", hex(b.side ?? b.body));
    set("mat_faceplate_accent", hex(b.accent));
    set("mat_faceplate_accent_labels", hex(b.accent));   // the label shapes of the studio model follow the accent too
    set("mat_bezel_simple", hex(bezelId(b)));
    set("mat_bezel_ext", hex(bezelId(b)));
    set("mat_bezel_jiant", hex(bezelId(b)));
    set("mat_bezel_logo", b.logo ? hex(b.logo) : logoColor(hex(b.accent), hex(bezelId(b))));   // chosen, else auto
    for (const s of SLOTS) {
      set(`mat_knob_${s}_body`, hex(b.knobs[s].body));
      set(`mat_knob_${s}_cap`, hex(b.knobs[s].cap));
      seeThrough(`mat_knob_${s}_body`, b.knobs[s].body);
      seeThrough(`mat_knob_${s}_cap`, b.knobs[s].cap);
    }
    const caseMode = b.mode === "case";
    if (this.deviceShadow) this.deviceShadow.visible = caseMode;
    for (const cs of this.contactShadows) cs.visible = caseMode;   // knobs-only: the device is a see-through shell, no shadow
    // Knobs-only: the device turns into a translucent x-ray ghost, only the knobs stay opaque
    for (const n of ["mat_fm1_device_body", "mat_fm1_keys", "mat_fm1_screen"]) {
      const m = this.mats[n];
      if (!m) continue;
      m.transparent = !caseMode;
      m.opacity = caseMode ? 1 : 0.32;   // knobs-only: the device is a translucent shell in the customer's device color
      m.depthWrite = caseMode;
      m.needsUpdate = true;
    }
    const ghostTint = new THREE.Color(f.body).lerp(new THREE.Color("#ffffff"), 0.45);   // lighter than the device color so it reads on dark
    for (const e of this.ghostEdges) {
      (e.material as THREE.LineBasicMaterial).color.copy(ghostTint);
      e.visible = !caseMode;
    }
    // each firmware needs one bezel; JIANT's own bezel is used when the model has it, else the extended one
    const fw = b.badge ? firmwareById(b.badge) : undefined;
    const has = (n: string) => this.meshes.some((m) => m.name === n);
    const bezelType = fw?.bezel === "jiant" && has("bezel_jiant") ? "jiant" : "ext";
    const noBezel = b.bezel === NO_BEZEL;     // the buyer deleted the bezel
    const plateName = b.badge === null || !fw?.logo || noBezel ? null   // BLANK: no plate at all
      : [`bezel_logo_${b.badge}`, `bezel_logo_${bezelType}`, "bezel_logo_blank", "bezel_logo_ext"].find(has) ?? null;
    for (const m of this.meshes) {
      const n = m.name;
      let vis = true;
      // basic bezel = the plain ring; badge bezel = ring + strip for the firmware name + its logo plate
      if (n === "bezel_simple") vis = b.badge === null;
      else if (n === "bezel_ext") vis = b.badge !== null && bezelType !== "jiant";
      else if (n === "bezel_jiant") vis = b.badge !== null && bezelType === "jiant";
      else if (n.startsWith("bezel_logo_")) vis = n === plateName;
      if (noBezel && n.startsWith("bezel_")) vis = false;
      if (!caseMode && !n.startsWith("knob_") && !["fm1_device_body", "fm1_keys", "fm1_screen"].includes(n)) vis = false;
      const k = KNOB_RE.exec(n);
      if (k) {
        const kn = b.knobs[k[1] as Slot];
        // a variant the proxy model does not have yet (classic long before v0.7) shows its short sibling instead
        const has3d = !!kn && has(`knob_${k[1]}_${kn.style}_${kn.height}_body`);
        vis = !!kn && kn.style === k[2] && (has3d ? kn.height : "short") === k[3] && !k[5];
      }
      m.visible = vis;
    }
    this.applyLogo(b, plateName, fw?.logo ?? null);
  }

  /** The firmware logo: its SVG painted in the logo color on a thin quad lying on the logo plate. */
  private applyLogo(b: Fm1Build, plateName: string | null, file: string | null) {
    const plate = plateName ? this.meshes.find((m) => m.name === plateName) : undefined;
    const mat = plate?.material as THREE.MeshStandardMaterial | undefined;
    // a logo that is real geometry in the model (JIANT) is shown as it is; the SVG overlay is for the flat placeholder plates
    const realGeometry = !!plate && (plate.geometry.index?.count ?? plate.geometry.attributes.position.count) / 3 > 40;
    if (realGeometry && this.logoQuad) this.logoQuad.visible = false;
    if (realGeometry && mat) { mat.visible = true; return; }
    if (!plate || !file || !this.applied) {
      if (this.logoQuad) this.logoQuad.visible = false;
      if (mat) mat.visible = true;   // BLANK or no logo yet: the plain colored plate
      return;
    }
    loadLogo(file).then((l) => {
      if (!l || !this.applied || this.applied.b.badge !== b.badge) return;
      const geo = plate.geometry;
      geo.computeBoundingBox();
      const bb = geo.boundingBox!, size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
      if (!this.logoQuad) {
        this.logoQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
        this.logoQuad.rotation.x = -Math.PI / 2;   // lies flat, the top of the picture points to the back of the device
        this.logoQuad.raycast = () => {};            // clicks go to the plate
      }
      const q = this.logoQuad;
      if (q.parent !== plate) plate.add(q);
      const sc = firmwareById(b.badge ?? "")?.scale ?? 1;
      q.scale.set(size.x * sc, size.z * sc, 1);
      q.position.set(c.x, bb.max.y + 0.00006, c.z);
      const color = b.logo ? this.colorOf.hex(b.logo) : logoColor(this.colorOf.hex(b.accent), this.colorOf.hex(bezelId(b)));
      const key = `${file}|${color}`;
      let tex = this.logoTex.get(key);
      if (!tex) {
        tex = new THREE.CanvasTexture(logoCanvas(l, 1024, Math.max(64, Math.round(1024 * size.z / size.x)), color));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        this.logoTex.set(key, tex);
      }
      const qm = q.material as THREE.MeshStandardMaterial;
      qm.map = tex;
      qm.needsUpdate = true;
      q.visible = true;
      (plate.material as THREE.MeshStandardMaterial).visible = false;   // the picture replaces the plain plate (still clickable)
    });
  }
  /** set by the React side: filament id -> hex */
  colorOf = { hex: (id: string): string => id, translucent: (_id: string): boolean => false };

  /** Bracket the part being edited (by material names). Pass [] to hide. */
  highlight(names: string[]) {
    this.hl = names;
  }

  /** Light these materials up (hover). Pass [] to clear. */
  setHover(names: string[]) {
    this.hoverNames = new Set(names);
  }

  /** Hide the brackets now (Done, theme loaded). */
  clearHighlight() {
    this.hl = [];
  }

  focus(t: FocusTarget) {
    let toT = HOME.target.clone();
    let toP = HOME.pos.clone();
    if (t === "faceplate") {
      toP = new THREE.Vector3(0, 0.16, 0.2);   // a little above the home view, far enough to see the whole faceplate
    } else if (t) {
      const k = this.layout.knobs[t];
      toT = new THREE.Vector3(k.x, 0, k.z);
      toP = new THREE.Vector3(k.x, 0.07, k.z + 0.075);
    }
    this.tween = { t: 0, fromP: this.camera.position.clone(), fromT: this.controls.target.clone(), toP, toT };
  }

  /** PNG data URL of the finished look: overview camera, nothing glowing. */
  snapshot(): string {
    const saved = { hover: this.hoverNames, pos: this.camera.position.clone(), target: this.controls.target.clone() };
    this.hoverNames = new Set();
    this.camera.position.copy(HOME.pos);
    this.camera.lookAt(HOME.target);
    this.paint();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL("image/png");
    this.hoverNames = saved.hover;
    this.camera.position.copy(saved.pos);
    this.camera.lookAt(saved.target);
    this.paint();
    return url;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.resumeTimer);
    this.resizeObs.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private step() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / 0.5);
      const e = 1 - Math.pow(1 - tw.t, 3);
      this.camera.position.lerpVectors(tw.fromP, tw.toP, e);
      this.controls.target.lerpVectors(tw.fromT, tw.toT, e);
      if (tw.t >= 1) this.tween = null;
    }
    this.paint();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateBrackets();
  }

  /** Draw (or hide) the two bracket sets: the part being edited and the part under the mouse. */
  private updateBrackets() {
    this.overlay.style.display = "block";
    this.drawBracket(this.hl, this.brSel, 8);
    this.drawBracket([...this.hoverNames], this.brHover, 14);
  }

  /** Project the world box of these materials to the screen and draw 4 corner brackets around it. */
  private drawBracket(matNames: string[], paths: { halo: SVGPathElement; light: SVGPathElement }, pad: number) {
    const names = new Set(matNames);
    const box = new THREE.Box3();
    let any = false;
    for (const m of this.meshes) {
      if (!m.visible || !names.has((m.material as THREE.Material).name)) continue;
      const b: THREE.Box3 = m.userData.box ?? (m.userData.box = new THREE.Box3().setFromObject(m));
      box.union(b);
      any = true;
    }
    if (!any) { paths.halo.setAttribute("d", ""); paths.light.setAttribute("d", ""); return; }
    const w = this.el.clientWidth, h = this.el.clientHeight;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const v = new THREE.Vector3();
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      v.set(x, y, z).project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    const len = Math.max(10, Math.min(38, Math.min(x1 - x0, y1 - y0) * 0.3));
    const dd = `M${x0} ${y0 + len}V${y0}H${x0 + len}M${x1 - len} ${y0}H${x1}V${y0 + len}M${x1} ${y1 - len}V${y1}H${x1 - len}M${x0 + len} ${y1}H${x0}V${y1 - len}`;
    paths.halo.setAttribute("d", dd);
    paths.light.setAttribute("d", dd);
  }

  /** Colors and hover glow for the current state. */
  private paint() {
    for (const n in this.mats) {
      const base = this.base[n];
      if (!base) continue;
      this.mats[n].color.copy(base);
      // hover: the part under the mouse glows in its own color, so you see what a click will pick
      if (this.hoverNames.has(n)) this.mats[n].emissive.copy(base).multiplyScalar(0.45).addScalar(0.08);
      else this.mats[n].emissive.setRGB(0, 0, 0);
    }
  }

  private resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private bindPick() {
    const ray = new THREE.Raycaster();
    let down = { x: 0, y: 0 };
    const cv = this.renderer.domElement;
    const resolve = (e: PointerEvent): Pick | null => {
      const r = cv.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      const n = ray.intersectObjects(this.meshes.filter((m) => m.visible), false)[0]?.object.name ?? "";
      const k = KNOB_RE.exec(n);
      if (k) return { k: "knob", slot: k[1] as Slot, part: k[4] === "cap" ? "cap" : "body" };
      if (n === "faceplate_body") return { k: "fp", part: "body" };
      if (n === "faceplate_side") return { k: "fp", part: "side" };
      if (n === "faceplate_accent" || n === "faceplate_accent_labels") return { k: "fp", part: "accent" };
      if (n.startsWith("bezel_logo_")) return { k: "fp", part: "logo" };   // click the firmware logo to color it
      if (n.startsWith("bezel_")) return { k: "fp", part: "bezel" };
      return null;
    };
    cv.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
    cv.addEventListener("pointerup", (e) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return; // it was an orbit drag
      this.onPick(resolve(e));
    });
    // hover (mouse only), at most once per frame
    let busy = false;
    let lastKey = "";
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || busy || e.buttons) return;
      busy = true;
      requestAnimationFrame(() => {
        busy = false;
        const p = resolve(e);
        const key = p ? JSON.stringify(p) : "";
        if (key === lastKey) return;
        lastKey = key;
        cv.style.cursor = p ? "pointer" : "";
        this.onHover(p);
      });
    });
    cv.addEventListener("pointerleave", () => {
      lastKey = "";
      cv.style.cursor = "";
      this.onHover(null);
    });
  }
}
