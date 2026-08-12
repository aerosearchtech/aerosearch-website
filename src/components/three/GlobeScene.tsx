"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { colors } from "@/theme/colors";
import { LAND_MASK_B64, LAND_W, LAND_H } from "./landMask";

/**
 * The contaminated world, as a dot globe.
 *
 * Land comes from a baked Natural Earth mask; the red is contamination. Every
 * marked state is one the 2025 Landmine Monitor names directly — for the extent
 * of its contamination, its casualty count, or its clearance reporting. Nothing
 * here is estimated by us, and nothing is labelled on the page: the globe shows
 * distribution, and the caption carries the source and the total.
 *
 * India is marked as its own layer. The Monitor records 57 mine/ERW casualties
 * there in 2024 and names India among the states where non-state armed groups
 * used improvised mines. Its contamination is not one problem but three, in
 * three unconnected parts of the country, which is why it is drawn as belts
 * rather than a single blob. Dot counts everywhere are a measure of extent, not
 * of casualties — India is wide, not worst.
 */

const R = 1; // globe radius; everything else is expressed against it
const ROWS = 96; // latitude bands — longitude count per band scales with cos(lat)
const DEG = Math.PI / 180;
const SPIN = 0.03; // radians per second — slow enough to hold a region on the face
const PULSE = 2.4; // radians per second; one breath every ~2.6s
const DOT = 0.019; // one dot size for the whole globe, land and contamination alike

/** Contaminated ground: latitude, longitude, and how many dots to scatter. */
type Site = readonly [number, number, number];

/**
 * Massive contamination — more than 100km², per Landmine Monitor 2025.
 * Afghanistan, Bosnia and Herzegovina, Cambodia, Ethiopia, Iraq, Türkiye, Ukraine.
 */
const MASSIVE: readonly Site[] = [
  [33.9, 67.7, 16],
  [44.0, 18.0, 12],
  [12.6, 104.9, 14],
  [9.1, 40.5, 16],
  [33.2, 43.7, 16],
  [39.0, 35.2, 15],
  [48.4, 31.2, 18],
];

/**
 * Further states the same report names for casualties, clearance totals, or
 * clearance funding: Myanmar, Syria, Yemen, Croatia, Somalia, Colombia, DR
 * Congo, Palestine, Senegal, South Sudan, Serbia, Thailand.
 */
const AFFECTED: readonly Site[] = [
  [21.9, 95.9, 10],
  [34.8, 39.0, 10],
  [15.6, 48.5, 8],
  [45.1, 15.2, 6],
  [5.2, 46.2, 7],
  [4.6, -74.3, 7],
  [-4.0, 21.8, 8],
  [31.9, 35.2, 4],
  [14.5, -14.5, 5],
  [7.9, 29.7, 7],
  [44.0, 21.0, 5],
  [15.9, 101.0, 6],
];

/**
 * India, the ground we are built for, in the three belts that actually carry
 * the threat:
 *
 * 1. The western border. Roughly two million mines were laid along the Pakistan
 *    frontier during Operation Parakram in 2001–02; by 2004 the Army reported
 *    some 300,000 of them untraceable across 400km of Punjab and Rajasthan.
 *    Travel advisories still warn of mines and UXO within 10km of that border
 *    in Gujarat, Punjab and Rajasthan, and the Jammu sectors remain live.
 * 2. The central Left-Wing-Extremism belt — Bastar, Gadchiroli, Malkangiri and
 *    Jharkhand — where the contamination is improvised and laid continuously
 *    rather than left over from a war.
 * 3. The northeast, where insurgent IEDs persist at a lower rate.
 */
const INDIA: readonly Site[] = [
  [33.3, 74.4, 5], // Jammu — Rajouri/Poonch
  [30.8, 74.3, 5], // Punjab border — Ferozepur/Amritsar
  [28.9, 73.0, 5], // Rajasthan — Sri Ganganagar/Bikaner
  [26.4, 71.0, 6], // Rajasthan — Jaisalmer/Barmer
  [23.7, 69.6, 4], // Gujarat — Kutch
  [19.3, 81.6, 6], // Chhattisgarh — Bastar
  [19.9, 80.2, 3], // Maharashtra — Gadchiroli
  [18.4, 82.0, 3], // Odisha — Malkangiri
  [22.6, 85.3, 4], // Jharkhand — West Singhbhum
  [24.7, 93.9, 4], // Manipur
  [26.2, 94.3, 3], // Nagaland
];

/** lat/lon on the sphere, with the prime meridian facing +Z. */
function toXYZ(lat: number, lon: number, r: number): [number, number, number] {
  const p = (90 - lat) * DEG;
  const t = (lon + 180) * DEG;
  return [-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)];
}

