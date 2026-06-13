import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Upload
} from "lucide-react";

import { PremiumCamera } from "./PremiumCamera";
import { Reveal } from "./Reveal";

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

const valueCards = [
  {
    title: "Acesso por senha",
    description:
      "Cada cliente recebe um código exclusivo para acessar sua galeria.",
    icon: LockKeyhole
  },
  {
    title: "Compra individual",
    description:
      "Escolha suas fotos favoritas e compre apenas o que desejar.",
    icon: ShoppingBag
  },
  {
    title: "Entrega segura",
    description:
      "Download liberado após confirmação do pagamento.",
    icon: ShieldCheck
  }
];

const experienceSteps = [
  {
    title: "Contratação do serviço",
    description:
      "O cliente escolhe a cobertura ideal para casamento, aniversário, formatura ou evento corporativo."
  },
  {
    title: "Criação da galeria privada",
    description:
      "O administrador organiza o evento, envia as fotos e prepara uma experiência exclusiva."
  },
  {
    title: "Acesso por senha",
    description:
      "Cada cliente recebe um código individual para entrar com privacidade e segurança."
  },
  {
    title: "Seleção, pagamento e download",
    description:
      "O cliente escolhe suas favoritas, finaliza a compra e baixa após a aprovação."
  }
];

const differentiators = [
  {
    title: "Galeria protegida por senha",
    description: "Acesso individual e controlado para cada evento.",
    icon: LockKeyhole
  },
  {
    title: "Painel administrativo",
    description: "Gestão central de galerias, acessos e pedidos.",
    icon: LayoutDashboard
  },
  {
    title: "Upload de fotos",
    description: "Envio organizado de imagens para cada galeria.",
    icon: Upload
  },
  {
    title: "Checkout seguro",
    description: "Fluxo de pagamento preparado para compras reais.",
    icon: CreditCard
  },
  {
    title: "Compra por foto",
    description: "O cliente paga somente pelas imagens escolhidas.",
    icon: ImagePlus
  },
  {
    title: "Experiência responsiva",
    description: "Navegação confortável em celular, tablet e desktop.",
    icon: Smartphone
  }
];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

export function PremiumHome({
  services,
  isAdmin,
  openGalleryAccess,
  openAuthModal,
  openServicePurchase,
  openAdminPage
}: PremiumHomeProps) {
  const reducedMotion = useReducedMotion();

  function scrollToSection(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="overflow-x-clip bg-[#030304] text-white">
      <section className="premium-grid relative isolate min-h-[calc(100vh-78px)] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute left-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-red-600/10 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-8rem] top-[-4rem] h-[34rem] w-[34rem] rounded-full bg-red-500/10 blur-[130px]"
        />

        <nav
          aria-label="Navegação da landing page"
          className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-left text-xs font-black uppercase tracking-[0.34em] text-white"
          >
            Fauzi Eventos
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={openGalleryAccess}
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Galeria
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("servicos")}
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Serviços
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Login
            </button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:gap-12">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-red-400 sm:text-xs">
                GALERIA PRIVADA PREMIUM
              </p>
              <h1 className="mt-5 text-[clamp(2.75rem,7vw,5.8rem)] font-black uppercase leading-[0.92] tracking-[-0.065em] text-white">
                Fotografia de eventos com compra segura
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8 lg:mx-0">
                Galerias privadas por senha, seleção de favoritas e download
                liberado após aprovação do pagamento.
              </p>

              <div className="hero-actions mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <button
                  type="button"
                  onClick={openGalleryAccess}
                  className="premium-action-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black"
                >
                  Acessar Galeria
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("experiencia")}
                  className="premium-action-secondary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold"
                >
                  Conhecer experiência
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-white/45 lg:justify-start">
                {[
                  "Galeria por senha",
                  "Checkout seguro",
                  "Download após pagamento"
                ].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-red-400" />
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="mx-auto w-full max-w-[680px]">
              <PremiumCamera />
            </div>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-3 lg:mt-8">
            {valueCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: reducedMotion ? 0 : 0.35 + index * 0.1
                  }}
                  whileHover={reducedMotion ? undefined : { y: -4 }}
                  className={`rounded-[1.4rem] border p-5 backdrop-blur-xl transition ${
                    index === 0
                      ? "border-red-500/25 bg-red-500/[0.07] shadow-[0_18px_50px_rgba(127,29,29,0.16)]"
                      : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <Icon className="h-5 w-5 text-red-400" />
                  <h2 className="mt-5 text-lg font-black tracking-[-0.025em]">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {card.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="experiencia"
        className="scroll-mt-28 border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-red-400">
              Como funciona
            </p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.96] tracking-[-0.055em] sm:text-6xl">
              Um fluxo simples do evento até a entrega.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
              Privacidade para o cliente, controle para o fotógrafo e uma
              experiência de compra objetiva em qualquer dispositivo.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {experienceSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.07}>
                <article className="group h-full rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/25 hover:bg-red-500/[0.045]">
                  <div className="text-sm font-black tracking-[0.22em] text-red-400">
                    0{index + 1}
                  </div>
                  <h3 className="mt-10 text-xl font-black tracking-[-0.03em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {step.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="servicos"
        className="scroll-mt-28 border-t border-white/[0.06] bg-white/[0.015] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-red-400">
                Serviços
              </p>
              <h2 className="mt-5 text-4xl font-black uppercase leading-[0.96] tracking-[-0.055em] sm:text-6xl">
                Cobertura profissional para momentos importantes.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/55 lg:text-right">
              Pacotes preparados para entregar qualidade visual, organização e
              acesso privado do início ao fim.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={(index % 2) * 0.07}>
                <article className="group relative min-h-[430px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <div className="mb-4 h-px w-12 bg-red-500 transition-all duration-300 group-hover:w-20" />
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/50">
                          A partir de {formatBRL(service.price)}
                        </p>
                        <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">
                          {service.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openServicePurchase(service)}
                        aria-label={`Comprar serviço ${service.title}`}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 bg-black/45 text-white transition hover:border-red-400 hover:bg-red-500"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">
                      {service.description || service.subtitle}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-red-400">
              Diferenciais
            </p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-[0.96] tracking-[-0.055em] sm:text-6xl">
              Tecnologia a serviço da fotografia.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={(index % 3) * 0.06}>
                  <article className="h-full bg-[#08080a] p-6 transition hover:bg-red-500/[0.045] sm:p-8">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-6 text-lg font-black tracking-[-0.025em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      {item.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-[radial-gradient(circle_at_75%_25%,rgba(239,68,68,0.22),transparent_30%),linear-gradient(135deg,#151010,#070708_55%)] px-6 py-16 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:px-10 lg:py-24">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]"
            />
            <div className="relative z-10 mx-auto max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-red-400">
                Sua galeria está pronta?
              </p>
              <h2 className="mt-5 text-4xl font-black uppercase leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Entre com sua senha e encontre seus melhores momentos.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/60">
                Acesse, escolha suas favoritas e finalize a compra com
                segurança.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openGalleryAccess}
                  className="premium-action-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black"
                >
                  Acessar Galeria
                  <ChevronRight className="h-4 w-4" />
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={openAdminPage}
                    className="premium-action-secondary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Painel admin
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default PremiumHome;
