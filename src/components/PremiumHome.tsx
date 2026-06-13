import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, LockKeyhole, ShieldCheck } from "lucide-react";

import FallingPattern from "./FallingPattern";

type Service = {
  id: "casamento" | "aniversario" | "formatura" | "corporativo";
  title: string;
  subtitle: string;
  price: number;
  image: string;
  description: string;
  delivery: string;
};

interface PremiumHomeProps {
  services: Service[];
  isAdmin: boolean;
  openGalleryAccess: () => void;
  openAuthModal: (mode: "login" | "register") => void;
  openServicePurchase: (service: Service) => void;
  openAdminPage: () => void;
}

const stats = [
  { value: "+10.000", label: "fotos entregues" },
  { value: "+500", label: "eventos" },
  { value: "98%", label: "satisfação" }
];

function CameraHero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!el || !canvas || !context) return;

    let animationFrame = 0;
    let width = 1;
    let height = 1;
    let targetX = 0;
    let targetY = 0;
    let rotationX = -0.08;
    let rotationY = -0.16;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      targetY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      targetX = (0.5 - (e.clientY - rect.top) / rect.height) * 0.28;
    };

    const onLeave = () => {
      targetX = -0.08;
      targetY = -0.16;
    };

    const drawRoundedRect = (
      x: number,
      y: number,
      rectWidth: number,
      rectHeight: number,
      radius: number,
      fill: CanvasGradient | string,
      stroke?: string
    ) => {
      context.beginPath();
      context.roundRect(x, y, rectWidth, rectHeight, radius);
      context.fillStyle = fill;
      context.fill();
      if (stroke) {
        context.strokeStyle = stroke;
        context.lineWidth = 1.5;
        context.stroke();
      }
    };

    const render = (time: number) => {
      rotationX += (targetX - rotationX) * 0.055;
      rotationY += (targetY - rotationY) * 0.055;

      context.clearRect(0, 0, width, height);
      const scale = Math.min(width / 620, height / 600);
      const centerX = width * 0.56;
      const centerY = height * 0.5 + Math.sin(time * 0.0012) * 5;

      context.save();
      context.translate(centerX, centerY);
      context.transform(
        1,
        rotationX * 0.2,
        rotationY * 0.32,
        1,
        rotationY * 42,
        rotationX * -30
      );
      context.scale(scale, scale);

      context.shadowColor = "rgba(255, 35, 35, 0.25)";
      context.shadowBlur = 70;
      context.fillStyle = "rgba(120, 0, 0, 0.18)";
      context.beginPath();
      context.ellipse(15, 210, 225, 42, 0, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      const bodyGradient = context.createLinearGradient(-240, -150, 230, 190);
      bodyGradient.addColorStop(0, "#353535");
      bodyGradient.addColorStop(0.42, "#171717");
      bodyGradient.addColorStop(1, "#050505");
      drawRoundedRect(-245, -155, 490, 315, 42, bodyGradient, "rgba(255,255,255,0.17)");

      const gripGradient = context.createLinearGradient(145, -75, 245, 150);
      gripGradient.addColorStop(0, "#242424");
      gripGradient.addColorStop(1, "#080808");
      drawRoundedRect(135, -82, 110, 242, 34, gripGradient, "rgba(255,255,255,0.1)");

      context.fillStyle = "#0b0b0b";
      context.strokeStyle = "rgba(255,255,255,0.14)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(-120, -155);
      context.lineTo(-68, -225);
      context.lineTo(62, -225);
      context.lineTo(118, -155);
      context.closePath();
      context.fill();
      context.stroke();

      drawRoundedRect(-58, -216, 112, 32, 8, "#171717", "rgba(255,255,255,0.14)");
      drawRoundedRect(151, -132, 54, 22, 11, "#090909", "rgba(255,255,255,0.18)");

      context.save();
      context.translate(-34, 0);
      const lensOuter = context.createRadialGradient(-28, -28, 20, 0, 0, 132);
      lensOuter.addColorStop(0, "#4b4b4b");
      lensOuter.addColorStop(0.35, "#181818");
      lensOuter.addColorStop(1, "#030303");
      context.fillStyle = lensOuter;
      context.strokeStyle = "rgba(255,255,255,0.2)";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(0, 0, 132, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      context.fillStyle = "#101010";
      context.strokeStyle = "rgba(255,255,255,0.12)";
      context.lineWidth = 12;
      context.beginPath();
      context.arc(0, 0, 103, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      const glass = context.createRadialGradient(-34, -40, 8, 0, 0, 82);
      glass.addColorStop(0, "rgba(255,110,110,0.8)");
      glass.addColorStop(0.2, "rgba(105,25,35,0.7)");
      glass.addColorStop(0.55, "#11152a");
      glass.addColorStop(1, "#020205");
      context.fillStyle = glass;
      context.beginPath();
      context.arc(0, 0, 78, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(255,255,255,0.2)";
      context.beginPath();
      context.ellipse(-30, -35, 23, 11, -0.45, 0, Math.PI * 2);
      context.fill();
      context.restore();

      drawRoundedRect(-212, -120, 62, 35, 8, "#080808", "rgba(255,255,255,0.12)");
      context.fillStyle = "rgba(255, 70, 70, 0.75)";
      context.beginPath();
      context.arc(176, -101, 4, 0, Math.PI * 2);
      context.fill();

      context.restore();
      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    animationFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative"
      initial={{ opacity: 0, scale: 0.98, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d", pointerEvents: "auto" }}
    >
      <div
        className="absolute -inset-6 rounded-[2.5rem]"
        style={{
          background:
            "radial-gradient(circle at 68% 26%, rgba(255,60,60,0.26) 0%, rgba(0,0,0,0) 58%), radial-gradient(circle at 40% 75%, rgba(180,80,255,0.10) 0%, rgba(0,0,0,0) 56%)"
        }}
      />

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-black/30">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_60%_25%,rgba(255,70,70,0.16)_0%,rgba(0,0,0,0)_52%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_100%)]" />
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }} />
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Câmera profissional tridimensional"
          className="relative z-10 h-[min(700px,68vh)] w-[min(640px,58vw)] min-w-[320px]"
        />
      </div>
    </motion.div>
  );
}

export function PremiumHome({
  services,
  isAdmin,
  openGalleryAccess,
  openAuthModal,
  openServicePurchase,
  openAdminPage
}: PremiumHomeProps) {
  const horizontalRef = useRef<HTMLElement | null>(null);
  const horizontalTrackRef = useRef<HTMLDivElement | null>(null);

  const featureImages = useMemo(
    () => [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1523438097201-512ae7d59c42?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=80"
    ],
    []
  );

  useEffect(() => {
    let raf = 0;
    let lenisInstance: { raf: (time: number) => void; destroy: () => void } | null = null;
    let horizontalTween: { kill: () => void; scrollTrigger?: { kill: () => void } } | null = null;
    let scrollTriggerModule: { getAll: () => Array<{ kill: () => void }> } | null = null;
    let cancelled = false;

    const bootstrap = async () => {
      const [{ default: gsap }, scrollTriggerModuleImport, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis")
      ]);

      if (cancelled) return;

      const ScrollTrigger = scrollTriggerModuleImport.default;
      scrollTriggerModule = ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      lenisInstance = new Lenis({
        smoothWheel: true,
        lerp: 0.08,
        wheelMultiplier: 0.9,
        gestureOrientation: "vertical"
      });

      const hero = document.querySelector<HTMLElement>("[data-hero]");
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal]");

      const frameLoop = (time: number) => {
        lenisInstance?.raf(time);
        raf = requestAnimationFrame(frameLoop);
      };
      raf = requestAnimationFrame(frameLoop);

      if (hero) {
        gsap.fromTo(
          hero.querySelectorAll("[data-hero-line]"),
          { opacity: 0, y: 56, filter: "blur(14px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.15,
            stagger: 0.14,
            ease: "power4.out",
            delay: 0.15
          }
        );

        gsap.fromTo(
          hero.querySelector("[data-hero-media]"),
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 1
            }
          }
        );
      }

      revealItems.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 42, filter: "blur(12px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      const section = horizontalRef.current;
      const track = horizontalTrackRef.current;

      if (section && track) {
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        horizontalTween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true
          }
        });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenisInstance?.destroy();
      horizontalTween?.scrollTrigger?.kill();
      horizontalTween?.kill();
      scrollTriggerModule?.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="pb-20">
      <section data-hero className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <FallingPattern />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_40%,rgba(0,0,0,0.76)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.86)_100%)]" />

          <div className="absolute inset-0" data-hero-media>
            <div className="absolute inset-0 flex items-center justify-end px-4 sm:px-6 lg:px-8">
              <CameraHero />
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 flex min-h-screen items-center px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-[560px]">
                <div className="flex flex-wrap gap-2">
                  {[
                    "PRIVATE GALLERY",
                    "SECURE CHECKOUT",
                    "CLIENT ACCESS",
                    "PHOTO DELIVERY"
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p data-hero-line className="mt-4 text-[11px] font-semibold uppercase tracking-[0.44em] text-white/60">
                  PRIVATE PHOTO SYSTEM
                </p>

                <h1 className="mt-4 text-2xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white sm:text-3xl md:text-4xl">
                  Galerias privadas para fotógrafos modernos
                </h1>

                <p data-hero-line className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                  Venda fotos, entregue galerias exclusivas e ofereça uma experiência premium.
                </p>

                <div data-hero-line className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={openGalleryAccess}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90"
                  >
                    Acessar Galeria
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                  >
                    Conhecer experiência
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="mx-auto flex min-h-[120vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-center">
          <div className="w-full lg:w-1/2">
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80"
                alt="Evento premium"
                className="h-[70vh] w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            </div>
          </div>

          <div className="w-full lg:w-1/2 lg:pl-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/50">
              Experiência editorial
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-black uppercase leading-[0.96] tracking-[-0.07em] text-white sm:text-6xl">
              Fotografia de evento com linguagem de marca de luxo.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/68">
              A superfície pública prioriza impacto visual. Acesso à galeria, compra de serviço e checkout continuam disponíveis, mas sem interromper a experiência editorial.
            </p>
            <button
              type="button"
              onClick={openGalleryAccess}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              Abrir galeria privada
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section ref={horizontalRef} className="relative min-h-screen overflow-hidden">
        <div className="sticky top-0 flex min-h-screen items-center overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/50">
                Galeria horizontal
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.96] tracking-[-0.07em] text-white sm:text-6xl">
                Fotos deslizando lateralmente conforme a página avança.
              </h2>
            </div>
          </div>

          <div
            ref={horizontalTrackRef}
            className="flex min-w-max gap-6 px-4 sm:px-6 lg:px-8"
          >
            {featureImages.map((image, index) => (
              <div
                key={image}
                className="relative h-[72vh] w-[72vw] min-w-[72vw] overflow-hidden rounded-[2rem] sm:w-[54vw] sm:min-w-[54vw] lg:w-[42vw] lg:min-w-[42vw]"
              >
                <img
                  src={image}
                  alt={`Galeria ${index + 1}`}
                  className="h-full w-full object-cover object-center transition duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-5 bottom-5 max-w-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-white/55">
                    Fauzi Eventos
                  </p>
                  <p className="mt-3 text-2xl font-black uppercase tracking-[-0.05em] text-white">
                    Momento {index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="border-y border-white/10 py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-6xl font-black tracking-[-0.08em] text-white sm:text-8xl lg:text-[8rem]">
                  {stat.value}
                </div>
                <p className="mt-3 text-sm uppercase tracking-[0.34em] text-white/45">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="relative min-h-screen overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=2200&q=80"
          alt="Chamada final"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.25)_42%,rgba(0,0,0,0.86)_100%)]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.44em] text-white/60">
              Acesso privado
            </p>
            <h2 className="mt-6 text-5xl font-black uppercase leading-[0.92] tracking-[-0.08em] text-white sm:text-7xl lg:text-8xl">
              Entrar na galeria
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Fotos privadas, compra de serviço, carrinho, checkout e download liberado apenas após pagamento aprovado.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={openGalleryAccess}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90"
              >
                Acessar galeria
                <ChevronRight className="h-4 w-4" />
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={openAdminPage}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Painel admin
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 text-white/70">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => openServicePurchase(service)}
              className="group flex w-full items-center justify-between border-b border-white/10 py-5 text-left transition hover:border-white/25"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/45">
                  Serviço
                </p>
                <p className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  {service.title}
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                  {service.subtitle}
                </p>
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45 transition group-hover:text-white">
                Comprar
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openGalleryAccess}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-white/90"
          >
            <LockKeyhole className="h-4 w-4" />
            Acessar galeria
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={openAdminPage}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Painel admin
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default PremiumHome;
