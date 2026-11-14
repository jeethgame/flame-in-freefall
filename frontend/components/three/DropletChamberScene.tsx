"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function ChamberBody() {
  return (
    <group>
      {/* Main sphere chamber */}
      <mesh>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshStandardMaterial color="#1a2535" metalness={0.5} roughness={0.3} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.04, 8, 64]} />
        <meshStandardMaterial color="#2a3a50" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Top flange */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.15, 32]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Bottom flange */}
      <mesh position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.15, 32]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function NeedleAssembly() {
  return (
    <group position={[0, 1.1, 0]}>
      {/* Deployment needle */}
      <mesh>
        <cylinderGeometry args={[0.015, 0.005, 1.6, 8]} />
        <meshStandardMaterial color="#5a6a80" metalness={0.9} roughness={0.1} />
      </mesh>
      <LeaderLine from={[-0.1, 0.5, 0.3]} to={[-0.8, 1.0, 0.8]} label="Opposing Needle\nAssembly" />
    </group>
  );
}

function FuelDroplet() {
  const ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.scale.set(
        1 + Math.sin(t * 1.5) * 0.03,
        1 + Math.sin(t * 1.8) * 0.03,
        1 + Math.sin(t * 2.0 + 0.5) * 0.03,
      );
    }
    if (haloRef.current) {
      // Extinction halo slowly shrinks
      const shrink = 1.0 - Math.sin(t * 0.3) * 0.15;
      haloRef.current.scale.set(shrink, shrink, shrink);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Golden fuel droplet */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#d4a730" metalness={0.4} roughness={0.6} emissive="#d4a730" emissiveIntensity={0.3} />
      </mesh>
      <pointLight color="#d4a730" intensity={1} distance={2} />

      {/* Shrinking extinction flame halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#48b8ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner halo ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.02, 8, 32]} />
        <meshBasicMaterial color="#48b8ff" transparent opacity={0.3} />
      </mesh>

      <LeaderLine from={[0, 0, 0.5]} to={[0.8, -0.3, 1.2]} label="Heptane Fuel\nDroplet" />
      <LeaderLine from={[0.5, 0.2, 0.3]} to={[1.2, 0.8, 1.0]} label="Shrinking Extinction\nFlame Halo" />
    </group>
  );
}

function CO2Nozzles() {
  const nozzlePositions: [number, number, number][] = [
    [1.0, 0.5, 0.5],
    [1.0, -0.5, 0.5],
    [-1.0, 0.5, -0.5],
    [-1.0, -0.5, -0.5],
  ];

  return (
    <group>
      {nozzlePositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
            <meshStandardMaterial color="#3a4a5a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <LeaderLine from={[1.0, -0.5, 0.6]} to={[1.5, -0.9, 1.0]} label="CO2 Diluent\nNozzles" />
    </group>
  );
}

function LeaderLine({ from, to, label }: { from: [number, number, number]; to: [number, number, number]; label: string }) {
  return (
    <group>
      <Line points={[from, to]} color="#5a6577" lineWidth={1} dashed dashSize={0.05} gapSize={0.03} />
      <mesh position={from}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#3fbfa0" />
      </mesh>
      <Text position={[to[0] + 0.08, to[1], to[2]]} fontSize={0.07} color="#8b949e" anchorX="left" anchorY="middle" maxWidth={1.5}>
        {label}
      </Text>
    </group>
  );
}

export default function DropletChamberScene() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, background: "#080c12", borderRadius: 4, position: "relative" }}>
      <Canvas camera={{ position: [3, 1.5, 3], fov: 38 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#080c12"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 4]} intensity={1.2} color="#d0e0f0" />
        <directionalLight position={[-3, -1, -3]} intensity={0.4} color="#4060c0" />

        <group rotation={[0, -0.3, 0]}>
          <ChamberBody />
          <NeedleAssembly />
          <FuelDroplet />
          <CO2Nozzles />
        </group>

        <Text position={[-1.2, -1.8, 0]} fontSize={0.09} color="#3fbfa0" anchorX="left">
          CHAMBER PRESSURE: 10.2 PSI
        </Text>
        <Text position={[0.5, -1.8, 0]} fontSize={0.09} color="#8b949e" anchorX="left">
          MDCA CONFIGURATION: HIGH-RES SENSORS
        </Text>

        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} autoRotate autoRotateSpeed={0.25} />
      </Canvas>

      <div style={{
        position: "absolute", top: 12, left: 14,
        fontSize: 10, color: "var(--label)", letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        CIR MULTI-USER DROPLET COMBUSTION APPARATUS (MDCA)
      </div>
    </div>
  );
}
