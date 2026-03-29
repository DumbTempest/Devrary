"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/navbar";
import Link from "next/link";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";

const PROGRESS_KEY = "devrary:reading-progress";

type SortMode = "recent" | "title-asc" | "title-desc";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [booksData, setBooksData] = useState<Record<string, any>>({});
  const [progressMap, setProgressMap] = useState<Record<string, { pageIndex: number; totalPages?: number }>>({});
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [domainFilter, setDomainFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const getDomainFromId = (id: string) => {
    const parts = id.split("-");
    return parts.slice(1, -1).join("-") || "unknown";
  };

  const getShelfFromId = (id: string) => {
    const maybeCode = Number(id.split("-").at(-1));
    return Number.isFinite(maybeCode) ? maybeCode + 1 : 1;
  };

  useEffect(() => {
    try {
      const rawProgress = localStorage.getItem(PROGRESS_KEY);
      const parsedProgress = rawProgress ? JSON.parse(rawProgress) : {};
      setProgressMap(parsedProgress && typeof parsedProgress === "object" ? parsedProgress : {});
    } catch (error) {
      console.warn("Failed to load reading progress", error);
    }

    const fetchBookmarks = async () => {
      try {
        const res = await fetch("/api/bookmarks/all");
        const data = await res.json();

        if (res.ok) {
          setBookmarks(data.bookmarks || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      }
    };

    fetchBookmarks();
  }, []);

  const removeBookmark = async (id: string) => {
    // Optimistic UI removal.
    setBookmarks((prev) => prev.filter((b) => b !== id));

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: id,
          action: "remove",
        }),
      });

      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const results: Record<string, any> = {};

        await Promise.all(
          bookmarks.map(async (id) => {
            const bookID = id;
            const res = await fetch(`/api/books/${bookID}`);
            if (res.ok) {
              const data = await res.json();
              results[id] = data;
            }
          })
        );

        setBooksData(results);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      } finally {
        setLoading(false);
      }
    };

    if (bookmarks.length > 0) {
      fetchBooks();
    } else {
      setLoading(false);
    }
  }, [bookmarks]);

  const domains = useMemo(() => {
    const unique = new Set(bookmarks.map((id) => getDomainFromId(id)));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [bookmarks]);

  const visibleBookmarks = useMemo(() => {
    let ids = [...bookmarks];

    if (domainFilter !== "all") {
      ids = ids.filter((id) => getDomainFromId(id) === domainFilter);
    }

    if (sortMode === "title-asc") {
      ids.sort((a, b) => {
        const nameA = (booksData[a]?.name || a).toString().toLowerCase();
        const nameB = (booksData[b]?.name || b).toString().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    if (sortMode === "title-desc") {
      ids.sort((a, b) => {
        const nameA = (booksData[a]?.name || a).toString().toLowerCase();
        const nameB = (booksData[b]?.name || b).toString().toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }

    return ids;
  }, [bookmarks, domainFilter, sortMode, booksData]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedSkyNoBirds />
      <main className="relative min-h-screen w-full p-10 font-tektur">
        <Navbar />

        <div className="grid grid-cols-2 gap-16 items-start">


        <Card
          className="
            bg-[#F5E7C6]
            border-4 border-[#222222]
            rounded-[40px]
            shadow-[12px_12px_0px_0px_#222222]
            p-12
            max-w-xl
            ml-20
            mt-20
          "
        >
          <h1 className="text-5xl font-bold mb-6 text-[#222222]">
            My Bookmarks
          </h1>

          <p className="text-xl text-[#222222]">
            All the books you've saved for later reading.
          </p>
        </Card>

        <div className="mt-20 space-y-6 max-h-[650px] overflow-y-auto pr-6 pb-4">

          <Card className="bg-white border-4 border-[#222222] rounded-2xl shadow-[6px_6px_0px_0px_#222222] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-bold text-[#222222]">Sort</label>
              <select
                title="Sort bookmarks"
                aria-label="Sort bookmarks"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="border-2 border-[#222222] rounded-lg px-3 py-2 bg-[#F5E7C6] text-sm font-semibold text-[#222222]"
              >
                <option value="recent">Recently saved</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>

              <label className="text-sm font-bold text-[#222222] ml-2">Domain</label>
              <select
                title="Filter bookmarks by domain"
                aria-label="Filter bookmarks by domain"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="border-2 border-[#222222] rounded-lg px-3 py-2 bg-[#F5E7C6] text-sm font-semibold text-[#222222]"
              >
                {domains.map((domain) => (
                  <option key={domain} value={domain}>{domain === "all" ? "All domains" : domain}</option>
                ))}
              </select>
            </div>
          </Card>

          {visibleBookmarks.length === 0 && (
            <Card
              className="
                bg-white
                border-4 border-[#222222]
                rounded-2xl
                shadow-[6px_6px_0px_0px_#222222]
                p-6
              "
            >
              <p className="text-lg text-[#222222]">
                No bookmarks yet.
              </p>
            </Card>
          )}

          {visibleBookmarks.map((id) => {
            const book = booksData[id];
            const bookId = id;
            if (!book) return null;

            const progress = progressMap[id];
            const current = Number(progress?.pageIndex || 0);
            const total = Number(progress?.totalPages || 0);
            const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;

            return (
              <Card
                key={bookId}
                className="
                  bg-white
                  border-4 border-[#222222]
                  rounded-2xl
                  shadow-[6px_6px_0px_0px_#222222]
                  p-6
                  transition-all
                  hover:translate-x-1
                  hover:translate-y-1
                  hover:shadow-none
                "
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[#222222]">
                      {book.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {book.author}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDomainFromId(id)} {"•"} Progress {percent}%
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/library/${getDomainFromId(id)}?shelf=${getShelfFromId(id)}&bookId=${id}`}
                    >
                      <Button
                        className="
                          bg-[#FF6D1F]
                          text-white
                          border-2 border-[#222222]
                          rounded-xl
                          shadow-[4px_4px_0px_0px_#222222]
                          px-4 py-2
                        "
                      >
                        Open
                      </Button>
                    </Link>

                    <Button
                      onClick={() => removeBookmark(id)}
                      className="
                        bg-red-500
                        text-white
                        border-2 border-[#222222]
                        rounded-xl
                        shadow-[4px_4px_0px_0px_#222222]
                        px-4 py-2
                      "
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

        </div>

      </div>
      </main>
    </div>
  );
}