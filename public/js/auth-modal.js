// ============================================================
// auth-modal.js — modal único com toggle Login / Cadastrar
// Substitui o snippet React auth-modal.tsx + dependências.
// Persiste usuário (e token se o backend emitir) no localStorage.
// ============================================================

const $ = (sel, root = document) => root.querySelector(sel);

const STORAGE_USER = "ff:user";
const STORAGE_TOKEN = "ff:token";

const state = {
  open: false,
  mode: "login", // "login" | "register"
  loading: false
};

// ---------- helpers ----------

function readUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USER)) || null; }
  catch { return null; }
}

function writeUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    return;
  }
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  if (user.token) localStorage.setItem(STORAGE_TOKEN, user.token);
}

function setMessage(text, kind = "") {
  const box = $("#authMessage");
  if (!box) return;
  box.classList.remove("is-error", "is-success", "is-show");
  if (!text) {
    box.textContent = "";
    return;
  }
  box.textContent = text;
  if (kind) box.classList.add(`is-${kind}`);
  box.classList.add("is-show");
}

// ---------- open / close ----------

function openModal(mode = "login") {
  const backdrop = $("#authBackdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  state.open = true;
  setMode(mode);
  // pequeno atraso para a animação rodar
  requestAnimationFrame(() => backdrop.classList.add("is-open"));
  setTimeout(() => $("#auth-email")?.focus(), 80);
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const backdrop = $("#authBackdrop");
  if (!backdrop) return;
  backdrop.classList.remove("is-open");
  setTimeout(() => {
    backdrop.hidden = true;
    state.open = false;
    document.body.style.overflow = "";
    setMessage("");
    $("#authForm")?.reset();
  }, 220);
}

// ---------- mode toggle ----------

function setMode(mode) {
  state.mode = mode === "register" ? "register" : "login";

  const title = $("#authTitle");
  const sub = $("#authSub");
  const submit = $("#authSubmit");
  const senha = $("#auth-senha");
  const nomeField = $('[data-field="nome"]');
  const nomeInput = $("#auth-nome");
  const toggleBtns = document.querySelectorAll(".auth-toggle button");

  toggleBtns.forEach((b) => {
    const active = b.dataset.mode === state.mode;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  if (state.mode === "register") {
    title.textContent = "Crie sua conta";
    sub.textContent = "Cadastre-se para acessar a galeria e concluir suas compras.";
    submit.textContent = "Criar conta";
    senha.setAttribute("autocomplete", "new-password");
    nomeField.hidden = false;
    nomeInput.setAttribute("required", "");
  } else {
    title.textContent = "Bem-vindo de volta";
    sub.textContent = "Entre com sua conta para acessar suas fotos e compras.";
    submit.textContent = "Entrar";
    senha.setAttribute("autocomplete", "current-password");
    nomeField.hidden = true;
    nomeInput.removeAttribute("required");
  }

  setMessage("");
}

// ---------- submit ----------

async function submitForm(ev) {
  ev.preventDefault();
  if (state.loading) return;

  const email = $("#auth-email").value.trim();
  const senha = $("#auth-senha").value;
  const nome = $("#auth-nome").value.trim();

  if (!email || !senha) {
    setMessage("Preencha email e senha para continuar.", "error");
    return;
  }
  if (state.mode === "register" && !nome) {
    setMessage("Preencha seu nome para se cadastrar.", "error");
    return;
  }
  if (senha.length < 6) {
    setMessage("Sua senha precisa ter pelo menos 6 caracteres.", "error");
    return;
  }

  state.loading = true;
  const submit = $("#authSubmit");
  const originalText = submit.textContent;
  submit.textContent = state.mode === "register" ? "Criando..." : "Entrando...";
  submit.disabled = true;

  try {
    const url = state.mode === "register" ? "/auth/register" : "/auth/login";
    const body = state.mode === "register" ? { nome, email, senha } : { email, senha };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* não era JSON */ }

    if (!res.ok) {
      setMessage(data?.error || text || "Não foi possível concluir a operação.", "error");
      return;
    }

    if (state.mode === "register") {
      setMessage("Conta criada! Agora entre com seu email e senha.", "success");
      setMode("login");
      $("#auth-email").value = email;
      $("#auth-senha").value = "";
      return;
    }

    writeUser(data);
    setMessage("Login realizado. Carregando sua conta...", "success");
    setTimeout(() => {
      closeModal();
      // dispara evento pra landing atualizar header
      window.dispatchEvent(new CustomEvent("ff:auth-changed", { detail: { user: data } }));
    }, 600);
  } catch (err) {
    console.error(err);
    setMessage("Falha de rede. Verifique sua conexão e tente novamente.", "error");
  } finally {
    state.loading = false;
    submit.textContent = originalText;
    submit.disabled = false;
  }
}

// ---------- bind ----------

function bindAuth() {
  const openers = [$("#openAuth"), $("#openAuthHero")].filter(Boolean);
  openers.forEach((b) => b.addEventListener("click", () => openModal("login")));

  $("#authClose")?.addEventListener("click", closeModal);

  $("#authBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "authBackdrop") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (state.open && e.key === "Escape") closeModal();
  });

  document.querySelectorAll(".auth-toggle button").forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
  });

  $("#authForm")?.addEventListener("submit", submitForm);

  // logout (botão no header é gerenciado pela landing, mas exposto aqui)
  window.ffLogout = () => {
    writeUser(null);
    window.dispatchEvent(new CustomEvent("ff:auth-changed", { detail: { user: null } }));
  };
}

// boot
bindAuth();

// expõe para o landing.js abrir o modal diretamente
window.ffOpenAuth = openModal;
window.ffReadUser = readUser;
