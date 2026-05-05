import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────
   LADY OF JUSTICE — Bright White Marble, Centre-Stage
   Mouse-reactive via shared ref from parent
   ───────────────────────────────────────────────────── */

function ScalePan({ position, swingPhase = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 1.2 + swingPhase) * 0.06;
  });

  const chainMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.95, roughness: 0.08 }), []);
  const panMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0f0f0', metalness: 0.85, roughness: 0.12 }), []);

  return (
    <group ref={ref} position={position}>
      {[-0.12, 0, 0.12].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.15, 0]} material={chainMat}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        </mesh>
      ))}
      <mesh material={panMat}>
        <sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={chainMat}>
        <torusGeometry args={[0.2, 0.012, 8, 24]} />
      </mesh>
    </group>
  );
}

function LadyJustice({ mousePos }) {
  const groupRef = useRef();
  const targetRot = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    if (mousePos.current) {
      targetRot.current.x = mousePos.current.y * 0.15;
      targetRot.current.y = mousePos.current.x * 0.3;
    }
    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.04;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.04;
  });

  // Bright white marble — stands out against dark background
  const marble = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 0.05,
    roughness: 0.35,
    emissive: '#444444',
    emissiveIntensity: 0.15,
  }), []);

  // Slightly warm white for accents
  const marbleWarm = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f5f0e8',
    metalness: 0.08,
    roughness: 0.4,
    emissive: '#333333',
    emissiveIntensity: 0.1,
  }), []);

  const metalSilver = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e0e0e0',
    metalness: 0.95,
    roughness: 0.05,
    emissive: '#222222',
    emissiveIntensity: 0.1,
  }), []);

  const blindfoldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#e8e0d5',
    metalness: 0.02,
    roughness: 0.7,
    emissive: '#333333',
    emissiveIntensity: 0.1,
  }), []);

  return (
    <group ref={groupRef} position={[0, -2.2, 0]}>
      {/* ——— PEDESTAL ——— */}
      <mesh position={[0, 0, 0]} material={marble} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.2, 1.8]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={marble} castShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.5, 8]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={marble} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.8, 16]} />
      </mesh>
      <mesh position={[0, 1.35, 0]} material={marble} castShadow>
        <cylinderGeometry args={[0.55, 0.45, 0.1, 16]} />
      </mesh>

      {/* ——— ROBE / BODY ——— */}
      <mesh position={[0, 1.85, 0]} material={marble} castShadow>
        <coneGeometry args={[0.6, 1.0, 24]} />
      </mesh>
      <mesh position={[0, 2.65, 0]} material={marble} castShadow>
        <cylinderGeometry args={[0.28, 0.38, 1.0, 20]} />
      </mesh>
      <mesh position={[-0.25, 2.0, 0.15]} rotation={[0, 0.3, 0.15]} material={marbleWarm} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.25]} />
      </mesh>
      <mesh position={[0.25, 2.0, -0.15]} rotation={[0, -0.3, -0.15]} material={marbleWarm} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.25]} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.32, 3.05, 0]} material={marble} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      <mesh position={[0.32, 3.05, 0]} material={marble} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 3.2, 0]} material={marble} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 12]} />
      </mesh>

      {/* ——— HEAD ——— */}
      <mesh position={[0, 3.5, 0]} material={marble} castShadow>
        <sphereGeometry args={[0.24, 32, 32]} />
      </mesh>
      <mesh position={[0, 3.72, -0.08]} material={marble} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
      </mesh>
      <mesh position={[-0.15, 3.58, -0.05]} material={marble}>
        <sphereGeometry args={[0.08, 12, 12]} />
      </mesh>
      <mesh position={[0.15, 3.58, -0.05]} material={marble}>
        <sphereGeometry args={[0.08, 12, 12]} />
      </mesh>

      {/* ——— BLINDFOLD ——— */}
      <mesh position={[0, 3.52, 0.12]} material={blindfoldMat} castShadow>
        <boxGeometry args={[0.52, 0.07, 0.12]} />
      </mesh>
      <mesh position={[-0.28, 3.48, -0.06]} rotation={[0.1, 0.5, -0.3]} material={blindfoldMat}>
        <boxGeometry args={[0.22, 0.04, 0.06]} />
      </mesh>

      {/* ——— LEFT ARM + SCALES ——— */}
      <mesh position={[-0.42, 2.8, 0]} rotation={[0, 0, 0.4]} material={marble} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 10]} />
      </mesh>
      <mesh position={[-0.65, 3.2, 0]} rotation={[0, 0, 0.1]} material={marble} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.6, 10]} />
      </mesh>
      <mesh position={[-0.68, 3.5, 0]} material={marble} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
      </mesh>

      {/* Scale beam */}
      <mesh position={[-0.68, 3.55, 0]} material={metalSilver} castShadow>
        <boxGeometry args={[1.2, 0.035, 0.035]} />
      </mesh>
      <mesh position={[-0.68, 3.58, 0]} material={metalSilver}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>

      {/* Scale pans */}
      <ScalePan position={[-1.25, 3.3, 0]} swingPhase={0} />
      <ScalePan position={[-0.12, 3.35, 0]} swingPhase={Math.PI} />

      {/* ——— RIGHT ARM + SWORD ——— */}
      <mesh position={[0.42, 2.8, 0]} rotation={[0, 0, -0.3]} material={marble} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.55, 10]} />
      </mesh>
      <mesh position={[0.55, 2.35, 0]} rotation={[0, 0, -0.05]} material={marble} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.5, 10]} />
      </mesh>
      <mesh position={[0.56, 2.1, 0]} material={marble}>
        <sphereGeometry args={[0.06, 12, 12]} />
      </mesh>

      {/* Sword blade */}
      <mesh position={[0.56, 1.45, 0]} material={metalSilver} castShadow>
        <boxGeometry args={[0.04, 1.2, 0.015]} />
      </mesh>
      <mesh position={[0.56, 0.8, 0]} rotation={[0, 0, Math.PI]} material={metalSilver}>
        <coneGeometry args={[0.025, 0.12, 4]} />
      </mesh>
      {/* Crossguard */}
      <mesh position={[0.56, 2.05, 0]} material={metalSilver} castShadow>
        <boxGeometry args={[0.25, 0.035, 0.06]} />
      </mesh>
      <mesh position={[0.56, 2.15, 0]} material={metalSilver}>
        <sphereGeometry args={[0.03, 8, 8]} />
      </mesh>
      <mesh position={[0.56, 2.1, 0]} material={marbleWarm}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
      </mesh>
    </group>
  );
}

