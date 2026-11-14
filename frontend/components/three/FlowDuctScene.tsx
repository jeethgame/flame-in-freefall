"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function FlowStraightener() {
  return (
    <group position={[-1.8, 0, 0]}>
      {/* Grid of thin cylinders */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh key={`${row}-${col}`} position={[0, (row - 2) * 0.25, (col - 1) * 0.25]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
            <meshStandardMaterial color="#2a3040" metalness={0.9} roughness={0.3} />
          </mesh>
        ))
      )}
      <LeaderLine from={[0, 0.9, 0.8]} to={[0.8, 1.4, 1.2]} label="Perforated Flow\nStraightener" />
    </group>
  );
}

function QuartzWindow() {
  return (
    <group position={[0, 0, 0.65]}>
      <mesh>
        <boxGeometry args={[2.4, 1.2, 0.04]} />
        <meshPhysicalMaterial color="#a0c8d8" transparent opacity={0.15} roughness={0.05} metalness={0.1} />
      </mesh>
      <LeaderLine from={[1.3, 0.3, 0]} to={[2.0, 0.8, 0.5]} label="Quartz Viewing\nWindow" />
    </group>
  );
}

function BurningSample() {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 3) * 0.15;
      flameRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 4 + 1) * 0.08;
    }
  });

  return (
    <group position={[0.2, -0.15, 0]}>
      {/* PMMA fuel strip */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.3]} />
        <meshStandardMaterial color="#8a6530" roughness={0.8} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0.3, 0.15, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#48b8ff" transparent opacity={0.7} />
      </mesh>
      {/* Flame glow */}
      <pointLight position={[0.3, 0.15, 0]} color="#48b8ff" intensity={2} distance={2} />
      <LeaderLine from={[0.3, 0.5, 0.3]} to={[1.4, 1.0, 0.8]} label="PMMA Fuel\nSample Strip" />
    </group>
  );
}

function InletVent() {
  return (
    <group position={[2.0, -0.4, 0]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#3a4555" metalness={0.8} roughness={0.3} />
      </mesh>
      <LeaderLine from={[0, -0.3, 0.3]} to={[0.6, -0.9, 0.8]} label="Inlet Vent /\nFlow Control" />
    </group>
  );
}

function InstrumentPort() {
  return (
    <group position={[-0.5, -0.55, 0.5]}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 6]} />
        <meshStandardMaterial color="#445060" metalness={0.9} roughness={0.2} />
      </mesh>
      <LeaderLine from={[0, -0.15, 0.15]} to={[0.5, -0.7, 0.6]} label="Instrumentation\nPort" />
    </group>
  );
}

function DuctBody() {
  return (
    <mesh>
      <boxGeometry args={[3.8, 1.3, 1.2]} />
      <meshStandardMaterial color="#2a3850" metalness={0.5} roughness={0.4} transparent opacity={0.85} />
    </mesh>
  );
}

function LeaderLine({ from, to, label }: { from: [number, number, number]; to: [number, number, number]; label: string }) {
  return (
    <group>
      <Line points={[from, to]} color="#5a6577" lineWidth={1} dashed dashSize={0.05} gapSize={0.03} />
      {/* Dot at start */}
      <mesh position={from}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#3fbfa0" />
      </mesh>
      <Text
        position={[to[0] + 0.1, to[1], to[2]]}
        fontSize={0.09}
        color="#8b949e"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.5}
      >
        {label}
      </Text>
    </group>
  );
}

function FlowArrows() {
  const arrowPositions = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      y: (i - 2.5) * 0.2,
      z: (Math.random() - 0.5) * 0.6,
    })), []
  );

  return (
    <group>
      {arrowPositions.map((pos, i) => (
        <Line
          key={i}
          points={[[-1.5, pos.y, pos.z], [1.5, pos.y, pos.z]]}
          color="#2a8a72" opacity={0.2} transparent
          lineWidth={1}
        />
      ))}
    </group>
  );
}

export default function FlowDuctScene() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, background: "#080c12", borderRadius: 4 }}>
      <Canvas camera={{ position: [3, 2, 3], fov: 40 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#080c12"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#d0e0f0" />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#4060c0" />
        <pointLight position={[0, 0, 2]} intensity={0.5} color="#a0c0d0" />

        <group rotation={[0, -0.3, 0]}>
          <DuctBody />
          <FlowStraightener />
          <QuartzWindow />
          <BurningSample />
          <InletVent />
          <InstrumentPort />
          <FlowArrows />
        </group>

        {/* Bottom HUD text */}
        <Text position={[-1.2, -1.2, 0]} fontSize={0.1} color="#3fbfa0" anchorX="left">
          FLOW VELOCITY: 5.2 cm/s
        </Text>
        <Text position={[0.8, -1.2, 0]} fontSize={0.1} color="#3fbfa0" anchorX="left">
          CHAMBER PRESSURE: 1.0 atm
        </Text>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>

      {/* Overlay label */}
      <div style={{
        position: "absolute", top: 12, left: 14,
        fontSize: 10, color: "var(--label)", letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        MICROGRAVITY SCIENCE GLOVEBOX (MSG) — SPICE
      </div>
    </div>
  );
}
