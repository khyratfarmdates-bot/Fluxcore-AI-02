import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../lib/utils';
import { EmotionState } from '../core/companion/CompanionState';

export interface FluxyCharacterProps {
  size?: number;
  isThinking?: boolean;
  isSmiling?: boolean;
  isExplaining?: boolean;
  isPointing?: boolean;
  pointingDirection?: 'left' | 'right';
  locomotionRef?: React.MutableRefObject<{ vx: number; vy: number; speed: number; distanceToTarget: number; angle: number; navState: string }>;
  emotion?: EmotionState;
  active?: boolean;
  className?: string;
}

function FluxyModel({ isThinking, isSmiling, isExplaining, isPointing, pointingDirection, locomotionRef, emotion, active }: any) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const distanceTraveled = useRef(0);
  
  const [globalMouse, setGlobalMouse] = useState({ x: 0, y: 0 });
  const smoothedVelocity = useRef({ x: 0, y: 0 });
  const smoothedSpeed = useRef(0);
  const [isWalkingState, setIsWalkingState] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 based on screen size
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setGlobalMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Materials
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: active ? '#4f46e5' : '#64748b',
    metalness: 0.1,
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  }), [active]);

  const screenMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1.0,
  }), []);

  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    toneMapped: false,
  }), []);

  const mouthMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: active ? '#ffffff' : '#94a3b8',
    toneMapped: false,
  }), [active]);

  // Animations & Interactions
  useFrame((state, delta) => {
    // Look at mouse or look at popup
    if (headRef.current) {
      let targetX = (globalMouse.x * Math.PI) / 4;
      let targetY = (globalMouse.y * Math.PI) / 6;

      if (isPointing) {
        // Look towards the bubble/popup side dynamically
        targetX = pointingDirection === 'left' ? -Math.PI / 5 : Math.PI / 5;
        targetY = Math.PI / 10; // look slightly up towards the bubble/popup
      }

      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetX, 5 * delta);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -targetY, 5 * delta);
    }
    
    // True Locomotion Engine
    const rawSpeed = locomotionRef?.current?.speed || 0;
    const rawVX = locomotionRef?.current?.vx || 0;
    const rawVY = locomotionRef?.current?.vy || 0;

    // Smooth values to prevent jitter
    smoothedSpeed.current = THREE.MathUtils.lerp(smoothedSpeed.current, rawSpeed, 0.1);
    smoothedVelocity.current.x = THREE.MathUtils.lerp(smoothedVelocity.current.x, rawVX, 0.1);
    smoothedVelocity.current.y = THREE.MathUtils.lerp(smoothedVelocity.current.y, rawVY, 0.1);

    const speed = smoothedSpeed.current;
    
    // Hysteresis for walking state
    const isWalking = speed > 10;
    if (isWalking !== isWalkingState) {
       // Only switch if stable
       setIsWalkingState(isWalking);
    }
    
    // Accumulate actual travel distance for physical motion
    if (isWalkingState) {
       distanceTraveled.current += (speed * delta) * 0.05;
    } else {
       // Snap back smoothly when stopped
       distanceTraveled.current = THREE.MathUtils.lerp(distanceTraveled.current, 0, 5 * delta);
    }
    
    // Walking & Idle Body logic
    if (group.current) {
      if (isWalkingState) {
         // Walk bounce based on actual speed (slowed down and refined)
         group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, Math.abs(Math.sin(distanceTraveled.current * 3.5)) * 0.08, 10 * delta);
         // Lean into movement
         group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -(smoothedVelocity.current.x * 0.0005), 5 * delta);
         // Turn to face the direction of movement realistically
         const targetYRotation = smoothedVelocity.current.x > 8 
           ? Math.PI / 3.2 
           : (smoothedVelocity.current.x < -8 ? -Math.PI / 3.2 : 0);
         group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetYRotation, 5 * delta);
      } else {
         // Idle breathing
         group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, Math.sin(state.clock.elapsedTime * 2) * 0.05, 5 * delta);
         group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 5 * delta);
         // Face forward when idle
         group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 5 * delta);
      }
    }

    // Arm and Leg animations based on true locomotion
    if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
      if (isWalkingState) {
         // Walk cycle based on distance traveled, with slow, realistic pace
         leftLegRef.current.rotation.x = Math.sin(distanceTraveled.current * 3.5) * 0.45;
         rightLegRef.current.rotation.x = Math.sin(distanceTraveled.current * 3.5 + Math.PI) * 0.45;
         
         // Arms swing
         if (!isExplaining && !isThinking) {
           leftArmRef.current.rotation.x = Math.sin(distanceTraveled.current * 3.5 + Math.PI) * 0.3;
           rightArmRef.current.rotation.x = Math.sin(distanceTraveled.current * 3.5) * 0.3;
         }
      } else {
         // Micro foot placement & balance when transitioning to idle
         leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 15 * delta);
         rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 15 * delta);
      }

      const isWalkingSlow = isWalkingState && speed < 50;

      if (isPointing) {
        if (pointingDirection === 'left') {
          // Point Left Arm directly towards the pop-up/speech balloon
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -Math.PI / 1.25, 6 * delta);
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 3, 6 * delta);

          // Other arm is relaxed/excited
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, Math.PI / 6, 5 * delta);
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 5 * delta);
        } else {
          // Point Right Arm directly towards the pop-up/speech balloon
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, Math.PI / 1.25, 6 * delta);
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 3, 6 * delta);

          // Other arm is relaxed/excited
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -Math.PI / 6, 5 * delta);
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 5 * delta);
        }
      } else if (isExplaining) {
         leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -Math.PI / 4 - Math.sin(state.clock.elapsedTime * 6) * 0.2, 5 * delta);
         if (!isWalkingSlow) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 4, 5 * delta);
         
         rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, Math.PI / 4 + Math.sin(state.clock.elapsedTime * 6 + 1) * 0.2, 5 * delta);
         if (!isWalkingSlow) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 4, 5 * delta);
      } else if (isThinking) {
         leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 5 * delta);
         if (!isWalkingSlow) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 5 * delta);
         
         // hand touching chin/head
         rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, Math.PI / 1.2, 5 * delta);
         if (!isWalkingSlow) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 4, 5 * delta);
      } else if (!isWalkingState) {
         // idle arms
         leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.2 - Math.sin(state.clock.elapsedTime * 2) * 0.05, 5 * delta);
         leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 5 * delta);
         
         rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.2 + Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 0.05, 5 * delta);
         rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 5 * delta);
      }
    }

    // Blinking logic & Eye Expressions
    if (eyesRef.current) {
      if (emotion === 'happy' || isSmiling) {
        eyesRef.current.scale.y = THREE.MathUtils.lerp(eyesRef.current.scale.y, 0.2, 0.2);
        eyesRef.current.position.y = THREE.MathUtils.lerp(eyesRef.current.position.y, 0.05, 0.2);
      } else if (emotion === 'sad') {
        eyesRef.current.scale.y = THREE.MathUtils.lerp(eyesRef.current.scale.y, 0.6, 0.2);
        eyesRef.current.position.y = THREE.MathUtils.lerp(eyesRef.current.position.y, -0.05, 0.2);
      } else if (emotion === 'excited') {
        eyesRef.current.scale.y = THREE.MathUtils.lerp(eyesRef.current.scale.y, 1.3, 0.2);
      } else {
        const time = state.clock.elapsedTime;
        const isBlinking = Math.sin(time * 2) > 0.95; // blink interval
        eyesRef.current.scale.y = THREE.MathUtils.lerp(eyesRef.current.scale.y, isBlinking ? 0.05 : 1, 0.3);
        eyesRef.current.position.y = THREE.MathUtils.lerp(eyesRef.current.position.y, 0, 0.2);
      }
    }

    // Mouth logic
    if (mouthRef.current) {
      if (emotion === 'happy' || isSmiling) {
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1.5, 0.2);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.8, 0.2);
      } else if (emotion === 'sad') {
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 0.6, 0.2);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.4, 0.2);
      } else if (emotion === 'excited') {
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1.2, 0.5);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1.2, 0.5);
      } else if (isExplaining) {
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 0.8 + Math.sin(state.clock.elapsedTime * 15) * 0.2, 0.5);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.8 + Math.sin(state.clock.elapsedTime * 15) * 0.5, 0.5);
      } else {
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 0.8, 0.2);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.2, 0.2);
      }
    }
  });

  return (
    <group position={[0, -0.6, 0]}>
      <group ref={group}>
        {/* Head */}
        <group ref={headRef} position={[0, 1.2, 0]}>
          {/* Main Head Box bg */}
          <RoundedBox args={[1.4, 1.1, 1]} radius={0.3} smoothness={4} material={bodyMaterial} />
          {/* Face Screen */}
          <RoundedBox args={[1.2, 0.9, 0.9]} position={[0, 0, 0.1]} radius={0.15} smoothness={4} material={screenMaterial} />
          
          {/* Eyes Group */}
          <group ref={eyesRef} position={[0, 0.1, 0.56]}>
            <Sphere args={[0.12, 16, 16]} position={[-0.25, 0, 0]} material={eyeMaterial} scale={[1, 1.4, 0.5]} />
            <Sphere args={[0.12, 16, 16]} position={[0.25, 0, 0]} material={eyeMaterial} scale={[1, 1.4, 0.5]} />
          </group>

          {/* Mouth */}
          <RoundedBox ref={mouthRef} args={[0.3, 0.1, 0.1]} position={[0, -0.2, 0.56]} radius={0.05} smoothness={4} material={mouthMaterial} />
        </group>

        {/* Neck (Floating Space) */}
        <Box args={[0.3, 0.2, 0.3]} position={[0, 0.55, 0]} material={screenMaterial} />

        {/* Body */}
        <RoundedBox args={[1.3, 1.4, 0.9]} position={[0, -0.2, 0]} radius={0.3} smoothness={4} material={bodyMaterial} />
        
        {/* Core Heart Component */}
        <Sphere args={[0.2, 32, 32]} position={[0, -0.1, 0.46]} material={eyeMaterial} scale={[1, 1, 0.2]} />
        <pointLight position={[0, -0.1, 0.6]} distance={1.5} intensity={active ? 1.5 : 0} color="#38bdf8" />

        {/* Left Arm Pivot */}
        <group position={[-0.8, 0, 0]}>
          <group ref={leftArmRef}>
             <RoundedBox args={[0.35, 1, 0.35]} position={[0, -0.4, 0]} radius={0.15} smoothness={4} material={bodyMaterial} />
          </group>
        </group>

        {/* Right Arm Pivot */}
        <group position={[0.8, 0, 0]}>
          <group ref={rightArmRef}>
             <RoundedBox args={[0.35, 1, 0.35]} position={[0, -0.4, 0]} radius={0.15} smoothness={4} material={bodyMaterial} />
          </group>
        </group>
        
        {/* Left Leg Pivot */}
        <group position={[-0.4, -0.7, 0]}>
          <group ref={leftLegRef}>
             <RoundedBox args={[0.3, 0.7, 0.3]} position={[0, -0.35, 0]} radius={0.12} smoothness={4} material={bodyMaterial} />
          </group>
        </group>

        {/* Right Leg Pivot */}
        <group position={[0.4, -0.7, 0]}>
          <group ref={rightLegRef}>
             <RoundedBox args={[0.3, 0.7, 0.3]} position={[0, -0.35, 0]} radius={0.12} smoothness={4} material={bodyMaterial} />
          </group>
        </group>
      </group>
      {/* Ground Shadow Plane */}
      <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
      
      {/* Contact Glow Plane */}
      <mesh position={[0, -1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color={active ? (emotion === 'excited' ? '#ec4899' : '#38bdf8') : '#475569'} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Canvas WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function FluxyCharacter({ 
  size = 150, 
  isThinking, 
  isSmiling, 
  isExplaining,
  isPointing,
  pointingDirection,
  locomotionRef,
  emotion,
  active, 
  className 
}: FluxyCharacterProps) {
  return (
    <div 
      className={cn("relative pointer-events-none", className)}
      style={{ width: size, height: size * 1.2 }}
    >
      <ErrorBoundary fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-full border border-slate-800 animate-pulse">
           <div className="text-4xl">🤖</div>
        </div>
      }>
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ pointerEvents: 'none', background: 'transparent' }}
          gl={{ preserveDrawingBuffer: true, powerPreference: 'low-power' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn("WebGL context lost");
            });
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, -2]} intensity={0.5} />
          <FluxyModel 
            isThinking={isThinking} 
            isSmiling={isSmiling} 
            isExplaining={isExplaining}
            isPointing={isPointing}
            pointingDirection={pointingDirection}
            locomotionRef={locomotionRef}
            emotion={emotion}
            active={active} 
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
