import { useEffect, useRef } from "react";
import * as THREE from "three";

/** A small turntable of one knob body (the GLB just picked), to check it before saving. */
export function KnobPreview3D({ object, label }: { object: THREE.Object3D; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    const W = 170, H = 170;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(1, 2, 1.5); scene.add(sun);
    const obj = object.clone(true);
    // keep its place in the file's world: a Max export turns Z-up into Y-up on a parent node, so the node's own
    // transform alone would show the knob lying down
    object.updateWorldMatrix(true, false);
    object.matrixWorld.decompose(obj.position, obj.quaternion, obj.scale);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.5, flatShading: true });
    obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat; });
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const pivot = new THREE.Group();
    obj.position.sub(c);
    pivot.add(obj);
    scene.add(pivot);
    const r = size.length();
    const cam = new THREE.PerspectiveCamera(30, W / H, r / 100, r * 20);
    cam.position.set(0, r * 1.1, r * 2.1);
    cam.lookAt(0, 0, 0);
    let raf = 0;
    const tick = () => { pivot.rotation.y += 0.012; renderer.render(scene, cam); raf = requestAnimationFrame(tick); };
    tick();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); mat.dispose(); el.innerHTML = ""; };
  }, [object]);
  return (
    <div className="inline-flex flex-col items-center border border-border bg-[#050505]">
      <div ref={host} style={{ width: 170, height: 170 }} />
      <span className="mono text-[10px] pb-1">{label}</span>
    </div>
  );
}
