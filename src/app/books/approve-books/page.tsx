"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/navbar";
import { FlipbookPreview } from "@/components/custom/flipbook_preview";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";

export default function ApproveBooksPage() {
    const { data: session, status } = useSession();
    const [books, setBooks] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (status !== "authenticated") return;

        const fetchDrafts = async () => {
            try {
                const res = await fetch("/api/books/drafts");
                const data = await res.json();

                if (res.ok) {
                    setBooks(data.books);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === "admin") {
            fetchDrafts();
        }
    }, [status, session]);

    // Keep auth guard after hooks.
    if (status === "loading") {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session || session.user.role !== "admin") {
        return (
            <div className="h-screen flex items-center justify-center text-2xl">
                🚫 Access Denied
            </div>
        );
    }

    const handleApprove = async (id: string) => {
        await fetch("/api/books/approve", {
            method: "POST",
            body: JSON.stringify({ draftId: id }),
            headers: { "Content-Type": "application/json" },
        });

        setBooks((prev) => prev.filter((b) => b._id !== id));
        setSelected(null);
    };

    const handleReject = async (id: string) => {
        await fetch("/api/books/reject", {
            method: "POST",
            body: JSON.stringify({ draftId: id }),
            headers: { "Content-Type": "application/json" },
        });

        setBooks((prev) => prev.filter((b) => b._id !== id));
        setSelected(null);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <AnimatedSkyNoBirds />
            <main className="relative min-h-screen p-10 font-tektur">
                <Navbar />

            <div className="grid grid-cols-2 gap-10 mt-10">
                <h1 className="text-4xl font-bold col-span-2 mb-6">Admin Panel</h1>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold">Draft Books</h1>

                    {loading && <p>Loading drafts...</p>}

                    {books.map((book) => (
                        <Card
                            key={book._id}
                            onClick={() => setSelected(book)}
                            className="
                cursor-pointer p-5 bg-white
                border-4 border-[#222]
                rounded-2xl
                shadow-[6px_6px_0px_0px_#222]
                hover:translate-x-1 hover:translate-y-1 hover:shadow-none
                transition-all
              "
                        >
                            <div className="font-bold">{book.name}</div>
                            <div className="text-sm text-gray-600">{book.author}</div>
                            <div className="text-xs text-gray-500 mt-2">
                                {book.description}
                            </div>
                        </Card>
                    ))}
                </div>

                <div>
                    {selected ? (
                        <div className="space-y-6">

                            <FlipbookPreview
                                data={{
                                    name: selected.name,
                                    author: selected.author,
                                    description: selected.description,
                                    duration: selected.duration,
                                    variant: selected.variant,
                                    tags: selected.tags,
                                    pages: selected.pages,
                                }}
                            />

                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={() => handleApprove(selected._id)}
                                    className="bg-green-500 text-white px-6 py-3 border-2 border-[#222] rounded-xl shadow-[4px_4px_0px_0px_#222]"
                                >
                                    ✅ Approve
                                </Button>

                                <Button
                                    onClick={() => handleReject(selected._id)}
                                    className="bg-red-500 text-white px-6 py-3 border-2 border-[#222] rounded-xl shadow-[4px_4px_0px_0px_#222]"
                                >
                                    ❌ Reject
                                </Button>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center text-gray-500 mt-20">
                            Select a book to preview
                        </div>
                    )}
                </div>

                </div>
            </main>
        </div>
    );
}