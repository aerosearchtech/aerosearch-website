"use client";

import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { colors, feeds } from "@/theme/colors";
import SurveyDrone from "./SurveyDrone";
import Ordnance from "./Ordnance";

/** Half-width of the surveyed box; lanes run the full span in X. */
const FIELD_X = 4.6;
const LANE_Z = [-3, -1.8, -0.6, 0.6, 1.8, 3] as const;
const LANE_W = 1.2; // lane spacing, and therefore swath width
const ALT = 1.6; // survey altitude above the ground plane
const SWATH_R = 0.62; // radius of the sensor footprint on the ground
const DETECT_R = 0.9; // a contact is called when the footprint reaches this
const TURN = 0.86; // lane fraction at which the aircraft starts its turn
const SWEEP = 0.78; // share of the cycle spent flying; the rest holds the map
const PERIOD = 22; // seconds for one full survey and reset
const POP = 0.85; // seconds for a contact marker to rise and settle

/**
 * Three aircraft fly the same lanes in trail, each carrying a different sensor.
 * That is the argument of the scene: no single read finds everything, so ground
 * the leader passes clean is called by the aircraft behind it. Each channel has
 * its own hue, and a contact flashes in the hue of whichever sensor called it.
 */
const CRAFT = 3;
const LAG = 0.03; // cycle fraction each aircraft trails the one ahead
const WASH = 0.05; // ground wash per aircraft; three of them stack additively

/** Cycle progress for one aircraft, which holds at the start until its turn. */
const progressFor = (p: number, craft: number): number => Math.max(0, p - craft * LAG);

/**
 * Buried threats: x, z, silhouette kind, yaw, and the sensor that calls it.
 * Kinds are generic ordnance shapes — a blast disc, a shell, a stake mine, a
 * small canister — and identify no specific munition.
 *
 * The last field is the whole point of the scene. Four of these are found by
 * the leader; the other six stay dark until the second or third aircraft is
 * over them, which is what one sensor flying alone would have left in the
 * ground.
 */
const MINES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [-3.4, -3.0, 0, 0.3, 0],
  [1.1, -3.0, 1, 1.1, 1],
  [3.6, -1.8, 2, 0, 2],
  [-2.5, -1.8, 3, 0.7, 0],
  [-0.4, -0.6, 0, 2.2, 1],
  [2.9, -0.6, 1, -0.6, 0],
  [-3.8, 0.6, 3, 1.9, 2],
  [0.7, 0.6, 0, 0.9, 1],
  [2.2, 1.8, 2, 0, 2],
  [-1.6, 3.0, 1, 2.6, 0],
];

type Probe = { x: number; z: number; p: number };

const cSignal = new THREE.Color(colors.signal);
const easeOutBack = (t: number): number => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/**
 * Where an aircraft is at its own cycle progress p, and how far through the
 * survey it is. Every aircraft flies this same track, just offset in time.
 * Everything else in the scene derives from this one function, which is what
 * keeps the swaths, the coverage, and the detections in agreement.
 */
function flightAt(p: number): { x: number; z: number; lane: number; frac: number; heading: number } {
  const t = Math.min(p / SWEEP, 1) * LANE_Z.length;
  const lane = Math.min(Math.floor(t), LANE_Z.length - 1);
  const frac = Math.min(t - lane, 1);
  const dir = lane % 2 === 0 ? 1 : -1;
  const x = dir * (frac * 2 - 1) * FIELD_X;

  // Slide onto the next lane during the turn rather than teleporting across.
  const next = LANE_Z[Math.min(lane + 1, LANE_Z.length - 1)];
  const turn = frac <= TURN ? 0 : THREE.MathUtils.smoothstep((frac - TURN) / (1 - TURN), 0, 1);
  const z = THREE.MathUtils.lerp(LANE_Z[lane], next, turn);

  // Nose follows the track: down the lane, then swinging through the turn.
  const heading = dir > 0 ? 0 : Math.PI;
  return { x, z, lane, frac, heading: heading + turn * Math.PI * (dir > 0 ? 1 : -1) };
}

