"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Particles() {
  const points = useRef<THREE.Points>(null!);

  const count = 120;

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
  }

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    points.current.rotation.y = t * 0.05;
    points.current.rotation.x = Math.sin(t * 0.1) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.05}
        color="#d4af37"
        transparent
        opacity={0.8}
      />
    </points>
  );
}

function GlowRing() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.z = t * 0.2;
    ref.current.scale.setScalar(1 + Math.sin(t) * 0.05);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.2, 1.6, 64]} />
      <meshBasicMaterial
        color="#d4af37"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* 🖼️ BACKGROUND IMAGE */}
      <img
        src="/hero-perfume.jpg"
        alt="Miraaq Hero"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />

      {/* 🌑 DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/60" />

      {/* ✨ 3D CANVAS OVERLAY */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#d4af37" />

        <GlowRing />
        <Particles />
      </Canvas>

      {/* 🧭 TEXT LAYER */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">

        <p className="text-xs tracking-[0.4em] text-yellow-300 uppercase">
          From Nature. For Legacy.
        </p>

        <h1 className="text-5xl md:text-7xl font-serif text-white tracking-widest mt-4">
          TIMELESS ESSENCE
        </h1>

        <p className="mt-4 text-gray-300 max-w-xl">
          Crafted with rare ingredients. Worn by legends.
        </p>

        <button className="mt-8 px-8 py-3 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black transition">
          Discover Miraaq
        </button>
      </div>
    </div>
  );
}