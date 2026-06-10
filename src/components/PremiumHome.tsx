import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, LockKeyhole, ShieldCheck } from "lucide-react";

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

const heroLines = ["Galerias privadas", "para momentos únicos"];
const stats = [
  { value: "+10.000", label: "fotos entregues" },
  { value: "+500", label: "eventos" },
  { value: "98%", label: "satisfação" }
];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            data-hero-media
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2200&q=80"
            alt="Fauzi Eventos"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_40%,rgba(0,0,0,0.76)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.2)_0%,rgba(5,5,5,0.86)_100%)]" />
        </motion.div>

        <div className="relative z-10 flex min-h-screen items-end px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-end">
            <div className="max-w-3xl">
              <p data-hero-line className="text-[11px] font-semibold uppercase tracking-[0.44em] text-white/60">
                Fauzi Eventos
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.08em] text-white sm:text-7xl lg:text-[8rem]">
                {heroLines.map((line) => (
                  <span key={line} data-hero-line className="block">
                    {line}
                  </span>
                ))}
              </h1>

              <p
                data-hero-line
                className="mt-6 max-w-xl text-base leading-8 text-white/72 sm:text-lg"
              >
                Acesse suas fotos com segurança, escolha suas favoritas e finalize sua compra em uma experiência exclusiva.
              </p>

              <div data-hero-line className="mt-8 flex flex-wrap items-center gap-3">
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