/**
 * Ground already read, as one translucent wash per aircraft laid over the same
 * lanes. The leader's ochre goes down first, the second aircraft's blue over
 * it, then the third's teal, and because the washes blend additively the turf
 * pales as each sensor adds its read. Coverage is therefore not one state but
 * three, and you can see at a glance how many sensors have been over any strip.
 */
function Coverage({ probes }: { probes: MutableRefObject<Probe[]> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    for (let c = 0; c < CRAFT; c++) {
      const { lane, frac } = flightAt(probes.current[c].p);
      LANE_Z.forEach((_, i) => {
        const mesh = refs.current[c * LANE_Z.length + i];
        if (!mesh) return;
        const done = i < lane ? 1 : i === lane ? Math.min(frac / TURN, 1) : 0;
        const dir = i % 2 === 0 ? 1 : -1;
        mesh.scale.x = Math.max(0.0001, done);
        // Grow from the end the aircraft entered from, not from the middle.
        mesh.position.x = -dir * FIELD_X * (1 - done);
        (mesh.material as THREE.MeshBasicMaterial).opacity = done > 0 ? WASH : 0;
      });
    }
  });

  return (
    <>
      {Array.from({ length: CRAFT }, (_, c) => (
        // Stacked a hair apart so the washes never fight for the same depth.
        <group key={c} position={[0, 0.006 + c * 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {LANE_Z.map((z, i) => (
            <mesh
              key={z}
              ref={(m) => {
                refs.current[c * LANE_Z.length + i] = m;
              }}
              position={[0, -z, 0]}
            >
              <planeGeometry args={[FIELD_X * 2, LANE_W]} />
              <meshBasicMaterial
                color={feeds[c]}
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * One contact. The ground is opaque until the swath reaches it; then the object
 * under the soil resolves and stays visible — the map being built.
 */
function Contact({
  x,
  z,
  kind,
  yaw,
  by,
  probes,
}: {
  x: number;
  z: number;
  kind: number;
  yaw: number;
  by: number;
  probes: MutableRefObject<Probe[]>;
}) {
  const found = useRef(-1);
  const group = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Group>(null);
  const wave = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const waveMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Only this contact's own sensor can call it. The others fly over it blind,
    // which is exactly what the reader is meant to notice.
    const { p } = probes.current[0];
    if (p < 0.02) found.current = -1;
    else if (found.current < 0) {
      const q = probes.current[by];
      if (Math.hypot(q.x - x, q.z - z) < DETECT_R) found.current = t;
    }

    const age = found.current < 0 ? -1 : t - found.current;
    if (!group.current) return;
    group.current.visible = age >= 0;
    if (age < 0) return;

    const rise = easeOutBack(Math.min(age / POP, 1));
    if (pin.current) {
      pin.current.scale.setScalar(Math.max(0.001, rise));
      // Settle into a slow breath once the spring has run.
      pin.current.position.y = 0.02 * Math.sin(t * 2.4) * Math.min(age / POP, 1);
    }
    if (ring.current) ring.current.opacity = Math.min(age * 2.4, 1) * 0.9;

    // A single shockwave on the call, then nothing — repetition would read as noise.
    const w = age / 0.7;
    if (wave.current && waveMat.current) {
      const s = 0.35 + w * 1.5;
      wave.current.scale.set(s, s, s);
      waveMat.current.opacity = w < 1 ? (1 - w) * 0.65 : 0;
    }
  });

  return (
    <group ref={group} position={[x, 0, z]} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.15, 0.19, 40]} />
        <meshBasicMaterial
          ref={ring}
          color={cSignal}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* The call flashes in the channel that made it; the marker it leaves
          behind stays red, because red on this site means hazard and nothing
          else. Who found it is a moment — what it is, is permanent. */}
      <mesh ref={wave} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.82, 1, 48]} />
        <meshBasicMaterial
          ref={waveMat}
          color={feeds[by]}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* What is actually down there, sitting just under the surface. */}
      <group ref={pin} rotation={[0, yaw, 0]} position={[0, -0.02, 0]}>
        <Ordnance kind={kind} />
      </group>
    </group>
  );
}

/**
 * One aircraft's live footprint and the beam that puts it there, in that
 * aircraft's channel hue. Three of these read the same ground differently.
 */
function Swath({ probes, craft }: { probes: MutableRefObject<Probe[]>; craft: number }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const hue = feeds[craft];

  useFrame((state) => {
    const q = probes.current[craft];
    if (group.current) group.current.position.set(q.x, 0, q.z);
    // Offset the throb per aircraft, so three beams do not pulse as one.
    if (core.current) {
      core.current.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3.4 + craft) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <mesh position={[0, ALT / 2, 0]}>
        <coneGeometry args={[SWATH_R, ALT, 40, 1, true]} />
        <meshBasicMaterial
          color={hue}
          transparent
          opacity={0.11}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[SWATH_R * 0.9, SWATH_R, 56]} />
          <meshBasicMaterial
            color={hue}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[SWATH_R * 0.9, 40]} />
          <meshBasicMaterial
            ref={core}
            color={hue}
            transparent
            opacity={0.2}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Drives the cycle and carries every aircraft along its own track. */
function Flight({ probes }: { probes: MutableRefObject<Probe[]> }) {
  const craft = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = (t % PERIOD) / PERIOD;

    for (let i = 0; i < CRAFT; i++) {
      const pi = progressFor(p, i);
      const { x, z, heading } = flightAt(pi);
      probes.current[i] = { x, z, p: pi };
      const g = craft.current[i];
      if (!g) continue;
      // Stagger the hover bob, or the formation reads as one rigid object.
      g.position.set(x, ALT + Math.sin(t * 1.7 + i * 2.1) * 0.03, z);
      g.rotation.y = heading;
      // Bank into the turns, which is where the track curvature actually is.
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.05);
    }
  });

  return (
    <>
      {Array.from({ length: CRAFT }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            craft.current[i] = g;
          }}
        >
          {/* Scaled to read as an aircraft over a field, not a model on a desk. */}
          <group scale={0.5}>
            <SurveyDrone />
          </group>
        </group>
      ))}
    </>
  );
}

