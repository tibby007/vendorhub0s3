export function logDebug(tag: string, payload?: any) {
  if (import.meta.env.VITE_DEBUG !== "1") return;
  console.log(`[${tag}]`, payload ?? "");
}