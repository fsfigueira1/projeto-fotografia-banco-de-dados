"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { X, Mail, Lock, User } from "lucide-react";
import { getApiUrl } from "@/lib/api";

type Mode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onClose: () => void;
  onSuccess: (user: { _id: string; nome: string; email: string; role?: "client" | "admin"; token?: string | null }) => void;
}

export function AuthModal({
  open,
  mode,
  onModeChange,
  onClose,
  onSuccess
}: AuthModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setError(false);
  }, [open, mode]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const url = getApiUrl(mode === "register" ? "/auth/register" : "/auth/login");
      const body =
        mode === "register"
          ? { nome, email, senha }
          : { email, senha };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : data?.error || "Falha na autenticação.");
      }

      if (mode === "register") {
        setMessage("Conta criada. Faça login para continuar.");
        onModeChange("login");
        setSenha("");
        return;
      }

      onSuccess(data?.data?.user || data);
      setMessage("Login realizado.");
      onClose();
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass relative z-10 w-full max-w-md overflow-hidden rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
              Foto Fauzi Eventos
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {mode === "register" ? "Criar conta" : "Entrar"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="mb-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => onModeChange("register")}
              className={`rounded-[0.9rem] px-4 py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <label className="block">
                <span className="mb-2 block text-sm text-white/70">Nome</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <User className="h-4 w-4 text-white/45" />
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-transparent outline-none placeholder:text-white/35"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Email</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Mail className="h-4 w-4 text-white/45" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    type="email"
                    className="w-full bg-transparent outline-none placeholder:text-white/35"
                    autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Senha</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Lock className="h-4 w-4 text-white/45" />
                <input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  type="password"
                  className="w-full bg-transparent outline-none placeholder:text-white/35"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Processando..." : mode === "register" ? "Criar conta" : "Entrar"}
            </button>

            {message && (
              <p className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
