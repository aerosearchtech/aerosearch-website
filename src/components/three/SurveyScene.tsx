"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Grid, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { colors } from "@/theme/colors";
import SurveyDrone from "./SurveyDrone";

const GROUND_Y = -2.35;
const DRONE_Y = 0.75;
const GIMBAL_LOCAL_Y = -0.18; // gimbal offset within the (floating) drone group
// The cone is a world-space child, so its apex must use the gimbal's WORLD height.
const GIMBAL_WORLD_Y = DRONE_Y + GIMBAL_LOCAL_Y;
const DROP = GIMBAL_WORLD_Y - GROUND_Y; // vertical throw from gimbal to ground
const CONE_RADIUS = 0.62;
const MAX_SLEW = 0.3; // radians either side of nadir
// Push the aircraft off-centre so the headline keeps a clean column on the left.
const FRAME_OFFSET = 1.55;

/**
 * Gimbal slew angle at time t. The payload and its ground footprint both read
 * this, which is what keeps the cone and the footprint locked together.
 */
const slewAt = (t: number): number => Math.sin(t * 0.4) * MAX_SLEW;

/** Generic 3-axis gimbal: roll ring, camera ball, lens. No sensor is implied. */
function GimbalPayload() {
  const yoke = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (yoke.current) yoke.current.rotation.z = slewAt(state.clock.elapsedTime);
  });

  return (
    <group position={[0, GIMBAL_LOCAL_Y, 0]}>
      {/* Fixed mount onto the airframe */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.16, 0.14, 0.16]} />
        <meshStandardMaterial color="#2A2622" metalness={0.9} roughness={0.4} />
      </mesh>

      {/* Slewing assembly */}
      <group ref={yoke}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.022, 10, 36]} />
          <meshStandardMaterial color="#3A342E" metalness={0.95} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial color="#17140F" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Lens, facing down the scan axis */}
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.062, 0.075, 0.07, 20]} />
          <meshStandardMaterial
            color="#0C0A08"
            metalness={0.4}
            roughness={0.15}
            emissive={colors.survey}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}

/** The scan volume: a soft cone hinged at the gimbal, sweeping the ground. */
function ScanCone() {
  const pivot = useRef<THREE.Group>(null);

  useFrame((state) => {
    const a = slewAt(state.clock.elapsedTime);
    if (!pivot.current) return;
    // Rotating about +Z throws the tip toward +X, matching the footprint's +tan.
    pivot.current.rotation.z = a;
    // A rigid cone would lift off the ground as it tilts; stretch it so the beam
    // stays planted exactly where the footprint sits.
    pivot.current.scale.y = 1 / Math.cos(a);
  });

  return (
    <group ref={pivot} position={[0, GIMBAL_WORLD_Y, 0]}>
      {/* Cone apex sits on the pivot; the base lands on the ground plane. */}
      <mesh position={[0, -DROP / 2, 0]}>
        <coneGeometry args={[CONE_RADIUS, DROP, 48, 1, true]} />
        <meshBasicMaterial
          color={colors.survey}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Denser inner core gives the beam body rather than a flat wash. */}
      <mesh position={[0, -DROP / 2, 0]}>
        <coneGeometry args={[CONE_RADIUS * 0.45, DROP, 32, 1, true]} />
        <meshBasicMaterial
          color={colors.survey}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Where the scan meets the ground: a bright ring tracking the cone. */
function Footprint() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = slewAt(t);
    if (group.current) group.current.position.x = Math.tan(angle) * DROP;
    // Breathe the core so the contact point reads as live, not painted on.
    if (inner.current) {
      const m = inner.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.16 + Math.sin(t * 3.1) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, GROUND_Y + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[CONE_RADIUS * 0.92, CONE_RADIUS, 64]} />
        <meshBasicMaterial
          color={colors.survey}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={inner}>
        <circleGeometry args={[CONE_RADIUS * 0.92, 48]} />
        <meshBasicMaterial
          color={colors.survey}
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Ground already covered by earlier passes — quiet context, not the subject. */
function SurveyedLanes() {
  const lanes = useMemo(() => [-3.1, -2.2, 2.2, 3.1], []);
  return (
    <group position={[0, GROUND_Y + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {lanes.map((z) => (
        <mesh key={z} position={[0, z, 0]}>
          <planeGeometry args={[9, 0.55]} />
          <meshBasicMaterial
            color={colors.survey}
            transparent
            opacity={0.045}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Key light pinned to the camera. The rig orbits, so a fixed fill slides off the
 * airframe and leaves it reading as a silhouette; this one never does.
 */
function KeyLight() {
  const light = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!light.current) return;
    light.current.position.copy(camera.position);
    light.current.position.y += 1.4;
  });

  return <pointLight ref={light} intensity={30} distance={24} color="#FFEDD4" />;
}

/** Slow cinematic orbit at a low, heroic angle with a touch of pointer parallax. */
function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, -0.5, 0), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = t * 0.038 + pointer.x * 0.3;
    const radius = 7.4;
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.5 + pointer.y * 0.5, 0.04);
    camera.lookAt(target);
    // Slide the camera along its own X so the subject sits right of frame at any
    // orbit angle, leaving the headline column clear. Dropped on narrow screens,
    // where the copy stacks over the scene instead of beside it.
    if (state.size.width >= 900) camera.translateX(-FRAME_OFFSET);
  });

  return null;
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={[colors.night, 9, 26]} />
      <color attach="background" args={[colors.night]} />

      {/*
       * The camera orbits, so positioned fills drift off the subject. Ambient and
       * the HDRI carry the base exposure (view-independent), and the directional
       * lights only shape it.
       */}
      <ambientLight intensity={0.5} />
      <spotLight position={[5, 9, 3]} angle={0.6} penumbra={0.9} intensity={9} color="#FFF2E0" />
      <hemisphereLight args={["#FFE6C6", colors.ridge, 0.7]} />
      <KeyLight />
      {/* Ochre back-rim carves the airframe out of the dark. */}
      <pointLight position={[-3.4, 1.6, -4.6]} intensity={30} distance={16} color={colors.survey} />
      {/* Ground bounce under the scan. */}
      <pointLight position={[0, GROUND_Y + 0.7, 0]} intensity={7} distance={8} color={colors.survey} />

      <Environment files="/hdri/studio.hdr" environmentIntensity={1.05} />

      {/* Survey grid standing in for the ground itself. */}
      <Grid
        position={[0, GROUND_Y, 0]}
        args={[40, 40]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={colors.line}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={colors.boneFaint}
        fadeDistance={26}
        fadeStrength={1.4}
        infiniteGrid
        followCamera={false}
      />

      <SurveyedLanes />
      <ScanCone />
      <Footprint />

      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.3} floatingRange={[-0.04, 0.08]}>
        <group position={[0, DRONE_Y, 0]}>
          <SurveyDrone />
          <GimbalPayload />
        </group>
      </Float>

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.25} luminanceSmoothing={0.4} intensity={0.75} radius={0.7} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.22} />
        <Vignette eskil={false} offset={0.24} darkness={0.92} />
      </EffectComposer>
    </>
  );
}

export default function SurveyScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "demand" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [5.2, 1.6, 5.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
      }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
