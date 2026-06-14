const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "routes/galerias.js"),
  "utf8"
);

describe("admin overview", () => {
  it("returns real photos together with galleries, codes and purchases", () => {
    expect(source).toContain(
      "const [galleries, accessCodes, purchases, photos] = await Promise.all"
    );
    expect(source).toContain("Foto.find({}).sort");
    expect(source).toContain("photos: photos.map");
    expect(source).toContain("storageProvider: photo.storageProvider");
  });
});
