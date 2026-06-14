import {
  calculateSelectedTotal,
  collectOwnedPhotoIds,
  selectAvailablePhotos
} from "../../src/lib/gallery";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(
  path.join(process.cwd(), "src/App.tsx"),
  "utf8"
);
const photoSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/GalleryPhoto.tsx"),
  "utf8"
);

describe("gallery helpers", () => {
  it("collects only photos from paid purchases", () => {
    const ids = collectOwnedPhotoIds([
      { status: "paid", photoIds: ["1", "2"] },
      { pago: false, status: "pending", photoIds: ["3"] },
      { pago: true, fotoId: "4" }
    ]);

    expect([...ids]).toEqual(["1", "2", "4"]);
  });

  it("excludes owned and duplicate photos from the selected cart", () => {
    const photos = [
      { _id: "1", preco: 20 },
      { _id: "2", preco: 30 }
    ];

    expect(
      selectAvailablePhotos(photos, ["1", "1", "2"], new Set(["2"]))
    ).toEqual([photos[0]]);
  });

  it("calculates the selected total with safe numeric prices", () => {
    expect(
      calculateSelectedTotal([
        { _id: "1", preco: 20 },
        { _id: "2", preco: "30.50" },
        { _id: "3", preco: Number.NaN }
      ])
    ).toBe(50.5);
  });
});

describe("private gallery experience", () => {
  it("renders loading, empty, selection, purchased and checkout states", () => {
    expect(appSource).toContain("Carregando galeria privada");
    expect(appSource).toContain("Nenhuma foto disponível nesta galeria");
    expect(appSource).toContain("checkoutError");
    expect(appSource).toContain("checkoutLoading");
    expect(appSource).toContain(
      "disabled={!selectedPhotoIds.length || checkoutLoading}"
    );
    expect(appSource).toContain('checkoutError ? (');
    expect(appSource).toContain("Comprada");
    expect(appSource).toContain("Selecionada");
  });

  it("preserves the private token and protected download contract", () => {
    expect(appSource).toContain('checkoutHeaders["x-gallery-token"]');
    expect(appSource).toContain('headers: { "x-gallery-token": token }');
    expect(appSource).toContain("/media/photos/${photoId}/download");
    expect(appSource).toContain("credentials: \"include\"");
    expect(photoSource).toContain('headers: { "x-gallery-token": galleryToken }');
    expect(photoSource).toContain("/media/photos/${photoId}/preview");
    expect(photoSource).toContain("URL.revokeObjectURL");
  });

  it("keeps WhatsApp optional and explains missing configuration", () => {
    expect(appSource).toContain("Comprar por WhatsApp");
    expect(appSource).toContain("WhatsApp não configurado");
    expect(appSource).toContain("disabled={!WHATSAPP_PHONE");
  });
});
