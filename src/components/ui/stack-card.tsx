"use client";

import * as motion from "motion/react-client";
import type { Variants } from "motion/react";
import type { CSSProperties } from "react";
import { ChevronRight, Heart, ImageIcon, MapPin, Sparkles } from "lucide-react";

export interface PhotoStackItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  price?: string;
  featured?: boolean;
}

interface ScrollTriggeredProps {
  items: PhotoStackItem[];
  onAction?: (id: string) => void;
}

export function ScrollTriggered({ items, onAction }: ScrollTriggeredProps) {
  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,10,12,0.86),rgba(6,6,8,0.94))] px-4 py-14 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl md:px-8"
        style={container}
      >
        {items.map((item, i) => (
          <Card key={item.id} i={i} item={item} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  item: PhotoStackItem;
  i: number;
  onAction?: (id: string) => void;
}

function Card({ item, i, onAction }: CardProps) {
  return (
    <motion.div
      className={`card-container-${i}`}
      style={cardContainer}
      initial={{ x: i % 2 === 0 ? -90 : 90, y: 60, opacity: 0, scale: 0.98 }}
      whileInView={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      viewport={{ amount: 0.7, once: false }}
      transition={{ type: "spring", bounce: 0.18, duration: 0.75, delay: i * 0.05 }}
    >
      <motion.article
        style={card}
        variants={cardVariants}
        whileHover={{ y: -6, rotate: -0.25, scale: 1.01 }}
        transition={{ type: "spring", bounce: 0.16, duration: 0.55 }}
        className="card overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <div className="relative h-full w-full">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/18 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_24%)]" />

          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
            {item.featured ? <Sparkles className="h-3.5 w-3.5 text-[#ff1a1a]" /> : <ImageIcon className="h-3.5 w-3.5 text-white/70" />}
            {item.featured ? "Destaque" : "Foto"}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-black tracking-[-0.05em] text-white">{item.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/72">
                  <MapPin className="h-4 w-4 text-white/55" />
                  <span className="truncate">{item.subtitle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAction?.(item.id)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white text-black transition hover:scale-[1.03]"
                aria-label={`Comprar ${item.title}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md">
                <Heart className="h-3.5 w-3.5 text-[#ff1a1a]" />
                {item.price || "Consultar valor"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Fauzi Eventos
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

const cardVariants: Variants = {
  offscreen: {
    y: 220,
    scale: 0.92,
    rotate: -7,
    opacity: 0
  },
  onscreen: {
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.22,
      duration: 0.75
    }
  }
};

const container: CSSProperties = {
  margin: "0 auto",
  maxWidth: 1240,
  paddingBottom: 28,
  width: "100%"
};

const cardContainer: CSSProperties = {
  overflow: "hidden",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  paddingTop: 14,
  marginBottom: -118
};

const card: CSSProperties = {
  width: 360,
  height: 520,
  borderRadius: 30,
  background: "#0b0b0d",
  boxShadow:
    "0 0 1px rgba(0,0,0,0.08), 0 0 2px rgba(0,0,0,0.08), 0 0 8px rgba(0,0,0,0.08), 0 0 24px rgba(0,0,0,0.12)",
  transformOrigin: "10% 60%"
};

const splash: CSSProperties = {
  position: "absolute",
  inset: 0,
  clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`
};
