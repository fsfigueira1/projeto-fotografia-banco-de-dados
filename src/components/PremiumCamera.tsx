import { useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

const CAMERA_SOURCES = [
  "/images/camera-hero.png",
  "/img/camera-hero.png",
  "/camera-hero.png"
] as const;

type Tilt = {
  rotateX: number;
  rotateY: number;
};

export function PremiumCamera() {
  const reducedMotion = useReducedMotion();
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageSource, setImageSource] = useState<string | null>(
    CAMERA_SOURCES[0]
  );
  const [tilt, setTilt] = useState<Tilt>({ rotateX: -2, rotateY: -4 });

  function handleImageError() {
    const nextIndex = sourceIndex + 1;
    if (nextIndex >= CAMERA_SOURCES.length) {
      setImageSource(null);
      return;
    }

    setSourceIndex(nextIndex);
    setImageSource(CAMERA_SOURCES[nextIndex]);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

    setTilt({
      rotateX: Math.max(-5, Math.min(5, vertical * -8)),
      rotateY: Math.max(-5, Math.min(5, horizontal * 10))
    });
  }

  function resetTilt() {
    setTilt({ rotateX: -2, rotateY: -4 });
  }

  return (
    <motion.div
      className="camera-stage"
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="camera-glow" aria-hidden="true" />
      <motion.div
        className="camera-float"
        animate={
          reducedMotion
            ? undefined
            : {
                y: [0, -12, 0],
                rotateZ: [-1.5, 0.8, -1.5]
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="camera-tilt"
          animate={reducedMotion ? undefined : tilt}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        >
          <div
            data-camera-fallback
            className="camera-fallback"
            role="img"
            aria-label="Câmera profissional"
          >
            <div className="camera-top" aria-hidden="true" />
            <div className="camera-body">
              <div className="camera-brand">FAUZI</div>
              <div className="camera-lens">
                <div className="camera-lens-glass" />
              </div>
              <div className="camera-grip" />
              <div className="camera-indicator" />
            </div>
          </div>

          {imageSource ? (
            <img
              key={imageSource}
              src={imageSource}
              onError={handleImageError}
              alt="Câmera profissional Fauzi Eventos"
              className="camera-image"
            />
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
