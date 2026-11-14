"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function HabitatShell() {
  return (
    <group>
      {/* Main cylinder body */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.2, 1.2, 4.5, 32, 1, true]} />
        <meshStandardMaterial color="#1e2a38" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.4} />
      </mesh>
      {/* End caps */}
      <mesh position={[-2.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#1a2535" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      <mesh position={[2.25, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#1a2535" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      {/* Ring frames */}
      {[-1.5, -0.5, 0.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.22, 0.03, 8, 32]} />
          <meshStandardMaterial color="#2a3a50" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function DuctFeed({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#2a3850" metalness={0.8} roughness={0.3} />
      </mesh>
      <LeaderLine
        from={[0, 0.5, 0]}
        to={[0.6, 1.2, 0.5]}
        label={label}
      />
    </group>
  );
}

function EgressHatch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.4, 0.05, 8, 16]} />
        <meshStandardMaterial color="#3a4a60" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.38, 16]} />
        <meshStandardMaterial color="#1a2535" metalness={0.6} roughness={0.5} transparent opacity={0.6} />
      </mesh>
      <LeaderLine from={[0.1, -0.3, 0.3]} to={[0.8, -0.9, 0.7]} label="Egress Hatch" />
    </group>
  );
}

function SmokeSensorNode({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(clock.elapsedTime * 2 + position[0] * 3) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#3fbfa0" transparent opacity={0.7} />
    </mesh>
  );
}

function AirflowVectors() {
  const arrows = useMemo(() =>
    Array.from({ length: 10 }).map((_, i) => ({
      x: (i - 4.5) * 0.45,
      y: 0.3 + Math.random() * 0.4,
    })), []
  );

  return (
    <group>
      {arrows.map((a, i) => (
        <Line
          key={i}
          points={[[a.x, a.y, -0.3], [a.x + 0.3, a.y - 0.1, 0.3]]}
          color="#2a8a72" opacity={0.1} transparent
          lineWidth={1}
        />
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
      <Text
        position={[to[0] + 0.08, to[1], to[2]]}
        fontSize={0.08}
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

export default function LunarHabitatScene() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, background: "#080c12", borderRadius: 4, position: "relative" }}>
      <Canvas camera={{ position: [4, 2, 3], fov: 38 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <color attach="background" args={["#080c12"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#d0e0f0" />
        <directionalLight position={[-3, -1, -2]} intensity={0.4} color="#4060c0" />

        <group rotation={[0, -0.4, 0]}>
          <HabitatShell />
          <DuctFeed position={[-0.8, 1.0, 0]} label="Main Duct\nFeed" />
          <DuctFeed position={[0.8, 1.0, 0]} label="Main Duct\nFeed" />
          <EgressHatch position={[2.3, 0, 0]} />
          <EgressHatch position={[-2.3, 0, 0]} />

          {/* Smoke sensor nodes */}
          {[[-1.0, 0.9, 0.4], [0, 0.9, -0.4], [1.0, 0.9, 0.4], [-0.5, -0.9, 0], [0.5, -0.9, 0]].map((p, i) => (
            <SmokeSensorNode key={i} position={p as [number, number, number]} />
          ))}

          <AirflowVectors />

          <LeaderLine from={[0.2, 1.05, 0.5]} to={[1.5, 1.6, 1.0]} label="OPTICAL SMOKE/DUST\nSENSORS" />
        </group>

        {/* HUD text */}
        <Text position={[-1.8, -1.5, 0]} fontSize={0.1} color="#8b949e" anchorX="left">
          INT. PRESSURE: 10.2 PSI
        </Text>
        <Text position={[-1.8, -1.7, 0]} fontSize={0.1} color="#d4a730" anchorX="left">
          O2 CONC: 34.0%
        </Text>
        <Text position={[0.5, -1.5, 0]} fontSize={0.1} color="#8b949e" anchorX="left">
          GRAVITY: 0.166 g
        </Text>

        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} autoRotate autoRotateSpeed={0.2} />
      </Canvas>

      <div style={{
        position: "absolute", top: 12, left: 14,
        fontSize: 10, color: "var(--label)", letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        ARTEMIS LUNAR HABITAT — PRESSURIZED CABIN
      </div>
    </div>
  );
}
