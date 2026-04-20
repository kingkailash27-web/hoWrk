import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const CityGrid = ({ scrollY }: { scrollY: number }) => {
  const gridRef = useRef<THREE.Group>(null);

  // Create a stylized city grid
  const buildings = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const h = Math.random() * 5 + 1;
      temp.push({ position: [x, h / 2, z], scale: [0.8, h, 0.8] });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!gridRef.current) return;
    // Zoom effect based on scroll
    const zoom = 1 + scrollY * 0.005;
    gridRef.current.position.z = scrollY * 0.02;
    gridRef.current.scale.set(zoom, zoom, zoom);

    // Slight rotation based on mouse
    gridRef.current.rotation.y = THREE.MathUtils.lerp(gridRef.current.rotation.y, (state.mouse.x * Math.PI) / 20, 0.1);
    gridRef.current.rotation.x = THREE.MathUtils.lerp(gridRef.current.rotation.x, (state.mouse.y * Math.PI) / 20, 0.1);
  });

  return (
    <group ref={gridRef}>
      {/* Ground Grid */}
      <gridHelper args={[100, 50, '#000000', '#F0F0F0']} position={[0, 0, 0]} rotation={[0, 0, 0]} />

      {/* Stylized Buildings */}
      {buildings.map((b, i) => (
        <mesh key={i} position={b.position as any}>
          <boxGeometry args={b.scale as any} />
          <meshStandardMaterial
            color="#F3F4F6"
            emissive="#000000"
            emissiveIntensity={0}
            transparent={false}
            opacity={1}
            metalness={0.1}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Floating Map Pins / Shields */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[2, 4, -5]}>
          <octahedronGeometry args={[0.5]} />
          <MeshDistortMaterial color="#000000" speed={2} distort={0.2} />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
        <mesh position={[-3, 3, -8]}>
          <torusGeometry args={[0.4, 0.1, 16, 32]} />
          <meshStandardMaterial color="#000000" emissive="#000000" emissiveIntensity={0} />
        </mesh>
      </Float>
    </group>
  );
};

export const Hero3D = ({ scrollY }: { scrollY: number }) => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
        <color attach="background" args={['#FFFFFF']} />
        <fog attach="fog" args={['#FFFFFF', 10, 40]} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#FFFFFF" />
        <pointLight position={[-10, 5, -5]} intensity={0.5} color="#FFFFFF" />

        <CityGrid scrollY={scrollY} />

        <Environment preset="city" />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white pointer-events-none" />
    </div>
  );
};
