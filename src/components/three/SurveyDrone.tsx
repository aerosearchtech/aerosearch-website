"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { colors } from "@/theme/colors";

/**
 * A purpose-built survey quadcopter, modelled in code.
 *
 * Deliberately plain: clean booms, flat skids, a sensor bay. It should read as a
 * working survey aircraft a mine action team would actually fly, not as a
 * weapon — the aircraft saves lives rather than takes them, and it has to say so.
 */

const BOOM_R = 1.02; // motor distance from centre
const ROTOR_R = 0.56;
const ANGLES = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180);

const BODY = "#262019";
const BOOM = "#2E271F";
const METAL = "#4A4136";

function Rotor({ angle, spin }: { angle: number; spin: number }) {
  const blades = useRef<THREE.Group>(null);
  const x = Math.cos(angle) * BOOM_R;
  const z = Math.sin(angle) * BOOM_R;

  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.y += spin * dt;
  });

  return (
    <group position={[x, 0.02, z]}>
      {/* Motor can */}
      <mesh>
        <cylinderGeometry args={[0.088, 0.098, 0.14, 20]} />
        <meshStandardMaterial color={METAL} metalness={0.9} roughness={0.32} />
      </mesh>

      {/* Blades — two per motor, thin and slightly pitched. */}
      <group ref={blades} position={[0, 0.1, 0]}>
        {[0, Math.PI].map((b) => (
          <mesh key={b} rotation={[0, b, 0.06]} position={[Math.cos(b) * ROTOR_R * 0.5, 0, 0]}>
            <boxGeometry args={[ROTOR_R, 0.008, 0.062]} />
            <meshStandardMaterial color="#0E0C0A" metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Disc standing in for rotor blur. */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ROTOR_R, 44]} />
        <meshBasicMaterial
          color={colors.boneMuted}
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Boom({ angle }: { angle: number }) {
  return (
    <group rotation={[0, -angle, 0]}>
      <mesh position={[BOOM_R / 2, 0.01, 0]}>
        <boxGeometry args={[BOOM_R, 0.06, 0.075]} />
        <meshStandardMaterial color={BOOM} metalness={0.6} roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Flat skid landing gear — no claws, no talons. */
function Skid({ side }: { side: number }) {
  return (
    <group position={[0, -0.3, side * 0.34]}>
      <mesh>
        <boxGeometry args={[0.86, 0.035, 0.05]} />
        <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.4} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.11, 0]}>
          <boxGeometry args={[0.035, 0.22, 0.035]} />
          <meshStandardMaterial color={METAL} metalness={0.85} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function SurveyDrone() {
  return (
    <group>
      {/* Fuselage */}
      <RoundedBox args={[1.16, 0.3, 0.5]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color={BODY} metalness={0.55} roughness={0.4} />
      </RoundedBox>

      {/* Upper avionics deck */}
      <RoundedBox args={[0.62, 0.11, 0.36]} radius={0.04} smoothness={4} position={[0, 0.19, 0]}>
        <meshStandardMaterial color={BOOM} metalness={0.7} roughness={0.35} />
      </RoundedBox>

      {/* GNSS puck */}
      <mesh position={[-0.12, 0.28, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.035, 20]} />
        <meshStandardMaterial color="#0D0B09" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Nose marker — forward reference, bone (cleared) */}
      <mesh position={[0.6, 0.02, 0]}>
        <sphereGeometry args={[0.035, 14, 14]} />
        <meshStandardMaterial
          color={colors.bone}
          emissive={colors.bone}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* Tail beacon — signal red */}
      <mesh position={[-0.6, 0.02, 0]}>
        <sphereGeometry args={[0.032, 14, 14]} />
        <meshStandardMaterial
          color={colors.signal}
          emissive={colors.signal}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {ANGLES.map((a) => (
        <Boom key={a} angle={a} />
      ))}
      {ANGLES.map((a, i) => (
        <Rotor key={a} angle={a} spin={i % 2 === 0 ? 46 : -46} />
      ))}

      <Skid side={1} />
      <Skid side={-1} />
    </group>
  );
}
