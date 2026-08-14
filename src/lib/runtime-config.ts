declare global {
  interface Window {
    /** Injected at runtime by server.cjs from API_URL / VITE_API_URL env vars. */
    __BIAZO_API_URL?: string;
  }
}

/** API base URL: runtime (cPanel env) → build-time Vite env → same-origin /api */
export function getApiBase(): string {
  if (typeof window !== "undefined" && window.__BIAZO_API_URL) {
    return window.__BIAZO_API_URL;
  }
  return import.meta.env.VITE_API_URL ?? "/api";
}
