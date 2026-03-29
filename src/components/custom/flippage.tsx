"use client";

import React, { useRef, useState, useEffect } from "react";
import HTMLFlipBookBase from "react-pageflip";

import { useSession } from "next-auth/react";
import { Cover } from "./cover";
import { Page } from "./page";

const HTMLFlipBook = HTMLFlipBookBase as any;

type PageSection =
  | { type: "text"; content: string }
  | { type: "list"; content: string[] }
  | { type: "highlight"; content: string }
  | { type: "video"; content: string }
  | {
      type: "audio";
      content: string | { src: string; title?: string };
    };

type BookData = {
  _id?: string;
  name: string;
  description: string;
  author: string;
  duration: string;
  variant: string;
  language?: string;
  tags: string[];
  pages: Array<{
    title: string;
    sections: PageSection[];
  }>;
  CoverImage?: string;
  BackcoverImage?: string;
};

const LANGUAGE_COVER_MAP: Record<string, string> = {
  javascript: "/covers/back-js-yellow.svg",
  js: "/covers/back-js-yellow.svg",
  typescript: "/covers/back-ts-blue.svg",
  ts: "/covers/back-ts-blue.svg",
  go: "/covers/go.png",
  rust: "/covers/back-rust-orange.svg",
  "c++": "/covers/c++.jpg",
  cpp: "/covers/c++.jpg",
  java: "/covers/java.png",
};

const LANGUAGE_CODE_MAP: Record<string, string> = {
  "0": "javascript",
  "1": "typescript",
  "2": "go",
  "3": "c++",
  "4": "rust",
  "5": "python",
};

const BACK_COVER_COLOR_MAP: Record<string, string> = {
  javascript: "/covers/back-js-yellow.svg",
  js: "/covers/back-js-yellow.svg",
  typescript: "/covers/back-ts-blue.svg",
  ts: "/covers/back-ts-blue.svg",
  rust: "/covers/back-rust-orange.svg",
  java: "/covers/back-java-offwhite.svg",
  "c++": "/covers/back-cpp-lightblue.svg",
  cpp: "/covers/back-cpp-lightblue.svg",
};

function getBookLanguage(book: BookData): string | null {
  const normalizedTags = Array.isArray(book.tags)
    ? book.tags.map((tag) => String(tag).toLowerCase())
    : [];

  const explicitLanguage = book.language?.toLowerCase();
  if (explicitLanguage) {
    return explicitLanguage;
  }

  const tagLanguage = normalizedTags.find((tag) => LANGUAGE_COVER_MAP[tag]);
  if (tagLanguage) {
    return tagLanguage;
  }

  const trailingCode = book._id?.split("-").pop();
  const mappedLanguage = trailingCode ? LANGUAGE_CODE_MAP[trailingCode] : undefined;
  return mappedLanguage || null;
}

function getLanguageCover(book: BookData): string | null {
  const language = getBookLanguage(book);
  if (language && LANGUAGE_COVER_MAP[language]) {
    return LANGUAGE_COVER_MAP[language];
  }

  return null;
}


/* ───────────── FLIPBOOK ───────────── */
const BOOK_W = 1200;
const BOOK_H = 700;
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.0;
const PROGRESS_KEY = "devrary:reading-progress";

/* ── Reusable neobrutalist button ── */
const NeoButton = ({
  onClick,
  disabled,
  title,
  children,
  className = "",
  variant = "primary",
}: {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "danger" | "success" | "ghost";
}) => {
  const base =
    "font-bold border-4 border-[#222222] rounded-2xl transition-all duration-100 flex items-center justify-center select-none";

  const variants: Record<string, string> = {
    primary:
      "bg-[#FF6D1F] text-white shadow-[4px_4px_0px_0px_#222222] active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110",
    danger:
      "bg-[#EF233C] text-white shadow-[4px_4px_0px_0px_#222222] active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110",
    success:
      "bg-[#2DC653] text-white shadow-[4px_4px_0px_0px_#222222] active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110",
    ghost:
      "bg-white text-[#222222] shadow-[4px_4px_0px_0px_#222222] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[#f5f5f5]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]} disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_#222222] ${className}`}
    >
      {children}
    </button>
  );
};

