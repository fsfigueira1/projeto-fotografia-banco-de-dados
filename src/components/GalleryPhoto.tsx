import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface GalleryPhotoProps {
  photoId: string;
  galleryToken: string;
  alt: string;
  className?: string;
}

export function GalleryPhoto({
  photoId,
  galleryToken,
  alt,
  className = ""
}: GalleryPhotoProps) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";

    setSource("");
    setFailed(false);

    void fetch(getApiUrl(`/media/photos/${photoId}/preview`), {
      credentials: "include",
      headers: { "x-gallery-token": galleryToken },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Não foi possível carregar a prévia.");
        }
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setFailed(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [galleryToken, photoId]);

  if (failed) {
    return (
      <div className={`grid place-items-center bg-zinc-900 ${className}`}>
        <div className="px-5 text-center text-white/45">
          <ImageOff className="mx-auto h-8 w-8" />
          <span className="mt-2 block text-xs">Prévia indisponível</span>
        </div>
      </div>
    );
  }

  if (!source) {
    return (
      <div
        aria-label="Carregando prévia"
        className={`animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-950 ${className}`}
      />
    );
  }

  return <img src={source} alt={alt} className={className} />;
}
