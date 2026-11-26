/**
 * SMPD conceptual study model, rendered in WebGL.
 * A laser-cut contour landscape on a dark plinth, a traced plot, and a
 * contemporary home with a cantilevered upper volume and timber-toned fins.
 *
 * Sequence: contour lines on a flat base -> terrain lifts layer by layer ->
 * plot boundary is traced -> architectural outline draws -> volumes rise ->
 * slow moving sunlight. Conceptual brand artwork only, not an SMPD project.
 */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { LAYERS, centerOf, wobble, superR } from '../lib/terrain';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type Variant = 'day' | 'dusk';
export type Shot = 'hero' | 'land' | 'homes' | 'dusk' | 'heroMobile';

export interface ModelOptions {
  canvas: HTMLCanvasElement;
  variant?: Variant;
  shot?: Shot;
  preserve?: boolean;
}

const C = {
  card: 0xece6da,
  card2: 0xe5ddcf,
  plateau: 0xf1ece2,
  plinth: 0x23261f,
  plaster: 0xf5f2eb,
  charcoal: 0x2b2e28,
  fin: 0xb59a76,
  stone: 0xd9d1c2,
  glass: 0x4a5852,
  water: 0x5d7c70,
  deck: 0xa88e6c,
  leaf: 0x8a9e80,
  leafDeep: 0x6f8667,
  trunk: 0x5b4d3e,
  line: 0x1f211c,
};

const T = 0.42; // layer thickness

/* ---------- Terrain geometry ---------- */
function layerPoints(i: number, segs = 160) {
  const { rx, rz } = LAYERS[i];
  const c = centerOf(i);
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < segs; k++) {
    const a = (k / segs) * Math.PI * 2;
    const r = superR(a, rx, rz) * wobble(a, i);
    pts.push(new THREE.Vector2(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r));
  }
  return pts;
}
function insideLayer(i: number, x: number, z: number) {
  const c = centerOf(i);
  const dx = x - c.x, dz = z - c.y;
  const a = Math.atan2(dz, dx);
  const { rx, rz } = LAYERS[i];
  return Math.hypot(dx, dz) < superR(a, rx, rz) * wobble(a, i) - 0.6;
}
function heightAt(x: number, z: number) {
  let h = 0;
  for (let i = 0; i < LAYERS.length; i++) if (insideLayer(i, x, z)) h = (i + 1) * T;
  return h;
}

