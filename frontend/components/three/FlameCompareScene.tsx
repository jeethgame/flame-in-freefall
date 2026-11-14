"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function QuartzChamber({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Glass cylinder */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 2.0, 32, 1, true]} />
        <meshStandardMaterial color="#304860" metalness={0.2} roughness={0.15} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Wireframe edge glow */}
      <mesh>
        <cylinderGeometry args={[0.81, 0.81, 2.0, 32, 1, true]} />
        <meshBasicMaterial color="#1a3a50" wireframe transparent opacity={0.3} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.1, 32]} />
        <meshStandardMaterial color="#3a5060" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Top ring glow */}
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.015, 8, 32]} />
        <meshBasicMaterial color="#3fbfa0" transparent opacity={0.4} />
      </mesh>
      {/* Bottom base */}
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
        <meshStandardMaterial color="#3a5060" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bottom ring glow */}
      <mesh position={[0, -1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.015, 8, 32]} />
        <meshBasicMaterial color="#3fbfa0" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function MicrogravityFlame({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.scale.set(
        1 + Math.sin(t * 2.5) * 0.06,
        1 + Math.sin(t * 3.1) * 0.06,
        1 + Math.sin(t * 2.8 + 0.5) * 0.06,
      );
    }
    if (glowRef.current) {
      glowRef.current.intensity = 3 + Math.sin(clock.elapsedTime * 4) * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Spherical blue diffusion flame — 0g signature */}
      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#2080c0" transparent opacity={0.08} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#60c8ff" transparent opacity={0.65} />
      </mesh>
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#c0f0ff" transparent opacity={0.85} />
      </mesh>
      <pointLight ref={glowRef} color="#60c8ff" intensity={5} distance={4} />
    </group>
  );
}

function EarthFlame({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.scale.set(
        1 + Math.sin(t * 5) * 0.04,
        1 + Math.sin(t * 3) * 0.08,
        1 + Math.sin(t * 4 + 1) * 0.04,
      );
    }
  });

  return (
    <group position={position} ref={ref}>
      {/* Elongated teardrop — 1g buoyant flame */}
      {/* Outer glow */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial color="#c06010" transparent opacity={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 16, 32]} />
        <meshBasicMaterial color="#ff8820" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.22, 0.7, 16]} />
        <meshBasicMaterial color="#ffaa30" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.12, 0.4, 12]} />
        <meshBasicMaterial color="#ffee80" transparent opacity={0.5} />
      </mesh>
      <pointLight color="#ff8820" intensity={5} distance={4} />

      {/* Convective streamline arrows */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
        <Line
          key={i}
          points={[[z * 0.8, -0.6, z * 0.5], [z * 0.5, 0.3, z * 0.3], [z * 0.3, 0.9, z * 0.1]]}
          color="#8a4410" opacity={0.15} transparent
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function ThermocoupleRake({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vertical rod */}
      <mesh>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
        <meshStandardMaterial color="#4a5a70" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Horizontal tines */}
      {[-0.3, -0.1, 0.1, 0.3].map((y, i) => (
        <mesh key={i} position={[0.15, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 4]} />
          <meshStandardMaterial color="#5a6a80" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
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

interface FlameCompareSceneProps {
  o2Percent?: number;
  pressurePsi?: number;
}

export default function FlameCompareScene({ o2Percent = 21, pressurePsi = 14.7 }: FlameCompareSceneProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420, background: "#080c12", borderRadius: 4, position: "relative" }}>
      <Canvas camera={{ position: [0, 1.5, 6], fov: 35 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#080c12"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 4]} intensity={1.2} color="#c0d8e8" />
        <directionalLight position={[-2, 3, -3]} intensity={0.4} color="#4080c0" />

        {/* Left: 0g */}
        <group position={[-1.8, 0, 0]}>
          <QuartzChamber position={[0, 0, 0]} />
          <MicrogravityFlame position={[0, 0, 0]} />
          <ThermocoupleRake position={[-0.5, 0, 0.2]} />
          <LeaderLine from={[-0.5, 0.6, 0.4]} to={[-1.2, 1.3, 0.8]} label="Thermocouple\nRake" />
          <Text position={[0, 1.4, 0]} fontSize={0.12} color="#e6edf3" anchorX="center" fontWeight="bold">
            0g SPACE (ISS)
          </Text>
          <Text position={[0, -1.4, 0]} fontSize={0.08} color="#8b949e" anchorX="center">
            10mm Engineering Scale
          </Text>
        </group>

        {/* Right: 1g */}
        <group position={[1.8, 0, 0]}>
          <QuartzChamber position={[0, 0, 0]} />
          <EarthFlame position={[0, -0.1, 0]} />
          <LeaderLine from={[0.3, 0.4, 0.3]} to={[1.0, 1.0, 0.6]} label="Thermal Gradient\nMap" />
          <Text position={[0, 1.4, 0]} fontSize={0.12} color="#e6edf3" anchorX="center" fontWeight="bold">
            1g EARTH
          </Text>
        </group>

        {/* Bottom HUD */}
        <Text position={[-1.8, -1.8, 0]} fontSize={0.08} color="#3fbfa0" anchorX="center">
          {`CHAMBER PRESSURE: ${pressurePsi} PSI`}
        </Text>
        <Text position={[-1.8, -2.0, 0]} fontSize={0.08} color="#d4a730" anchorX="center">
          {`O2 CONC: ${o2Percent.toFixed(1)}%`}
        </Text>
        <Text position={[1.8, -1.8, 0]} fontSize={0.08} color="#8b949e" anchorX="center">
          BUOYANT VELOCITY: 24 cm/s
        </Text>
        <Text position={[0, -2.2, 0]} fontSize={0.06} color="#5a6577" anchorX="center">
          Quartz Viewport
        </Text>

        <OrbitControls enablePan={false} minDistance={4} maxDistance={10} autoRotate autoRotateSpeed={0.15} />
      </Canvas>

      {/* Corner label */}
      <div style={{
        position: "absolute", top: 12, right: 14,
        fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        ISS COMBUSTION INTEGRATED RACK (CIR)
      </div>
    </div>
  );
}
