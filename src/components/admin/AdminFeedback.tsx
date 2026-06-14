import { CheckCircle2, X, XCircle } from "lucide-react";

interface AdminFeedbackProps {
  error: string;
  success: string;
  onDismiss: () => void;
}

export function AdminFeedback({
  error,
  success,
  onDismiss
}: AdminFeedbackProps) {
  const message = error || success;
  if (!message) return null;

  const content = (
    <>
      <div className="flex items-start gap-2">
        {error ? (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        aria-label="Fechar mensagem"
        onClick={onDismiss}
        className="rounded-full p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start justify-between gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
    >
      {content}
    </div>
  );
}
