"use client";

// 3D airspace view built directly on Three.js (no R3F dependency to avoid
// React 19 peer-version friction). Renders a 5×5×2 km box with the swarm,
// targets and FoV cones, slowly orbiting camera.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { COLORS, DRONE_COLORS } from "@/drishti/theme/colors";
import type { UAV } from "@/drishti/types/uav";
import type { Track } from "@/drishti/types/track";

interface Props {
  uavs: UAV[];
  tracks: Track[];
  maxRangeKm: number;
}

// Convert sim-frame (East, North, Up in metres) to Three.js (x: east, y: up, z: -north).
function toScene(x: number, y: number, z: number, scale: number): [number, number, number] {
  return [x * scale, z * scale, -y * scale];
}

export function Radar3D({ uavs, tracks, maxRangeKm }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    swarmGroup: THREE.Group;
    trackGroup: THREE.Group;
    raf: number;
    scale: number;
  } | null>(null);

  // One-time scene setup
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scale = 0.05; // 1 m → 0.05 units; 5 km → 250 units

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.fog = new THREE.Fog(COLORS.bg, 200, 800);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
    camera.position.set(220, 180, 220);
    camera.lookAt(0, 30, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Ground grid: 10 km × 10 km, every 1 km
    const grid = new THREE.GridHelper(maxRangeKm * 2000 * scale, maxRangeKm * 2, COLORS.bdHi, COLORS.bdDim);
    (grid.material as THREE.Material).opacity = 0.4;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Range rings on ground
    for (let km = 1; km <= maxRangeKm; km++) {
      const ringGeo = new THREE.RingGeometry(km * 1000 * scale - 0.3, km * 1000 * scale + 0.3, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLORS.greenDim,
        transparent: true,
        opacity: km === maxRangeKm ? 0.6 : 0.25,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
    }

    // Lights — faint, mostly emissive in our scene
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(100, 200, 100);
    scene.add(dir);

    const swarmGroup = new THREE.Group();
    const trackGroup = new THREE.Group();
    scene.add(swarmGroup);
    scene.add(trackGroup);

    stateRef.current = {
      scene,
      camera,
      renderer,
      swarmGroup,
      trackGroup,
      raf: 0,
      scale,
    };

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    // Orbit
    const t0 = performance.now();
    const animate = () => {
      const s = stateRef.current;
      if (!s) return;
      const t = (performance.now() - t0) / 1000;
      const r = 280;
      s.camera.position.set(Math.cos(t * 0.06) * r, 160, Math.sin(t * 0.06) * r);
      s.camera.lookAt(0, 30, 0);
      s.renderer.render(s.scene, s.camera);
      s.raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      ro.disconnect();
      const s = stateRef.current;
      if (s) {
        cancelAnimationFrame(s.raf);
        s.renderer.dispose();
        mount.removeChild(s.renderer.domElement);
      }
      stateRef.current = null;
    };
  }, [maxRangeKm]);

  // Rebuild swarm & track markers whenever data changes
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    // Clear groups
    while (s.swarmGroup.children.length > 0) {
      const c = s.swarmGroup.children[0];
      if (c) s.swarmGroup.remove(c);
    }
    while (s.trackGroup.children.length > 0) {
      const c = s.trackGroup.children[0];
      if (c) s.trackGroup.remove(c);
    }

    uavs.forEach((uav, i) => {
      const dc = DRONE_COLORS[i] ?? COLORS.green;
      const color = new THREE.Color(
        uav.status === "ACTIVE"
          ? dc
          : uav.status === "FAULT"
            ? COLORS.red
            : uav.status === "RTH"
              ? COLORS.amber
              : COLORS.blue,
      );
      // Cone marker
      const geo = new THREE.ConeGeometry(2, 6, 4);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      const [x, y, z] = toScene(uav.pos.x, uav.pos.y, uav.pos.z, s.scale);
      mesh.position.set(x, y, z);
      mesh.rotation.x = Math.PI; // point down-ish
      s.swarmGroup.add(mesh);

      // Drop-line from drone to ground
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, 0, z),
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color,
        dashSize: 2,
        gapSize: 1.5,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      s.swarmGroup.add(line);

      // FoV cone (open downward + outward)
      if (uav.status === "ACTIVE" && uav.radarOn) {
        const fovGeo = new THREE.ConeGeometry(maxRangeKm * 1000 * s.scale * 0.6, maxRangeKm * 1000 * s.scale, 32, 1, true);
        const fovMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.05,
          side: THREE.DoubleSide,
        });
        const fov = new THREE.Mesh(fovGeo, fovMat);
        // Point cone outward from swarm centre
        const outAz = Math.atan2(uav.pos.x, uav.pos.y);
        fov.rotation.x = Math.PI / 2;
        fov.rotation.z = -outAz;
        fov.position.set(x, y, z);
        // Translate cone tip to drone (cone is centred by default → push half-length forward)
        const half = (maxRangeKm * 1000 * s.scale) / 2;
        fov.position.x += Math.sin(outAz) * half;
        fov.position.z -= Math.cos(outAz) * half;
        s.swarmGroup.add(fov);
      }
    });

    tracks.forEach((t) => {
      const col =
        t.type === "DRONE" ? COLORS.red : t.type === "BIRD" ? COLORS.amber : COLORS.txtHi;
      const geo = new THREE.OctahedronGeometry(1.6, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(col),
        emissive: new THREE.Color(col),
        emissiveIntensity: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const [x, y, z] = toScene(t.x, t.y, t.z, s.scale);
      mesh.position.set(x, y, z);
      s.trackGroup.add(mesh);

      // Track history polyline
      if (t.history.length > 1) {
        const pts = t.history.map((h) => {
          const [hx, hy, hz] = toScene(h.x, h.y, t.z, s.scale);
          return new THREE.Vector3(hx, hy, hz);
        });
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(lineGeo, lineMat);
        s.trackGroup.add(line);
      }
    });
  }, [uavs, tracks, maxRangeKm]);

  return (
    <div
      ref={mountRef}
      style={{ flex: 1, position: "relative", overflow: "hidden", background: COLORS.bg }}
    />
  );
}
