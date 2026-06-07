"use client";

import { Suspense, useRef, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Environment,
  MeshTransmissionMaterial,
  Text,
  Sparkles,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

const FRAGRANCE_NOTES = [
  { label: "Oud", position: [2.5, 1.2, 0] as [number, number, number] },
  { label: "Amber", position: [-2.8, 0.8, 0.5] as [number, number, number] },
  { label: "Rose", position: [1.8, -1.5, 1] as [number, number, number] },
  { label: "Saffron", position: [-2, -1.2, -0.5] as [number, number, number] },
  { label: "Musk", position: [0, 2.2, -1] as [number, number, number] },
];

function PerfumeBottle() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y =
      state.clock.elapsedTime * 0.3 + pointer.x * 0.5;

    groupRef.current.rotation.x = pointer.y * 0.15;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[0, -0.5, 0]}>
          {/* Bottle body */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.6, 0.7, 2.2, 32]} />
            <MeshTransmissionMaterial
              backside
              samples={4}
              thickness={0.5}
              chromaticAberration={0.06}
              anisotropy={0.3}
              distortion={0.2}
              distortionScale={0.3}
              temporalDistortion={0.1}
              iridescence={1}
              iridescenceIOR={1.2}
              iridescenceThicknessRange={[0, 1400]}
              color="#1a1008"
              attenuationColor="#c9a10e"
              attenuationDistance={0.8}
            />
          </mesh>

          {/* Gold cap */}
          <mesh position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.5, 32]} />
            <meshStandardMaterial
              color="#c9a10e"
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>

          {/* Cap top */}
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshStandardMaterial
              color="#e2b91a"
              metalness={0.9}
              roughness={0.15}
            />
          </mesh>

          {/* Liquid */}
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.55, 0.65, 1.4, 32]} />
            <meshStandardMaterial
              color="#057848"
              transparent
              opacity={0.6}
              emissive="#057848"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* Gold band */}
          <mesh position={[0, 0.8, 0]}>
            <torusGeometry args={[0.62, 0.03, 16, 32]} />
            <meshStandardMaterial
              color="#c9a10e"
              metalness={1}
              roughness={0.05}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

function FragranceNote({
  label,
  position,
}: {
  label: string;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
  });

  return (
    <group ref={ref} position={position}>
      <Text
        fontSize={0.18}
        color="#c9a10e"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#0a0a0a"
      >
        {label}
      </Text>
    </group>
  );
}

function GoldenParticles() {
  return (
    <>
      <Sparkles count={200} scale={8} size={2} speed={0.3} color="#c9a10e" />
      <Sparkles count={80} scale={6} size={3} speed={0.2} color="#e2b91a" />
    </>
  );
}

function Scene() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.x = pointer.x * 5;
      lightRef.current.position.y = 5 + pointer.y * 3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />

      <directionalLight
        ref={lightRef}
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        color="#fff5e0"
      />

      <pointLight position={[-3, 2, -2]} intensity={0.8} color="#c9a10e" />
      <pointLight position={[3, -1, 2]} intensity={0.5} color="#057848" />

      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#c9a10e"
        castShadow
      />

      <PerfumeBottle />
      <GoldenParticles />

      {FRAGRANCE_NOTES.map((note) => (
        <FragranceNote key={note.label} {...note} />
      ))}

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={8}
        blur={2}
        far={4}
        color="#c9a10e"
      />

      <Environment preset="night" />
    </>
  );
}

function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-32 h-48 rounded-lg bg-gradient-to-b from-gold-500/20 to-emerald-800/20 animate-pulse" />
    </div>
  );
}

function Hero3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Suspense fallback={<HeroFallback />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default memo(Hero3D);