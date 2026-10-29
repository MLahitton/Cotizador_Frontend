export function hasProjectCode(code: string | null | undefined): code is string {
  return typeof code === "string" && code.trim().length > 0;
}

export async function copyProjectCode(
  code: string | null | undefined,
  writeText: (text: string) => Promise<void>,
): Promise<"copied" | "error" | "unavailable"> {
  if (!hasProjectCode(code)) return "unavailable";
  try {
    await writeText(code);
    return "copied";
  } catch {
    return "error";
  }
}
