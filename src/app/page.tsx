"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Navbar from "@/components/custom/navbar";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";
import { AnimatePresence, motion } from "framer-motion";
import MainPageModal from "../components/custom/mainpagemodal";

const EASE = "easeOut" as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const slideIn = (direction: "left" | "right") => ({
  initial: { opacity: 0, x: direction === "left" ? -60 : 60 },
  animate: { opacity: 1, x: 0 },
});

const popIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

const transition = (delay = 0, duration = 0.5) => ({
  duration,
  delay,
  ease: EASE,
});

export default function Home() {
  const { data: session, status } = useSession();
  const [isHoveringBook, setIsHoveringBook] = useState(false);
  const [showThoughtBubble, setShowThoughtBubble] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoveredBookKey, setHoveredBookKey] = useState<string | null>(null);
  const [activeQuote, setActiveQuote] = useState({
    command: "git status",
    description: "Shows changed, staged, and untracked files in your working tree.",
  });

  const developerQuotes = [
    {
      command: "git status -sb",
      description: "Short branch-aware status with staged/unstaged file changes.",
    },
    {
      command: "git diff",
      description: "Shows unstaged line-by-line changes in tracked files.",
    },
    {
      command: "git add <file>",
      description: "Stages selected file changes for the next commit.",
    },
    {
      command: "git commit -m \"message\"",
      description: "Creates a commit from staged changes with a message.",
    },
    {
      command: "git checkout -b feature/name",
      description: "Creates a new branch and switches to it immediately.",
    },
    {
      command: "git pull --rebase origin main",
      description: "Updates your branch with remote changes while keeping history linear.",
    },
    {
      command: "git push -u origin HEAD",
      description: "Pushes current branch and sets upstream tracking.",
    },
    {
      command: "gh pr create --fill",
      description: "Creates a pull request using commit details automatically.",
    },
    {
      command: "gh issue list",
      description: "Lists repository issues from GitHub CLI.",
    },
    {
      command: "gh run watch",
      description: "Streams GitHub Actions workflow run status live.",
    },
    {
      command: "git stash push -m \"wip\"",
      description: "Temporarily stores local modifications without committing.",
    },
    {
      command: "git reset --soft HEAD~1",
      description: "Moves HEAD back one commit while keeping changes staged.",
    },
  ];

  const pickRandomQuote = (current: { command: string; description: string }) => {
    if (developerQuotes.length === 1) return developerQuotes[0];
    let next = current;
    while (next.command === current.command) {
      next = developerQuotes[Math.floor(Math.random() * developerQuotes.length)];
    }
    return next;
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isHoveringBook) {
      timer = setTimeout(() => setShowThoughtBubble(true), 500);
    } else {
      setShowThoughtBubble(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHoveringBook]);

  useEffect(() => {
    if (!hoveredBookKey) return;
    setActiveQuote((current) => pickRandomQuote(current));
  }, [hoveredBookKey]);

  useEffect(() => {
    if (!showThoughtBubble || !hoveredBookKey) return;
    const rotateTimer = setInterval(() => {
      setActiveQuote((current) => pickRandomQuote(current));
    }, 3200);
    return () => clearInterval(rotateTimer);
  }, [showThoughtBubble, hoveredBookKey]);

  return (
    <>
      <AnimatedSkyNoBirds />

      <AnimatePresence>
        {showThoughtBubble && (
          <motion.div
            {...popIn}
            transition={transition(0, 0.2)}
            className="fixed z-70 pointer-events-none"
            style={{
              left: `clamp(210px, ${cursorPosition.x}px, calc(100vw - 210px))`,
              top: `clamp(96px, ${cursorPosition.y}px, calc(100vh - 28px))`,
            }}
          >
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-full -top-6 w-96 px-5 py-4 rounded-3xl bg-linear-to-b from-white to-slate-50 border-2 border-black shadow-[6px_6px_0px_0px_#222222]">
                <p className="text-[12px] leading-snug text-[#111827] font-semibold whitespace-pre-line font-mono bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 mb-2">
                  {activeQuote.command}
                </p>
                <p className="text-sm leading-snug text-[#222222] font-medium">
                  {activeQuote.description}
                </p>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-5 w-5 h-5 rounded-full bg-white border-2 border-black shadow-sm" />
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-2.5 w-3 h-3 rounded-full bg-white border-2 border-black shadow-sm" />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-black shadow-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <motion.main
        {...fadeUp}
        transition={transition(0, 0.5)}
        className="relative h-screen w-full p-10 font-tektur overflow-hidden"
      >
        <Navbar />

        <div className="grid grid-cols-2 gap-16 items-start">

    
          <motion.div
            {...slideIn("left")}
            transition={transition(0.15)}
            className="ml-20 mt-20"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Card className="bg-[#F5E7C6] border-4 border-[#222222] rounded-[40px] shadow-[12px_12px_0px_0px_#222222] p-12 max-w-xl">
                <h1 className="text-5xl font-bold mb-6 text-[#222222]">
                  Devrary
                </h1>
                <p className="text-xl mb-10 text-[#222222]">
                  Discover coding concepts inside a structured virtual library.
                  Walk through domains, browse languages, and open curated resources
                  designed to make learning clear and accessible.
                </p>
                <Link href="/room">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15, ease: EASE }}
                  >
                    <Button className="bg-[#FF6D1F] text-white border-4 border-[#222222] rounded-2xl shadow-[6px_6px_0px_0px_#222222] font-bold px-10 py-5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                      Start learning
                    </Button>
                  </motion.div>
                </Link>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            {...slideIn("right")}
            transition={transition(0.3)}
            className="h-[650px] w-full relative"
          >
            <Link href="/room">
              <Canvas
                className="w-full h-full"
                camera={{ position: [3, 3, 4], fov: 50 }}
                onPointerMissed={() => {
                  document.body.style.cursor = "default";
                }}
              >
                <ambientLight intensity={1} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <Suspense fallback={null}>
                  <MainPageModal
                    onHoverChange={setIsHoveringBook}
                    onCursorMove={(x, y) => setCursorPosition({ x, y })}
                    onHoveredBookChange={setHoveredBookKey}
                  />
                </Suspense>
                <OrbitControls enableZoom={true} enableRotate={false} enablePan={false} />
              </Canvas>
            </Link>
          </motion.div>

        </div>
      </motion.main>
    </>
  );
}