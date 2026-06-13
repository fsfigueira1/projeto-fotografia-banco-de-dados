"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

type FallingPatternProps = {
  className?: string;
};

type Drop = {
  x: number;
  y: number;
  z: number; // depth for blur/opacity
  speed: number;
  len: number;
  width: number;
  hue: number;
  alpha: number;
};

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
export default function FallingPattern({ className }: FallingPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dropsRef = useRef<Drop[]>([]);

  const seedDrops = useMemo(() => {
    const rand = mulberry32(184); // stable
    const base: Drop[] = [];
    for (let i = 0; i < 220; i++) {
      const z = rand();
      base.push({
        x: rand(),
        y: rand(),
        z,
        speed: 0.22 + rand() * 0.55 + z * 0.35,
        len: 16 + rand() * 46 + z * 16,
        width: 1 + rand() * 2,
        hue: rand() < 0.75 ? 0 : 0, // red/deep hues only (avoid noise)
        alpha: 0.08 + rand() * 0.18
      });
    }
    return base;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    dropsRef.current = seedDrops;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      const rectW = canvas.clientWidth || 1;
      const rectH = canvas.clientHeight || 1;

      ctx.clearRect(0, 0, rectW, rectH);

      // base subtle vignette
      const g = ctx.createRadialGradient(rectW * 0.55, rectH * 0.35, 10, rectW * 0.55, rectH * 0.35, Math.max(rectW, rectH));
      g.addColorStop(0, "rgba(255,70,70,0.08)");
      g.addColorStop(0.35, "rgba(255,70,70,0.02)");
      g.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, rectW, rectH);

      const drops = dropsRef.current;
      for (const d of drops) {
        d.y += d.speed * dt;
        if (d.y > 1.12) {
          d.y = -0.12;
          d.x = Math.random();
        }

        const x = d.x * rectW;
        const y = d.y * rectH;

        const red = Math.floor(35 + (1 - d.z) * 65);
        const alpha = d.alpha * (0.55 + (1 - d.z) * 0.65);
        ctx.strokeStyle = `rgba(${red}, 10, 10, ${alpha})`;
        ctx.lineWidth = d.width;

        // blur-ish by drawing multiple passes very lightly
        for (let i = 0; i < 2; i++) {
          const yy = y + i * 0.15;
          ctx.beginPath();
          ctx.moveTo(x, yy - d.len);
          ctx.lineTo(x, yy);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [seedDrops]);

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      initial={{ opacity: 0.1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.75) 100%)"
        }}
      />
      <div className="absolute inset-0" style={{ filter: "blur(0.2px)" }} />
    </motion.div>
  );
}
