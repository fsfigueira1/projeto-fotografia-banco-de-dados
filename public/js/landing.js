const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scheduleIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }
  window.setTimeout(callback, 250);
}

function formatBRL(value) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(value || 0));
  } catch {
    return `R$ ${Number(value || 0)}`;
  }
}

function getCurrentUser() {
  try {
    return window.ffReadUser?.() || null;
  } catch {
    return null;
  }
}

function userIdFrom(user) {
  return user?._id || user?.id || user?.userId || null;
}

function showToast(title, text, kind = "success") {
  const wrap = $(".toast-wrap");
  if (!wrap) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="${kind === "error" ? "M18 6 6 18M6 6l12 12" : "M20 6 9 17l-5-5"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </div>
    <div>
      <p class="toast-title"></p>
      <p class="toast-text"></p>
    </div>
    <button class="toast-close" type="button" aria-label="Fechar notificacao">x</button>
  `;

  $(".toast-title", toast).textContent = title;
  $(".toast-text", toast).textContent = text;
  wrap.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-show"));

  const close = () => {
    toast.classList.remove("is-show");
    window.setTimeout(() => toast.remove(), 220);
  };

  const timer = window.setTimeout(close, 2800);
  $(".toast-close", toast)?.addEventListener("click", () => {
    window.clearTimeout(timer);
    close();
  });
}

function setupReveal() {
  const items = $$("[data-reveal]");
  if (!items.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.14
  });

  items.forEach((item) => observer.observe(item));
}

function setupNavigation() {
  const hamburger = $("#hamburger");
  const drawer = $("#mobileDrawer");

  const setDrawer = (open) => {
    if (!hamburger || !drawer) return;
    hamburger.setAttribute("aria-expanded", String(open));
    drawer.dataset.open = open ? "true" : "false";
  };

  hamburger?.addEventListener("click", () => {
    setDrawer(hamburger.getAttribute("aria-expanded") !== "true");
  });

  drawer?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setDrawer(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setDrawer(false);
  });

  const tabs = $$(".tab");
  const mapTarget = (tab) => (tab === "como" ? "como-funciona" : tab);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = document.getElementById(mapTarget(tab.dataset.tab));
      target?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    });
  });
}

function setupAccordion() {
  const items = $$("[data-acc]");
  if (!items.length) return;

  const activate = (item) => {
    items.forEach((entry) => entry.classList.toggle("is-active", entry === item));
  };

  items.forEach((item) => {
    item.tabIndex = 0;
    item.addEventListener("mouseenter", () => activate(item));
    item.addEventListener("focusin", () => activate(item));
    item.addEventListener("click", () => activate(item));
  });
}

function syncAuthButtons() {
  const user = getCurrentUser();
  $("#openAuth")?.toggleAttribute("hidden", Boolean(user));
  $("#logoutBtn")?.toggleAttribute("hidden", !user);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : "Falha na requisicao.");
  }

  return data;
}

function createPhotoCard(photo, ownedIds) {
  const id = photo._id || photo.id;
  const owned = ownedIds.has(String(id));
  const evento = photo.evento || "Evento Fauzi";
  const cidade = photo.cidade || "Local do evento";
  const preco = Number(photo.preco || 50);
  const destaque = photo.destaque ? "Destaque" : owned ? "Comprada" : "Disponivel";

  const article = document.createElement("article");
  article.className = "photo-card reveal is-visible";
  article.dataset.owned = String(owned);
  article.setAttribute("role", "listitem");

  article.innerHTML = `
    <div class="photo-media">
      <img src="${photo.url}" alt="Foto de ${evento}" loading="lazy" decoding="async" width="900" height="620" />
      <span class="photo-badge">${destaque}</span>
    </div>
    <div class="photo-body">
      <h3 class="photo-title"></h3>
      <div class="photo-meta">
        <span></span>
        <strong class="photo-price"></strong>
      </div>
      <button class="buy-btn" type="button"></button>
    </div>
  `;

  $(".photo-title", article).textContent = evento;
  $(".photo-meta span", article).textContent = cidade;
  $(".photo-price", article).textContent = formatBRL(preco);

  const button = $(".buy-btn", article);
  button.textContent = owned ? "Já está na sua galeria" : "Comprar foto";
  button.classList.toggle("is-bought", owned);
  button.disabled = owned;

  if (!owned) {
    button.addEventListener("click", () => startCheckout(id));
  }

  return article;
}

function createFeaturedCard(photo) {
  const evento = photo.evento || "Fauzi Eventos";
  const cidade = photo.cidade || "";
  const badge = photo.destaque ? "Destaque principal" : "Acervo Fauzi";
  const article = document.createElement("article");
  article.className = "featured-card reveal is-visible";
  article.innerHTML = `
    <img src="${photo.url}" alt="Foto de ${evento}" loading="lazy" decoding="async" />
    <div class="featured-overlay" aria-hidden="true"></div>
    <div class="featured-copy">
      <span class="label">${badge}</span>
      <h3></h3>
      <p></p>
    </div>
  `;
  $(".featured-copy h3", article).textContent = evento;
  $(".featured-copy p", article).textContent = cidade ? `${cidade} - imagem do evento em destaque.` : "Imagem do evento em destaque.";
  return article;
}

async function loadGallery() {
  const grid = $("#grid");
  const status = $("#status");
  const featured = $("#featured");
  if (!grid || !status) return;

  status.hidden = false;
  status.textContent = "Carregando galeria premium...";

  try {
    const user = getCurrentUser();
    const userId = userIdFrom(user);
    const [photos, ownedPhotos] = await Promise.all([
      fetchJson("/fotos"),
      userId ? fetchJson(`/fotos/compradas/${encodeURIComponent(userId)}`) : Promise.resolve([])
    ]);

    const ownedIds = new Set((ownedPhotos || []).map((photo) => String(photo._id || photo.id)));
    const orderedPhotos = [...(photos || [])].sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque)));
    const featuredPhotos = orderedPhotos.slice(0, 3);
    const nodes = orderedPhotos.map((photo) => createPhotoCard(photo, ownedIds));
    grid.replaceChildren(...nodes);

    if (featured) {
      featured.replaceChildren(...featuredPhotos.map((photo) => createFeaturedCard(photo)));
      featured.hidden = !featuredPhotos.length;
    }

    status.hidden = Boolean(photos?.length);
    if (!photos?.length) {
      status.textContent = "Nenhuma foto disponivel no momento.";
    }
  } catch (error) {
    status.hidden = false;
    status.textContent = "Nao foi possivel carregar a galeria agora.";
    showToast("Erro", error.message || "Falha ao carregar fotos.", "error");
  }
}

async function startCheckout(fotoId) {
  const user = getCurrentUser();
  const userId = userIdFrom(user);

  if (!userId) {
    window.ffOpenAuth?.("login");
    showToast("Login necessário", "Entre para comprar e salvar suas fotos.", "error");
    return;
  }

  try {
    const data = await fetchJson("/pagamento/criar-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoId, userId })
    });

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error("Checkout indisponivel.");
  } catch (error) {
    showToast("Checkout", error.message || "Nao foi possivel iniciar o pagamento.", "error");
  }
}

function bindAuth() {
  $("#openAuthHero")?.addEventListener("click", () => window.ffOpenAuth?.("login"));
  $("#openAuthGallery")?.addEventListener("click", () => window.ffOpenAuth?.("login"));
  $("#logoutBtn")?.addEventListener("click", () => {
    window.ffLogout?.();
    showToast("Sessão encerrada", "Você saiu da sua conta.");
  });

  window.addEventListener("ff:auth-changed", () => {
    syncAuthButtons();
    loadGallery();
  });

  syncAuthButtons();
}

function boot() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  setupNavigation();
  setupAccordion();
  setupReveal();
  bindAuth();
  loadGallery();

  const params = new URLSearchParams(window.location.search);
  if (params.get("auth") === "login" || window.location.hash === "#login") {
    window.ffOpenAuth?.("login");
  }

  scheduleIdle(() => {
    const visible = $$(".reveal.is-visible");
    visible.forEach((el) => el.classList.add("fade-up"));
  });
}

boot();
