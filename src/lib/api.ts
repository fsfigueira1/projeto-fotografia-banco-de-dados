const LOCAL_BACKEND_ORIGIN = "http://localhost:3000";

export function getApiUrl(path: string) {
  if (typeof window === "undefined") return `${LOCAL_BACKEND_ORIGIN}${path}`;

  if (window.location.origin === LOCAL_BACKEND_ORIGIN) {
    return path;
  }

  return `${LOCAL_BACKEND_ORIGIN}${path}`;
}
