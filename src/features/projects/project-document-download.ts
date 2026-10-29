import { apiGetDocument } from "@/lib/http/api-client";
import { getAccessToken } from "@/features/auth/auth-storage";

export function documentDownloadName(header: string | null, fallback: string): string {
  let name = fallback;
  const extended = header?.match(/filename\*=UTF-8''([^;]+)/i);
  const plain = header?.match(/filename="((?:\\.|[^"\\])*)"|filename=([^;]+)/i);
  try {
    if (extended) name = decodeURIComponent(extended[1].trim());
    else if (plain) name = (plain[1] ?? plain[2]).replace(/\\(.)/g, "$1").trim();
  } catch { name = fallback; }
  const leaf = name.replace(/\\/g, "/").split("/").pop() ?? "";
  // Remove control/bidi characters and path/Windows filename syntax.
  return Array.from(leaf).filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127 && !/[<>:"|?*\p{Cf}]/u.test(c))
    .join("").slice(0, 180).trim().replace(/^\.+|\.+$/g, "") || "documento";
}

export function createDocumentDownload(requirementId: string, fileId: string, fallback: string,
  onState: (state: "idle" | "busy" | "error", error?: unknown) => void,
  dependencies = { load: apiGetDocument, token: getAccessToken,
    save: (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      try {
        anchor.href = url; anchor.download = name; anchor.style.display = "none";
        document.body.append(anchor); anchor.click();
      } finally {
        anchor.remove();
        // Give the browser a task to consume the download URL. No disk-success claim.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } }) {
  let disposed = false;
  let pending: AbortController | null = null;
  const token = dependencies.token();
  return {
    async start() {
      if (disposed || pending || dependencies.token() !== token) return;
      const controller = new AbortController();
      pending = controller;
      onState("busy");
      try {
        const result = await dependencies.load(`/api/v2/requirements/${encodeURIComponent(requirementId)}/documents/${encodeURIComponent(fileId)}/download`, controller.signal);
        if (disposed || controller.signal.aborted || dependencies.token() !== token) return;
        dependencies.save(result.blob, documentDownloadName(result.contentDisposition, fallback));
        onState("idle");
      } catch (error) {
        if (!disposed && !controller.signal.aborted && dependencies.token() === token) onState("error", error);
      } finally { if (pending === controller) pending = null; }
    },
    dispose() { disposed = true; pending?.abort(); },
  };
}
