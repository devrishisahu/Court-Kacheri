import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LadyJustice(props) {
  const group = useRef();
  // Load the GLTF model
  const { scene } = useGLTF('/models/Lady_Justice.glb');

    const baseRotation = useRef(0);

  useFrame((state, delta) => {
    if (group.current) {
      // 1. Continuous auto-rotation increment
      baseRotation.current += delta * 0.25;
      
      // 2. Map pointer X to a Y-axis rotation offset (instead of tilt)
      const mouseInfluence = (state.pointer.x * Math.PI) / 3;
      const targetY = baseRotation.current + mouseInfluence;
      
      // Smoothly lerp to the target rotation on Y axis
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.05);
      
      // Ensure X and Z stay at 0 (no tilt)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* We apply a base scale and position to center it nicely */}
      <primitive object={scene} />
    </group>
  );
}

// Preload the model so it loads quickly
useGLTF.preload('/models/Lady_Justice.glb');
