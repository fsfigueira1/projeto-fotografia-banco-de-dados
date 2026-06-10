import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Eye,
  GalleryHorizontalEnd,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  PackageSearch,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SquarePen,
  Trash2,
  Upload
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { getApiUrl } from "@/lib/api";
import { ScrollTriggered, type PhotoStackItem } from "@/components/ui/stack-card";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

type Mode = "login" | "register";
type Page = "home" | "admin";
type PaymentMethod = "card" | "pix" | "boleto";
type PaymentProvider = "stripe" | "mercadopago";

type User = {
  _id: string;
  nome: string;
  email: string;
  role?: "client" | "admin";
  token?: string | null;
};

type Service = {
  id: "casamento" | "aniversario" | "formatura" | "corporativo";
  title: string;
  subtitle: string;
  price: number;
  image: string;
  description: string;
  delivery: string;
};

type Gallery = {
  _id: string;
  title: string;
  slug: string;
  eventType?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  eventDate?: string | null;
  coverPhotoId?: string;
  photoIds?: string[];
  status?: "draft" | "active" | "archived";
};

type AccessCode = {
  _id: string;
  galleryId: string;
  label?: string;
  active?: boolean;
  expiresAt?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  createdBy?: string;
  lastUsedAt?: string | null;
};

type Photo = {
  _id: string;
  url: string;
  sourceUrl?: string;
  galleryId?: string;
  userId?: string;
  preco?: number;
  evento?: string;
  cidade?: string;
  destaque?: boolean;
  requiresAccess?: boolean;
  downloadableAfterPayment?: boolean;
};

type Purchase = {
  _id: string;
  userId?: string;
  fotoId?: string;
  photoIds?: string[];
  serviceId?: string;
  galleryId?: string;
  accessCodeId?: string;
  type?: string;
  paymentMethod?: string;
  total?: number;
  pago?: boolean;
  status?: string;
  sessionId?: string;
};

type GallerySession = {
  token: string;
  gallery: Gallery;
  code?: AccessCode;
  photos: Photo[];
  purchases: Purchase[];
};

type AdminOverview = {
  galleries: Gallery[];
  accessCodes: AccessCode[];
  purchases: Purchase[];
};

const services: Service[] = [
  {
    id: "casamento",
    title: "Casamento",
    subtitle: "Cobertura completa, direção e galeria privada.",
    price: 1800,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    description: "Cobertura da cerimônia, recepção e entrega organizada para casal e convidados.",
    delivery: "Galeria privada liberada após pagamento"
  },
  {
    id: "aniversario",
    title: "Aniversário",
    subtitle: "Eventos de celebração com imagem elegante.",
    price: 1200,
    image: "https://images.unsplash.com/photo-1523438097201-512ae7d59c42?auto=format&fit=crop&w=1600&q=80",
    description: "Pacote para aniversários infantis, 15 anos e comemorações familiares.",
    delivery: "Senha compartilhável liberada após confirmação"
  },
  {
    id: "formatura",
    title: "Formatura",
    subtitle: "Colação, baile e fotos formais com acabamento premium.",
    price: 1500,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80",
    description: "Cobertura para turmas, famílias e registros institucionais.",
    delivery: "Galeria individual do evento"
  },
  {
    id: "corporativo",
    title: "Corporativo",
    subtitle: "Networking, marca e entrega visual para empresas.",
    price: 900,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    description: "Registro de palestras, lançamentos, recepções e eventos empresariais.",
    delivery: "Acesso administrativo ao evento"
  }
];

const STORE_USER_KEY = "ff:user";
const STORE_GALLERY_KEY = "ff:gallery-session";
function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORE_USER_KEY);
    return;
  }
  localStorage.setItem(STORE_USER_KEY, JSON.stringify(user));
}

