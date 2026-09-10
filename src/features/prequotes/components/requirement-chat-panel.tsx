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
  return actionType ? labels[actionType] ?? "Cambio técnico" : "Cambio técnico";
}

function actionNoun(actionType: string | null): string {
  const labels: Record<string, string> = {
    CHANGE_SYSTEM: "sistema",
    CHANGE_GLASS: "vidrio",
    CHANGE_FINISH: "acabado",
    CHANGE_QUANTITY: "cantidad",
    CHANGE_DIMENSIONS: "dimensiones",
    EXCLUDE_ITEM: "estado del elemento",
    INCLUDE_ITEM: "estado del elemento",
    CHANGE_COMMERCIAL_LINE: "línea comercial",
  };
  return actionType ? labels[actionType] ?? "cambio técnico" : "cambio técnico";
}

function actionVerb(actionType: string | null): string {
  const labels: Record<string, string> = {
    CHANGE_SYSTEM: "cambiar el sistema",
    CHANGE_GLASS: "cambiar el vidrio",
    CHANGE_FINISH: "cambiar el acabado",
    CHANGE_QUANTITY: "cambiar la cantidad",
    CHANGE_DIMENSIONS: "cambiar las dimensiones",
    EXCLUDE_ITEM: "excluir",
    INCLUDE_ITEM: "reactivar",
    CHANGE_COMMERCIAL_LINE: "cambiar la línea comercial",
  };
  return actionType ? labels[actionType] ?? "hacer este cambio técnico" : "hacer este cambio técnico";
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
  return actionType ? labels[actionType] ?? `Cambios propuestos (${count})` : `Cambios propuestos (${count})`;
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

function targetLabel(action: RequirementChatInteractionAction | RequirementChatInteraction): string {
  return action.target?.reference?.trim() || "este elemento";
}

function actionSentence(action: RequirementChatInteractionAction): string {
  const requested = requestedLabel(action);
  const target = targetLabel(action);
  if (action.actionType === "EXCLUDE_ITEM") return `Voy a excluir ${target}.`;
  if (action.actionType === "INCLUDE_ITEM") return `Voy a reactivar ${target}.`;
  if (action.actionType === "CHANGE_COMMERCIAL_LINE") {
    return requested
      ? `Voy a cambiar la línea comercial a ${requested}.`
      : "Voy a cambiar la línea comercial.";
  }
  return requested
    ? `Voy a ${actionVerb(action.actionType)} de ${target} a ${requested}.`
    : `Voy a ${actionVerb(action.actionType)} de ${target}.`;
}

function clarificationOptions(interaction: RequirementChatInteraction, actions: RequirementChatInteractionAction[]) {
  const options = [...interaction.availableOptions, ...actions.flatMap((action) => action.availableOptions)];
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.id ?? `${option.optionType}:${option.displayName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasUnsupportedReason(interaction: RequirementChatInteraction, actions: RequirementChatInteractionAction[]): boolean {
  return [...interaction.reasons, ...actions.flatMap((action) => action.validationReasons)].some((reason) => {
    const normalized = reason.toUpperCase();
    return normalized.includes("UNSUPPORTED") || normalized.includes("CAPABILITY");
  });
}

function clarificationTitle(interaction: RequirementChatInteraction, actions: RequirementChatInteractionAction[]): string {
  const options = clarificationOptions(interaction, actions);
  const hasTargetOptions = options.some((option) => option.optionType.toUpperCase().includes("TARGET")
    || option.optionType.toUpperCase().includes("ITEM"));
  if (hasUnsupportedReason(interaction, actions) || (!interaction.actionType && actions.length === 0 && options.length === 0)) return "Aún no puedo hacer ese cambio";
  if (hasTargetOptions || actions.length > 1) return "¿A cuál elemento te refieres?";
  if (actions.some((action) => !requestedLabel(action))) return "Necesito un dato más";
  return "Necesito un dato más";
}

function clarificationBody(title: string, interaction: RequirementChatInteraction, actions: RequirementChatInteractionAction[]): string {
  const action = actions[0];
  if (title === "¿A cuál elemento te refieres?") {
    const reference = action?.target?.reference ?? interaction.target?.reference;
    return reference
      ? `Encontré más de una coincidencia para ${reference}.`
      : "Encontré más de una coincidencia posible.";
  }
  if (title === "Aún no puedo hacer ese cambio") {
    return "Puedo ayudarte con cambios técnicos sobre elementos, sistemas, vidrios, acabados, cantidades o dimensiones.";
  }
  if (action) {
    return `Entendí que quieres ${actionVerb(action.actionType)} de ${targetLabel(action)}.`;
  }
  return "Necesito que me indiques que quieres ajustar.";
}

function clarificationQuestion(actions: RequirementChatInteractionAction[]): string {
  const action = actions[0];
  if (!action) return "Puedes responder con el cambio que quieres hacer.";
  if (action.availableOptions.length > 0) return "Respóndeme con el número o con el nombre de la opción.";
  if (!requestedLabel(action)) return `¿Qué ${actionNoun(action.actionType)} quieres usar?`;
  return "Puedes responder con más detalle para continuar.";
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
  return { text: "No fue posible completar la acción. Revisa el mensaje e intenta nuevamente.", warning: true };
}

function executedInteractionToActionPlan(chat: RequirementChat): RequirementChatActionPlan | null {
  const interaction = chat.lastInteraction;
  if (!interaction?.planId || !interaction.reasons.includes("CHAT_ACTION_EXECUTED")) return null;
  return {
    planId: interaction.planId,
    requirementId: chat.requirementId,
    technicalProposalId: "",
    scope: chat.scope,
    status: interaction.pricingStatus === "PRICING_PENDING" ? "EXECUTED_WITH_PRICING_PENDING" : "EXECUTED",
    requiresConfirmation: false,
    createdAtUtc: new Date().toISOString(),
    expiresAtUtc: null,
    pricingStatus: interaction.pricingStatus,
    executionReasons: interaction.reasons,
    actions: interaction.actions.map((action) => ({
      actionId: action.actionId,
      actionType: action.actionType,
      targetTechnicalProposalItemId: action.target?.technicalProposalItemId ?? null,
      targetReference: action.target?.reference ?? null,
      requestedValue: action.requestedValue,
      currentValue: action.currentValue,
      resolvedCatalogEntity: action.resolvedCatalogEntity,
      validationState: action.validationState,
      validationReasons: action.validationReasons,
      requiresConfirmation: action.requiresConfirmation,
      availableOptions: action.availableOptions,
    })),
  };
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
    const title = clarificationTitle(interaction, actions);
    const options = clarificationOptions(interaction, actions);
    return <div className="mr-8 rounded-sm border border-info bg-info-soft p-3 text-sm text-foreground">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-foreground-secondary">{clarificationBody(title, interaction, actions)}</p>
      {options.length > 0 ? <ol className="mt-3 space-y-1">
        {options.slice(0, 6).map((option, index) => <li key={`${option.id ?? option.displayName}-${index}`} className="break-words text-foreground-secondary">
          <span className="font-medium text-foreground">{index + 1}.</span> {option.displayName}
        </li>)}
      </ol> : null}
      <p className="mt-3 text-xs text-foreground-secondary">{clarificationQuestion(actions)}</p>
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
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{isBatch ? batchTitle(interaction.actionType, actionCount) : "Confirma el cambio"}</p><Badge tone={cancelled ? "neutral" : "brand"} size="sm">{cancelled ? "Cancelado" : isBatch ? `${actionCount} cambios` : actionLabel(interaction.actionType)}</Badge></div>
    <p className="mt-2 text-foreground-secondary">{isBatch ? `Voy a aplicar ${actionCount} cambios.` : actions[0] ? actionSentence(actions[0]) : "Voy a aplicar este cambio técnico."}</p>
    {isBatch ? <ol className="mt-3 space-y-2">
      {actions.map((action, index) => <li key={action.actionId} className="rounded-sm border border-border-subtle bg-surface/70 p-2">
        <p className="font-semibold text-foreground">{index + 1}. {targetLabel(action)}</p>
        <p className="text-xs text-foreground-secondary">{actionSentence(action)}</p>
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
    {!cancelled ? <p className="mt-3 text-xs text-foreground-secondary">Puedes responder &quot;sí&quot; para aplicar el cambio o &quot;no&quot; para cancelarlo.</p> : null}
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
      const value = await sendRequirementChatMessage(requirementId, itemId ?? null, outgoing);
      setChat(value);
      const executedPlan = executedInteractionToActionPlan(value);
      if (executedPlan) {
        setActionResult(executedPlan);
        try {
          await onActionExecuted?.(executedPlan);
        } catch {
          setError("El cambio fue aplicado, pero no fue posible actualizar la vista. Vuelve a cargarla para consultar los datos vigentes.");
        }
      }
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
      setActionError("No fue posible confirmar el cambio. Puedes reintentar de forma segura.");
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
