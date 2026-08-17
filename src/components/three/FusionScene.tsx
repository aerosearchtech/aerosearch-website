"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { feeds } from "@/theme/colors";

/**
 * Three channels reading the same ground, brought into register.
 *
 * The whole argument rests on one property of noise: it does not repeat. Each
 * channel here carries its own grain, its own false returns, and only a partial
 * view of what is actually there — no single one of them is trustworthy, and the
 * scene never pretends otherwise.
 *
 * Blending is additive and nothing is brightened by hand. When the channels come
 * into register, the returns that are genuinely in the same place land on top of
 * each other and go white; the ones that only ever existed in one channel stay
 * dim and stay tinted. What emerges, emerges because it was really there.
 *
 * Nothing here names a sensor. The three hues are channels, not instruments.
 */

const CHANNELS = 3;
const PERIOD = 15; // seconds for one drift-and-register cycle
const DRIFT = 1.05; // how far out of register a channel travels

/** The sheets overfill the frame at every aspect, so no edge is ever visible. */
const SHEET_W = 11;
const SHEET_H = 6.5;
const NOISE = 1100; // uncorrelated grain, per channel

/** Returns per cluster, whether the cluster is real or not. */
const PER_CLUSTER = 70;
const CLUSTER_R = 0.34;
const FALSE_PER_CHANNEL = 3;

/**
 * What is actually on the ground. Held well inside the frame so the whole set
 * survives the narrow aspect the layout falls back to on a phone.
 */
const REAL: ReadonlyArray<readonly [number, number]> = [
  [-2.75, 0.85],
  [-1.15, -1.15],
  [0.35, 0.45],
  [1.95, -0.95],
  [2.9, 1.05],
];

/** Deterministic, so the field is the same field on every load. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Uniform scatter across a disc — clusters read as returns, not as dots. */
function disc(r: () => number, radius: number): [number, number] {
  const rad = radius * Math.sqrt(r());
  const a = r() * Math.PI * 2;
  return [rad * Math.cos(a), rad * Math.sin(a)];
}

/**
 * One channel's raw feed: grain everywhere, its own false returns, and every
 * real return except the one it happens to be blind to.
 */
function buildChannel(c: number): Float32Array {
  const r = rng(9001 + c * 7919);
  const seen = REAL.filter((_, i) => i !== c);
  const total = NOISE + (seen.length + FALSE_PER_CHANNEL) * PER_CLUSTER;
  const pos = new Float32Array(total * 3);
  let i = 0;

  const put = (x: number, y: number) => {
    pos[i++] = x;
    pos[i++] = y;
    pos[i++] = 0;
  };

  for (let n = 0; n < NOISE; n++) {
    put((r() - 0.5) * SHEET_W, (r() - 0.5) * SHEET_H);
  }

  // Real returns sit at identical local coordinates in every channel, which is
  // the only reason they can ever coincide.
  for (const [x, y] of seen) {
    for (let n = 0; n < PER_CLUSTER; n++) {
      const [dx, dy] = disc(r, CLUSTER_R);
      put(x + dx, y + dy);
    }
  }

  for (let f = 0; f < FALSE_PER_CHANNEL; f++) {
    const cx = (r() - 0.5) * 6.4;
    const cy = (r() - 0.5) * 3.2;
    for (let n = 0; n < PER_CLUSTER; n++) {
      const [dx, dy] = disc(r, CLUSTER_R);
      put(cx + dx, cy + dy);
    }
  }

  return pos;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * How far into register the channels are: they close over most of the cycle,
 * hold there long enough to be read, then fall back out.
 */
function register(p: number): number {
  if (p < 0.5) return smooth(p / 0.5);
  if (p < 0.78) return 1;
  return smooth(1 - (p - 0.78) / 0.22);
}

function Field() {
  const groups = useRef<THREE.Points[]>([]);
  const { pointer } = useThree();

  const sheets = useMemo(
    () =>
      Array.from({ length: CHANNELS }, (_, c) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(buildChannel(c), 3));
        // Directions 120° apart, so out of register the channels separate on
        // three different axes rather than sliding along one.
        const a = (c / CHANNELS) * Math.PI * 2 + 0.4;
        return { geometry: g, tint: feeds[c], dx: Math.cos(a), dy: Math.sin(a) };
      }),
    [],
  );

  useFrame((state) => {
    const p = (state.clock.elapsedTime % PERIOD) / PERIOD;
    const off = (1 - register(p)) * DRIFT;
    sheets.forEach((s, c) => {
      const g = groups.current[c];
      if (!g) return;
      g.position.set(s.dx * off, s.dy * off, 0);
    });

    // The same restrained parallax the other scenes use; the field is a surface
    // being looked at, not an object being orbited.
    const cam = state.camera;
    cam.position.x += (pointer.x * 0.35 - cam.position.x) * 0.04;
    cam.position.y += (pointer.y * 0.2 - cam.position.y) * 0.04;
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      {sheets.map((s, c) => (
        <points
          key={s.tint}
          ref={(el) => {
            if (el) groups.current[c] = el;
          }}
          geometry={s.geometry}
        >
          <pointsMaterial
            size={0.055}
            color={s.tint}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      ))}

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.4} intensity={0.7} radius={0.5} />
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

export default function FusionScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "demand" | "never";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8.6], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <Suspense fallback={null}>
        <Field />
      </Suspense>
    </Canvas>
  );
}
