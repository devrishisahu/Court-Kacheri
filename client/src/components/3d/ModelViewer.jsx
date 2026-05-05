import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, Html, useProgress, OrbitControls } from '@react-three/drei';
import LadyJustice from './LadyJustice';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center className="text-white/50 text-xl font-light tracking-widest whitespace-nowrap">
      Loading {progress.toFixed(0)}%
    </Html>
  );
}

export default function ModelViewer() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 opacity-40 mix-blend-screen">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#c0a080" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
        
        <Suspense fallback={<Loader />}>
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={false}
          />
          <Float speed={1.5} rotationIntensity={0} floatIntensity={1} floatingRange={[-0.3, 0.3]}>
            {/* Lifted higher for more bottom margin */}
            <LadyJustice position={[0, -1.2, 0]} scale={3.5} />
          </Float>
          {/* Environment gives the model realistic lighting and reflections */}
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
