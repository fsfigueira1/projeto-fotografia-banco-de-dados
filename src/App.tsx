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
  Copy,
  Eye,
  GalleryHorizontalEnd,
  ImagePlus,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { GalleryPhoto } from "@/components/GalleryPhoto";
import { PremiumHome } from "@/components/PremiumHome";
import { getApiUrl } from "@/lib/api";
import {
  calculateSelectedTotal,
  collectOwnedPhotoIds,
  selectAvailablePhotos
} from "@/lib/gallery";
import { ScrollTriggered } from "@/components/ui/stack-card";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

type Mode = "login" | "register";
type Page = "home" | "admin";
type PaymentMethod = "card" | "pix" | "boleto";

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
  createdAt?: string;
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
  storageProvider?: "local" | "cloudinary";
  createdAt?: string;
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
  createdAt?: string;
  paidAt?: string | null;
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
  photos: Photo[];
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

const heroSignals = [
  "Galerias privadas por evento",
  "Senha e checkout seguros",
  "Download liberado após pagamento"
];

const experienceSteps = [
  {
    title: "Escolha o serviço",
    description: "Casamento, aniversário, formatura ou corporativo com proposta visual premium."
  },
  {
    title: "Admin gera a senha",
    description: "Cada evento recebe um código exclusivo, ativado após confirmação."
  },
  {
    title: "Cliente entra na galeria",
    description: "Acesso privado por senha para selecionar, comprar e baixar depois do pagamento."
  }
];

const STORE_USER_KEY = "ff:user";
const STORE_GALLERY_KEY = "ff:gallery-session";
const WHATSAPP_PHONE = String(
  import.meta.env.VITE_WHATSAPP_PHONE || ""
).replace(/\D/g, "");
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

function authHeaders(user: User | null): Record<string, string> {
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
}

