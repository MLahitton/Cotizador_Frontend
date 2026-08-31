import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getRequirementChat, sendRequirementChatMessage } from "@/features/prequotes/requirement-chat-api";
import type { RequirementChat } from "@/features/prequotes/requirement-chat-types";

export function RequirementChatPanel({ requirementId, itemId, title, compact = false }: {
  requirementId: string;
  itemId?: string | null;
  title: string;
  compact?: boolean;
}) {
  const [chat, setChat] = useState<RequirementChat | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scopeLabel = itemId ? "Chat del item" : "Chat global";

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      setLoading(true);
      setError(null);
      try {
        const value = await getRequirementChat(requirementId, itemId ?? null);
        if (!cancelled) setChat(value);
      } catch {
        if (!cancelled) setError("No fue posible cargar el historial del chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadChat();
    return () => {
      cancelled = true;
    };
  }, [requirementId, itemId]);

  const canSend = useMemo(() => message.trim().length > 0 && !sending, [message, sending]);

  async function submit() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const updated = await sendRequirementChatMessage(requirementId, itemId ?? null, message);
      setChat(updated);
      setMessage("");
    } catch {
      setError("No fue posible obtener respuesta del asistente. Tu mensaje queda guardado en Backend si alcanzó a enviarse.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Surface variant={compact ? "subtle" : "elevated"} padding={compact ? "md" : "lg"} className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{scopeLabel}</p>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-foreground-secondary">Solo lectura: puedo explicar, comparar y resumir; los cambios se hacen desde el editor.</p>
        </div>
        <MessageCircle aria-hidden="true" className="shrink-0 text-brand" size={20} />
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto rounded-sm border border-border-subtle bg-surface-subtle p-3">
        {loading ? <p className="text-sm text-foreground-secondary">Cargando historial...</p> : null}
        {!loading && chat?.messages.length === 0 ? <p className="text-sm text-foreground-secondary">Todavia no hay mensajes en este hilo.</p> : null}
        {chat?.messages.map((item) => (
          <div key={item.messageId} className={`rounded-sm p-2 text-sm ${item.role === "USER" ? "ml-8 bg-brand text-white" : "mr-8 border border-border bg-surface text-foreground"}`}>
            <p className="whitespace-pre-wrap leading-6">{item.content}</p>
          </div>
        ))}
      </div>

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <textarea
          value={message}
          maxLength={4000}
          rows={compact ? 2 : 3}
          className="min-h-11 flex-1 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
          placeholder="Preguntale al asistente sobre esta propuesta..."
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <Button type="button" disabled={!canSend} onClick={submit}>
          <Send aria-hidden="true" size={16} />
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </Surface>
  );
}
