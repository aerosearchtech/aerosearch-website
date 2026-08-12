"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { colors, feeds } from "@/theme/colors";
import SurveyDrone from "./SurveyDrone";
import Ordnance from "./Ordnance";

/**
 * A formation holding station over moving ground.
 *
 * The argument the scene makes is fusion: every aircraft carries a different
 * pod, every pod reads a different shape of ground, and the shapes overlap into
 * one continuous band no single aircraft could cover. Nothing here names a
 * sensor — the silhouettes are deliberately generic, and the footprint each one
 * throws is the only thing that distinguishes it.
 */

const ALT = 2; // formation altitude above the ground plane
const SPEED = 1.9; // ground speed, in grid units per second
const SECTION = 1.2; // grid section size; the ground scroll wraps on it

type Craft = {
  /** Station in the formation. */
  readonly x: number;
  readonly z: number;
  /** Which pod hangs under it, and therefore what shape it reads. */
  readonly pod: number;
  /** Span of its footprint on the ground, across track and along it. */
  readonly w: number;
  readonly d: number;
  /** Facets in the beam — round apertures read round, flat ones read square. */
  readonly seg: number;
  /** Pulse rate, so the feeds are visibly not in lockstep. */
  readonly rate: number;
  /** This aircraft's channel colour, shared by its aperture and its beam. */
  readonly tint: string;
};

/**
 * An echelon, not a rank: stations recede so the nearest aircraft is close
 * enough to read its pod and the rest fall away behind it. The spans still
 * overlap across track, which is the point — no gap in the band.
 */
const FORMATION: readonly Craft[] = [
  { x: -2.7, z: 2.6, pod: 0, w: 1.9, d: 1.9, seg: 32, rate: 2.1, tint: feeds[0] },
  { x: -1.1, z: 0.7, pod: 1, w: 2.0, d: 0.6, seg: 4, rate: 3.3, tint: feeds[1] },
  { x: 0.55, z: -1.2, pod: 2, w: 2.3, d: 2.3, seg: 32, rate: 1.6, tint: feeds[2] },
  { x: 2.2, z: -3.1, pod: 3, w: 1.85, d: 0.35, seg: 4, rate: 4.2, tint: feeds[3] },
  { x: 3.85, z: -5, pod: 4, w: 2.0, d: 1.2, seg: 4, rate: 2.7, tint: feeds[4] },
];

/** The lit aperture on every pod, and the colour of everything it throws. */
function Aperture({ tint, ...props }: React.ComponentProps<"mesh"> & { tint: string }) {
  return (
    <mesh {...props}>
      <meshBasicMaterial color={tint} toneMapped={false} />
    </mesh>
  );
}

/** Slung clear of the skids, where a payload actually hangs and can be seen. */
const PIVOT = -0.52;

