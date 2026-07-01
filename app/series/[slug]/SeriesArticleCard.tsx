"use client";
import { useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/supabase";

const CATEGORY_COLORS: Record<string, string> = {
  "다른나라 줍줍줍": "#3B82F6",
  "경제 줍줍줍": "#10B981",
  "사람 줍줍줍": "#F59E0B",
};
const CATEGORY_BG: Record<string, string> = {
  "다른나라 줍줍줍": "#1a2235",
  "경제 줍줍줍": "#162a22",
  "사람 줍줍줍": "#2a2212",
};

export default function SeriesArticleCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false);
  const date = (article.published_at ?? article.created_at).slice(0, 10).replace(/-/g, ".");
  const catColor = CATEGORY_COLORS[article.category] ?? "#888";
  const catBg = CATEGORY_BG[article.category] ?? "#222";
  return (
    <Link href={`/article/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ backgroundColor: "#242118", border: `1px solid ${hovered ? "#c8a96e" : "#333"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.2s, transform 0.2s", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}>
        <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: catBg, overflow: "hidden" }}>
          {article.cover_image ? (<img src={article.cover_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#444", fontSize: "12px" }}>{article.category}</span></div>)}
        </div>
        <div style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", backgroundColor: catColor, color: "#fff", display: "inline-block", marginBottom: "8px" }}>{article.category}</span>
          <h2 style={{ color: "#f0e8d6", fontSize: "15px", fontWeight: 700, lineHeight: 1.5, margin: "0 0 8px" }}>{article.title}</h2>
          <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>{date}</p>
        </div>
      </div>
    </Link>
  );
}
