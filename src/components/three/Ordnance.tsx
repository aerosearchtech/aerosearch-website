"use client";

import * as THREE from "three";
import { colors } from "@/theme/colors";

/**
 * The buried object itself, seen as the sensor sees it — a silhouette under the
 * soil rather than a pin on top of it.
 *
 * Four generic shapes, so a field reads as mixed contamination. None of them is
 * an identifiable munition, and none is ever labelled: the point is that
 * something is down there, not what model it is. Always signal red, which on
 * this site means one thing only — contaminated, do not enter.
 */

export const ORDNANCE_KINDS = 4;

const cSignal = new THREE.Color(colors.signal);

export default function Ordnance({ kind }: { kind: number }) {
  if (kind === 1) {
    // Elongated shell, lying where it fell.
    return (
      <mesh rotation={[0, 0, Math.PI / 2 - 0.15]}>
        <capsuleGeometry args={[0.075, 0.3, 4, 12]} />
        <meshBasicMaterial color={cSignal} toneMapped={false} />
      </mesh>
    );
  }

  if (kind === 2) {
    // Stake mine: small body on a post, with radial prongs.
    return (
      <group>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 10]} />
          <meshBasicMaterial color={cSignal} toneMapped={false} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i * Math.PI) / 2) * 0.11, 0.13, Math.sin((i * Math.PI) / 2) * 0.11]}
            rotation={[0, 0, 0.5]}
          >
            <boxGeometry args={[0.015, 0.11, 0.015]} />
            <meshBasicMaterial color={cSignal} toneMapped={false} />
          </mesh>
        ))}
      </group>
    );
  }

  if (kind === 3) {
    // Compact canister.
    return (
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.11, 10]} />
        <meshBasicMaterial color={cSignal} toneMapped={false} />
      </mesh>
    );
  }

  // Blast disc: squat body, rim, and a centre plate.
  return (
    <group>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.15, 0.14, 0.07, 24]} />
        <meshBasicMaterial color={cSignal} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.075, 0.115, 24]} />
        <meshBasicMaterial color={colors.night} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
        <meshBasicMaterial color={cSignal} toneMapped={false} />
      </mesh>
    </group>
  );
}