export default function Flipbook({
  bookId,
  onClose,
}: {
  bookId: string;
  onClose?: () => void;
}) {
  const { data: session, status } = useSession();
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [bookMeta, setBookData] = useState<BookData | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await fetch("/api/bookmarks/all");
        const data = await res.json();
        if (res.ok) setBookmarks(data.bookmarks || []);
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      }
    };
    if (status === "authenticated") fetchBookmarks();
  }, []);

  const isBookmarked = (id: string) => bookmarks.includes(id);

  const computeFit = () => {
    if (!containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const padding = 96;
    const scaleW = cw / BOOK_W;
    const scaleH = (ch - padding) / BOOK_H;
    const fit = parseFloat(Math.min(scaleW, scaleH, 1).toFixed(3));
    setZoom(fit);
  };

  useEffect(() => {
    computeFit();
    const ro = new ResizeObserver(computeFit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [bookMeta]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) =>
        parseFloat(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)).toFixed(3))
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [bookMeta]);

  const flipNext = () => flipBookRef.current?.pageFlip().flipNext();
  const flipPrev = () => flipBookRef.current?.pageFlip().flipPrev();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") flipNext();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") flipPrev();
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const fetchBookData = async () => {
      const res = await fetch(`/api/books/${bookId}`);
      if (res.ok) {
        const data = await res.json();
        setBookData(data);
        setTotalPages(data.pages.length + 2);
      } else {
        console.error("Failed to fetch book data");
      }
    };
    fetchBookData();
  }, [bookId]);

  useEffect(() => {
    if (!bookMeta) return;

    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const progressMap = raw ? JSON.parse(raw) : {};
      const saved = progressMap?.[bookId];
      const savedPage = Number(saved?.pageIndex);

      if (!Number.isFinite(savedPage) || savedPage <= 0) return;

      const maxPage = Math.max(0, (bookMeta.pages?.length || 0) + 1);
      const targetPage = Math.min(savedPage, maxPage);

      const timer = setTimeout(() => {
        const pageFlip = flipBookRef.current?.pageFlip?.();
        if (!pageFlip) return;

        if (typeof pageFlip.turnToPage === "function") {
          pageFlip.turnToPage(targetPage);
          return;
        }

        if (typeof pageFlip.flip === "function") {
          pageFlip.flip(targetPage);
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn("Failed to restore reading progress", error);
    }
  }, [bookId, bookMeta]);

  if (!bookMeta) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-black/60">
        {/* Neobrutalist loading state */}
        <div
          className="w-14 h-14 border-4 border-[#222222] rounded-2xl bg-[#FF6D1F]
          animate-bounce shadow-[4px_4px_0px_0px_#222222]"
        />
        <p className="text-white text-sm font-bold tracking-widest uppercase border-4 border-[#222222] px-5 py-2 rounded-2xl shadow-[4px_4px_0px_0px_#222222]">
          Loading book…
        </p>
      </div>
    );
  }

  const toggleBookmark = async (id: string) => {
    const isSaved = bookmarks.includes(id);
    setBookmarks((prev) =>
      isSaved ? prev.filter((b) => b !== id) : [...prev, id]
    );
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id, action: isSaved ? "remove" : "add" }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const speakCurrentPage = () => {
    if (!flipBookRef.current) return;
    const current = flipBookRef.current.pageFlip().getCurrentPageIndex();
    const text = `Page ${current + 1}. ${bookMeta.name}. ${bookMeta.description}`;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
  };

  const language = getBookLanguage(bookMeta);
  const languageCover = getLanguageCover(bookMeta);
  const isGoBook = language === "go";
  const frontCoverImage =
    isGoBook
      ? "/covers/go.png"
      : bookMeta.CoverImage || languageCover || "/covers/default-cover.png";
  const colorBackCover = language ? BACK_COVER_COLOR_MAP[language] : undefined;
  const backCoverImage =
    isGoBook
      ? "/covers/go.png"
      : bookMeta.BackcoverImage ||
        colorBackCover ||
        languageCover ||
        "/covers/default-cover.png";

  return (
    <main
      ref={containerRef}
      className="h-full w-full bg-black/60 flex items-center justify-center relative overflow-hidden rounded-2xl border-4 border-[#222222]"
    >
      {/* ── Top-left: bookmark + read aloud ── */}
      <div className="absolute top-5 left-5 z-50 flex items-center gap-2">
        {status === "authenticated" && (
          <NeoButton
            onClick={() => toggleBookmark(bookId)}
            variant={isBookmarked(bookId) ? "success" : "primary"}
            className="px-4 py-2 text-sm"
          >
            {isBookmarked(bookId) ? "✅ Saved" : "Save"}
          </NeoButton>
        )}

        {!speaking ? (
          <NeoButton
            onClick={speakCurrentPage}
            variant="ghost"
            className="px-4 py-2 text-sm"
          >
            🔊 Read
          </NeoButton>
        ) : (
          <NeoButton
            onClick={stopSpeaking}
            variant="danger"
            className="px-4 py-2 text-sm"
          >
            ⏹ Stop
          </NeoButton>
        )}
      </div>

      {/* ── Left arrow ── */}
      <NeoButton
        onClick={flipPrev}
        title="Previous page (← or A)"
        variant="primary"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-20 text-2xl"
      >
        ‹
      </NeoButton>

      {/* ── Right arrow ── */}
      <NeoButton
        onClick={flipNext}
        title="Next page (→ or D)"
        variant="primary"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-20 text-2xl"
      >
        ›
      </NeoButton>

      {/* ── Scaled flipbook wrapper ── */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          width: BOOK_W,
          height: BOOK_H,
          flexShrink: 0,
        }}
      >
        <HTMLFlipBook
          ref={flipBookRef}
          width={600}
          height={700}
          size="fixed"
          drawShadow
          flippingTime={900}
          showCover
          mobileScrollSupport
          onFlip={(e: any) => {
            setCurrentPage(e.data);
            speechSynthesis.cancel();
            setSpeaking(false);

            try {
              const raw = localStorage.getItem(PROGRESS_KEY);
              const progressMap = raw ? JSON.parse(raw) : {};
              progressMap[bookId] = {
                pageIndex: e.data,
                totalPages,
                updatedAt: Date.now(),
              };
              localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));
            } catch (error) {
              console.warn("Failed to save reading progress", error);
            }
          }}
        >
          <Cover
            title={bookMeta.name}
            author={bookMeta.author}
            subtitle={bookMeta.description}
            coverImage={frontCoverImage}
          />

          {bookMeta.pages.map((page, index) => (
            <Page
              key={index}
              number={index + 1}
              title={page.title}
              sections={page.sections}
            />
          ))}

          <Cover
            title="The End"
            subtitle={`Thank you for reading ${bookMeta.name}`}
            author={bookMeta.author}
            coverImage={backCoverImage}
          />
        </HTMLFlipBook>
      </div>

      {/* ── Bottom bar: zoom + page counter + hint ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {/* Zoom out */}
        <NeoButton
          onClick={() =>
            setZoom((z) =>
              parseFloat(Math.max(ZOOM_MIN, z - ZOOM_STEP).toFixed(3))
            )
          }
          disabled={zoom <= ZOOM_MIN}
          title="Zoom out"
          variant="ghost"
          className="w-10 h-10 text-xl"
        >
          −
        </NeoButton>

        {/* Zoom % / fit reset */}
        <button
          onClick={computeFit}
          title="Reset to fit"
          className="
            px-3 py-2 min-w-[60px] text-center
            bg-white text-[#222222]
            font-bold text-xs font-mono tracking-wider
            border-4 border-[#222222] rounded-2xl
            shadow-[4px_4px_0px_0px_#222222]
            active:translate-x-1 active:translate-y-1 active:shadow-none
            transition-all duration-100
          "
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom in */}
        <NeoButton
          onClick={() =>
            setZoom((z) =>
              parseFloat(Math.min(ZOOM_MAX, z + ZOOM_STEP).toFixed(3))
            )
          }
          disabled={zoom >= ZOOM_MAX}
          title="Zoom in"
          variant="ghost"
          className="w-10 h-10 text-xl"
        >
          +
        </NeoButton>

        {/* Divider */}
        <div className="w-1 h-8 bg-[#222222] rounded-full mx-1" />

        {/* Page counter */}
        <div
          className="
            px-4 py-2
            bg-[#FF6D1F] text-white
            font-bold text-xs font-mono tracking-widest
            border-4 border-[#222222] rounded-2xl
            shadow-[4px_4px_0px_0px_#222222]
          "
        >
          {currentPage + 1} / {totalPages}
        </div>

        {/* Divider */}
        <div className="w-1 h-8 bg-[#222222] rounded-full mx-1 hidden sm:block" />

        {/* Keyboard hint */}
        <div
          className="
            hidden sm:flex items-center
            px-3 py-2
            bg-white text-[#222222]
            font-bold text-[10px] tracking-wide
            border-4 border-[#222222] rounded-2xl
            shadow-[4px_4px_0px_0px_#222222]
          "
        >
          ← → · A D · Ctrl+scroll · Esc
        </div>
      </div>
    </main>
  );
}