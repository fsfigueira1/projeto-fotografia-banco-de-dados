const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/PremiumHome.tsx"),
  "utf8"
);

describe("PremiumHome hero", () => {
  it("renders the camera from local primitives without an image asset", () => {
    expect(source).toContain("<canvas");
    expect(source).not.toContain("camera-hero.png");
  });

  it("preserves gallery access and login actions", () => {
    expect(source).toContain("onClick={openGalleryAccess}");
    expect(source).toContain('onClick={() => openAuthModal("login")}');
  });
});
