import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { confirmRequirementChatAction, getRequirementChat, sendRequirementChatMessage } from "@/features/prequotes/requirement-chat-api";
import type { RequirementChat, RequirementChatActionPlan, RequirementChatInteraction, RequirementChatInteractionAction } from "@/features/prequotes/requirement-chat-types";

function actionLabel(actionType: string | null): string {
  const labels: Record<string, string> = {
    CHANGE_SYSTEM: "Sistema",
    CHANGE_GLASS: "Vidrio",
    CHANGE_FINISH: "Acabado",
    CHANGE_QUANTITY: "Cantidad",
    CHANGE_DIMENSIONS: "Dimensiones",
    EXCLUDE_ITEM: "Excluir elemento",
    INCLUDE_ITEM: "Incluir elemento",
    CHANGE_COMMERCIAL_LINE: "Línea comercial",
  };
  return actionType ? labels[actionType] ?? actionType.replaceAll("_", " ") : "Cambio técnico";
}

function batchTitle(actionType: string | null, count: number): string {
  if (count <= 1) return "Cambio propuesto";
  const labels: Record<string, string> = {
    CHANGE_SYSTEM: `Cambiar sistema en ${count} elementos`,
    CHANGE_GLASS: `Cambiar vidrio en ${count} elementos`,
    CHANGE_FINISH: `Cambiar acabado en ${count} elementos`,
    CHANGE_QUANTITY: `Cambiar cantidad en ${count} elementos`,
    CHANGE_DIMENSIONS: `Cambiar dimensiones en ${count} elementos`,
    EXCLUDE_ITEM: `Excluir ${count} elementos`,
    INCLUDE_ITEM: `Incluir ${count} elementos`,
    CHANGE_COMMERCIAL_LINE: `Cambiar línea comercial en ${count} elementos`,
  };
  return actionType ? labels[actionType] ?? `Cambios propuestos · ${count}` : `Cambios propuestos · ${count}`;
}

function interactionActions(interaction: RequirementChatInteraction): RequirementChatInteractionAction[] {
  if (interaction.actions.length > 0) return interaction.actions;
  if (!interaction.actionType) return [];
  return [{
    actionId: interaction.planId ?? "legacy-action",
    actionType: interaction.actionType,
    target: interaction.target,
    currentValue: interaction.currentValue,
    requestedValue: interaction.requestedValue,
    resolvedCatalogEntity: null,
    validationState: interaction.requiresConfirmation ? "VALID" : "UNKNOWN",
    validationReasons: interaction.reasons,
    requiresConfirmation: interaction.requiresConfirmation,
    availableOptions: interaction.availableOptions,
  }];
}

function requestedLabel(action: RequirementChatInteractionAction): string | null {
  return action.resolvedCatalogEntity?.displayName ?? action.requestedValue;
}

function resultMessage(plan: RequirementChatActionPlan): { text: string; warning: boolean } {
  const count = plan.actions.length;
  const prefix = count > 1 ? `${count} cambios aplicados.` : "Cambio aplicado.";
  if (plan.status === "EXECUTED_WITH_PRICING_PENDING" || plan.pricingStatus === "PRICING_PENDING") {
    return { text: `${prefix} Precio pendiente de actualización.`, warning: true };
  }
  if (plan.pricingStatus === "NOT_YET_PRICED") {
    return { text: `${prefix} Aún sin pricing generado.`, warning: false };
  }
  if (plan.status === "EXECUTED" && plan.pricingStatus === "PRICING_UPDATED") {
    return { text: `${prefix} Precio actualizado.`, warning: false };
  }
  if (plan.status === "EXECUTED") return { text: prefix, warning: false };
  return { text: `La acción terminó con estado ${plan.status}.`, warning: true };
}

