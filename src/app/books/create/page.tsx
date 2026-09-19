"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/custom/navbar";
import { FlipbookPreview } from "@/components/custom/flipbook_preview";
import AnimatedSkyNoBirds from "@/components/custom/animated-sky-no-birds";

const PRESET_TAGS = [
    "javascript", "typescript", "react", "nextjs", "nodejs", "express", "mongodb", "sql", "postgresql", "firebase",
    "html", "css", "tailwind", "bootstrap", "sass", "ui", "ux", "design", "figma", "frontend",
    "backend", "fullstack", "api", "rest", "graphql", "authentication", "authorization", "jwt", "oauth", "security",
    "webdev", "performance", "optimization", "seo", "testing", "jest", "cypress", "vitest", "debugging", "deployment",
    "docker", "kubernetes", "ci/cd", "aws", "azure", "gcp", "cloud", "serverless", "vercel", "netlify",
    "data-structures", "algorithms", "dsa", "recursion", "sorting", "searching", "graphs", "trees", "dp", "greedy",
    "python", "java", "c++", "c", "go", "rust", "kotlin", "swift", "dart", "flutter",
    "machine-learning", "ai", "deep-learning", "nlp", "computer-vision", "data-science", "pandas", "numpy", "tensorflow", "pytorch",
    "blockchain", "web3", "solidity", "crypto", "smart-contracts", "defi", "nft", "cybersecurity", "ethical-hacking", "networking",
    "linux", "bash", "git", "github", "open-source", "system-design", "scalability", "microservices", "event-driven", "architecture"
];

type BookSection =
    | { type: "text"; content: string }
    | { type: "highlight"; content: string }
    | { type: "list"; content: string[] };

type SectionType = BookSection["type"];

type BookPage = {
    title: string;
    sections: BookSection[];
};

