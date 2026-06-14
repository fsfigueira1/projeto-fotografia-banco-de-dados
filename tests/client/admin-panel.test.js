const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(
  path.join(process.cwd(), "src/App.tsx"),
  "utf8"
);
const feedbackSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/admin/AdminFeedback.tsx"),
  "utf8"
);
const statSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/admin/AdminStatCard.tsx"),
  "utf8"
);

describe("admin panel", () => {
  it("keeps the existing admin actions visible", () => {
    expect(appSource).toContain("Painel administrativo");
    expect(appSource).toContain("saveGallery");
    expect(appSource).toContain("saveCode");
    expect(appSource).toContain("uploadPhoto");
    expect(appSource).toContain("updateGalleryStatus");
    expect(appSource).toContain("deleteGallery");
    expect(appSource).toContain("deleteCode");
    expect(appSource).toContain("toggleCodeActive");
    expect(appSource).toContain("Editar");
    expect(appSource).toContain("Excluir");
    expect(appSource).toContain("Ativar");
    expect(appSource).toContain("Inativar");
    expect(appSource).not.toContain("login 123");
  });

  it("provides feedback, loading and empty states", () => {
    expect(appSource).toContain("adminSuccess");
    expect(appSource).toContain("uploadLoading");
    expect(appSource).toContain("Nenhuma galeria criada.");
    expect(appSource).toContain("Nenhum código criado.");
    expect(appSource).toContain("Nenhuma foto enviada.");
    expect(appSource).toContain("Nenhum pedido encontrado.");
    expect(appSource).toContain("window.confirm");
    expect(appSource).toContain("navigator.clipboard.writeText");
  });

  it("uses accessible feedback and statistic components", () => {
    expect(feedbackSource).toContain('role="alert"');
    expect(feedbackSource).toContain('role="status"');
    expect(statSource).toContain("<article");
    expect(statSource).toContain("tone");
  });

  it("labels the main admin forms", () => {
    expect(appSource).toContain('htmlFor="admin-gallery-title"');
    expect(appSource).toContain('htmlFor="admin-code-gallery"');
    expect(appSource).toContain('htmlFor="admin-upload-gallery"');
    expect(appSource).toContain('htmlFor="admin-upload-file"');
  });
});