function App() {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceTarget, setServiceTarget] = useState<Service | null>(null);
  const [booted, setBooted] = useState(false);

  const [galleryAccessOpen, setGalleryAccessOpen] = useState(false);
  const [galleryCode, setGalleryCode] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [gallerySession, setGallerySession] = useState<GallerySession | null>(() => readStoredGallery());
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [galleryActionError, setGalleryActionError] = useState("");
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);

  const [adminOverview, setAdminOverview] = useState<AdminOverview>({
    galleries: [],
    accessCodes: [],
    purchases: [],
    photos: []
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminActionLoading, setAdminActionLoading] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [lastCreatedCode, setLastCreatedCode] = useState("");
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
      setCheckoutError("");
      setGalleryActionError("");
    }
  }, [gallerySession?.gallery?._id]);

  useEffect(() => {
    setCheckoutError("");
  }, [paymentMethod, selectedPhotoIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooted(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateCursor = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        root.style.setProperty("--cursor-opacity", "0");
        return;
      }

      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
      root.style.setProperty("--cursor-opacity", "1");
    };

    const hideCursor = () => {
      root.style.setProperty("--cursor-opacity", "0");
    };

    window.addEventListener("pointermove", updateCursor);
    window.addEventListener("pointerdown", updateCursor);
    window.addEventListener("pointerleave", hideCursor);

    return () => {
      window.removeEventListener("pointermove", updateCursor);
      window.removeEventListener("pointerdown", updateCursor);
      window.removeEventListener("pointerleave", hideCursor);
    };
  }, []);

  const isAdmin = user?.role === "admin";
  const ownedPhotoIds = useMemo(
    () => collectOwnedPhotoIds(gallerySession?.purchases || []),
    [gallerySession?.purchases]
  );

  const selectedPhotos = useMemo(() => {
    if (!gallerySession) return [];
    return selectAvailablePhotos(
      gallerySession.photos,
      selectedPhotoIds,
      ownedPhotoIds
    );
  }, [gallerySession, ownedPhotoIds, selectedPhotoIds]);

  const selectedTotal = useMemo(
    () => calculateSelectedTotal(selectedPhotos),
    [selectedPhotos]
  );

  const ambientParticles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => {
        const left = (index * 13 + 9) % 100;
        const top = (index * 17 + 7) % 100;
        const size = 2 + (index % 4);
        const delay = (index % 8) * 0.6;
        const duration = 18 + (index % 6) * 5;

        return { left, top, size, delay, duration };
      }),
    []
  );

  async function refreshGallerySession(token: string) {
    setGalleryLoading(true);
    setGalleryActionError("");
    try {
      const response = await fetch(apiUrl("/galerias/me"), {
        credentials: "include",
        headers: { "x-gallery-token": token }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message ||
            data?.error ||
            "Sessão da galeria inválida ou expirada."
        );
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
    } catch (error) {
      setGallerySession(null);
      writeStoredGallery(null);
      setGalleryError(
        error instanceof Error
          ? error.message
          : "Sessão da galeria inválida ou expirada."
      );
      setGalleryAccessOpen(true);
    } finally {
      setGalleryLoading(false);
    }
  }

  async function refreshAdminOverview() {
    if (!user || !isAdmin) return;
    setAdminLoading(true);
    setAdminError("");
    try {
      const response = await fetch(apiUrl("/galerias/admin/overview"), {
        credentials: "include",
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
        purchases: data.purchases || [],
        photos: data.photos || []
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
        credentials: "include",
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
    setCheckoutError("");
    setGalleryActionError("");
    setGallerySession(null);
    writeStoredGallery(null);
    setPage("home");
  }

  function togglePhoto(photoId: string) {
    if (ownedPhotoIds.has(photoId)) return;

    setSelectedPhotoIds((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    );
  }

  async function createCheckout(payload: Record<string, unknown>) {
    const photoIds = Array.isArray(payload.photoIds)
      ? payload.photoIds.map(String)
      : [];
    if (!payload.serviceId && !photoIds.length) {
      setCheckoutError("Selecione pelo menos uma foto para continuar.");
      return;
    }

    if (!user?.token && !user?._id) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const checkoutHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...authHeaders(user)
      };
      if (gallerySession?.token) {
        checkoutHeaders["x-gallery-token"] = gallerySession.token;
      }

      const response = await fetch(apiUrl("/pagamento/criar-checkout"), {
        method: "POST",
        credentials: "include",
        headers: checkoutHeaders,
        body: JSON.stringify({
          ...payload,
          paymentMethod
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Não foi possível iniciar o checkout.";
        setCheckoutError(message);
        return;
      }

      if (typeof data?.url !== "string" || !data.url.trim()) {
        setCheckoutError("O checkout não retornou uma URL válida.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setCheckoutError(
        "Não foi possível conectar ao checkout. Tente novamente."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function downloadPurchasedPhoto(photoId: string) {
    if (!ownedPhotoIds.has(photoId) || downloadingPhotoId) return;

    setDownloadingPhotoId(photoId);
    setGalleryActionError("");
    try {
      const response = await fetch(
        apiUrl(`/media/photos/${photoId}/download`),
        {
          credentials: "include",
          headers: {
            ...authHeaders(user)
          }
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível baixar esta foto."
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `fauzi-eventos-${photoId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setGalleryActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível baixar esta foto."
      );
    } finally {
      setDownloadingPhotoId(null);
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
    if (!WHATSAPP_PHONE) return;
    const message = encodeURIComponent(
      `Olá, quero contratar o serviço ${service.title} da Fauzi Eventos.`
    );
    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function openWhatsAppForPhotos() {
    if (!WHATSAPP_PHONE) return;
    const message = encodeURIComponent(
      `Olá, quero comprar as fotos selecionadas da galeria ${gallerySession?.gallery.title || ""}.`
    );
    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function saveGallery() {
    if (!user || !isAdmin) return;
    if (!galleryForm.title.trim() || !galleryForm.slug.trim()) {
      setAdminError("Informe o título e o slug da galeria.");
      return;
    }

    setAdminActionLoading("gallery");
    setAdminError("");
    setAdminSuccess("");
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

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user)
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível salvar a galeria."
        );
      }

      await refreshAdminOverview();
      setAdminSuccess(
        editingGalleryId
          ? "Galeria atualizada com sucesso."
          : "Galeria criada com sucesso."
      );
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
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a galeria."
      );
    } finally {
      setAdminActionLoading("");
    }
  }

  async function saveCode() {
    if (!user || !isAdmin) return;
    if (!codeForm.galleryId) {
      setAdminError("Selecione uma galeria para o código.");
      return;
    }
    if (!editingCodeId && !codeForm.code.trim()) {
      setAdminError("Informe o código de acesso.");
      return;
    }

    setAdminActionLoading("code");
    setAdminError("");
    setAdminSuccess("");
    const url = editingCodeId
      ? apiUrl(`/galerias/admin/codes/${editingCodeId}`)
      : apiUrl("/galerias/admin/codes");

    const method = editingCodeId ? "PATCH" : "POST";
    const payload = {
      ...codeForm,
      code: codeForm.code || undefined,
      expiresAt: codeForm.expiresAt || null
    };

    try {
      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user)
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível salvar o código."
        );
      }

      const createdCode = editingCodeId ? "" : codeForm.code.trim();
      await refreshAdminOverview();
      setLastCreatedCode(createdCode);
      setAdminSuccess(
        editingCodeId
          ? "Código atualizado com sucesso."
          : "Código criado. Copie e envie ao cliente."
      );
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
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o código."
      );
    } finally {
      setAdminActionLoading("");
    }
  }

  async function uploadPhoto(event: FormEvent) {
    event.preventDefault();
    if (!user || !isAdmin) return;
    if (!uploadForm.galleryId) {
      setAdminError("Selecione uma galeria antes de enviar a foto.");
      return;
    }

    const input = (event.target as HTMLFormElement).elements.namedItem("foto") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setAdminError("Selecione uma imagem para enviar.");
      return;
    }

    setUploadLoading(true);
    setAdminError("");
    setAdminSuccess("");
    const formData = new FormData();
    formData.append("foto", file);
    formData.append("galleryId", uploadForm.galleryId);
    formData.append("evento", uploadForm.evento);
    formData.append("cidade", uploadForm.cidade);
    formData.append("preco", String(uploadForm.preco));
    formData.append("destaque", String(uploadForm.destaque));
    formData.append("requiresAccess", String(uploadForm.requiresAccess));

    try {
      const response = await fetch(apiUrl("/upload"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...authHeaders(user)
        },
        body: formData
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Não foi possível enviar a foto."
        );
      }

      await refreshAdminOverview();
      setAdminSuccess("Foto enviada com sucesso.");
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto."
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function updateGalleryStatus(id: string, status: Gallery["status"]) {
    if (!user || !isAdmin) return;
    setAdminActionLoading(`gallery-status-${id}`);
    setAdminError("");
    setAdminSuccess("");
    try {
      const response = await fetch(apiUrl(`/galerias/admin/galleries/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user)
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível alterar o status.");
      }
      await refreshAdminOverview();
      setAdminSuccess(status === "active" ? "Galeria ativada." : "Galeria inativada.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível alterar o status.");
    } finally {
      setAdminActionLoading("");
    }
  }

  async function deleteGallery(id: string) {
    if (!user || !isAdmin) return;
    if (!window.confirm("Excluir esta galeria e seus códigos de acesso?")) return;
    setAdminActionLoading(`gallery-delete-${id}`);
    setAdminError("");
    setAdminSuccess("");
    try {
      const response = await fetch(apiUrl(`/galerias/admin/galleries/${id}`), {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(user)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível excluir a galeria.");
      }
      await refreshAdminOverview();
      setAdminSuccess("Galeria excluída.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível excluir a galeria.");
    } finally {
      setAdminActionLoading("");
    }
  }

  async function deleteCode(id: string) {
    if (!user || !isAdmin) return;
    if (!window.confirm("Excluir este código de acesso?")) return;
    setAdminActionLoading(`code-delete-${id}`);
    setAdminError("");
    setAdminSuccess("");
    try {
      const response = await fetch(apiUrl(`/galerias/admin/codes/${id}`), {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(user)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível excluir o código.");
      }
      await refreshAdminOverview();
      setAdminSuccess("Código excluído.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível excluir o código.");
    } finally {
      setAdminActionLoading("");
    }
  }

  async function toggleCodeActive(code: AccessCode) {
    if (!user || !isAdmin) return;
    setAdminActionLoading(`code-status-${code._id}`);
    setAdminError("");
    setAdminSuccess("");
    try {
      const response = await fetch(apiUrl(`/galerias/admin/codes/${code._id}`), {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user)
        },
        body: JSON.stringify({ active: !code.active })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Não foi possível alterar o código.");
      }
      await refreshAdminOverview();
      setAdminSuccess(code.active ? "Código inativado." : "Código ativado.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Não foi possível alterar o código.");
    } finally {
      setAdminActionLoading("");
    }
  }

  async function copyAccessCode(value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setAdminSuccess("Código copiado.");
      setAdminError("");
    } catch {
      setAdminError("Não foi possível copiar o código automaticamente.");
    }
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
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div aria-hidden="true" className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(255,26,26,0.14),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(180deg,#050505_0%,#070707_42%,#0b0b0d_100%)]" />
      <div aria-hidden="true" className="fixed inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:84px_84px] [mask-image:radial-gradient(circle_at_center,black_42%,transparent_100%)]" />
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,26,26,0.22),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_80%_70%,rgba(255,26,26,0.1),transparent_26%)] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="fixed inset-0 -z-10 opacity-40 mix-blend-screen">
        {ambientParticles.map((particle) => (
          <span
            key={`${particle.left}-${particle.top}-${particle.delay}`}
            className="absolute rounded-full bg-white/80 shadow-[0_0_22px_rgba(255,26,26,0.55)] motion-safe:animate-[float-slow_14s_ease-in-out_infinite]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[var(--cursor-x)] top-[var(--cursor-y)] z-[100] hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/5 shadow-[0_0_40px_rgba(255,26,26,0.22)] transition-[opacity,transform] duration-200 md:block"
        style={{ opacity: "var(--cursor-opacity, 0)" }}
      />

      <AnimatePresence>
        {!booted ? (
          <motion.div
            key="boot"
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050505]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="relative flex flex-col items-center gap-6 px-6 text-center">
              <div className="relative grid h-24 w-24 place-items-center rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_0_80px_rgba(255,26,26,0.18)]">
                <div className="absolute inset-2 rounded-[1.5rem] border border-white/10" />
                <div className="text-3xl font-black tracking-[-0.08em] text-white">F</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.42em] text-white/45">Fauzi Eventos</div>
                <div className="mt-3 text-2xl font-black tracking-[-0.05em] sm:text-4xl">Experiência premium carregando</div>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/55">Galeria privada, checkout e painel administrativo em uma interface futurista e fluida.</p>
              </div>
              <div className="h-1.5 w-52 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-white via-[#ff1a1a] to-white"
                  animate={{ x: ["-35%", "135%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={`relative z-10 transition-opacity duration-500 ${booted ? "opacity-100" : "opacity-0"}`}>
      <header
        className={`sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl ${
          page === "home" ? "hidden" : ""
        }`}
      >
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
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-white">
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
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
            >
              Acessar galeria
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={openAdminPage}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 hover:text-white"
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
          <PremiumHome
            services={services}
            isAdmin={isAdmin}
            openGalleryAccess={openGalleryAccess}
            openAuthModal={openAuthModal}
            openServicePurchase={openServicePurchase}
            openAdminPage={openAdminPage}
          />
        ) : null}

        {false ? (
          <div className="hidden space-y-6">
            <section className="mx-auto max-w-7xl px-4 pb-20 pt-10 lg:px-6 lg:pt-16">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-6 shadow-2xl shadow-black/30 lg:p-8"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
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
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/10"
                    >
                      Fazer login
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      "Senha por evento",
                      "Carrinho privado",
                      "Checkout seguro com Stripe"
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
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xs font-black text-white/90">
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
                        className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/10"
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
                          className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/10"
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
                      "Pagamento seguro com Stripe"
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
          <section className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-6 lg:py-12">
            <motion.header
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.18),transparent_34%),linear-gradient(135deg,rgba(8,8,10,0.98),rgba(18,18,22,0.94))] p-6 shadow-2xl shadow-black/30 md:p-8"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300/80">Operação Fauzi Eventos</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Painel administrativo</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                    Gerencie galerias, acessos, fotos e pedidos sem sair do fluxo operacional.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={adminLoading}
                    onClick={() => void refreshAdminOverview()}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/85 disabled:opacity-50"
                  >
                    {adminLoading ? "Atualizando..." : "Atualizar dados"}
                  </button>
                  <button type="button" onClick={() => setPage("home")} className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400">
                    Voltar para o site
                  </button>
                </div>
              </div>
            </motion.header>

            <AdminFeedback
              error={adminError}
              success={adminSuccess}
              onDismiss={() => {
                setAdminError("");
                setAdminSuccess("");
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <AdminStatCard label="Galerias" value={adminOverview.galleries.length} tone="accent" />
              <AdminStatCard label="Fotos" value={adminOverview.photos.length} />
              <AdminStatCard label="Pedidos" value={adminOverview.purchases.length} />
              <AdminStatCard
                label="Pagos"
                value={adminOverview.purchases.filter((purchase) => purchase.pago || purchase.status === "paid").length}
                tone="success"
              />
              <AdminStatCard
                label="Receita aprovada"
                value={formatBRL(
                  adminOverview.purchases
                    .filter((purchase) => purchase.pago || purchase.status === "paid")
                    .reduce((total, purchase) => total + Number(purchase.total || 0), 0)
                )}
                tone="success"
              />
            </div>

            {adminLoading && !adminOverview.galleries.length ? (
              <div className="grid min-h-48 place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] text-sm text-white/55">
                Carregando painel administrativo...
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Galerias</div>
                    <h3 className="mt-2 text-2xl font-black">{editingGalleryId ? "Editar galeria" : "Criar galeria"}</h3>
                  </div>
                  {editingGalleryId ? (
                    <button type="button" onClick={() => setEditingGalleryId(null)} className="text-sm font-semibold text-white/55 hover:text-white">
                      Cancelar edição
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2" htmlFor="admin-gallery-title">
                    <span className="text-sm font-semibold text-white/70">Título *</span>
                    <input id="admin-gallery-title" value={galleryForm.title} onChange={(event) => setGalleryForm((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Slug *</span>
                      <input value={galleryForm.slug} onChange={(event) => setGalleryForm((current) => ({ ...current, slug: event.target.value }))} placeholder="casamento-ana-e-joao" className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Tipo de evento</span>
                      <input value={galleryForm.eventType} onChange={(event) => setGalleryForm((current) => ({ ...current, eventType: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-white/70">Descrição</span>
                    <textarea value={galleryForm.description} onChange={(event) => setGalleryForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Cliente</span>
                      <input value={galleryForm.customerName} onChange={(event) => setGalleryForm((current) => ({ ...current, customerName: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Email do cliente</span>
                      <input type="email" value={galleryForm.customerEmail} onChange={(event) => setGalleryForm((current) => ({ ...current, customerEmail: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Data do evento</span>
                      <input type="date" value={galleryForm.eventDate} onChange={(event) => setGalleryForm((current) => ({ ...current, eventDate: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Status</span>
                      <select value={galleryForm.status} onChange={(event) => setGalleryForm((current) => ({ ...current, status: event.target.value as Gallery["status"] }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40">
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativa</option>
                        <option value="archived">Arquivada</option>
                      </select>
                    </label>
                  </div>
                  <button type="button" disabled={adminActionLoading === "gallery"} onClick={() => void saveGallery()} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50">
                    {adminActionLoading === "gallery" ? "Salvando..." : editingGalleryId ? "Salvar alterações" : "Criar galeria"}
                  </button>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">Acesso privado</div>
                    <h3 className="mt-2 text-2xl font-black">{editingCodeId ? "Editar código" : "Gerar código"}</h3>
                  </div>
                  {editingCodeId ? (
                    <button type="button" onClick={() => setEditingCodeId(null)} className="text-sm font-semibold text-white/55 hover:text-white">
                      Cancelar edição
                    </button>
                  ) : null}
                </div>

                {lastCreatedCode ? (
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">Código recém-criado</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="min-w-0 truncate text-lg font-black text-emerald-100">{lastCreatedCode}</code>
                      <button type="button" onClick={() => void copyAccessCode(lastCreatedCode)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-400 px-3 py-2 text-xs font-bold text-emerald-950">
                        <Copy className="h-4 w-4" /> Copiar código
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-emerald-100/60">Por segurança, o código não pode ser recuperado depois desta sessão.</p>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2" htmlFor="admin-code-gallery">
                    <span className="text-sm font-semibold text-white/70">Galeria *</span>
                    <select id="admin-code-gallery" value={codeForm.galleryId} onChange={(event) => setCodeForm((current) => ({ ...current, galleryId: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40">
                      <option value="">Selecionar galeria</option>
                      {adminOverview.galleries.map((gallery) => <option key={gallery._id} value={gallery._id}>{gallery.title}</option>)}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Identificação</span>
                      <input value={codeForm.label} onChange={(event) => setCodeForm((current) => ({ ...current, label: event.target.value }))} placeholder="Família da noiva" className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">{editingCodeId ? "Nova senha opcional" : "Senha/código *"}</span>
                      <input value={codeForm.code} onChange={(event) => setCodeForm((current) => ({ ...current, code: event.target.value }))} placeholder="EVENTO2026" className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Expira em</span>
                      <input type="datetime-local" value={codeForm.expiresAt} onChange={(event) => setCodeForm((current) => ({ ...current, expiresAt: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none focus:border-red-400/40" />
                    </label>
                    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm">
                      <span className="font-semibold text-white/70">Código ativo</span>
                      <input type="checkbox" checked={codeForm.active} onChange={(event) => setCodeForm((current) => ({ ...current, active: event.target.checked }))} />
                    </label>
                  </div>
                  <button type="button" disabled={adminActionLoading === "code"} onClick={() => void saveCode()} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50">
                    {adminActionLoading === "code" ? "Salvando..." : editingCodeId ? "Salvar código" : "Criar código"}
                  </button>
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <h3 className="text-xl font-black">Galerias cadastradas</h3>
                <div className="mt-5 space-y-3">
                  {adminOverview.galleries.length ? adminOverview.galleries.map((gallery) => (
                    <article key={gallery._id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-white">{gallery.title}</h4>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${gallery.status === "active" ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/55"}`}>
                              {gallery.status === "active" ? "Ativa" : gallery.status === "archived" ? "Arquivada" : "Rascunho"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-white/50">{gallery.slug}</p>
                          <p className="mt-2 text-xs text-white/40">{adminOverview.photos.filter((photo) => String(photo.galleryId) === String(gallery._id)).length} fotos</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEditGallery(gallery)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75">Editar</button>
                          <button type="button" disabled={adminActionLoading === `gallery-status-${gallery._id}`} onClick={() => void updateGalleryStatus(gallery._id, gallery.status === "active" ? "archived" : "active")} className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-50">
                            {gallery.status === "active" ? "Inativar" : "Ativar"}
                          </button>
                          <button type="button" disabled={adminActionLoading === `gallery-delete-${gallery._id}`} onClick={() => void deleteGallery(gallery._id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 hover:border-red-400/30 hover:text-red-100">Excluir</button>
                        </div>
                      </div>
                    </article>
                  )) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Nenhuma galeria criada.</div>}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <h3 className="text-xl font-black">Códigos de acesso</h3>
                <div className="mt-5 space-y-3">
                  {adminOverview.accessCodes.length ? adminOverview.accessCodes.map((code) => {
                    const gallery = adminOverview.galleries.find((item) => String(item._id) === String(code.galleryId));
                    return (
                      <article key={code._id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold">{code.label || "Acesso sem identificação"}</h4>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${code.active ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>{code.active ? "Ativo" : "Inativo"}</span>
                            </div>
                            <p className="mt-1 text-sm text-white/50">{gallery?.title || "Galeria não encontrada"}</p>
                            <p className="mt-2 text-xs text-white/35">Senha protegida por hash</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => startEditCode(code)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/75">Editar</button>
                            <button type="button" disabled={adminActionLoading === `code-status-${code._id}`} onClick={() => void toggleCodeActive(code)} className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-50">{code.active ? "Inativar" : "Ativar"}</button>
                            <button type="button" disabled={adminActionLoading === `code-delete-${code._id}`} onClick={() => void deleteCode(code._id)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 hover:border-red-400/30 hover:text-red-100">Excluir</button>
                          </div>
                        </div>
                      </article>
                    );
                  }) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Nenhum código criado.</div>}
                </div>
              </section>
            </div>

            <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45"><Upload className="h-4 w-4" />Upload de fotos</div>
                <form className="mt-5 grid gap-4" onSubmit={(event) => void uploadPhoto(event)}>
                  <label className="grid gap-2" htmlFor="admin-upload-gallery">
                    <span className="text-sm font-semibold text-white/70">Galeria *</span>
                    <select id="admin-upload-gallery" value={uploadForm.galleryId} onChange={(event) => setUploadForm((current) => ({ ...current, galleryId: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none">
                      <option value="">Selecionar galeria</option>
                      {adminOverview.galleries.map((gallery) => <option key={gallery._id} value={gallery._id}>{gallery.title}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2" htmlFor="admin-upload-file">
                    <span className="text-sm font-semibold text-white/70">Imagem *</span>
                    <input id="admin-upload-file" name="foto" type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!uploadForm.galleryId || uploadLoading} className="rounded-2xl border border-dashed border-white/15 bg-black/35 px-4 py-5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-black disabled:opacity-45" />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Evento</span>
                      <input value={uploadForm.evento} onChange={(event) => setUploadForm((current) => ({ ...current, evento: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-white/70">Cidade</span>
                      <input value={uploadForm.cidade} onChange={(event) => setUploadForm((current) => ({ ...current, cidade: event.target.value }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none" />
                    </label>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-white/70">Preço</span>
                    <input type="number" min="0" step="0.01" value={uploadForm.preco} onChange={(event) => setUploadForm((current) => ({ ...current, preco: Number(event.target.value) }))} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 outline-none" />
                  </label>
                  {!adminOverview.galleries.length ? <p className="text-sm text-amber-200/70">Crie uma galeria antes de enviar fotos.</p> : null}
                  <button type="submit" disabled={!uploadForm.galleryId || uploadLoading} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">
                    {uploadLoading ? "Enviando foto..." : "Enviar foto"}
                  </button>
                </form>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
                <h3 className="text-xl font-black">Fotos recentes</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {adminOverview.photos.length ? adminOverview.photos.map((photo) => {
                    const gallery = adminOverview.galleries.find((item) => String(item._id) === String(photo.galleryId));
                    const purchased = adminOverview.purchases.some((purchase) => (purchase.pago || purchase.status === "paid") && (purchase.photoIds || []).map(String).includes(String(photo._id)));
                    return (
                      <article key={photo._id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <div className="relative h-36 bg-zinc-900">
                          <img src={photo.sourceUrl || photo.url} alt={photo.evento || "Foto"} className="h-full w-full object-cover" />
                          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${purchased ? "bg-emerald-500 text-emerald-950" : "bg-black/70 text-white/70"}`}>{purchased ? "Comprada" : "Disponível"}</span>
                        </div>
                        <div className="p-4">
                          <h4 className="truncate font-bold">{photo.evento || "Foto sem título"}</h4>
                          <p className="mt-1 truncate text-xs text-white/45">{gallery?.title || "Sem galeria"}</p>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{formatBRL(photo.preco || 0)}</span>
                            <span className="text-white/40">{photo.storageProvider || "local"}</span>
                          </div>
                        </div>
                      </article>
                    );
                  }) : <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Nenhuma foto enviada.</div>}
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 md:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45"><ReceiptText className="h-4 w-4" />Pedidos</div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {adminOverview.purchases.length ? adminOverview.purchases.map((purchase) => {
                  const paid = purchase.pago || purchase.status === "paid";
                  return (
                    <article key={purchase._id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-bold">Pedido {String(purchase._id).slice(-8)}</h4>
                          <p className="mt-1 text-xs text-white/45">{purchase.type === "service" ? "Serviço" : `${purchase.photoIds?.length || 0} foto(s)`}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${paid ? "bg-emerald-500/15 text-emerald-200" : purchase.status === "failed" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-100"}`}>
                          {paid ? "Pago" : purchase.status === "failed" ? "Falhou" : purchase.status === "canceled" ? "Cancelado" : "Pendente"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="text-xs text-white/45">{purchase.paymentMethod || "Pagamento"}</span>
                        <span className="font-black">{formatBRL(purchase.total || 0)}</span>
                      </div>
                    </article>
                  );
                }) : <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">Nenhum pedido encontrado.</div>}
              </div>
            </section>
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

                     <button
                       type="button"
                       disabled={checkoutLoading}
                       onClick={() => void createCheckout({ serviceId: serviceTarget.id })}
                       className="inline-flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
                     >
                       {checkoutLoading ? "Abrindo checkout..." : "Comprar serviço"}
                       <ChevronRight className="h-4 w-4" />
                     </button>

                     <button
                       type="button"
                       disabled={!WHATSAPP_PHONE}
                       title={!WHATSAPP_PHONE ? "WhatsApp não configurado" : undefined}
                       onClick={() => openWhatsAppForService(serviceTarget)}
                       className="inline-flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-45"
                     >
                       Comprar por WhatsApp
                       <ChevronRight className="h-4 w-4" />
                     </button>

                     {checkoutError ? (
                       <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                         {checkoutError}
                       </div>
                     ) : null}
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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
              />
              {galleryError ? (
                <div role="alert" className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
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
                  disabled={galleryLoading}
                  onClick={() => void submitGalleryAccess()}
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:cursor-wait disabled:opacity-60"
                >
                  {galleryLoading ? "Validando acesso..." : "Abrir galeria"}
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

              {galleryLoading ? (
                <div className="grid min-h-[45vh] place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 text-center">
                  <div>
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
                    <h3 className="mt-5 text-xl font-bold">Carregando galeria privada</h3>
                    <p className="mt-2 text-sm text-white/55">Validando seu acesso e atualizando as fotos.</p>
                  </div>
                </div>
              ) : !gallerySession.photos.length ? (
                <div className="grid min-h-[45vh] place-items-center rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.04] p-8 text-center">
                  <div className="max-w-md">
                    <ImagePlus className="mx-auto h-10 w-10 text-red-300" />
                    <h3 className="mt-5 text-2xl font-black">Nenhuma foto disponível nesta galeria</h3>
                    <p className="mt-3 text-sm leading-6 text-white/60">
                      As imagens deste evento ainda estão sendo preparadas. Atualize novamente em alguns instantes.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={loadGallerySession}
                        className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black"
                      >
                        Atualizar galeria
                      </button>
                      <button
                        type="button"
                        onClick={closeGallery}
                        className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/80"
                      >
                        Sair da galeria
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {gallerySession.photos.map((photo) => {
                    const photoId = String(photo._id);
                    const selected = selectedPhotoIds.includes(photoId);
                    const owned = ownedPhotoIds.has(photoId);
                    return (
                      <motion.article
                        key={photo._id}
                        whileHover={{ y: -3 }}
                        transition={{ duration: 0.14 }}
                        className={`group overflow-hidden rounded-[1.5rem] border bg-white/[0.05] transition ${
                          owned
                            ? "border-emerald-400/25 bg-emerald-500/[0.06]"
                            : selected
                              ? "border-red-400/45 bg-red-500/[0.08] shadow-[0_20px_60px_rgba(185,28,28,0.16)]"
                              : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="relative h-64 sm:h-72">
                          <GalleryPhoto
                            photoId={photoId}
                            galleryToken={gallerySession.token}
                            alt={photo.evento || "Foto da galeria"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                          <div className={`absolute left-4 top-4 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${
                            owned
                              ? "border-emerald-300/25 bg-emerald-950/80 text-emerald-100"
                              : selected
                                ? "border-red-300/30 bg-red-950/80 text-red-100"
                                : "border-white/10 bg-black/60 text-white/75"
                          }`}>
                            {owned ? "Comprada" : selected ? "Selecionada" : "Disponível"}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-black tracking-[-0.03em]">{photo.evento || "Registro do evento"}</h3>
                          <p className="mt-1 text-sm text-white/60">{photo.cidade || galleryTitle}</p>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-white">{formatBRL(photo.preco || 0)}</span>
                            {owned ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200">
                                <BadgeCheck className="h-4 w-4" />
                                Pagamento aprovado
                              </span>
                            ) : (
                              <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => togglePhoto(photoId)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                  selected
                                    ? "bg-red-500 text-white hover:bg-red-400"
                                    : "border border-white/10 bg-white/[0.06] text-white/85 hover:border-red-400/35 hover:bg-red-500/10"
                                }`}
                              >
                                {selected ? "Remover" : "Selecionar"}
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={!owned || downloadingPhotoId === photoId}
                            onClick={() => void downloadPurchasedPhoto(photoId)}
                            className="mt-4 inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {owned
                              ? downloadingPhotoId === photoId
                                ? "Preparando download..."
                                : "Baixar foto comprada"
                              : "Download após pagamento"}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

                <aside className="rounded-[1.5rem] border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/30 xl:sticky xl:top-24 xl:self-start">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
                      <ShoppingBag className="h-4 w-4" />
                      Carrinho
                    </div>
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-100">
                      {selectedPhotos.length} {selectedPhotos.length === 1 ? "foto" : "fotos"}
                    </span>
                  </div>
                  <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
                    {selectedPhotos.length ? (
                      selectedPhotos.map((photo) => (
                        <div key={photo._id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{photo.evento || "Foto selecionada"}</div>
                            <div className="mt-1 text-sm font-bold text-white">{formatBRL(photo.preco || 0)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePhoto(String(photo._id))}
                            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 hover:border-red-400/30 hover:text-red-100"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/55">
                        Selecione as fotos desejadas. O total será atualizado automaticamente.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <span className="text-sm text-white/65">Total</span>
                    <span className="text-lg font-black text-white">{formatBRL(selectedTotal)}</span>
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
                              ? "border-red-400/40 bg-red-500 text-white"
                              : "border-white/10 bg-black/30 text-white/75 hover:bg-white/[0.08]"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedPhotoIds.length || checkoutLoading}
                      onClick={() =>
                        void createCheckout({
                          photoIds: selectedPhotoIds,
                          galleryId: gallerySession.gallery._id,
                          accessCodeId: gallerySession.code?._id
                        })
                      }
                      className="inline-flex items-center justify-between rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {checkoutLoading ? "Abrindo checkout..." : "Comprar selecionadas"}
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={!WHATSAPP_PHONE || !selectedPhotoIds.length}
                      title={!WHATSAPP_PHONE ? "WhatsApp não configurado" : undefined}
                      onClick={openWhatsAppForPhotos}
                      className="inline-flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Comprar por WhatsApp
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {checkoutError ? (
                      <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                        {checkoutError}
                      </div>
                    ) : null}

                    {galleryActionError ? (
                      <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
                        {galleryActionError}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={galleryLoading}
                      onClick={loadGallerySession}
                      className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white/80 disabled:cursor-wait disabled:opacity-50"
                    >
                      Atualizar galeria
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </aside>
              </div>
              )}
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
              if (normalized.role === "admin") {
                setPage("admin");
              }
              setAuthOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
    </div>
  );
}

export default App;