/* ---------- Helpers ---------- */
function std(color: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });
}
/** Box with its pivot at the bottom centre, so scale.y "builds" upward. */
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createModel(opts: ModelOptions) {
  const { canvas, variant = 'day', shot = 'hero' } = opts;
  const dusk = variant === 'dusk';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = dusk ? 0.95 : 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = dusk ? 0.08 : 0.22;

  /* Lights */
  const hemi = new THREE.HemisphereLight(dusk ? 0x7d8aa3 : 0xfffaf0, dusk ? 0x1f211c : 0xcfc6b5, dusk ? 0.55 : 0.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(dusk ? 0xffd2a1 : 0xfff0da, dusk ? 0.9 : 3.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 140;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const sunAngle = { a: dusk ? -0.35 : 0.35, elev: dusk ? 0.3 : 0.62 };
  const placeSun = () => {
    const r = 60;
    sun.position.set(Math.cos(sunAngle.a) * r * Math.cos(sunAngle.elev), Math.sin(sunAngle.elev) * r, Math.sin(sunAngle.a) * r * Math.cos(sunAngle.elev) * -1 + 10);
  };
  placeSun();
  const fill = new THREE.DirectionalLight(dusk ? 0x6f7d96 : 0xe8eef5, dusk ? 0.25 : 0.35);
  fill.position.set(-40, 20, 30);
  scene.add(fill);

  /* Table shadow catcher */
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.ShadowMaterial({ opacity: dusk ? 0.45 : 0.16 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = -1.6;
  catcher.receiveShadow = true;
  scene.add(catcher);

  /* Plinth */
  const plinth = box(50, 1.6, 37, std(C.plinth, { roughness: 0.7 }), 0, -1.6, 0);
  scene.add(plinth);

  /* Terrain layers */
  const terrain = new THREE.Group();
  scene.add(terrain);
  const layerMeshes: THREE.Mesh[] = [];
  const contourLines: THREE.Line[] = [];
  LAYERS.forEach((_, i) => {
    const pts = layerPoints(i);
    const shape = new THREE.Shape(pts);
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2); // shape (x, y) -> world (x, z); depth -> -y
    g.translate(0, T, 0); // layer occupies y 0..T
    const mat = std(i === LAYERS.length - 1 ? C.plateau : i % 2 ? C.card2 : C.card, { roughness: 0.95 });
    if (dusk) mat.color.set(i % 2 ? 0xbdb8ad : 0xc6c1b6);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.finalY = i * T;
    terrain.add(m);
    layerMeshes.push(m);

    const lg = new THREE.BufferGeometry().setFromPoints([...pts, pts[0]].map((p) => new THREE.Vector3(p.x, 0, p.y)));
    const lm = new THREE.LineBasicMaterial({ color: dusk ? 0xd8d2c4 : C.line, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(lg, lm);
    line.userData.finalY = (i + 1) * T + 0.005;
    line.userData.count = pts.length + 1;
    scene.add(line);
    contourLines.push(line);
  });
  const top = LAYERS.length * T;

  /* Plot boundary on the plateau */
  const plotCorners = [new THREE.Vector3(-10.2, top + 0.02, -6.8), new THREE.Vector3(10.6, top + 0.02, -7.3), new THREE.Vector3(11.4, top + 0.02, 6.6), new THREE.Vector3(-10.8, top + 0.02, 6.2)];
  const plotGeo = new THREE.BufferGeometry().setFromPoints([...plotCorners, plotCorners[0]]);
  const plotMat = new THREE.LineDashedMaterial({ color: dusk ? 0xe9dcc0 : C.leafDeep, dashSize: 0.55, gapSize: 0.35, transparent: true });
  const plot = new THREE.Line(plotGeo, plotMat);
  plot.computeLineDistances();
  scene.add(plot);
  const pins = plotCorners.map((p) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.7, 12), std(C.leaf, { roughness: 0.6 }));
    pin.geometry.translate(0, 0.35, 0);
    pin.position.copy(p);
    pin.castShadow = true;
    scene.add(pin);
    return pin;
  });

  /* House */
  const house = new THREE.Group();
  house.position.set(0.4, top, -0.3);
  house.scale.setScalar(1.2);
  scene.add(house);
  const M = {
    plaster: std(C.plaster, { roughness: 0.85 }),
    charcoal: std(C.charcoal, { roughness: 0.75 }),
    fin: std(C.fin, { roughness: 0.7 }),
    stone: std(C.stone, { roughness: 0.92 }),
    deck: std(C.deck, { roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({
      color: C.glass, roughness: 0.06, metalness: 0.75,
      emissive: dusk ? new THREE.Color(0xffc27a) : new THREE.Color(0x000000), emissiveIntensity: dusk ? 0.42 : 0,
    }),
    water: std(C.water, { roughness: 0.08, metalness: 0.2 }),
  };
  const parts: THREE.Mesh[] = [];
  const add = (m: THREE.Mesh) => { house.add(m); parts.push(m); return m; };
  add(box(14, 0.22, 8.6, M.stone, 0, 0, 0)); // terrace
  add(box(4.6, 0.05, 2.6, M.deck, 3.9, 0.22, 2.1)); // deck
  add(box(3.6, 0.06, 1.7, M.water, 4.0, 0.24, 2.1)); // pool
  add(box(7.0, 2.7, 4.4, M.plaster, -2.4, 0.22, -1.0)); // ground volume
  add(box(6.2, 2.1, 0.08, M.glass, -2.4, 0.42, 1.24)); // ground glazing
  add(box(0.2, 2.7, 0.2, M.charcoal, 5.6, 0.22, 1.25)); // column
  add(box(9.6, 2.5, 4.3, M.charcoal, 1.0, 2.92, -0.6)); // upper volume
  add(box(9.0, 1.7, 0.08, M.glass, 1.0, 3.3, 1.58)); // upper glazing
  add(box(10.4, 0.18, 5.0, M.plaster, 1.0, 5.42, -0.6)); // roof slab
  add(box(0.16, 2.5, 4.3, M.glass, 5.81, 2.92, -0.6)); // end glazing
  add(box(8.2, 1.05, 0.24, M.stone, -2.2, 0.22, 3.75)); // garden wall
  add(box(2.2, 0.9, 2.2, M.plaster, -6.0, 0.22, 2.2)); // low pavilion
  if (dusk) {
    // Warm interior light spilling onto the terrace.
    [[-2.4, 1.4, 0.6], [1.5, 4.0, 0.9], [5.2, 4.0, -0.4]].forEach(([x, y, z]) => {
      const l = new THREE.PointLight(0xffb468, 26, 14, 2);
      l.position.set(x, y, z);
      house.add(l);
    });
  }
  const fins: THREE.Mesh[] = [];
  for (let k = 0; k < 22; k++) {
    const f = box(0.07, 2.3, 0.34, M.fin, 0.2 + k * 0.255, 3.02, 1.82);
    fins.push(add(f));
  }

  /* Outline: edges of every house part, ordered bottom to top so they "rise" */
  const segs: number[][] = [];
  house.updateMatrixWorld(true);
  parts.forEach((p) => {
    if (fins.includes(p)) return;
    const e = new THREE.EdgesGeometry(p.geometry, 30);
    const pos = e.attributes.position;
    for (let k = 0; k < pos.count; k += 2) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, k).add(p.position);
      const b = new THREE.Vector3().fromBufferAttribute(pos, k + 1).add(p.position);
      segs.push([a.x, a.y, a.z, b.x, b.y, b.z]);
    }
  });
  segs.sort((s1, s2) => Math.min(s1[1], s1[4]) - Math.min(s2[1], s2[4]));
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs.flat(), 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: dusk ? 0xe9e2d2 : C.line, transparent: true, opacity: 0.9, depthTest: true });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.userData.count = segs.length * 2;
  house.add(edges);

  /* Trees: abstract model trees on the terraces */
  const treeSpots = [[-14, 6.2, 1.5], [-16.5, -2.5, 1.2], [-12.5, -8.8, 1.35], [13.5, -7.6, 1.5], [15.8, 1.5, 1.15], [11.8, 8.6, 1.3], [-4.5, 10.2, 1.0], [3.5, 9.8, 1.1], [17.5, -3.8, 0.9]];
  const treeMat = std(C.leaf, { roughness: 0.75 });
  const treeMat2 = std(C.leafDeep, { roughness: 0.75 });
  const trunkMat = std(C.trunk);
  const trees = treeSpots.map(([x, z, s], i) => {
    const g = new THREE.Group();
    const y = heightAt(x, z);
    g.position.set(x, y, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.3 * s, 6), trunkMat);
    trunk.position.y = 0.65 * s;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1 * s, 32, 24), i % 3 ? treeMat : treeMat2);
    crown.position.y = 1.55 * s;
    crown.scale.set(1, 1, 1);
    crown.castShadow = true;
    crown.receiveShadow = true;
    g.add(trunk, crown);
    scene.add(g);
    return g;
  });

  /* Camera */
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 400);
  const target = new THREE.Vector3(0.5, 2.2, 0);
  const shots: Record<Shot, { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
    hero: { pos: [68, 52, 82], target: [0.5, 1.6, 0.6], fov: 18.5 },
    heroMobile: { pos: [52, 46, 66], target: [0.5, 1.6, 0.6], fov: 38 },
    land: { pos: [-8, 52, 34], target: [-2, 0, 2.5], fov: 30 },
    homes: { pos: [-20, 15, 40], target: [1.2, 3.0, 0.4], fov: 21 },
    dusk: { pos: [46, 22, 54], target: [0.5, 2.6, 0.5], fov: 24 },
  };
  const s = shots[shot];
  camera.fov = s.fov;
  camera.position.set(...s.pos);
  target.set(...s.target);
  camera.lookAt(target);
  const basePos = camera.position.clone();
  // Keep close-up shots clear of foreground trees.
  if (shot === 'homes') trees.forEach((t) => { if (t.position.distanceTo(camera.position) < 30) t.visible = false; });
  const look = { x: 0, y: 0 }; // pointer parallax
  const view = { x: 0, y: 0 }; // view offset in fractions of width/height

  /* Sizing */
  let w = 1, h = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (view.x || view.y) camera.setViewOffset(w, h, -view.x * w, -view.y * h, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    render();
  };

  const render = () => {
    camera.position.set(basePos.x + look.x * 2.2, basePos.y + look.y * 1.4, basePos.z - look.x * 1.6);
    camera.lookAt(target);
    renderer.render(scene, camera);
  };

  /* Final (static) state */
  const setFinal = () => {
    layerMeshes.forEach((m) => { m.position.y = m.userData.finalY; m.scale.y = 1; });
    contourLines.forEach((l) => { l.position.y = l.userData.finalY; (l.material as THREE.LineBasicMaterial).opacity = 0.22; l.geometry.setDrawRange(0, Infinity); });
    plot.geometry.setDrawRange(0, Infinity);
    plotMat.opacity = 1;
    pins.forEach((p) => (p.scale.y = 1));
    parts.forEach((p) => (p.scale.y = 1));
    edges.geometry.setDrawRange(0, Infinity);
    edgeMat.opacity = 0.18;
    trees.forEach((t) => t.scale.setScalar(1));
  };

  /* Animated intro */
  const intro = () => {
    const tl = gsap.timeline({ onUpdate: render });
    layerMeshes.forEach((m) => { m.position.y = 0; m.scale.y = 0.001; });
    contourLines.forEach((l) => { l.position.y = 0.01; l.geometry.setDrawRange(0, 0); });
    plot.geometry.setDrawRange(0, 0);
    plotMat.opacity = 0;
    pins.forEach((p) => (p.scale.y = 0.001));
    parts.forEach((p) => (p.scale.y = 0.001));
    edges.geometry.setDrawRange(0, 0);
    trees.forEach((t) => t.scale.setScalar(0.001));
    const startPos = basePos.clone().multiplyScalar(1.12).add(new THREE.Vector3(0, 6, 0));
    const endPos = basePos.clone();
    basePos.copy(startPos);

    // 1. Contour lines trace across the flat plinth.
    contourLines.forEach((l, i) => {
      const p = { v: 0 };
      tl.to(p, { v: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: () => l.geometry.setDrawRange(0, Math.ceil(p.v * l.userData.count)) }, 0.1 + i * 0.09);
    });
    // 2. The land lifts into terraces.
    layerMeshes.forEach((m, i) => {
      tl.to(m.position, { y: m.userData.finalY, duration: 1.2, ease: 'power3.inOut' }, 1.5 + i * 0.1);
      tl.to(m.scale, { y: 1, duration: 1.2, ease: 'power3.inOut' }, 1.5 + i * 0.1);
      tl.to(contourLines[i].position, { y: contourLines[i].userData.finalY, duration: 1.2, ease: 'power3.inOut' }, 1.5 + i * 0.1);
    });
    tl.to(contourLines.map((l) => l.material), { opacity: 0.22, duration: 1.2 }, 2.8);
    // 3. The plot is traced on the plateau.
    const pp = { v: 0 };
    tl.set(plotMat, { opacity: 1 }, 2.7);
    tl.to(pp, { v: 1, duration: 1.1, ease: 'power2.inOut', onUpdate: () => plot.geometry.setDrawRange(0, Math.ceil(pp.v * 5)) }, 2.7);
    tl.to(pins.map((p) => p.scale), { y: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2.5)' }, 2.9);
    // 4. The architectural outline draws upward.
    const ep = { v: 0 };
    tl.to(ep, { v: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: () => edges.geometry.setDrawRange(0, Math.ceil((ep.v * edges.userData.count) / 2) * 2) }, 3.4);
    // 5. The outline resolves into built form.
    const order = [...parts].sort((a, b) => a.position.y - b.position.y);
    order.forEach((p) => {
      const t = 4.3 + (p.position.y / 5.5) * 1.1 + (fins.includes(p) ? 0.35 + fins.indexOf(p) * 0.015 : 0);
      tl.to(p.scale, { y: 1, duration: 0.8, ease: 'power3.out' }, t);
    });
    tl.to(edgeMat, { opacity: 0.18, duration: 1.2 }, 5.4);
    tl.to(trees.map((t) => t.scale), { x: 1, y: 1, z: 1, duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)' }, 5.0);
    // Camera settles throughout.
    tl.to(basePos, { x: endPos.x, y: endPos.y, z: endPos.z, duration: 6.4, ease: 'power2.out' }, 0);
    return tl;
  };

  /* Slow light: the sun drifts and shadows sweep across the terraces. */
  const light = gsap.to(sunAngle, {
    a: sunAngle.a + (dusk ? 0.45 : 0.75), elev: sunAngle.elev - 0.12,
    duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
    onUpdate: () => { placeSun(); render(); },
  });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return {
    resize,
    render,
    setFinal,
    intro,
    light,
    setView(x: number, y: number) { view.x = x; view.y = y; resize(); },
    setLook(x: number, y: number) { look.x = x; look.y = y; render(); },
    dispose() {
      light.kill();
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose?.();
      });
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
