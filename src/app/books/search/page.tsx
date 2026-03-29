"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/navbar";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Search error:", data.error);
        return;
      }

      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce live search while typing.
  useEffect(() => {
    const delay = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  const handleNavigate = (id: string) => {
    const parts = id.split("-");
    console.log(parts);
    const shelfIndex = parts[parts.length - 1];

    router.push(
      `/library/web-dev?shelf=${Number(shelfIndex) + 1}&bookId=${id}`
    );
  };

  return (
    <>
      <AnimatedSkyNoBirds />
      <main className="relative min-h-screen w-full font-tektur">
        <div className="absolute top-10 right-11 w-full z-50">
        <Navbar />
      </div>

      <div className="flex items-start justify-center pt-32">
        <Card
          className="
            bg-[#F5E7C6]
            border-4 border-[#222222]
            rounded-[40px]
            shadow-[12px_12px_0px_0px_#222222]
            p-16
            w-[700px]
            max-w-[90%]
          "
        >
          <h1 className="text-4xl font-bold text-[#222222] mb-7 text-center">
            Search the Library
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center flex-1 bg-white border-4 border-[#222222] rounded-2xl shadow-[6px_6px_0px_0px_#222222] px-6 py-4">
              <Search className="text-[#222222] mr-4" size={26} />
              <input
                type="text"
                placeholder="Search books, concepts, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="
                  w-full
                  bg-transparent
                  outline-none
                  text-xl
                  text-[#222222]
                  placeholder:text-[#555]
                "
              />
            </div>

            <Button
              onClick={handleSearch}
              className="
                bg-[#FF6D1F]
                text-white
                border-4 border-[#222222]
                rounded-2xl
                shadow-[6px_6px_0px_0px_#222222]
                font-bold
                px-8 py-7
              "
            >
              Go
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-10"
              >
                <motion.div
                  className="w-10 h-10 border-4 border-[#222222] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 max-h-[400px] overflow-y-auto pr-2"
              >
                {results.map((book, i) => (
                  <motion.div
                    key={book._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleNavigate(book._id)}
                    className="
            cursor-pointer
            bg-white
            border-4 border-[#222222]
            rounded-2xl
            shadow-[6px_6px_0px_0px_#222222]
            p-5
            hover:translate-x-1
            hover:translate-y-1
            hover:shadow-none
            transition-all
          "
                  >
                    <div className="font-bold text-lg text-[#222222]">
                      {book.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {book.author}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {book.description}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : query ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-600 mt-4"
              >
                No results found.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </div>
      </main>
    </>
  );
}