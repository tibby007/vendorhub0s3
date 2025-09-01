export function logDebug(tag: string, payload?: unknown) {
  if (import.meta.env.VITE_DEBUG !== "1") return;
  console.log(`[${tag}]`, payload ?? "");
}