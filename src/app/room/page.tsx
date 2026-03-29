"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Text,
} from "@react-three/drei";
import { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import Navbar from "@/components/custom/navbar";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";

type RoomProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  label: string;
  scale: number;
  link: string;
  onSelect: (position: [number, number, number], link: string) => void;
  disabled: boolean;
};

function RoomModel({
  position,
  rotation,
  label,
  scale,
  link,
  onSelect,
  disabled,
}: RoomProps) {
  const { scene } = useGLTF("/models/rooms.glb");
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const { outlinedScene, roomShellOutline } = useMemo(() => {
    const cloned = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(cloned);

    const minX = bounds.min.x;
    const minY = bounds.min.y;
    const minZ = bounds.min.z;
    const maxX = bounds.max.x;
    const maxY = bounds.max.y;
    const maxZ = bounds.max.z;

    const points: number[] = [];
    const addLine = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number
    ) => {
      points.push(x1, y1, z1, x2, y2, z2);
    };

    // Bottom face
    addLine(minX, minY, minZ, maxX, minY, minZ);
    addLine(maxX, minY, minZ, maxX, minY, maxZ);
    addLine(maxX, minY, maxZ, minX, minY, maxZ);
    addLine(minX, minY, maxZ, minX, minY, minZ);

    // Top face
    addLine(minX, maxY, minZ, maxX, maxY, minZ);
    addLine(maxX, maxY, minZ, maxX, maxY, maxZ);
    

    // Vertical edges
    addLine(minX, minY, minZ, minX, maxY, minZ);
    addLine(maxX, minY, minZ, maxX, maxY, minZ);
    addLine(maxX, minY, maxZ, maxX, maxY, maxZ);
    

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

    const outlineGroup = new THREE.Group();
    const strokeScales = [1, 1.004, 0.996];

    strokeScales.forEach((scaleFactor) => {
      const stroke = new THREE.LineSegments(
        geometry.clone(),
        new THREE.LineBasicMaterial({ color: "#000000" })
      );
      stroke.name = "__room_outline__";
      stroke.renderOrder = 2;
      stroke.scale.setScalar(scaleFactor);
      outlineGroup.add(stroke);
    });

    geometry.dispose();

    return { outlinedScene: cloned, roomShellOutline: outlineGroup };
  }, [scene]);

  useEffect(() => {
    return () => {
      roomShellOutline.traverse((child) => {
        if (child.name !== "__room_outline__") return;

        const lines = child as THREE.LineSegments;
        lines.geometry.dispose();
        (lines.material as THREE.Material).dispose();
      });
    };
  }, [roomShellOutline]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth hover-scale interpolation.
    const targetScale = hovered && !disabled ? scale * 1.08 : scale;

    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Gentle floating motion to keep rooms feeling alive.
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 2;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={() => !disabled && onSelect(position, link)}
      onPointerOver={() => {
        if (disabled) return;
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <primitive object={outlinedScene} />
      <primitive object={roomShellOutline} />

      <Text
        position={[8, 5, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={4}
        font="/fonts/Tektur-VariableFont_wdth,wght.ttf"
        color={hovered ? "#00ffff" : "black"}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function CameraController({
  target,
  onArrive,
}: {
  target: THREE.Vector3 | null;
  onArrive: () => void;
}) {
  const { camera } = useThree();

  useFrame((state) => {
    if (!target) {
      // Subtle idle camera drift when no room is selected.
      camera.position.x += Math.sin(state.clock.elapsedTime * 0.2) * 0.008;
      camera.position.y += Math.cos(state.clock.elapsedTime * 0.15) * 0.008;
      return;
    }

    const desiredPosition = new THREE.Vector3(
      target.x,
      target.y + 80,
      target.z + 120
    );

    camera.position.lerp(desiredPosition, 0.05);
    camera.lookAt(target);

    if (camera.position.distanceTo(desiredPosition) < 1) {
      onArrive();
    }
  });

  return null;
}

function Scene({
  onRoomSelect,
  disabled,
}: {
  onRoomSelect: (pos: [number, number, number], link: string) => void;
  disabled: boolean;
}) {
  const modelScale = 3;
  const spacingX = 90;
  const spacingZ = 110;
  const globalOffsetX = -80;
  const globalOffsetZ = -50;
  const rotation: [number, number, number] = [0, Math.PI / 2, 0];

  const items = useMemo(
    () => [
      { label: "Web Dev", link: "/library/web-dev" },
      { label: "AI / ML", link: "/library/ai-ml" },
      { label: "Blockchain", link: "/library/blockchain" },
      { label: "CyberSec", link: "/library/cybersec" },
      { label: "Robotics", link: "/library/robotics" },
      { label: "Cloud", link: "/library/cloud" },
    ],
    []
  );

  const models = [];

  let index = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const item = items[index++];

      const position: [number, number, number] = [
        col * spacingX + globalOffsetX,
        0,
        row * spacingZ + globalOffsetZ,
      ];

      models.push(
        <RoomModel
          key={`${row}-${col}`}
          position={position}
          rotation={rotation}
          label={item.label}
          link={item.link}
          scale={modelScale}
          onSelect={onRoomSelect}
          disabled={disabled}
        />
      );
    }
  }

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[50, 80, 50]} intensity={2} />
      {models}
    </>
  );
}

export default function RoomGridPage() {
  const router = useRouter();

  const [target, setTarget] = useState<THREE.Vector3 | null>(null);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const [fade, setFade] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleRoomSelect = (
    pos: [number, number, number],
    link: string
  ) => {
    if (locked) return;

    setLocked(true);
    setTarget(new THREE.Vector3(...pos));
    setNextRoute(link);
  };

  const handleArrive = () => {
    setFade(true);
  };

  return (
    <>
      <AnimatedSkyNoBirds />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-screen h-screen relative overflow-hidden"
      >
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="absolute top-10 right-11 w-full z-50"
      >
        <Navbar />
      </motion.div>

      <Canvas
        camera={{
          position: [200, 200, 360],
          fov: 50,
          zoom: 1.8,
        }}
      >
        <Suspense fallback={null}>
          <Scene
            onRoomSelect={handleRoomSelect}
            disabled={locked}
          />
          <CameraController
            target={target}
            onArrive={handleArrive}
          />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {fade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-black z-40"
            onAnimationComplete={() => {
              if (nextRoute) router.push(nextRoute);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
useGLTF.preload("/models/rooms.glb");