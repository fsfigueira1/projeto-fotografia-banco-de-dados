interface ResolveApiBaseUrlOptions {
  configuredUrl?: string;
  development: boolean;
}

export function resolveApiBaseUrl({
  configuredUrl = "",
  development
}: ResolveApiBaseUrlOptions) {
  const explicitUrl = String(configuredUrl).trim();
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "");
  }

  return development ? "http://localhost:3000/api" : "/api";
}

const API_BASE_URL = resolveApiBaseUrl({
  configuredUrl: import.meta.env.VITE_API_URL,
  development: import.meta.env.DEV
});

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
