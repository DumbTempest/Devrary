"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useState, useEffect, useCallback } from "react";
import Shelf from "@/components/custom/shelf";
import BookIndexPanel from "@/components/custom/BookIndexPanel";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import Flipbook from "../../../components/custom/flippage";
import { Button } from "@/components/ui/button";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";


const techStack = [
    { name: "JavaScript", color: "#f7df1e" },
    { name: "TypeScript", color: "#3178c6" },
    { name: "Go", color: "#00ADD8" },
    { name: "C++", color: "#00599C" },
    { name: "Rust", color: "#DEA584" },
    { name: "Python", color: "#3776AB" },
];

function CameraController({
    target,
    isZoomed,
}: {
    target: THREE.Vector3 | null;
    isZoomed: boolean;
}) {
    const { camera } = useThree();

    useFrame(() => {
        const targetZoom = isZoomed ? 160 : 90;
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, 0.08);
        camera.updateProjectionMatrix();

        if (target) {
            camera.position.lerp(
                new THREE.Vector3(target.x, target.y + 0.5, target.z + 1.5),
                0.08
            );
            camera.lookAt(target);
        } else {
            camera.position.lerp(new THREE.Vector3(10, 10, 10), 0.08);
            camera.lookAt(0, 0, 0);
        }
    });

    return null;
}


export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const roomSlug = (() => {
        if (!pathname) return "library";
        const segments = pathname.split("/").filter(Boolean);
        const last = segments[segments.length - 1];
        return decodeURIComponent(last || "library");
    })();

    const roomDisplayName = roomSlug === "library"
        ? "Library"
        : roomSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const [overlayColor, setOverlayColor] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    type Book = {
        _id: string;
        name?: string;
        author?: string;
    }
    const [currentShelfBooks, setCurrentShelfBooks] = useState<any[]>([]);

    const shelfFromUrl = searchParams.get("shelf");
    const bookIdFromUrl = searchParams.get("bookId");

    const initialIndex = shelfFromUrl !== null ? Number(shelfFromUrl) - 1 : null;

    const [selectedIndex, setSelectedIndex] = useState<number | null>(initialIndex);

    useEffect(() => {
        if (!shelfFromUrl) return;
        const fetchBooks = async () => {
            const res = await fetch(`/api/shelf?shelf=${shelfFromUrl}`);
            const data = await res.json();
            console.log("Fetched books for shelf", shelfFromUrl, data);
            setCurrentShelfBooks(data);
        };
        fetchBooks();
    }, [shelfFromUrl]);

    useEffect(() => {
        setActiveBookId(bookIdFromUrl ?? null);
    }, [bookIdFromUrl]);

    const shelves: [number, number, number][] = [
        [-4, 0, -2], [0, 0, -2], [4, 0, -2],
        [-4, 0, 2], [0, 0, 2], [4, 0, 2],
    ];

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        router.push(`/library/${roomSlug}?shelf=${index + 1}`);
    };

    const handleBookOpen = useCallback((bookId: string, color: string) => {
        setOverlayColor(color);
        setActiveBookId(bookId);
        if (shelfFromUrl) {
            router.push(`/library/${roomSlug}?shelf=${shelfFromUrl}&bookId=${bookId}`);
        }
    }, [shelfFromUrl, roomSlug, router]);

    const handleBookClose = useCallback(() => {
        setOverlayColor(null);
        setActiveBookId(null);
        setResetSignal(prev => prev + 1);
        if (shelfFromUrl) {
            router.push(`/library/${roomSlug}?shelf=${shelfFromUrl}`);
        }
    }, [shelfFromUrl, roomSlug, router]);

    const handleReset = useCallback(() => {
        setOverlayColor(null);
        setActiveBookId(null);
        setSelectedIndex(null);
        setResetSignal(prev => prev + 1);
        router.push(`/library/${roomSlug}`);
    }, [roomSlug, router]);

    const handleSmartBack = useCallback(() => {
        if (activeBookId) { handleBookClose(); return; }
        if (selectedIndex !== null) { handleReset(); return; }
        router.push("/room");
    }, [activeBookId, selectedIndex, handleBookClose, handleReset, router]);

    const backLabel = activeBookId
        ? "Close Book"
        : selectedIndex !== null
            ? "Back to Library"
            : "Back to Rooms";

    return (
        <>
            <AnimatedSkyNoBirds />
            <main className="absolute h-screen w-screen overflow-hidden">
                <div className="absolute bottom-0 right-0 mb-10 mr-10 z-50">
                    <Button
                        onClick={handleSmartBack}
                        className="bg-[#FF6D1F] text-white border-4 border-[#222222] rounded-2xl shadow-[6px_6px_0px_0px_#222222] font-bold px-10 py-5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                        ← {backLabel}
                    </Button>
                </div>

                <div className="absolute top-6 left-8 z-50 pointer-events-none">
                    <h1 className="text-white text-3xl font-semibold tracking-wide drop-shadow-lg font-tektur">
                        {roomDisplayName}
                    </h1>
                </div>

                <Canvas
                    shadows
                    orthographic
                    camera={{ position: [10, 10, 10], zoom: 90 }}
                    onPointerMissed={() => {
                        if (activeBookId) handleBookClose();
                        else if (selectedIndex !== null) handleReset();
                    }}
                >
                    <hemisphereLight intensity={0.4} />
                    <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>

                    <Suspense fallback={null}>
                        {techStack.map((tech, i) => (
                            <Shelf
                                key={i}
                                position={shelves[i]}
                                index={i}
                                selectedIndex={selectedIndex}
                                onClick={() => handleSelect(i)}
                                onBookOpen={handleBookOpen}
                                label={tech.name}
                                labelColor={tech.color}
                                resetSignal={resetSignal}
                            />
                        ))}
                    </Suspense>

                    <CameraController
                        target={selectedIndex !== null ? new THREE.Vector3(...shelves[selectedIndex]) : null}
                        isZoomed={selectedIndex !== null}
                    />

                    <OrbitControls
                        enableRotate={selectedIndex === null}
                        enableZoom
                        enablePan={false}
                        minZoom={70}
                        maxZoom={250}
                    />
                </Canvas>

                {selectedIndex !== null && (
                    <BookIndexPanel
                        books={currentShelfBooks}
                        onBookOpen={handleBookOpen}
                    />
                )}

                <AnimatePresence>
                    {activeBookId && (
                        <>
                            {/* Keep canvas interactions blocked while modal is open. */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-40 bg-transparent"
                                onClick={handleBookClose}
                            />

                            <motion.div
                                key="book-panel"
                                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                                className="absolute z-50 inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div
                                    className="relative w-[95%] h-[95%] rounded-2xl overflow-hidden pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={handleBookClose}
                                        className="absolute top-4 right-4 z-10 
                                            bg-[#FF6D1F] text-white 
                                            border-4 border-[#222222] rounded-2xl 
                                            shadow-[4px_4px_0px_0px_#222222] 
                                            font-bold px-4 py-2 text-sm
                                            active:translate-x-1 active:translate-y-1 active:shadow-none 
                                            transition-all"
                                    >
                                        ✕ Close
                                    </button>

                                    <div className="w-full h-full">
                                        {activeBookId && <Flipbook bookId={activeBookId} />}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </>
    );
}

useGLTF.preload("/models/bookshelf.glb");