function ActionInteraction({ interaction, cancelled, confirming, result, error, onCancel, onConfirm }: {
  interaction: RequirementChatInteraction;
  cancelled: boolean;
  confirming: boolean;
  result: RequirementChatActionPlan | null;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (interaction.messageType === "INFORMATIONAL") return null;
  const actions = interactionActions(interaction);
  const actionCount = Math.max(interaction.actionCount, actions.length);
  const isBatch = actionCount > 1;
  const canConfirm = interaction.requiresConfirmation && actions.every((action) => action.requiresConfirmation && action.validationState === "VALID");

  if (interaction.messageType === "CLARIFICATION") {
    return <div className="mr-8 rounded-sm border border-info bg-info-soft p-3 text-sm text-foreground">
      <p className="font-semibold">Necesito una aclaración</p>
      {interaction.reasons.length > 0 ? <p className="mt-1 text-foreground-secondary">{interaction.reasons.join(" · ")}</p> : null}
      {actions.length > 0 ? <ol className="mt-3 space-y-2">
        {actions.map((action, index) => <li key={action.actionId} className="rounded-sm border border-border-subtle bg-surface p-2">
          <p className="font-medium text-foreground">{index + 1}. {action.target?.reference ?? "Target por confirmar"}</p>
          <p className="text-xs text-foreground-secondary">{actionLabel(action.actionType)}</p>
          {action.validationReasons.length > 0 ? <p className="mt-1 text-xs text-warning">{action.validationReasons.join(" · ")}</p> : null}
          {action.availableOptions.length > 0 ? <p className="mt-1 text-xs text-foreground-secondary">Opciones: {action.availableOptions.slice(0, 5).map((option) => option.displayName).join(", ")}</p> : null}
        </li>)}
      </ol> : null}
    </div>;
  }

  if (result) {
    const outcome = resultMessage(result);
    return <div className={`mr-8 rounded-sm border p-3 text-sm ${outcome.warning ? "border-warning bg-warning-soft" : "border-success bg-success-soft"}`}>
      <p className="flex items-center gap-2 font-semibold text-foreground">{outcome.warning ? <AlertTriangle aria-hidden="true" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}{outcome.text}</p>
      {error ? <p role="alert" className="mt-2 text-sm text-warning">{error}</p> : null}
    </div>;
  }

  return <div className="mr-8 rounded-sm border border-brand bg-brand-soft p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{isBatch ? batchTitle(interaction.actionType, actionCount) : "Cambio propuesto"}</p><Badge tone={cancelled ? "neutral" : "brand"} size="sm">{cancelled ? "Cancelado" : isBatch ? `${actionCount} acciones` : actionLabel(interaction.actionType)}</Badge></div>
    {isBatch ? <ol className="mt-3 space-y-2">
      {actions.map((action, index) => <li key={action.actionId} className="rounded-sm border border-border-subtle bg-surface/70 p-2">
        <p className="font-semibold text-foreground">{index + 1}. {action.target?.reference ?? "Target sin referencia"}</p>
        <p className="text-xs text-foreground-secondary">{actionLabel(action.actionType)}</p>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {action.currentValue ? <div><dt className="text-xs text-foreground-secondary">Valor actual</dt><dd className="break-words font-medium text-foreground">{action.currentValue}</dd></div> : null}
          {requestedLabel(action) ? <div><dt className="text-xs text-foreground-secondary">Valor solicitado</dt><dd className="break-words font-medium text-foreground">{requestedLabel(action)}</dd></div> : null}
        </dl>
      </li>)}
    </ol> : <>
      {interaction.target?.reference ? <p className="mt-2 font-semibold text-foreground">{interaction.target.reference}</p> : null}
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {interaction.currentValue ? <div><dt className="text-xs text-foreground-secondary">Valor actual</dt><dd className="break-words font-medium text-foreground">{interaction.currentValue}</dd></div> : null}
        {interaction.requestedValue ? <div><dt className="text-xs text-foreground-secondary">Valor solicitado</dt><dd className="break-words font-medium text-foreground">{interaction.requestedValue}</dd></div> : null}
      </dl>
    </>}
    {interaction.pricingImpactExpected ? <p className="mt-2 text-xs text-foreground-secondary">Impacto esperado: {interaction.pricingImpactExpected}</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    {!cancelled ? <div className="mt-3 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" size="sm" disabled={confirming} onClick={onCancel}>Cancelar</Button><Button type="button" size="sm" disabled={confirming || !interaction.planId || !canConfirm} onClick={onConfirm}>{confirming ? "Aplicando..." : isBatch ? `Confirmar ${actionCount} cambios` : "Confirmar cambio"}</Button></div> : null}
  </div>;
}

export function RequirementChatPanel({ requirementId, itemId, title, compact = false, onActionExecuted }: {
  requirementId: string;
  itemId?: string | null;
  title: string;
  compact?: boolean;
  onActionExecuted?: (result: RequirementChatActionPlan) => void | Promise<void>;
}) {
  const [chat, setChat] = useState<RequirementChat | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [actionResult, setActionResult] = useState<RequirementChatActionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const confirmingPlanRef = useRef<string | null>(null);
  const scopeLabel = itemId ? "Chat del ítem" : "Chat global";
  const pendingActionCount = chat?.lastInteraction && chat.lastInteraction.requiresConfirmation && !cancelled && !actionResult
    ? Math.max(chat.lastInteraction.actionCount, interactionActions(chat.lastInteraction).length)
    : 0;

  useEffect(() => {
    let disposed = false;
    void (async () => {
      await Promise.resolve();
      if (disposed) return;
      setLoading(true);
      setError(null);
      try {
        const value = await getRequirementChat(requirementId, itemId ?? null);
        if (!disposed) setChat(value);
      } catch {
        if (!disposed) setError("No fue posible cargar el historial del chat.");
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => { disposed = true; };
  }, [requirementId, itemId]);

  const canSend = useMemo(() => message.trim().length > 0 && !loading && !sending, [loading, message, sending]);

  async function submitText(text: string) {
    const outgoing = text.trim();
    if (!outgoing || sending) return;
    setSending(true);
    setError(null);
    setActionError(null);
    setActionResult(null);
    setCancelled(false);
    setMessage("");
    setChat((current) => current ? { ...current, messages: [...current.messages, { messageId: `local-${Date.now()}`, role: "USER", content: outgoing, sequence: current.messages.length, createdAtUtc: new Date().toISOString() }], lastInteraction: null } : current);
    try {
      setChat(await sendRequirementChatMessage(requirementId, itemId ?? null, outgoing));
    } catch {
      setError("No fue posible obtener respuesta del asistente. Tu mensaje permanece visible y puede haber quedado guardado en Backend.");
    } finally {
      setSending(false);
    }
  }

  async function confirmAction() {
    const planId = chat?.lastInteraction?.planId;
    if (!planId || confirmingPlanRef.current === planId) return;
    confirmingPlanRef.current = planId;
    setConfirming(true);
    setActionError(null);
    try {
      const result = await confirmRequirementChatAction(requirementId, planId);
      setActionResult(result);
      try {
        await onActionExecuted?.(result);
      } catch {
        setActionError("El cambio fue aplicado, pero no fue posible actualizar la vista. Vuelve a cargarla para consultar los datos vigentes.");
      }
    } catch {
      setActionError("No fue posible confirmar el cambio. El plan no se muestra como ejecutado; puedes reintentar de forma segura.");
    } finally {
      confirmingPlanRef.current = null;
      setConfirming(false);
    }
  }

  return <Surface variant={compact ? "subtle" : "elevated"} padding={compact ? "md" : "lg"} className="space-y-3">
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <MessageCircle aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={20} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{scopeLabel}</p>
          <h3 className="break-words text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 break-words text-xs text-foreground-secondary">Puedo explicar la propuesta y preparar cambios para tu confirmación.</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {!isOpen && pendingActionCount > 0 ? <Badge tone="brand" size="sm">{pendingActionCount === 1 ? "1 cambio pendiente" : `${pendingActionCount} cambios pendientes`}</Badge> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar asistente de la precotización" : "Abrir asistente de la precotización"}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
          {isOpen ? "Cerrar" : "Abrir"}
        </Button>
      </div>
    </div>

    {isOpen ? <>
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-sm border border-border-subtle bg-surface-subtle p-3">
        {loading ? <p className="text-sm text-foreground-secondary">Cargando historial...</p> : null}
        {!loading && chat?.messages.length === 0 ? <p className="text-sm text-foreground-secondary">Todavía no hay mensajes en este hilo.</p> : null}
        {chat?.messages.map((item) => <div key={item.messageId} className={`rounded-sm p-2 text-sm ${item.role === "USER" ? "ml-8 bg-brand text-white" : "mr-8 border border-border bg-surface text-foreground"}`}><p className="whitespace-pre-wrap leading-6">{item.content}</p></div>)}
        {chat?.lastInteraction ? <ActionInteraction interaction={chat.lastInteraction} cancelled={cancelled} confirming={confirming} result={actionResult} error={actionError} onCancel={() => setCancelled(true)} onConfirm={() => void confirmAction()} /> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={message}
          maxLength={4000}
          rows={compact ? 2 : 3}
          className="min-h-11 flex-1 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
          placeholder="Pregúntale al asistente sobre esta propuesta..."
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitText(message); } }}
        />
        <Button type="button" disabled={!canSend} onClick={() => void submitText(message)}><Send aria-hidden="true" size={16} />{sending ? "Enviando..." : "Enviar"}</Button>
      </div>
    </> : null}
  </Surface>;
}