/** Five pods, none of them an identifiable instrument. */
function Pod({ kind, tint }: { kind: number; tint: string }) {
  const shell = <meshStandardMaterial color={colors.ridge} metalness={0.7} roughness={0.35} />;

  const body = () => {
    if (kind === 1) {
      // Flat panel, looking straight down across the track.
      return (
        <>
          <mesh>
            <boxGeometry args={[0.5, 0.08, 0.17]} />
            {shell}
          </mesh>
          <Aperture tint={tint} position={[0, -0.05, 0]}>
            <boxGeometry args={[0.44, 0.022, 0.11]} />
          </Aperture>
        </>
      );
    }

    if (kind === 2) {
      // Broad dome.
      return (
        <>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
            {shell}
          </mesh>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {shell}
          </mesh>
          <Aperture tint={tint} position={[0, -0.235, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.075, 16]} />
          </Aperture>
        </>
      );
    }

    if (kind === 3) {
      // Slim bar slung across the track.
      return (
        <>
          <mesh>
            <boxGeometry args={[0.62, 0.05, 0.05]} />
            {shell}
          </mesh>
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.075, 12]} />
              {shell}
            </mesh>
          ))}
          <Aperture tint={tint} position={[0, -0.035, 0]}>
            <boxGeometry args={[0.56, 0.014, 0.022]} />
          </Aperture>
        </>
      );
    }

    if (kind === 4) {
      // Block with a pair of apertures.
      return (
        <>
          <mesh>
            <boxGeometry args={[0.33, 0.18, 0.22]} />
            {shell}
          </mesh>
          {[-0.08, 0.08].map((x) => (
            <Aperture tint={tint} key={x} position={[x, -0.1, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.045, 14]} />
            </Aperture>
          ))}
        </>
      );
    }

    // Gimballed ball in a yoke.
    return (
      <>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.07, 0]}>
            <boxGeometry args={[0.035, 0.2, 0.13]} />
            {shell}
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.18, 22, 16]} />
          {shell}
        </mesh>
        <Aperture tint={tint} position={[0, -0.165, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 18]} />
        </Aperture>
      </>
    );
  };

  return (
    <>
      {/* Mast down from the fuselage, common to every fit. */}
      <mesh position={[0, PIVOT / 2 - 0.04, 0]}>
        <boxGeometry args={[0.09, Math.abs(PIVOT), 0.09]} />
        {shell}
      </mesh>
      <group position={[0, PIVOT, 0]}>{body()}</group>
    </>
  );
}

/**
 * What one aircraft is reading: the beam volume and the ground it lands on.
 * Held in world space rather than under the aircraft, so the station-keeping
 * bob never drags the footprint through the soil.
 */
function Beam({ craft }: { craft: Craft }) {
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const { x, z, w, d, seg, rate, tint } = craft;

  // A polygon of `seg` sides sits inside its circle — widen it to the true span.
  const k = 1 / Math.cos(Math.PI / seg);

  useFrame((state) => {
    if (core.current) {
      core.current.opacity = 0.1 + Math.sin(state.clock.elapsedTime * rate) * 0.035;
    }
  });

  return (
    <group
      position={[x, 0, z]}
      scale={[(w / 2) * k, 1, (d / 2) * k]}
      rotation={[0, Math.PI / seg, 0]}
    >
      {/* Front faces only: with additive blending, both sides doubles the wash. */}
      <mesh position={[0, ALT / 2, 0]}>
        <cylinderGeometry args={[0.06, 1, ALT, seg, 1, true]} />
        <meshBasicMaterial
          color={tint}
          transparent
          opacity={0.035}
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <circleGeometry args={[1, seg]} />
          <meshBasicMaterial
            ref={core}
            color={tint}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[0.94, 1, seg]} />
          <meshBasicMaterial
            color={tint}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** One aircraft on station: holding altitude, never quite still. */
function Station({ craft, i }: { craft: Craft; i: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.position.y = ALT + Math.sin(t * 1.3 + i * 1.9) * 0.05;
    group.current.rotation.z = Math.sin(t * 0.9 + i) * 0.022;
  });

  return (
    <group ref={group} position={[craft.x, ALT, craft.z]}>
      <group scale={0.62}>
        <SurveyDrone />
        <Pod kind={craft.pod} tint={craft.tint} />
      </group>
    </group>
  );
}

/**
 * What is buried in the ground coming toward the formation.
 *
 * The mines travel with the soil rather than sitting in the scene, so a contact
 * is made by the ground arriving under a beam — which is the honest mechanic.
 * Once a beam has crossed one it stays resolved: the map is being built, not
 * flickering. Positions are laid out by hand so contacts arrive unevenly.
 */
const LOOP = 26; // z-distance a mine travels before it recycles, well out of frame
const MINE_Z0 = -17; // where it re-enters, far enough back to be unseen

