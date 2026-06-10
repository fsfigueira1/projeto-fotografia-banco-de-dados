const API_BASE_URL = String(import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