/** Fixed high-oblique frame: this is a map being drawn, not a hero orbit. */
function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, -0.1, 0), []);

  useFrame((state) => {
    const pull = state.size.width / state.size.height < 1.4 ? 1.34 : 1;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.7, 0.05);
    camera.position.y = 8.4 * pull;
    camera.position.z = 9.6 * pull;
    camera.lookAt(target);
  });

  return null;
}

function Scene() {
  const probes = useRef<Probe[]>(
    Array.from({ length: CRAFT }, () => ({ x: -FIELD_X, z: LANE_Z[0], p: 0 })),
  );

  return (
    <>
      <fog attach="fog" args={[colors.night, 12, 24]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#FFE6C6", colors.ridge, 0.8]} />
      <directionalLight position={[3, 7, 4]} intensity={2.4} color="#FFF2E0" />
      <pointLight position={[0, 2.4, 0]} intensity={9} distance={9} color={colors.survey} />

      <Grid
        args={[26, 26]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={colors.line}
        sectionSize={LANE_W}
        sectionThickness={1}
        sectionColor={colors.boneFaint}
        fadeDistance={22}
        fadeStrength={1.2}
        followCamera={false}
      />

      {/* Survey boundary — the area someone has asked us to look at. */}
      <lineSegments position={[0, 0.004, 0]}>
        <edgesGeometry
          args={[new THREE.PlaneGeometry(FIELD_X * 2, LANE_Z.length * LANE_W).rotateX(-Math.PI / 2)]}
        />
        <lineBasicMaterial color={colors.boneFaint} transparent opacity={0.5} />
      </lineSegments>

      <Coverage probes={probes} />
      {Array.from({ length: CRAFT }, (_, i) => (
        <Swath key={i} probes={probes} craft={i} />
      ))}
      {MINES.map(([x, z, kind, yaw, by]) => (
        <Contact key={`${x}:${z}`} x={x} z={z} kind={kind} yaw={yaw} by={by} probes={probes} />
      ))}
      <Flight probes={probes} />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.3} luminanceSmoothing={0.4} intensity={0.9} radius={0.6} />
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function RasterScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "demand" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [0, 8.4, 9.6], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
