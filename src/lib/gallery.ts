export interface GalleryPhotoLike {
  _id: unknown;
  preco?: number | string | null;
}

export interface GalleryPurchaseLike {
  status?: string;
  pago?: boolean;
  fotoId?: unknown;
  photoIds?: unknown[];
}

export function collectOwnedPhotoIds(
  purchases: GalleryPurchaseLike[]
): Set<string> {
  const ownedIds = new Set<string>();

  for (const purchase of purchases) {
    if (!purchase.pago && purchase.status !== "paid") continue;

    for (const photoId of purchase.photoIds || []) {
      ownedIds.add(String(photoId));
    }

    if (purchase.fotoId != null) {
      ownedIds.add(String(purchase.fotoId));
    }
  }

  return ownedIds;
}

export function selectAvailablePhotos<T extends GalleryPhotoLike>(
  photos: T[],
  selectedIds: string[],
  ownedIds: Set<string>
): T[] {
  const selected = new Set(selectedIds.map(String));

  return photos.filter((photo) => {
    const photoId = String(photo._id);
    return selected.has(photoId) && !ownedIds.has(photoId);
  });
}

export function calculateSelectedTotal(
  photos: GalleryPhotoLike[]
): number {
  return photos.reduce((total, photo) => {
    const price = Number(photo.preco ?? 0);
    return total + (Number.isFinite(price) ? price : 0);
  }, 0);
}
