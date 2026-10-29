"use client";

import { useId, useState } from "react";
import { ChevronDown, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { copyProjectCode, hasProjectCode } from "@/features/projects/project-code-copy";

type CopyStatus = "copying" | "copied" | "error" | "unavailable";

export function ProjectCodeRowView({ code, open, status, onToggle, onCopy }: {
  code: string | null | undefined;
  open: boolean;
  status: CopyStatus | null;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const contentId = useId();
  if (!hasProjectCode(code)) return null;
  return (
    <div className="min-w-0 text-sm">
      <Button
        type="button" variant="ghost" size="sm" aria-expanded={open} aria-controls={contentId}
        onClick={onToggle}
        className="h-auto min-h-9 justify-start whitespace-normal px-0 py-1 text-left text-foreground-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark"
      >
        <ChevronDown aria-hidden="true" size={14} className={`shrink-0 ${open ? "rotate-180" : ""}`} />
        {open ? "Ocultar código del proyecto" : "Ver código del proyecto"}
      </Button>
      <div id={contentId}>
        {open ? (
          <div className="mt-2 min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <span className="min-w-0 select-text break-all text-foreground">{code}</span>
              <Button type="button" variant="ghost" size="sm" disabled={status === "copying"} onClick={onCopy}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-dark">
                <Copy aria-hidden="true" size={14} />
                Copiar código
              </Button>
            </div>
            <div role="status" aria-live="polite">
              {status === "copied" ? <p className="mt-1 text-success">Copiado</p> : null}
              {status === "error" ? (
                <p className="mt-1 text-foreground-secondary">No se pudo copiar. Selecciona el código y cópialo manualmente.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProjectCodeRow({ code }: { code: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    code: typeof code;
    status: CopyStatus;
  } | null>(null);
  const available = hasProjectCode(code);
  const status = feedback !== null && feedback.code === code ? feedback.status : null;

  const copy = async () => {
    if (!open || !available || status === "copying") return;
    setFeedback({ code, status: "copying" });
    const result = await copyProjectCode(code, (text) => navigator.clipboard.writeText(text));
    setFeedback({ code, status: result });
  };

  return <ProjectCodeRowView code={code} open={open} status={status} onCopy={copy} onToggle={() => setOpen((current) => !current)} />;
}