export default function CreatePage() {
    const [form, setForm] = useState({
        name: "JavaScript Fundamentals",
        description: "A beginner-friendly guide to JavaScript basics, syntax, and core programming concepts.",
        author: "Devrary Team",
        duration: "2h 30m",
        difficulty: "l1",
        domain: "web-dev",
        tags: "javascript,webdev,beginner",
    });

    const [pages, setPages] = useState<BookPage[]>([
        {
            title: "Introduction to JavaScript",
            sections: [{ type: "text", content: "JavaScript is a versatile language used for building interactive web applications." }],
        },
    ]);

    const [submitting, setSubmitting] = useState(false);
    const [modal, setModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        success: boolean;
    }>({
        open: false,
        title: "",
        message: "",
        success: false,
    });

    const handleChange = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const previewKey = useMemo(() => {
        return JSON.stringify(
            pages.map((page) => ({
                title: page.title,
                sections: page.sections.map((section) => ({
                    type: section.type,
                    content: section.content,
                })),
            }))
        );
    }, [pages]);

    const addPage = () => {
        setPages([
            ...pages,
            {
                title: `New Page ${pages.length + 1}`,
                sections: [{ type: "text", content: "Write your section content here..." }],
            },
        ]);
    };

    const removePage = (pageIndex: number) => {
        if (pages.length <= 1) return;
        setPages(pages.filter((_, index) => index !== pageIndex));
    };

    const addSection = (pageIndex: number) => {
        const updated = [...pages];
        updated[pageIndex].sections.push({ type: "text", content: "" });
        setPages(updated);
    };

    const updateSection = (pIndex: number, sIndex: number, key: "type" | "content", value: string) => {
        setPages((currentPages) => currentPages.map((page, pageIndex) => {
            if (pageIndex !== pIndex) return page;

            return {
                ...page,
                sections: page.sections.map((section, sectionIndex): BookSection => {
                    if (sectionIndex !== sIndex) return section;

                    if (key === "content") {
                        return section.type === "list"
                            ? { ...section, content: value.split("\n") }
                            : { ...section, content: value };
                    }

                    const nextType = value as SectionType;
                    if (nextType === "list") {
                        return {
                            type: "list",
                            content: section.type === "list" ? section.content : section.content ? [section.content] : [],
                        };
                    }

                    return {
                        type: nextType,
                        content: section.type === "list" ? section.content.join("\n") : section.content,
                    };
                }),
            };
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const payload = {
            ...form,
            tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            pages,
        };

        console.log("Payload:", payload);

        try {
            const res = await fetch("/api/books/create", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setModal({
                    open: true,
                    title: "Submission Failed",
                    message: err?.error || "Could not create the book. Please try again.",
                    success: false,
                });
                return;
            }

            setModal({
                open: true,
                title: "Book Submitted",
                message: "Your book was created successfully.",
                success: true,
            });
        } catch {
            setModal({
                open: true,
                title: "Network Error",
                message: "Something went wrong while submitting. Please retry.",
                success: false,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <AnimatedSkyNoBirds />
            <main className="relative min-h-screen p-10 font-['Syne',sans-serif]">
                <Navbar />

            {/* Load Syne from Google Fonts in your _app or layout */}
            {/* <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" /> */}

            <div className="flex justify-center mt-10">
                <Card className="p-10 w-[900px] bg-[#F5E7C6] border-4 border-[#222] rounded-3xl shadow-[10px_10px_0px_0px_#222] space-y-10">

                    <h1 className="text-4xl font-extrabold tracking-tight text-[#222]">Create Book</h1>

                    {/* ── Basic Info ── */}
                    <section className="space-y-5">
                        <h2 className="text-base font-bold uppercase tracking-widest text-[#222]/50">Basic Info</h2>

                        <div className="grid grid-cols-2 gap-5">

                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Name</label>
                                <input
                                    value={form.name}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                placeholder:text-[#aaa] placeholder:font-normal
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    placeholder="e.g. Intro to React"
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>

                            {/* Author */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Author</label>
                                <input
                                    value={form.author}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                placeholder:text-[#aaa] placeholder:font-normal
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    placeholder="e.g. Jane Doe"
                                    onChange={(e) => handleChange("author", e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Description</label>
                                <textarea
                                    value={form.description}
                                    rows={3}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl resize-none
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                placeholder:text-[#aaa] placeholder:font-normal
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    placeholder="What is this book about?"
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Duration</label>
                                <input
                                    value={form.duration}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                placeholder:text-[#aaa] placeholder:font-normal
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    placeholder="e.g. 2h 30m"
                                    onChange={(e) => handleChange("duration", e.target.value)}
                                />
                            </div>

                            {/* Tags */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">
                                    Tags <span className="font-normal normal-case tracking-normal text-[#222]/40">(max 5)</span>
                                </label>

                                {/* Selected tags */}
                                {form.tags.split(",").filter(Boolean).length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {form.tags.split(",").filter(Boolean).map((tag: string) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const updated = form.tags.split(",").filter((t: string) => t !== tag).join(",");
                                                    handleChange("tags", updated);
                                                }}
                                                className="
                      flex items-center gap-1.5
                      bg-[#FF6D1F] text-white
                      px-3 py-1 rounded-lg
                      border-2 border-[#222]
                      text-xs font-bold uppercase tracking-wide
                      hover:bg-[#e55c10] transition-colors
                    "
                                            >
                                                {tag}
                                                <span className="text-[10px] opacity-80">✕</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Preset tag picker */}
                                <div className="
              flex flex-wrap gap-2 max-h-36 overflow-y-auto
              border-2 border-[#222] p-3 rounded-xl bg-white
            ">
                                    {PRESET_TAGS.map((tag) => {
                                        const selected = form.tags.split(",").includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                disabled={!selected && form.tags.split(",").filter(Boolean).length >= 5}
                                                onClick={() => {
                                                    let current = form.tags.split(",").filter(Boolean);
                                                    if (selected) {
                                                        current = current.filter((t: string) => t !== tag);
                                                    } else {
                                                        if (current.length >= 5) return;
                                                        current.push(tag);
                                                    }
                                                    handleChange("tags", current.join(","));
                                                }}
                                                className={`
                      px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide
                      border-2 border-[#222] transition-all
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${selected
                                                        ? "bg-[#222] text-white"
                                                        : "bg-[#F5E7C6] hover:bg-[#FF6D1F] hover:text-white hover:border-[#FF6D1F]"
                                                    }
                    `}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom tag input */}
                                <input
                                    placeholder="Type a custom tag + Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const value = (e.target as HTMLInputElement).value.trim();
                                            if (!value) return;
                                            const current = form.tags.split(",").filter(Boolean);
                                            if (current.length >= 5 || current.includes(value)) return;
                                            current.push(value);
                                            handleChange("tags", current.join(","));
                                            (e.target as HTMLInputElement).value = "";
                                        }
                                    }}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                placeholder:text-[#aaa] placeholder:font-normal
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                />
                            </div>

                            {/* Difficulty */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Difficulty</label>
                                <select
                                title="meow"
                                    value={form.difficulty}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl appearance-none cursor-pointer
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    onChange={(e) => handleChange("difficulty", e.target.value)}
                                >
                                    <option value="l1">Beginner</option>
                                    <option value="l2">Intermediate</option>
                                    <option value="l3">Expert</option>
                                    <option value="l4">Misc</option>
                                </select>
                            </div>

                            {/* Domain */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">Domain</label>
                                <select
                                title="meow"
                                    value={form.domain}
                                    className="
                w-full px-4 py-3 text-sm font-semibold text-[#222]
                bg-white rounded-xl appearance-none cursor-pointer
                border-2 border-[#222]
                shadow-[4px_4px_0px_0px_#222]
                focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]
                transition-all duration-100
              "
                                    onChange={(e) => handleChange("domain", e.target.value)}
                                >
                                    <option value="web-dev">Web Dev</option>
                                    <option value="ai">AI / ML</option>
                                    <option value="blockchain">Blockchain</option>
                                    <option value="cybersec">CyberSec</option>
                                    <option value="robotics">Robotics</option>
                                    <option value="cloud">Cloud</option>
                                </select>
                            </div>

                        </div>
                    </section>

                    {/* ── Pages ── */}
                    <section className="space-y-5">
                        <h2 className="text-base font-bold uppercase tracking-widest text-[#222]/50">Pages</h2>
                        <div
                            className="
    bg-[#FFF7E6] border-2 border-[#222]
    rounded-2xl shadow-[6px_6px_0px_0px_#222]
    p-5 space-y-4
  "
                        >
                            {/* Heading */}
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#222]">
                                Front Cover
                            </h2>

                            {/* Title */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">
                                    Title
                                </label>
                                <input
                                    title="meow"
                                    placeholder="My Awesome Book"
                                    className="
        w-full px-4 py-3 text-sm font-semibold text-[#222]
        bg-[#FAF3E1] rounded-xl
        border-2 border-[#222]
        shadow-[3px_3px_0px_0px_#222]
      "
                                />
                            </div>

                            {/* Sections */}
                            <div className="space-y-2.5">


                                {/* Section 2 */}
                                <div className="flex gap-2.5 items-center">
                                    <select
                                       title="meow"
                                        className="
                      px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#222]
                      bg-[#F5E7C6] rounded-lg appearance-none cursor-pointer
                      border-2 border-[#222]
                      shadow-[3px_3px_0px_0px_#222]
                      focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                      transition-all duration-100 w-[110px] shrink-0
                    "
                                    >
                                        <option value="text">Text</option>
                                        <option value="highlight">Code</option>
                                        <option value="list">List</option>
                                    </select>
                                    <input

                                        className="
                  w-full px-4 py-3 text-sm font-semibold text-[#222]
                  bg-[#FAF3E1] rounded-xl
                  border-2 border-[#222]
                  shadow-[3px_3px_0px_0px_#222]
                  placeholder:text-[#aaa] placeholder:font-normal
                  focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                  transition-all duration-100
                "
                                        placeholder="Page title..."
                                    />
                                </div>
                            </div>

                        </div>
                        <div
                            className="
    bg-[#FFF7E6] border-2 border-[#222]
    rounded-2xl shadow-[6px_6px_0px_0px_#222]
    p-5 space-y-4
  "
                        >
                            {/* Heading */}
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#222]">
                                Back Cover
                            </h2>

                            {/* Title */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-[#222]">
                                    Title
                                </label>
                                <input
                                    title="meow"
                                    placeholder="My Awesome Book"
                                    
                                    className="
        w-full px-4 py-3 text-sm font-semibold text-[#222]
        bg-[#FAF3E1] rounded-xl
        border-2 border-[#222]
        shadow-[3px_3px_0px_0px_#222]
      "
                                />
                            </div>

                            {/* Sections */}
                            <div className="space-y-2.5">


                                {/* Section 2 */}
                                <div className="flex gap-2.5 items-center">
                                    <select
                                       title="meow"
                                        className="
                      px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#222]
                      bg-[#F5E7C6] rounded-lg appearance-none cursor-pointer
                      border-2 border-[#222]
                      shadow-[3px_3px_0px_0px_#222]
                      focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                      transition-all duration-100 w-[110px] shrink-0
                    "
                                    >
                                        <option value="text">Text</option>
                                        <option value="highlight">Code</option>
                                        <option value="list">List</option>
                                    </select>
                                    <input

                                        className="
                  w-full px-4 py-3 text-sm font-semibold text-[#222]
                  bg-[#FAF3E1] rounded-xl
                  border-2 border-[#222]
                  shadow-[3px_3px_0px_0px_#222]
                  placeholder:text-[#aaa] placeholder:font-normal
                  focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                  transition-all duration-100
                "
                                        placeholder="Page title..."
                                    />
                                </div>
                            </div>

                        </div>

                        {pages.map((page, pIndex) => (
                            <div
                                key={pIndex}
                                className="
              bg-white border-2 border-[#222]
              rounded-2xl shadow-[6px_6px_0px_0px_#222]
              p-5 space-y-4
            "
                            >
                                {/* Page title */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#222]">
                                        Page {pIndex + 1} Title
                                    </label>
                                    <input
                                        value={page.title}
                                        onChange={(e) => {
                                            const updated = [...pages];
                                            updated[pIndex].title = e.target.value;
                                            setPages(updated);
                                        }}
                                        className="
                  w-full px-4 py-3 text-sm font-semibold text-[#222]
                  bg-[#FAF3E1] rounded-xl
                  border-2 border-[#222]
                  shadow-[3px_3px_0px_0px_#222]
                  placeholder:text-[#aaa] placeholder:font-normal
                  focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                  transition-all duration-100
                "
                                        placeholder="Page title..."
                                    />
                                </div>

                                {/* Sections */}
                                <div className="space-y-2.5">
                                    {page.sections.map((section: BookSection, sIndex: number) => (
                                        <div key={sIndex} className="flex gap-2.5 items-center">
                                            <select
                                                title="meow"
                                                value={section.type}
                                                onChange={(e) => updateSection(pIndex, sIndex, "type", e.target.value)}
                                                className="
                      px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#222]
                      bg-[#F5E7C6] rounded-lg appearance-none cursor-pointer
                      border-2 border-[#222]
                      shadow-[3px_3px_0px_0px_#222]
                      focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                      transition-all duration-100 w-[110px] shrink-0
                    "
                                            >
                                                <option value="text">Text</option>
                                                <option value="highlight">Code</option>
                                                <option value="list">List</option>
                                            </select>

                                            <input
                                                value={section.type === "list" ? section.content.join("\n") : section.content}
                                                onChange={(e) => updateSection(pIndex, sIndex, "content", e.target.value)}
                                                className="
                      flex-1 px-4 py-2.5 text-sm font-semibold text-[#222]
                      bg-[#FAF3E1] rounded-lg
                      border-2 border-[#222]
                      shadow-[3px_3px_0px_0px_#222]
                      placeholder:text-[#aaa] placeholder:font-normal
                      focus:outline-none focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px]
                      transition-all duration-100
                    "
                                                placeholder={section.type === "list" ? "One item per line..." : "Content..."}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => addSection(pIndex)}
                                    className="
                px-4 py-2 text-xs font-bold uppercase tracking-widest
                bg-[#F5E7C6] text-[#222]
                border-2 border-[#222] rounded-lg
                shadow-[3px_3px_0px_0px_#222]
                hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                transition-all duration-100
              "
                                >
                                    + Add Section
                                </Button>

                                <Button
                                    onClick={() => removePage(pIndex)}
                                    disabled={pages.length <= 1}
                                    className="
                px-4 py-2 text-xs font-bold uppercase tracking-widest
                bg-[#FFD6D6] text-[#222]
                border-2 border-[#222] rounded-lg
                shadow-[3px_3px_0px_0px_#222]
                hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                transition-all duration-100
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_#222]
              "
                                >
                                    Remove Page
                                </Button>
                            </div>
                        ))}

                        <Button
                            onClick={addPage}
                            className="
            px-5 py-2.5 text-xs font-bold uppercase tracking-widest
            bg-white text-[#222]
            border-2 border-[#222] rounded-xl
            shadow-[4px_4px_0px_0px_#222]
            hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
            transition-all duration-100
          "
                        >
                            + Add Page
                        </Button>
                    </section>

                    {/* ── Submit ── */}
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="
          w-full py-4 text-sm font-extrabold uppercase tracking-widest
          bg-[#222] text-[#FAF3E1]
          border-2 border-[#222] rounded-xl
          shadow-[6px_6px_0px_0px_#FF6D1F]
          hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]
          transition-all duration-150
        "
                    >
                        {submitting ? "Submitting..." : "Create Book"}
                    </Button>

                </Card>
            </div>


            <div className="p-10 rounded-xl">
                <FlipbookPreview
                    key={previewKey}
                    data={{
                        name: form.name,
                        author: form.author,
                        description: form.description,
                        duration: form.duration,
                        variant: form.difficulty,
                        tags: form.tags.split(",").filter(Boolean),
                        pages: pages
                    }}
                />
            </div>

            {modal.open && (
                <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#F5E7C6] border-4 border-[#222] rounded-3xl shadow-[10px_10px_0px_0px_#222] p-6 space-y-4">
                        <h3 className={`text-2xl font-extrabold ${modal.success ? "text-[#166534]" : "text-[#991b1b]"}`}>
                            {modal.title}
                        </h3>
                        <p className="text-sm font-semibold text-[#222]">{modal.message}</p>
                        <div className="flex justify-end">
                            <Button
                                onClick={() => setModal((prev) => ({ ...prev, open: false }))}
                                className="
                  px-5 py-2.5 text-xs font-bold uppercase tracking-widest
                  bg-white text-[#222]
                  border-2 border-[#222] rounded-xl
                  shadow-[4px_4px_0px_0px_#222]
                  hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                  transition-all duration-100
                "
                            >
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </>
    );
}
