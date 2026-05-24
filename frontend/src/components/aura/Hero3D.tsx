import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import type { Mesh, Group } from "three";

function Knot() {
  const mesh = useRef<Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.15;
    mesh.current.rotation.y += delta * 0.2;
    const m = state.mouse;
    mesh.current.position.x = m.x * 0.4;
    mesh.current.position.y = m.y * 0.3;
  });
  return (
    <mesh ref={mesh} scale={1.15}>
      <torusKnotGeometry args={[1, 0.32, 220, 32]} />
      <meshStandardMaterial color="#0d0d0d" metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

function Wire() {
  const g = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!g.current) return;
    g.current.rotation.x -= delta * 0.08;
    g.current.rotation.y -= delta * 0.12;
  });
  return (
    <group ref={g}>
      <mesh scale={1.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ff5722" wireframe />
      </mesh>
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#ff5722" />
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
          <Knot />
        </Float>
        <Wire />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  );
}