function readStoredGallery(): GallerySession | null {
  try {
    const raw = sessionStorage.getItem(STORE_GALLERY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredGallery(gallery: GallerySession | null) {
  if (!gallery) {
    sessionStorage.removeItem(STORE_GALLERY_KEY);
    return;
  }
  sessionStorage.setItem(STORE_GALLERY_KEY, JSON.stringify(gallery));
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
}

function apiUrl(path: string) {
  return getApiUrl(path);
}

function authHeaders(user: User | null) {
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
}

function App() {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceTarget, setServiceTarget] = useState<Service | null>(null);

  const [galleryAccessOpen, setGalleryAccessOpen] = useState(false);
  const [galleryCode, setGalleryCode] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [gallerySession, setGallerySession] = useState<GallerySession | null>(() => readStoredGallery());
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("stripe");

  const [adminOverview, setAdminOverview] = useState<AdminOverview>({ galleries: [], accessCodes: [], purchases: [] });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    slug: "",
    eventType: "",
    description: "",
    customerName: "",
    customerEmail: "",
    eventDate: "",
    status: "draft" as Gallery["status"]
  });
  const [codeForm, setCodeForm] = useState({
    galleryId: "",
    label: "",
    code: "",
    expiresAt: "",
    customerName: "",
    customerEmail: "",
    active: false
  });
  const [uploadForm, setUploadForm] = useState({
    galleryId: "",
    evento: "",
    cidade: "",
    preco: 50,
    destaque: false,
    requiresAccess: true
  });

  useEffect(() => {
    if (!gallerySession?.token) return;
    writeStoredGallery(gallerySession);
  }, [gallerySession]);

  useEffect(() => {
    if (!user) return;
    writeStoredUser(user);
  }, [user]);

  useEffect(() => {
    if (gallerySession?.token) {
      void refreshGallerySession(gallerySession.token);
    }
  }, []);

  useEffect(() => {
    if (page === "admin" && user?.role === "admin") {
      void refreshAdminOverview();
    }
  }, [page, user?.role]);

  useEffect(() => {
    if (gallerySession) {
      setSelectedPhotoIds([]);
    }
  }, [gallerySession?.gallery?._id]);

  const isAdmin = user?.email === "123" && user?.role === "admin";
  const ownedPhotoIds = useMemo(() => {
    const owned = new Set<string>();
    for (const purchase of gallerySession?.purchases || []) {
      if (!purchase.pago && purchase.status !== "paid") continue;
      for (const id of purchase.photoIds || []) {
        owned.add(String(id));
      }
      if (purchase.fotoId) owned.add(String(purchase.fotoId));
    }
    return owned;
  }, [gallerySession?.purchases]);

  const selectedPhotos = useMemo(() => {
    if (!gallerySession) return [];
    return gallerySession.photos.filter((photo) => selectedPhotoIds.includes(String(photo._id)));
  }, [gallerySession, selectedPhotoIds]);

  const selectedTotal = useMemo(
    () => selectedPhotos.reduce((sum, photo) => sum + Number(photo.preco || 0), 0),
    [selectedPhotos]
  );

  async function refreshGallerySession(token: string) {
    setGalleryLoading(true);
    try {
      const response = await fetch(apiUrl("/galerias/me"), {
        headers: { "x-gallery-token": token }
      });
      if (!response.ok) {
        throw new Error("Sessão da galeria inválida.");
      }
      const data = await response.json();
      setGallerySession({
        token,
        gallery: data.gallery,
        code: data.code || (data.session?.accessCodeId ? { _id: String(data.session.accessCodeId), galleryId: String(data.session.galleryId || data.gallery?._id || "") } as AccessCode : undefined),
        photos: data.photos || [],
        purchases: data.purchases || []
      });
      setPage("home");
    } catch {
      setGallerySession(null);
      writeStoredGallery(null);
    } finally {
      setGalleryLoading(false);
    }
  }

  async function refreshAdminOverview() {
    if (!user?.token) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const response = await fetch(apiUrl("/galerias/admin/overview"), {
        headers: {
          ...authHeaders(user)
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível carregar o painel.");
      }
      setAdminOverview({
        galleries: data.galleries || [],
        accessCodes: data.accessCodes || [],
        purchases: data.purchases || []
      });
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível carregar o painel.");
    } finally {
      setAdminLoading(false);
    }
  }

  function openGalleryAccess() {
    setGalleryCode("");
    setGalleryError("");
    setGalleryAccessOpen(true);
    setMenuOpen(false);
  }

  function openAuthModal(mode: Mode) {
    setAuthMode(mode);
    setAuthOpen(true);
    setMenuOpen(false);
  }

  function openAdminPage() {
    setMenuOpen(false);
    if (!isAdmin) {
      openAuthModal("login");
      return;
    }
    setPage("admin");
  }

  async function submitGalleryAccess() {
    const code = galleryCode.trim();
    if (!code) {
      setGalleryError("Digite a senha ou código de acesso.");
      return;
    }

    setGalleryLoading(true);
    setGalleryError("");
    try {
      const response = await fetch(apiUrl("/galerias/acessar"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Senha inválida.");
      }

      const session: GallerySession = {
        token: data.token,
        gallery: data.gallery,
        code: data.code,
        photos: data.photos || [],
        purchases: data.purchases || []
      };

      setGallerySession(session);
      writeStoredGallery(session);
      setGalleryAccessOpen(false);
      setPage("home");
    } catch (error) {
      setGalleryError(error instanceof Error ? error.message : "Senha inválida.");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function loadGallerySession() {
    if (!gallerySession?.token) return;
    await refreshGallerySession(gallerySession.token);
  }

  function closeGallery() {
    setSelectedPhotoIds([]);
    setGallerySession(null);
    writeStoredGallery(null);
    setPage("home");
  }

  function togglePhoto(photoId: string) {
    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    );
  }

  async function createCheckout(payload: Record<string, unknown>) {
    if (!user?.token && !user?._id) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    const response = await fetch(apiUrl("/pagamento/criar-checkout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(user)
      },
      body: JSON.stringify({
        ...payload,
        userId: user?._id,
        paymentMethod,
        paymentProvider
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Não foi possível iniciar o checkout.");
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

  function openServicePurchase(service: Service) {
    setServiceTarget(service);
    setMenuOpen(false);
  }

  function closeServicePurchase() {
    setServiceTarget(null);
  }

  function openWhatsAppForService(service: Service) {
    const phone = "5511999999999";
    const message = encodeURIComponent(
      `Olá, quero contratar o serviço ${service.title} da Fauzi Eventos.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  function openWhatsAppForPhotos() {
    const phone = "5511999999999";
    const message = encodeURIComponent(
      `Olá, quero comprar as fotos selecionadas da galeria ${gallerySession?.gallery.title || ""}.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer");
  }

  async function saveGallery() {
    if (!user?.token || !isAdmin) return;
    const payload = {
      ...galleryForm,
      photoIds: editingGalleryId
        ? undefined
        : [],
      eventDate: galleryForm.eventDate || null
    };

    const url = editingGalleryId
      ? apiUrl(`/galerias/admin/galleries/${editingGalleryId}`)
      : apiUrl("/galerias/admin/galleries");

    const method = editingGalleryId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(user)
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Não foi possível salvar a galeria.");
    }

    await refreshAdminOverview();
    setEditingGalleryId(null);
    setGalleryForm({
      title: "",
      slug: "",
      eventType: "",
      description: "",
      customerName: "",
      customerEmail: "",
      eventDate: "",
      status: "draft"
    });
  }

  async function saveCode() {
    if (!user?.token || !isAdmin) return;
    const url = editingCodeId
      ? apiUrl(`/galerias/admin/codes/${editingCodeId}`)
      : apiUrl("/galerias/admin/codes");

    const method = editingCodeId ? "PATCH" : "POST";
    const payload = {
      ...codeForm,
      code: codeForm.code || undefined,
      expiresAt: codeForm.expiresAt || null
    };

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(user)
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Não foi possível salvar o código.");
    }

    await refreshAdminOverview();
    setEditingCodeId(null);
    setCodeForm({
      galleryId: "",
      label: "",
      code: "",
      expiresAt: "",
      customerName: "",
      customerEmail: "",
      active: false
    });
  }

  async function uploadPhoto(event: FormEvent) {
    event.preventDefault();
    if (!user?.token || !isAdmin) return;

    const input = (event.target as HTMLFormElement).elements.namedItem("foto") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("foto", file);
    formData.append("galleryId", uploadForm.galleryId);
    formData.append("evento", uploadForm.evento);
    formData.append("cidade", uploadForm.cidade);
    formData.append("preco", String(uploadForm.preco));
    formData.append("destaque", String(uploadForm.destaque));
    formData.append("requiresAccess", String(uploadForm.requiresAccess));

    const response = await fetch(apiUrl("/upload"), {
      method: "POST",
      headers: {
        ...authHeaders(user)
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Não foi possível enviar a foto.");
    }

    await refreshAdminOverview();
  }

  async function updateGalleryStatus(id: string, status: Gallery["status"]) {
    if (!user?.token || !isAdmin) return;
    await fetch(apiUrl(`/galerias/admin/galleries/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(user)
      },
      body: JSON.stringify({ status })
    });
    await refreshAdminOverview();
  }

  async function deleteGallery(id: string) {
    if (!user?.token || !isAdmin) return;
    await fetch(apiUrl(`/galerias/admin/galleries/${id}`), {
      method: "DELETE",
      headers: authHeaders(user)
    });
    await refreshAdminOverview();
  }

  async function deleteCode(id: string) {
    if (!user?.token || !isAdmin) return;
    await fetch(apiUrl(`/galerias/admin/codes/${id}`), {
      method: "DELETE",
      headers: authHeaders(user)
    });
    await refreshAdminOverview();
  }

  async function toggleCodeActive(code: AccessCode) {
    if (!user?.token || !isAdmin) return;
    await fetch(apiUrl(`/galerias/admin/codes/${code._id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(user)
      },
      body: JSON.stringify({ active: !code.active })
    });
    await refreshAdminOverview();
  }

  function startEditGallery(gallery: Gallery) {
    setEditingGalleryId(gallery._id);
    setGalleryForm({
      title: gallery.title || "",
      slug: gallery.slug || "",
      eventType: gallery.eventType || "",
      description: gallery.description || "",
      customerName: gallery.customerName || "",
      customerEmail: gallery.customerEmail || "",
      eventDate: gallery.eventDate ? String(gallery.eventDate).slice(0, 10) : "",
      status: gallery.status || "draft"
    });
  }

  function startEditCode(code: AccessCode) {
    setEditingCodeId(code._id);
    setCodeForm({
      galleryId: code.galleryId || "",
      label: code.label || "",
      code: "",
      expiresAt: code.expiresAt ? String(code.expiresAt).slice(0, 16) : "",
      customerName: code.customerName || "",
      customerEmail: code.customerEmail || "",
      active: Boolean(code.active)
    });
  }

  const galleryTitle = gallerySession?.gallery?.title || "Acessar minha galeria";
  const adminGalleryCards = useMemo<PhotoStackItem[]>(() => {
    return (adminOverview.galleries || []).slice(0, 5).map((gallery, index) => {
      const eventType = String(gallery.eventType || gallery.title || "").toLowerCase();
      const image =
        eventType.includes("casamento")
          ? services[0].image
          : eventType.includes("anivers")
            ? services[1].image
            : eventType.includes("formatura")
              ? services[2].image
              : services[3].image;

      return {
        id: gallery._id,
        image,
        title: gallery.title,
        subtitle: `${gallery.eventType || "Evento privado"} • ${gallery.slug}`,
        price: gallery.status === "active" ? "Ativa" : gallery.status === "archived" ? "Arquivada" : "Rascunho",
        featured: index === 0 || gallery.status === "active"
      };
    });
  }, [adminOverview.galleries]);

  const adminStats = useMemo(
    () => [
      { label: "Galerias", value: adminOverview.galleries.length },
      { label: "Ativas", value: adminOverview.galleries.filter((gallery) => gallery.status === "active").length },
      { label: "Códigos ativos", value: adminOverview.accessCodes.filter((code) => code.active).length },
      { label: "Pedidos pagos", value: adminOverview.purchases.filter((purchase) => purchase.pago || purchase.status === "paid").length }
    ],
    [adminOverview.accessCodes, adminOverview.galleries, adminOverview.purchases]
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <button
            type="button"
            onClick={() => {
              setPage("home");
              closeServicePurchase();
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 text-left"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-sm font-black text-red-100">
              F
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">Fauzi Eventos</div>
              <div className="text-sm font-semibold text-white/90">Casamentos, formaturas e aniversários</div>
            </div>
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={openGalleryAccess}
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-red-500/40 hover:bg-red-500/10"
            >
              Acessar galeria
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={openAdminPage}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-red-500/40 hover:bg-red-500/10"
              >
                Painel admin
              </button>
            ) : null}
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:scale-[1.01]"
              >
                Fazer login
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/80">
                <CircleUserRound className="h-4 w-4" />
                {user.nome}
              </div>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  writeStoredUser(null);
                  setUser(null);
                  setPage("home");
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-red-500/10 hover:text-red-100"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 lg:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="border-t border-white/10 px-4 pb-4 lg:hidden"
            >
              <div className="mx-auto mt-4 grid max-w-7xl gap-2">
                <button
                  type="button"
                  onClick={openGalleryAccess}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white/90"
                >
                  Acessar galeria
                </button>
                {!user ? (
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white/90"
                  >
                    Fazer login
                  </button>
                ) : null}
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={openAdminPage}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white/90"
                  >
                    Painel admin
                  </button>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main>
        {page === "home" ? (
          <div className="space-y-6">
            <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 lg:px-6 lg:pt-16">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-red-950/80 via-black to-black p-6 shadow-2xl shadow-black/30 lg:p-8"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-red-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Experiência imersiva
                  </div>
                  <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl">
                    Galeria privada com senha, carrinho e checkout.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                    O cliente compra o serviço, recebe ou digita o código de acesso, entra em uma galeria privada e compra as fotos que quiser com pagamento aprovado antes do download.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openGalleryAccess}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-[1.01]"
                    >
                      Acessar minha galeria
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal("login")}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-red-500/40 hover:bg-red-500/10"
                    >
                      Fazer login
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      "Senha por evento",
                      "Carrinho privado",
                      "Checkout com Stripe ou Mercado Pago"
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="grid gap-4">
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">Como funciona</div>
                    <div className="mt-5 space-y-4">
                      {[
                        "Cliente compra o serviço pelo site ou presencialmente.",
                        "Admin cria e ativa a senha/código da galeria.",
                        "Cliente acessa a galeria privada com o código.",
                        "Seleciona fotos, paga e só então baixa."
                      ].map((line, index) => (
                        <div key={line} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xs font-black text-red-100">
                            0{index + 1}
                          </div>
                          <p className="text-sm leading-6 text-white/72">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">Acesso rápido</div>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={openGalleryAccess}
                        className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-red-500/40 hover:bg-red-500/10"
                      >
                        <span className="flex items-center gap-2">
                          <LockKeyhole className="h-4 w-4" />
                          Acessar minha galeria
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={openAdminPage}
                          className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-red-500/40 hover:bg-red-500/10"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Painel admin
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
              <ScrollExpandMedia
                mediaType="image"
                mediaSrc="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80"
                bgImageSrc="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80"
                title="Galeria privada"
                date="Acesso por código"
                scrollToExpand="Experiência premium para eventos reais"
              >
                <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-white/10 bg-black/35 p-6 backdrop-blur-md">
                  <div className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">Fluxo preparado</div>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                    Cada evento recebe uma senha exclusiva. O cliente entra na galeria privada, seleciona as fotos, finaliza o pagamento e só então libera o download.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {[
                      "Senha por evento",
                      "Carrinho privado",
                      "Pagamento com Stripe ou Mercado Pago"
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-sm text-white/78">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollExpandMedia>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Serviços</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Comprar o serviço</h2>
                </div>
                <p className="hidden max-w-xl text-right text-sm leading-6 text-white/60 lg:block">
                  Cada serviço pode gerar um evento, uma galeria e um código compartilhável para o cliente e convidados.
                </p>
              </div>

              <div className="mt-2">
                <ScrollTriggered
                  items={services.map((service, index) => ({
                    id: service.id,
                    image: service.image,
                    title: service.title,
                    subtitle: service.subtitle,
                    price: formatBRL(service.price),
                    featured: index === 0
                  }))}
                  onAction={(id) => {
                    const service = services.find((item) => item.id === id);
                    if (service) openServicePurchase(service);
                  }}
                />
              </div>
            </section>
          </div>
        ) : null}

        {page === "admin" && isAdmin ? (
          <section className="relative mx-auto max-w-7xl space-y-6 px-4 py-10 lg:px-6">
            <div className="pointer-events-none absolute inset-x-4 top-6 -z-20 h-[520px] rounded-[2.25rem] bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-15 blur-[1px]" />
            <div className="pointer-events-none absolute inset-x-4 top-6 -z-10 h-[520px] rounded-[2.25rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_42%),linear-gradient(135deg,rgba(0,0,0,0.95),rgba(24,24,27,0.9))]" />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/75 shadow-2xl shadow-black/30 backdrop-blur-xl"
            >
              <div className="border-b border-white/10 px-6 py-6 md:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Admin</div>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Painel administrativo</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Fluxo do evento, uploads, códigos e pedidos em uma visão única para o dono do login 123.</p>
                  </div>
                  <button type="button" onClick={() => setPage("home")} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/[0.1]">Voltar</button>
                </div>
              </div>

              <div className="grid gap-3 border-b border-white/10 px-6 py-5 md:grid-cols-4 md:px-8">
                {adminStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{stat.label}</div>
                    <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-6 md:px-6 md:py-8">
                <ScrollTriggered
                  items={adminGalleryCards.length ? adminGalleryCards : services.map((service) => ({
                    id: service.id,
                    image: service.image,
                    title: service.title,
                    subtitle: service.subtitle,
                    price: formatBRL(service.price),
                    featured: true
                  }))}
                  onAction={(id) => {
                    const gallery = adminOverview.galleries.find((item) => item._id === id);
                    if (gallery) startEditGallery(gallery);
                  }}
                />
              </div>
            </motion.div>

            <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                  <PackageSearch className="h-4 w-4" />
                  Fluxo do evento
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    "1. Criar galeria",
                    "2. Gerar código",
                    "3. Subir fotos",
                    "4. Validar pagamento e liberar download"
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.04 }}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xs font-black text-white/90">0{index + 1}</div>
                      <div className="text-sm text-white/78">{item}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {adminOverview.galleries.slice(0, 4).map((gallery) => (
                    <div key={gallery._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="text-sm font-semibold text-white">{gallery.title}</div>
                      <div className="mt-1 text-xs text-white/55">{gallery.status || "draft"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                    <ReceiptText className="h-4 w-4" />
                    Resumo operacional
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Galerias", value: adminOverview.galleries.length },
                      { label: "Códigos", value: adminOverview.accessCodes.length },
                      { label: "Pedidos", value: adminOverview.purchases.length },
                      { label: "Pagos", value: adminOverview.purchases.filter((purchase) => purchase.pago || purchase.status === "paid").length }
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{item.label}</div>
                        <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                    <LockKeyhole className="h-4 w-4" />
                    Gerar acesso
                  </div>
                  <div className="mt-5 grid gap-3">
                    <select value={codeForm.galleryId} onChange={(event) => setCodeForm((current) => ({ ...current, galleryId: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none">
                      <option value="">Selecionar galeria</option>
                      {adminOverview.galleries.map((gallery) => (<option key={gallery._id} value={gallery._id}>{gallery.title}</option>))}
                    </select>
                    <input value={codeForm.code} onChange={(event) => setCodeForm((current) => ({ ...current, code: event.target.value }))} placeholder="Senha/código" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="datetime-local" value={codeForm.expiresAt} onChange={(event) => setCodeForm((current) => ({ ...current, expiresAt: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
                      <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"><span>Ativo</span><input type="checkbox" checked={codeForm.active} onChange={(event) => setCodeForm((current) => ({ ...current, active: event.target.checked }))} /></label>
                    </div>
                    <button type="button" onClick={() => void saveCode()} className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black">{editingCodeId ? "Salvar código" : "Criar código"}<ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45"><Upload className="h-4 w-4" />Upload de fotos</div>
                <form className="mt-5 grid gap-3" onSubmit={(event) => void uploadPhoto(event)}>
                  <select value={uploadForm.galleryId} onChange={(event) => setUploadForm((current) => ({ ...current, galleryId: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none">
                    <option value="">Selecionar galeria</option>
                    {adminOverview.galleries.map((gallery) => (<option key={gallery._id} value={gallery._id}>{gallery.title}</option>))}
                  </select>
                  <input name="foto" type="file" accept="image/*" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={uploadForm.evento} onChange={(event) => setUploadForm((current) => ({ ...current, evento: event.target.value }))} placeholder="Evento" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30" />
                    <input value={uploadForm.cidade} onChange={(event) => setUploadForm((current) => ({ ...current, cidade: event.target.value }))} placeholder="Cidade" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/30" />
                  </div>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black">Enviar foto<ChevronRight className="h-4 w-4" /></button>
                </form>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45"><SquarePen className="h-4 w-4" />Galerias e códigos</div>
                <div className="mt-5 space-y-3">
                  {adminOverview.galleries.map((gallery) => (<div key={gallery._id} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="font-semibold text-white">{gallery.title}</div><div className="text-sm text-white/60">{gallery.slug}</div></div>))}
                  {adminOverview.accessCodes.map((code) => (<div key={code._id} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="font-semibold text-white">{code.label || "Código sem rótulo"}</div><div className="text-xs text-white/45">{code.active ? "Ativo" : "Inativo"}</div></div>))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <AnimatePresence>
        {serviceTarget ? (
          <motion.div
            key="service-purchase"
            className="fixed inset-0 z-[70] overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Compra do serviço</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">{serviceTarget.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeServicePurchase}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85"
                >
                  Voltar
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.05]">
                  <div className="relative min-h-[420px]">
                    <img src={serviceTarget.image} alt={serviceTarget.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute left-5 top-5 inline-flex rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
                      Serviço
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Resumo</div>
                  <p className="mt-3 text-sm leading-6 text-white/65">{serviceTarget.description}</p>
                  <div className="mt-6 grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span className="text-sm text-white/65">Valor</span>
                      <span className="text-sm font-bold text-white">{formatBRL(serviceTarget.price)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <span className="text-sm text-white/65">Entrega</span>
                      <span className="text-sm font-bold text-white">{serviceTarget.delivery}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(["card", "pix", "boleto"] as PaymentMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                            paymentMethod === method
                              ? "border-white bg-white text-black"
                              : "border-white/10 bg-black/30 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(["stripe", "mercadopago"] as PaymentProvider[]).map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setPaymentProvider(provider)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                            paymentProvider === provider
                              ? "border-red-400 bg-red-500/15 text-red-50"
                              : "border-white/10 bg-black/30 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => void createCheckout({ serviceId: serviceTarget.id })}
                      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.01]"
                    >
                      Comprar serviço
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openWhatsAppForService(serviceTarget)}
                      className="inline-flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                    >
                      Comprar por WhatsApp
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {galleryAccessOpen ? (
          <motion.div
            key="gallery-access"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 px-4 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/50"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Acessar minha galeria</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Digite a senha do evento</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Apenas quem possui a senha consegue abrir a galeria privada daquele evento.
              </p>
              <label className="mt-5 block text-sm font-semibold text-white/80" htmlFor="gallery-code">
                Código de acesso
              </label>
              <input
                id="gallery-code"
                type="text"
                value={galleryCode}
                onChange={(event) => {
                  setGalleryCode(event.target.value);
                  if (galleryError) setGalleryError("");
                }}
                placeholder="Ex.: TESTE1"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-red-400/50"
              />
              {galleryError ? (
                <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
                  {galleryError}
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setGalleryAccessOpen(false)}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/80"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void submitGalleryAccess()}
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
                >
                  Abrir galeria
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {gallerySession ? (
          <motion.div
            key="gallery-private"
            className="fixed inset-0 z-[60] overflow-y-auto bg-black/96 px-4 py-6 backdrop-blur-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Galeria privada</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">{galleryTitle}</h2>
                  <p className="mt-2 text-sm text-white/60">
                    Apenas quem possui a senha abre esta galeria. Fotos só são baixadas após o pagamento aprovado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeGallery}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85"
                >
                  Sair da galeria
                </button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {gallerySession.photos.map((photo) => {
                    const selected = selectedPhotoIds.includes(String(photo._id));
                    const owned = ownedPhotoIds.has(String(photo._id));
                    return (
                      <motion.article
                        key={photo._id}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.14 }}
                        className={`overflow-hidden rounded-[1.5rem] border bg-white/[0.05] ${selected ? "border-red-400/50" : "border-white/10"}`}
                      >
                        <div className="relative h-72">
                          <img src={photo.url} alt={photo.evento || "Foto"} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                          <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
                            {owned ? "Pago" : selected ? "Selecionada" : "Disponível"}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-black tracking-[-0.03em]">{photo.evento}</h3>
                          <p className="mt-1 text-sm text-white/60">{photo.cidade}</p>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white/70">{formatBRL(photo.preco || 0)}</span>
                            <button
                              type="button"
                              onClick={() => togglePhoto(String(photo._id))}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                selected ? "bg-white text-black" : "border border-white/10 bg-white/[0.06] text-white/85"
                              }`}
                            >
                              {selected ? "Remover" : "Selecionar"}
                            </button>
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={!owned}
                              onClick={() => window.open(photo.url, "_blank", "noopener,noreferrer")}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Baixar
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

                <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                    <ShoppingBag className="h-4 w-4" />
                    Carrinho
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedPhotos.length ? (
                      selectedPhotos.map((photo) => (
                        <div key={photo._id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="text-sm font-semibold text-white">{photo.evento}</div>
                          <div className="mt-1 text-xs text-white/60">{photo.cidade}</div>
                          <div className="mt-2 text-sm font-bold text-white">{formatBRL(photo.preco || 0)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                        Nenhuma foto selecionada ainda.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <span className="text-sm text-white/65">Total</span>
                    <span className="text-sm font-bold text-white">{formatBRL(selectedTotal)}</span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(["card", "pix", "boleto"] as PaymentMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                            paymentMethod === method
                              ? "border-white bg-white text-black"
                              : "border-white/10 bg-black/30 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(["stripe", "mercadopago"] as PaymentProvider[]).map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setPaymentProvider(provider)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                            paymentProvider === provider
                              ? "border-red-400 bg-red-500/15 text-red-50"
                              : "border-white/10 bg-black/30 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedPhotoIds.length}
                      onClick={() =>
                        void createCheckout({
                          photoIds: selectedPhotoIds,
                          galleryId: gallerySession.gallery._id,
                          accessCodeId: gallerySession.code?._id
                        })
                      }
                      className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Comprar selecionadas
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={openWhatsAppForPhotos}
                      className="inline-flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
                    >
                      Comprar por WhatsApp
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={loadGallerySession}
                      className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/80"
                    >
                      Atualizar galeria
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {authOpen ? (
          <AuthModal
            open={authOpen}
            mode={authMode}
            onModeChange={setAuthMode}
            onClose={() => setAuthOpen(false)}
            onSuccess={(nextUser) => {
              const normalized: User = {
                _id: nextUser._id,
                nome: nextUser.nome,
                email: nextUser.email,
                role: (nextUser as User).role || "client",
                token: nextUser.token || null
              };
              setUser(normalized);
              writeStoredUser(normalized);
              if (normalized.email === "123" && normalized.role === "admin") {
                setPage("admin");
              }
              setAuthOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