function decodeMask(): Uint8Array {
  const bin = atob(LAND_MASK_B64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Land dots, one buffer for the whole sphere. */
function useLandPoints(): Float32Array {
  return useMemo(() => {
    const mask = decodeMask();
    const isLand = (lat: number, lon: number) => {
      const c = Math.min(LAND_W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * LAND_W)));
      const r = Math.min(LAND_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LAND_H)));
      const i = r * LAND_W + c;
      return (mask[i >> 3] & (1 << (i & 7))) !== 0;
    };

    const pts: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      const lat = 90 - ((row + 0.5) / ROWS) * 180;
      // Thin the row toward the poles so the dots stay evenly spaced.
      const cols = Math.max(1, Math.round(ROWS * 2 * Math.cos(lat * DEG)));
      for (let c = 0; c < cols; c++) {
        const lon = -180 + ((c + 0.5) / cols) * 360;
        if (isLand(lat, lon)) pts.push(...toXYZ(lat, lon, R));
      }
    }
    return new Float32Array(pts);
  }, []);
}

/**
 * Contamination, scattered around each site rather than pinned to one dot —
 * the cluster is the density, and no single point pretends to be a coordinate.
 */
function useSitePoints(sites: readonly Site[], spread: number): Float32Array {
  return useMemo(() => {
    const pts: number[] = [];
    // Fixed sequence, so the scatter is identical on every render and reload.
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (const [lat, lon, n] of sites) {
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * spread;
        const dLat = Math.sin(a) * d;
        const dLon = (Math.cos(a) * d) / Math.max(0.25, Math.cos(lat * DEG));
        pts.push(...toXYZ(lat + dLat, lon + dLon, R * 1.004));
      }
    }
    return new Float32Array(pts);
  }, [sites, spread]);
}

/**
 * A disc, drawn once and shared. GL points are square by default; masking them
 * with this is what makes the globe read as dots rather than pixels.
 */
function useDisc(): THREE.Texture {
  return useMemo(() => {
    const S = 64;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    if (g) {
      g.beginPath();
      g.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
      g.fillStyle = "#fff";
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);
}

/**
 * A dot layer. Every dot on the globe is the same size — density and colour
 * carry the reading, not scale, so no cluster is inflated beyond what the
 * source supports. Pass `phase` for a slow breath; it moves brightness only.
 */
function Dots({
  data,
  color,
  phase,
}: {
  data: Float32Array;
  color: string;
  phase?: number;
}) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const disc = useDisc();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data, 3));
    return g;
  }, [data]);

  useFrame((state) => {
    if (phase === undefined || !mat.current) return;
    const b = Math.sin(state.clock.elapsedTime * PULSE + phase) * 0.5 + 0.5;
    // Wide range on purpose: with size held constant, brightness is the only
    // channel the breath has left.
    mat.current.opacity = 0.32 + b * 0.68;
  });

  return (
    <points geometry={geom}>
      <pointsMaterial
        ref={mat}
        size={DOT}
        color={color}
        map={disc}
        sizeAttenuation
        transparent
        depthWrite={false}
        opacity={0.95}
        toneMapped={false}
      />
    </points>
  );
}

function Globe() {
  const group = useRef<THREE.Group>(null);
  const land = useLandPoints();
  const massive = useSitePoints(MASSIVE, 6.5);
  const affected = useSitePoints(AFFECTED, 4);
  // Tighter scatter, so the belts stay legible as belts on a country this size.
  const india = useSitePoints(INDIA, 2.4);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += SPIN * dt;
  });

  return (
    // Axial tilt, plus enough pitch to bring the northern mid-latitudes — where
    // almost all of the contamination sits — down to the centre of the frame.
    <group rotation={[0.34, 0, 0.34]}>
      {/* Front-facing longitude is -90 - lon; -168 opens the globe on India. */}
      <group ref={group} rotation={[0, THREE.MathUtils.degToRad(-168), 0]}>
        {/* Solid body just under the dots, so the far side is properly hidden. */}
        <mesh>
          <sphereGeometry args={[R * 0.993, 72, 52]} />
          <meshBasicMaterial color={colors.night} />
        </mesh>

        <Dots data={land} color={colors.boneMuted} />
        <Dots data={affected} color={colors.signal} phase={0} />
        <Dots data={massive} color={colors.signal} phase={1.1} />
        <Dots data={india} color={colors.signal} phase={2.3} />
      </group>

    </group>
  );
}

function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.28, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.15 + pointer.y * 0.2, 0.04);
    camera.lookAt(target);
  });

  return null;
}

function Scene() {
  return (
    <>
      <Globe />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.35} luminanceSmoothing={0.5} intensity={0.7} radius={0.5} />
      </EffectComposer>
    </>
  );
}

export default function GlobeScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "demand" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: [0, 0.15, 3.05], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
