"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { generateFpPro, getFpProCatalogs, previewFpPro } from "../fp-pro-api";
import type { FpProCatalogOption, FpProCatalogs, FpProItemDraft, FpProPreview, GenerateValidationIssue } from "../fp-pro-types";
import { buildGenerateRequest, catalogMatchesSearch, createItemDrafts, filenameFromDisposition, formatCurrencyCOP, fpProErrorMessage, getGenerateValidationState, groupSystemOptions, parseCurrencyCOP, validateFpProFile } from "../fp-pro-utils";

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const moneyFormat = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value: number | null): string {
  return value === null ? "Pendiente" : `${numberFormat.format(value)}%`;
}

function Field({ label, value, suffix }: { label: string; value: string | number | null; suffix?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">{value === null || value === "" ? "Pendiente" : `${value}${suffix ?? ""}`}</dd>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text", required = false, hint, readOnly = false, max }: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  required?: boolean;
  hint?: string;
  readOnly?: boolean;
  max?: number;
}) {
  return (
    <label className="block min-w-0 text-sm font-medium text-foreground">
      <span>{label}{required ? " *" : ""}</span>
      <Input className="mt-2" type={type} min={type === "number" ? 0 : undefined} max={max} step={type === "number" ? "any" : undefined} value={value} onChange={(event) => onChange(event.target.value)} required={required} readOnly={readOnly} />
      {hint ? <span className="mt-1 block text-xs font-normal text-foreground-secondary">{hint}</span> : null}
    </label>
  );
}

function CurrencyInput({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <label className="block min-w-0 text-sm font-medium text-foreground">
      Precio cristal *
      <Input
        className="mt-2"
        type="text"
        inputMode="decimal"
        defaultValue={formatCurrencyCOP(value)}
        placeholder="$ 0"
        onChange={(event) => onChange(parseCurrencyCOP(event.target.value))}
        onBlur={(event) => {
          const parsed = parseCurrencyCOP(event.target.value);
          event.target.value = parsed === null ? event.target.value : formatCurrencyCOP(parsed);
        }}
      />
      <span className="mt-1 block text-xs font-normal text-foreground-secondary">Manual · COP. Ej: 74000, 74.000 o 74,000</span>
    </label>
  );
}

