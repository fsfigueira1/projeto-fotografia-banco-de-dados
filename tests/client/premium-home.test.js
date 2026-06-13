const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/PremiumHome.tsx"),
  "utf8"
);
const appSource = fs.readFileSync(
  path.join(process.cwd(), "src/App.tsx"),
  "utf8"
);

describe("PremiumHome", () => {
  it("renders the approved product copy and section anchors", () => {
    expect(source).toContain("GALERIA PRIVADA PREMIUM");
    expect(source).toContain("Fotografia de eventos com compra segura");
    expect(source).toContain(
      "Galerias privadas por senha, seleção de favoritas"
    );
    expect(source).toContain('id="experiencia"');
    expect(source).toContain('id="servicos"');
  });

  it("preserves gallery, experience, login, service, and admin actions", () => {
    expect(source).toContain("onClick={openGalleryAccess}");
    expect(source).toContain('scrollIntoView({ behavior: "smooth"');
    expect(source).toContain('onClick={() => openAuthModal("login")}');
    expect(source).toContain("openServicePurchase(service)");
    expect(source).toContain("onClick={openAdminPage}");
  });

  it("renders populated value, process, and differentiator content", () => {
    expect(source).toContain("Acesso por senha");
    expect(source).toContain("Compra individual");
    expect(source).toContain("Entrega segura");
    expect(source).toContain("Contratação do serviço");
    expect(source).toContain("Experiência responsiva");
  });

  it("does not use canvas or WebGL for the camera", () => {
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("three");
  });

  it("avoids rendering duplicate navigation on the public home", () => {
    expect(appSource).toContain('page === "home" ? "hidden"');
  });
});
