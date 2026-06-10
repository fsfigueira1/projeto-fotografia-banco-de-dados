"use client";

import {
  ReactNode,
  TouchEvent,
  WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

export default function ScrollExpandMedia({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children
}: ScrollExpandMediaProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const scrollProgressRef = useRef(0);
  const mediaFullyExpandedRef = useRef(false);
  const touchStartYRef = useRef(0);

  const smoothProgress = useSpring(scrollProgress, {
    stiffness: 140,
    damping: 18,
    mass: 0.7
  });

  useEffect(() => {
    scrollProgressRef.current = 0;
    mediaFullyExpandedRef.current = false;
    touchStartYRef.current = 0;
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
    setTouchStartY(0);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        mediaFullyExpandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
        return;
      }

      if (mediaFullyExpandedRef.current) return;

      e.preventDefault();
      const scrollDelta = e.deltaY * 0.00115;
      const next = clamp(scrollProgressRef.current + scrollDelta);
      scrollProgressRef.current = next;
      setScrollProgress(next);

      if (next >= 0.84) {
        mediaFullyExpandedRef.current = true;
        setMediaFullyExpanded(true);
        setShowContent(true);
      } else if (next < 0.64) {
        setShowContent(false);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      touchStartYRef.current = y;
      setTouchStartY(y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartYRef.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (mediaFullyExpandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        mediaFullyExpandedRef.current = false;
        setMediaFullyExpanded(false);
        e.preventDefault();
        return;
      }

      if (mediaFullyExpandedRef.current) return;

      e.preventDefault();
      const scrollFactor = deltaY < 0 ? 0.009 : 0.0065;
      const next = clamp(scrollProgressRef.current + deltaY * scrollFactor);
      scrollProgressRef.current = next;
      setScrollProgress(next);

      if (next >= 0.84) {
        mediaFullyExpandedRef.current = true;
        setMediaFullyExpanded(true);
        setShowContent(true);
      } else if (next < 0.64) {
        setShowContent(false);
      }

      touchStartYRef.current = touchY;
      setTouchStartY(touchY);
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = 0;
      setTouchStartY(0);
    };

    window.addEventListener("wheel", handleWheel as unknown as EventListener, { passive: false });
    window.addEventListener("touchstart", handleTouchStart as unknown as EventListener, { passive: false });
    window.addEventListener("touchmove", handleTouchMove as unknown as EventListener, { passive: false });
    window.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener("wheel", handleWheel as unknown as EventListener);
      window.removeEventListener("touchstart", handleTouchStart as unknown as EventListener);
      window.removeEventListener("touchmove", handleTouchMove as unknown as EventListener);
      window.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, []);

  useEffect(() => {
    const updateMobile = () => setIsMobileState(window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  const mediaWidth = useTransform(smoothProgress, (value) => 300 + value * (isMobileState ? 650 : 1250));
  const mediaHeight = useTransform(smoothProgress, (value) => 400 + value * (isMobileState ? 200 : 400));
  const titleOffset = useTransform(smoothProgress, (value) => value * (isMobileState ? 180 : 150));
  const titleReverseOffset = useTransform(titleOffset, (value) => -value);
  const backgroundOpacity = useTransform(smoothProgress, (value) => 1 - value);
  const overlayOpacity = useTransform(smoothProgress, (value) => 0.5 - value * 0.3);
  const imageOverlayOpacity = useTransform(smoothProgress, (value) => 0.7 - value * 0.3);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  const finishExperience = () => {
    scrollProgressRef.current = 1;
    mediaFullyExpandedRef.current = true;
    touchStartYRef.current = 0;
    setScrollProgress(1);
    setShowContent(true);
    setMediaFullyExpanded(true);
    setTouchStartY(0);
  };

  return (
    <div ref={sectionRef} className="overflow-x-hidden transition-colors duration-700 ease-in-out">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <div className="relative flex min-h-[100dvh] w-full flex-col items-center">
          {!mediaFullyExpanded && (
            <button
              onClick={finishExperience}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md transition hover:bg-black/50"
            >
              Pular
            </button>
          )}

          <motion.div className="absolute inset-0 z-0 h-full" initial={{ opacity: 0 }} style={{ opacity: backgroundOpacity }}>
            <img src={bgImageSrc} alt="Background" className="h-screen w-screen object-cover object-center" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center">
              <motion.div
                className="absolute left-1/2 top-1/2 rounded-[2rem] transition-none"
                style={{
                  width: mediaWidth,
                  height: mediaHeight,
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                  boxShadow: "0px 0px 50px rgba(0, 0, 0, 0.35)",
                  transform: "translate(-50%, -50%)"
                }}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative h-full w-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? `${mediaSrc}${mediaSrc.includes("?") ? "&" : "?"}autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1`
                            : `${mediaSrc.replace("watch?v=", "embed/")}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=${mediaSrc.split("v=")[1]}`
                        }
                        className="h-full w-full rounded-[1.25rem]"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <motion.div className="absolute inset-0 rounded-[1.25rem] bg-black/30" initial={{ opacity: 0.7 }} style={{ opacity: overlayOpacity }} />
                    </div>
                  ) : (
                    <div className="relative h-full w-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="h-full w-full rounded-[1.25rem] object-cover"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <motion.div className="absolute inset-0 rounded-[1.25rem] bg-black/30" initial={{ opacity: 0.7 }} style={{ opacity: overlayOpacity }} />
                    </div>
                  )
                ) : (
                  <div className="relative h-full w-full">
                    <img src={mediaSrc} alt={title || "Media content"} className="h-full w-full rounded-[1.25rem] object-cover" />
                    <motion.div className="absolute inset-0 rounded-[1.25rem] bg-black/50" initial={{ opacity: 0.7 }} style={{ opacity: imageOverlayOpacity }} />
                  </div>
                )}

                <div className="relative z-10 mt-4 flex flex-col items-center text-center transition-none">
                  {date && (
                    <motion.p className="text-2xl text-white/90" style={{ x: titleReverseOffset }}>
                      {date}
                    </motion.p>
                  )}
                  {scrollToExpand && (
                    <motion.p className="font-medium text-white/80" style={{ x: titleOffset }}>
                      {scrollToExpand}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              <div className={`relative z-10 flex w-full flex-col items-center justify-center gap-4 text-center transition-none ${textBlend ? "mix-blend-difference" : "mix-blend-normal"}`}>
                <motion.h2 className="text-4xl font-bold text-white/90 transition-none md:text-5xl lg:text-6xl" style={{ x: titleReverseOffset }}>
                  {firstWord}
                </motion.h2>
                <motion.h2 className="text-center text-4xl font-bold text-white/90 transition-none md:text-5xl lg:text-6xl" style={{ x: titleOffset }}>
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            <motion.section
              className="flex w-full flex-col px-4 py-10 md:px-16 lg:py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