function CatalogSearchSelect({ label, value, options, disabled, onChange, hint, groupedSystems = false, neutralLabel }: {
  label: string;
  value: string | null;
  options: FpProCatalogOption[];
  disabled: boolean;
  onChange: (value: string) => void;
  hint: string;
  groupedSystems?: boolean;
  neutralLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => options.filter((option) => catalogMatchesSearch(option, search)), [options, search]);
  const grouped = useMemo(() => groupedSystems ? groupSystemOptions(options, search) : [], [groupedSystems, options, search]);
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const hasMatches = groupedSystems ? grouped.some((group) => group.options.length > 0) : filteredOptions.length > 0;

  return (
    <label className="block min-w-0 text-sm font-medium text-foreground">
      {label} *
      <div className="mt-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-muted" size={16} />
          <Input className="pl-9" value={search} disabled={disabled} placeholder="Buscar opción" onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          <option value="">{neutralLabel ?? "Seleccionar"}</option>
          {groupedSystems
            ? grouped.map((group) => (
                <optgroup key={group.family} label={group.family}>
                  {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </optgroup>
              ))
            : filteredOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </div>
      {!hasMatches ? <span className="mt-1 block text-xs font-normal text-warning">No se encontraron opciones</span> : null}
      {selectedLabel ? <span className="mt-1 block truncate text-xs font-normal text-foreground-secondary">Seleccionado: {selectedLabel}</span> : null}
      <span className="mt-1 block text-xs font-normal text-foreground-secondary">{hint}</span>
    </label>
  );
}

function moduleInferenceHint(item: FpProItemDraft): string {
  if (item.requiresManualModule || item.inferredModuleCount === null) return "No se pudo inferir con suficiente certeza";
  if (item.moduleConfidence === "High") return "Sugerido automáticamente · Confianza alta";
  if (item.moduleConfidence === "Medium") return "Sugerido automáticamente · Revisar si aplica";
  if (item.moduleConfidence === "Low") return "Sugerido automáticamente · Confianza baja";
  return "Sugerido automáticamente";
}

function formatMeters(value: number | null): string {
  return value === null ? "—" : `${numberFormat.format(value)} m`;
}

function formatProfileQuantity(value: number | null): string {
  return value === null ? "—" : numberFormat.format(value);
}

function ItemCard({ item, index, catalogs, catalogsLoading, issues, onChange }: { item: FpProItemDraft; index: number; catalogs: FpProCatalogs | null; catalogsLoading: boolean; issues: GenerateValidationIssue[]; onChange: (index: number, patch: Partial<FpProItemDraft>) => void }) {
  const complete = issues.length === 0;
  const imageSrc = item.image ? `data:${item.image.contentType};base64,${item.image.base64}` : null;
  const moduleHint = moduleInferenceHint(item);

  return (
    <details className="rounded-md border border-border bg-surface" open={index < 3}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-semibold text-foreground">Item {item.itemNumber}</p>
          <p className="mt-1 text-sm text-foreground-secondary">{item.typology || "Tipología pendiente"} · {numberFormat.format(item.widthM ?? 0)} × {numberFormat.format(item.heightM ?? 0)} m · {item.quantity ?? 0} unidades</p>
        </div>
        <Badge tone={complete ? "success" : "warning"}>{complete ? "Completo" : `${issues.length} pendientes`}</Badge>
      </summary>

      <div className="border-t border-border-subtle p-4">
        <div className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <div>
            {imageSrc ? (
              // Backend returns the authoritative preview image as a data URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={`Vista del item ${item.itemNumber}`} className="aspect-[4/3] w-full rounded-sm border border-border-subtle bg-surface-subtle object-contain" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-warning bg-warning-soft p-4 text-center text-sm text-warning">Imagen pendiente</div>
            )}
            <div className="mt-3 flex items-center gap-2"><Badge tone="brand" size="sm">Automático</Badge><span className="text-xs text-foreground-secondary">Imagen extraída de FP Pro</span></div>
          </div>

          <div className="min-w-0 space-y-5">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nombre" value={item.typology} />
              <Field label="Ancho" value={item.widthM === null ? null : numberFormat.format(item.widthM)} suffix=" m" />
              <Field label="Alto" value={item.heightM === null ? null : numberFormat.format(item.heightM)} suffix=" m" />
              <Field label="Cantidad" value={item.quantity} />
              <Field label="Área nominal" value={item.nominalAreaM2 === null ? null : numberFormat.format(item.nominalAreaM2)} suffix=" m²" />
              <Field label="Espesor" value={item.selectedThicknessMm === null ? null : numberFormat.format(item.selectedThicknessMm)} suffix=" mm" />
              <Field label="Peso estructura" value={item.structureWeightKg === null ? null : numberFormat.format(item.structureWeightKg)} suffix=" kg" />
              <Field label="Cerradura" value={item.lock} />
              <Field label="Aluminio" value={item.aluminumBase === null ? null : moneyFormat.format(item.aluminumBase)} />
              <Field label="ACCE" value={item.accessoriesBase === null ? null : moneyFormat.format(item.accessoriesBase)} />
              <Field label="Perfiles FP Pro" value={item.fpProProfiles.join(", ") || null} />
            </dl>

            <div className="grid gap-4">
              <CatalogSearchSelect label="Sistema" value={item.system} options={catalogs?.systems ?? []} disabled={catalogsLoading || !catalogs} groupedSystems onChange={(value) => onChange(index, { system: value || null })} hint={catalogsLoading ? "Cargando catálogo..." : "Catálogo BD GN · agrupado por familia"} />
              <CatalogSearchSelect label="Cristal" value={item.glassDescription} options={catalogs?.glassDescriptions ?? []} disabled={catalogsLoading || !catalogs} onChange={(value) => onChange(index, { glassDescription: value || null })} hint={catalogsLoading ? "Cargando catálogo..." : "Catálogo BD GN"} />
              <CatalogSearchSelect label="Acabado" value={item.finish} options={catalogs?.finishes ?? []} disabled={catalogsLoading || !catalogs} onChange={(value) => onChange(index, { finish: value || null })} hint={catalogsLoading ? "Cargando catálogo..." : "Override por item si aplica"} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CurrencyInput value={item.glassPrice} onChange={(value) => onChange(index, { glassPrice: value })} />
              <LabeledInput label="Módulo" type="number" required value={item.module ?? ""} onChange={(value) => onChange(index, { module: toNumber(value) })} hint={moduleHint} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Observaciones
                <textarea className="mt-2 min-h-24 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground" value={item.notes} onChange={(event) => onChange(index, { notes: event.target.value })} />
                <span className="mt-1 block text-xs font-normal text-foreground-secondary">Editable · texto detectado desde FP Pro</span>
              </label>
            </div>

            {item.technicalProfiles.length > 0 ? (
              <details className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Perfiles técnicos ({item.technicalProfiles.length})</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[38rem] text-left text-xs">
                    <thead className="text-foreground-secondary"><tr><th className="py-1 pr-3">Código</th><th className="py-1 pr-3">Descripción</th><th className="py-1 pr-3">Longitud total</th><th className="py-1 pr-3">Longitud unitaria</th><th className="py-1 pr-3">Cantidad</th></tr></thead>
                    <tbody>{item.technicalProfiles.map((profile, profileIndex) => <tr key={`${profile.code}-${profileIndex}`} className="border-t border-border-subtle"><td className="py-1 pr-3 font-medium text-foreground">{profile.code || "—"}</td><td className="py-1 pr-3 text-foreground-secondary">{profile.description || "—"}</td><td className="py-1 pr-3">{formatMeters(profile.totalLengthMeters)}</td><td className="py-1 pr-3">{formatMeters(profile.unitLengthMeters)}</td><td className="py-1 pr-3">{formatProfileQuantity(profile.quantity)}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            ) : null}

            {item.glass.length > 0 ? (
              <div><p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">Paneles de cristal detectados</p><div className="mt-2 flex flex-wrap gap-2">{item.glass.map((glass, glassIndex) => <Badge key={`${glass.code}-${glassIndex}`} size="sm">{glass.code} · {glass.quantity ?? 0} und.</Badge>)}</div></div>
            ) : null}

            {issues.length > 0 || item.warnings.length > 0 ? (
              <div className="rounded-sm border border-warning bg-warning-soft p-3 text-sm text-warning">
                {issues.map((issue) => <p key={issue.field}>{issue.message}</p>)}
                {item.warnings.map((warning) => <p key={`${warning.code}-${warning.field ?? "general"}`} className="mt-1">{warning.message}</p>)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </details>
  );
}

function ProcessReadinessIssues({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="mt-4 list-disc space-y-1 rounded-sm bg-warning-soft p-3 pl-8 text-sm text-warning">
      {issues.map((issue) => <li key={issue}>{issue}</li>)}
    </ul>
  );
}

export function FpProProposalPageContent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FpProPreview | null>(null);
  const [catalogs, setCatalogs] = useState<FpProCatalogs | null>(null);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [items, setItems] = useState<FpProItemDraft[]>([]);
  const [location, setLocation] = useState("");
  const [globalFinish, setGlobalFinish] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [productionLine, setProductionLine] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [budgetId, setBudgetId] = useState("");
  const [proposalName, setProposalName] = useState("");
  const [aluminumWastePercent, setAluminumWastePercent] = useState<number | null>(null);
  const [benefitPercent, setBenefitPercent] = useState<number | null>(null);
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [editingConfiguration, setEditingConfiguration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedGlobalFinishLabel = catalogs?.finishes.find((option) => option.value === globalFinish)?.label ?? globalFinish;

  const loadCatalogs = useCallback(async () => {
    await Promise.resolve();
    setCatalogsLoading(true);
    setCatalogsError(null);
    try { setCatalogs(await getFpProCatalogs()); }
    catch { setCatalogs(null); setCatalogsError("No fue posible cargar los catálogos FP Pro."); }
    finally { setCatalogsLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCatalogs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalogs]);

  const processIssues = useMemo(() => {
    const issues: string[] = [];
    const fileIssue = validateFpProFile(file);
    if (fileIssue) issues.push(fileIssue);
    if (catalogsLoading) issues.push("Espera mientras cargan los catálogos.");
    if (catalogsError || !catalogs) issues.push("Carga los catálogos FP Pro.");
    if (!clientName.trim()) issues.push("Ingresa el cliente.");
    if (!location) issues.push("Selecciona una ciudad / ubicación.");
    else if (catalogs && !catalogs.locations.some((option) => option.value === location)) issues.push("Selecciona una ciudad / ubicación válida.");
    if (!productionLine.trim()) issues.push("Ingresa la línea de producción.");
    if (!preparedBy.trim()) issues.push("Ingresa quién elaboró la propuesta.");
    if (!proposalName.trim()) issues.push("Ingresa el nombre de la propuesta.");
    if (!globalFinish) issues.push("Selecciona el acabado general.");
    else if (catalogs && !catalogs.finishes.some((option) => option.value === globalFinish)) issues.push("Selecciona un acabado general válido.");
    if (benefitPercent === null) issues.push("Ingresa el beneficio.");
    if (commissionPercent === null) issues.push("Ingresa la comisión.");
    return issues;
  }, [benefitPercent, catalogs, catalogsError, catalogsLoading, clientName, commissionPercent, file, globalFinish, location, preparedBy, productionLine, proposalName]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return term ? items.filter((item) => `${item.itemNumber} ${item.typology ?? ""}`.toLocaleLowerCase("es").includes(term)) : items;
  }, [items, search]);
  const validation = getGenerateValidationState({ preview, items, catalogs, catalogsLoading, catalogsError, location, globalFinish, clientName, projectName, productionLine, preparedBy, budgetId, proposalName, aluminumWastePercent, benefitPercent, commissionPercent });
  const { isReadyToGenerate, completeItemCount } = validation;

  const processReport = async () => {
    if (processIssues.length > 0) { setError(processIssues[0]); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const response = await previewFpPro(file!);
      const drafts = createItemDrafts(response).map((item) => ({ ...item, finish: globalFinish }));
      setPreview(response);
      setItems(drafts);
      setProjectName(response.report.description ?? "");
      setBudgetId(response.report.orderId ?? "");
      setAluminumWastePercent(response.report.aluminumWastePercent);
      setEditingConfiguration(false);
    } catch (cause) {
      setError(fpProErrorMessage(cause, "preview"));
    } finally { setLoading(false); }
  };

  const updateItem = (index: number, patch: Partial<FpProItemDraft>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    setError(null); setSuccess(null);
  };

  const applyGlobalFinish = (value: string) => {
    setGlobalFinish(value);
    setItems((current) => current.map((item) => ({ ...item, finish: value || null })));
    setError(null); setSuccess(null);
  };

  const generate = async () => {
    if (!preview || !isReadyToGenerate) { setError(validation.issues[0]?.message ?? "Completa todos los datos obligatorios antes de generar el Excel."); return; }
    setGenerating(true); setError(null); setSuccess(null);
    try {
      const response = await generateFpPro(buildGenerateRequest(preview, items, location, proposalName, clientName, projectName, productionLine, preparedBy, budgetId, aluminumWastePercent, benefitPercent, commissionPercent));
      const url = URL.createObjectURL(response.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFromDisposition(response.contentDisposition);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSuccess("Excel generado y descargado correctamente.");
    } catch (cause) { setError(fpProErrorMessage(cause, "generate")); }
    finally { setGenerating(false); }
  };

  const discardPreview = () => {
    if (!window.confirm("¿Deseas volver a la carga? Se descartarán los datos editados de este preview.")) return;
    setPreview(null); setItems([]); setFile(null); setLocation(""); setGlobalFinish(""); setClientName(""); setProjectName(""); setProductionLine(""); setPreparedBy(""); setBudgetId(""); setProposalName(""); setAluminumWastePercent(null); setBenefitPercent(null); setCommissionPercent(null); setSearch(""); setEditingConfiguration(false); setError(null); setSuccess(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const configurationForm = (
    <div className="grid gap-4 md:grid-cols-2">
      <LabeledInput label="Cliente" required value={clientName} onChange={(value) => { setClientName(value); setError(null); setSuccess(null); }} hint="Manual" />
      <CatalogSearchSelect label="Ciudad / ubicación" value={location} options={catalogs?.locations ?? []} disabled={catalogsLoading || !catalogs} onChange={(value) => { setLocation(value); setError(null); setSuccess(null); }} hint={catalogsLoading ? "Cargando catálogo..." : "Catálogo de plantilla"} />
      <LabeledInput label="Version" required value={productionLine} onChange={(value) => { setProductionLine(value); setError(null); setSuccess(null); }} hint="Manual" />
      <LabeledInput label="Elaborado por" required value={preparedBy} onChange={(value) => { setPreparedBy(value); setError(null); setSuccess(null); }} hint="Manual" />
      <LabeledInput label="Nombre de la propuesta" required value={proposalName} onChange={(value) => { setProposalName(value); setError(null); setSuccess(null); }} hint="Controla el nombre del archivo .xlsx" />
      <CatalogSearchSelect label="Acabado general" value={globalFinish} options={catalogs?.finishes ?? []} disabled={catalogsLoading || !catalogs} onChange={applyGlobalFinish} hint="Se aplica como base para todos los items." />
      <LabeledInput label="Beneficio [%]" type="number" max={1000} required value={benefitPercent ?? ""} onChange={(value) => { setBenefitPercent(toNumber(value)); setError(null); setSuccess(null); }} hint="Manual" />
      <LabeledInput label="Comisión [%]" type="number" max={1000} required value={commissionPercent ?? ""} onChange={(value) => { setCommissionPercent(toNumber(value)); setError(null); setSuccess(null); }} hint="Manual · 0 es válido" />
    </div>
  );

  return (
    <div className="space-y-6">
      <header><p className="text-sm font-semibold text-brand">Propuestas</p><h1 className="mt-1 text-2xl font-semibold text-foreground">Propuesta desde FP Pro</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">Carga un reporte, diligencia la configuración manual y luego revisa la información técnica detectada.</p></header>

      {!preview ? (
        <Surface padding="lg" className="mx-auto max-w-4xl">
          <div className="flex items-start gap-4"><div className="rounded-md bg-brand-soft p-3 text-brand"><Upload size={24} /></div><div><h2 className="font-semibold text-foreground">Subir reporte FP Pro</h2><p className="mt-1 text-sm text-foreground-secondary">Selecciona un PDF y completa los datos globales antes de procesarlo.</p></div></div>
          <label className="mt-6 block rounded-md border border-dashed border-border-strong bg-surface-subtle p-6 text-center hover:border-brand">
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0] ?? null; setFile(selected); setError(validateFpProFile(selected)); }} />
            <FileSpreadsheet className="mx-auto text-muted" size={30} /><span className="mt-3 block text-sm font-semibold text-foreground">{file?.name ?? "Seleccionar PDF"}</span>{file ? <span className="mt-1 block text-xs text-foreground-secondary">{numberFormat.format(file.size / 1024 / 1024)} MiB</span> : null}
          </label>

          <div className="mt-7 border-t border-border-subtle pt-6">
            <h2 className="text-lg font-semibold text-foreground">Datos de la propuesta</h2><p className="mt-1 text-sm text-foreground-secondary">Estos datos no salen de FP Pro y se conservan para generar el Excel.</p>
            <div className="mt-5">{configurationForm}</div>
          </div>

          {catalogsError ? <p className="mt-4 flex items-center justify-between gap-3 rounded-sm border border-danger bg-danger-soft p-3 text-sm text-danger"><span className="flex gap-2"><AlertTriangle className="shrink-0" size={17} />{catalogsError}</span><Button size="sm" variant="outline" onClick={() => void loadCatalogs()}>Reintentar</Button></p> : null}
          <ProcessReadinessIssues issues={processIssues.slice(0, 8)} />
          {error ? <p role="alert" className="mt-4 rounded-sm bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
          <Button className="mt-5 w-full sm:w-auto" onClick={processReport} disabled={processIssues.length > 0 || loading}>{loading ? <><LoaderCircle className="animate-spin" size={18} />Procesando...</> : "Procesar reporte"}</Button>
        </Surface>
      ) : (
        <>
          <Surface padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Configuración</h2><p className="mt-1 text-sm text-foreground-secondary">Datos globales conservados del paso inicial.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setEditingConfiguration((value) => !value)}>{editingConfiguration ? "Cerrar edición" : "Editar configuración"}</Button><Button variant="outline" onClick={discardPreview}>Nuevo reporte</Button></div></div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Cliente" value={clientName} />
              <Field label="Ciudad" value={location} />
              <Field label="Línea" value={productionLine} />
              <Field label="Elaborado por" value={preparedBy} />
              <Field label="Acabado" value={selectedGlobalFinishLabel} />
              <Field label="Beneficio" value={formatPercent(benefitPercent)} />
              <Field label="Comisión" value={formatPercent(commissionPercent)} />
              <Field label="Archivo" value={`${proposalName}.xlsx`} />
            </dl>
            {editingConfiguration ? <div className="mt-6 border-t border-border-subtle pt-5">{configurationForm}</div> : null}
          </Surface>

          <Surface padding="lg">
            <h2 className="text-lg font-semibold text-foreground">Datos del reporte FP Pro</h2><p className="mt-1 text-sm text-foreground-secondary">Información obtenida del preview. Proyecto, ID y desperdicio quedan disponibles para generar el Excel.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LabeledInput label="Proyecto" required value={projectName} onChange={(value) => { setProjectName(value); setError(null); setSuccess(null); }} hint="Detectado desde FP Pro · editable" />
              <LabeledInput label="ID Presupuesto" required value={budgetId} onChange={(value) => { setBudgetId(value); setError(null); setSuccess(null); }} hint="Detectado desde FP Pro · editable" />
              <LabeledInput label="Desperdicio de aluminio [%]" type="number" max={1000} required readOnly={preview.report.aluminumWastePercent !== null} value={aluminumWastePercent ?? ""} onChange={(value) => { setAluminumWastePercent(toNumber(value)); setError(null); setSuccess(null); }} hint={preview.report.aluminumWastePercent === null ? "Manual · no detectado" : "Automático · detectado desde FP Pro"} />
              <Field label="Revisión FP Pro" value={preview.report.revision} />
              <Field label="Cantidad de items" value={preview.report.itemsDetected} />
              <Field label="CNT perfiles" value={preview.report.profileBarCount} />
              <Field label="CNT puertas" value={preview.report.doorCount} />
            </div>
          </Surface>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Items</h2><p className="mt-1 text-sm text-foreground-secondary">{items.length} items · {completeItemCount} completos · {items.length - completeItemCount} pendientes</p></div><label className="relative block w-full sm:w-80"><Search className="absolute left-3 top-3 text-muted" size={17} /><Input className="pl-9" placeholder="Buscar item o tipología" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
            {filteredItems.map((item) => <ItemCard key={item.itemNumber} item={item} index={items.indexOf(item)} catalogs={catalogs} catalogsLoading={catalogsLoading} issues={validation.issues.filter((issue) => issue.scope === "item" && issue.itemNumber === item.itemNumber)} onChange={updateItem} />)}
            {filteredItems.length === 0 ? <Surface className="text-center text-sm text-foreground-secondary">No hay items que coincidan con la búsqueda.</Surface> : null}
          </section>

          <Surface padding="lg" className="sticky bottom-4 z-[var(--sng-z-sticky)] shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4"><div>{isReadyToGenerate ? <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 size={18} />Todo listo para generar</p> : <p className="font-semibold text-warning">Faltan datos para generar</p>}<p className="mt-1 text-xs text-foreground-secondary">El preview permanecerá disponible después de descargar.</p></div><Button onClick={generate} disabled={!isReadyToGenerate || generating}>{generating ? <><LoaderCircle className="animate-spin" size={18} />Generando...</> : <><Download size={18} />Generar Excel</>}</Button></div>
            {!isReadyToGenerate ? <ul className="mt-3 list-disc space-y-1 rounded-sm bg-warning-soft p-3 pl-8 text-sm text-warning">{validation.issues.slice(0, 12).map((issue) => <li key={`${issue.scope}-${issue.itemNumber ?? "global"}-${issue.field}`}>{issue.message}</li>)}{validation.issues.length > 12 ? <li>Y {validation.issues.length - 12} pendientes adicionales.</li> : null}</ul> : null}
            {error ? <p role="alert" className="mt-3 rounded-sm bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}{success ? <p role="status" className="mt-3 rounded-sm bg-success-soft p-3 text-sm text-success">{success}</p> : null}
          </Surface>
        </>
      )}
    </div>
  );
}