/** x, base z, silhouette kind, yaw. */
const MINES: ReadonlyArray<readonly [number, number, number, number]> = [
  [-2.6, -1.4, 0, 0.3],
  [0.4, -4.2, 2, 1.1],
  [2.4, -7.6, 1, 0.6],
  [-1.2, -9.1, 3, 1.9],
  [3.7, -11.8, 0, 0.9],
  [-2.9, -13.4, 1, 2.6],
  [0.9, -15.9, 3, 0.2],
  [2.1, -18.7, 2, 0],
  [-0.7, -21.2, 0, 2.2],
  [3.2, -24.1, 1, -0.6],
];

function Mine({ x, z0, kind, yaw }: { x: number; z0: number; kind: number; yaw: number }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const found = useRef(false);
  const lastZ = useRef(0);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;

    // Ride the soil, recycling well behind the camera.
    const z = ((z0 + state.clock.elapsedTime * SPEED - MINE_Z0) % LOOP) + MINE_Z0;
    g.position.set(x, 0, z);

    // A wrap means a new patch of ground: forget that this one was ever called.
    if (z < lastZ.current) found.current = false;
    lastZ.current = z;

    if (!found.current) {
      found.current = FORMATION.some(
        (c) => Math.abs(x - c.x) < c.w / 2 && Math.abs(z - c.z) < c.d / 2,
      );
    }

    g.visible = found.current;
    if (!found.current) return;

    const t = state.clock.elapsedTime;
    if (shell.current) shell.current.position.y = Math.sin(t * 2.4) * 0.02;
    if (ring.current) ring.current.opacity = 0.5 + Math.sin(t * 2.4) * 0.15;
  });

  return (
    <group ref={group} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[0.19, 0.23, 36]} />
        <meshBasicMaterial
          ref={ring}
          color={colors.signal}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={shell} rotation={[0, yaw, 0]} position={[0, -0.02, 0]}>
        <Ordnance kind={kind} />
      </group>
    </group>
  );
}

/** The ground does the travelling; the formation holds frame. */
function Ground() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) group.current.position.z = (state.clock.elapsedTime * SPEED) % SECTION;
  });

  return (
    <group ref={group}>
      <Grid
        args={[44, 44]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={colors.line}
        sectionSize={SECTION}
        sectionThickness={1}
        sectionColor={colors.boneFaint}
        fadeDistance={26}
        fadeStrength={1.4}
        followCamera={false}
      />
    </group>
  );
}

/** Below the formation and looking along it — the pods are the subject. */
function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0.7, 2.25, -1.6), []);

  useFrame((state) => {
    const pull = state.size.width / state.size.height < 1.5 ? 1.4 : 1;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, -0.5 + pointer.x * 0.5, 0.05);
    camera.position.y = 0.9;
    camera.position.z = 8.6 * pull;
    camera.lookAt(target);
  });

  return null;
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={[colors.night, 10, 26]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#FFE6C6", colors.ridge, 0.8]} />
      <directionalLight position={[3, 6, 5]} intensity={2.2} color="#FFF2E0" />
      {/* Rim from behind the formation, so the near airframe reads against the dark. */}
      <directionalLight position={[-5, 3, -6]} intensity={1.4} color={colors.boneMuted} />
      {/* Neutral, so it does not tint the feeds toward one another. */}
      <pointLight position={[0, 0.5, 1]} intensity={3} distance={12} color={colors.boneMuted} />

      <Ground />

      {MINES.map(([x, z0, kind, yaw]) => (
        <Mine key={`${x}:${z0}`} x={x} z0={z0} kind={kind} yaw={yaw} />
      ))}

      {FORMATION.map((craft) => (
        <Beam key={craft.x} craft={craft} />
      ))}
      {FORMATION.map((craft, i) => (
        <Station key={craft.x} craft={craft} i={i} />
      ))}

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.45} luminanceSmoothing={0.4} intensity={0.5} radius={0.6} />
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function SwarmScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "demand" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [-0.5, 0.9, 8.6], fov: 36 }}
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