/* Floating dust/light particles */
function AuraParticles() {
  const ref = useRef();
  const count = 150;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 4;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 7 - 2;
      arr[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const posArr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#ffffff" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* Pulsing glow ring at base */
function GlowRing() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI / 2;
    ref.current.material.opacity = 0.12 + Math.sin(clock.getElapsedTime() * 0.8) * 0.06;
  });
  return (
    <mesh ref={ref} position={[0, -2.1, 0]}>
      <torusGeometry args={[1.6, 0.015, 16, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </mesh>
  );
}

/* Reflective ground disc */
function GroundReflection() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
      <circleGeometry args={[4, 64]} />
      <meshStandardMaterial color="#0a0a0a" metalness={0.95} roughness={0.2} transparent opacity={0.6} />
    </mesh>
  );
}

/* ——— MAIN EXPORT ———
   mousePos ref is passed IN from HeroSection so that
   mouse events work even over the overlaid text/gradients */
export default function JusticeScene({ mousePos }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.5, 6.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 12, 28]} />

      {/* ——— STRONG LIGHTING RIG (statue must POP) ——— */}
      {/* Key light — bright warm from upper-right */}
      <spotLight
        position={[5, 10, 5]}
        intensity={4}
        color="#fff5e0"
        angle={0.4}
        penumbra={0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
      />
      {/* Fill light — cool blue from left */}
      <spotLight
        position={[-6, 4, 4]}
        intensity={2}
        color="#c0d0ff"
        angle={0.5}
        penumbra={0.7}
      />
      {/* Rim / back light — bright edge silhouette */}
      <spotLight
        position={[0, 8, -6]}
        intensity={3.5}
        color="#ffffff"
        angle={0.35}
        penumbra={0.4}
      />
      {/* Front fill — ensures face is lit */}
      <pointLight position={[0, 3, 5]} intensity={1.5} color="#ffffff" distance={12} />
      {/* Under-light for dramatic uplighting */}
      <pointLight position={[0, -1, 0]} intensity={1} color="#ffffff" distance={6} />
      {/* Ambient fill */}
      <ambientLight intensity={0.25} color="#e0e0e8" />

      <Float speed={0.8} rotationIntensity={0.015} floatIntensity={0.12}>
        <LadyJustice mousePos={mousePos} />
      </Float>

      <AuraParticles />
      <GlowRing />
      <GroundReflection />
    </Canvas>
  );
}
