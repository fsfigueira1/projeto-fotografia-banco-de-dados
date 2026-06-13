const fs = require("node:fs");
const path = require("node:path");

const cameraPath = path.join(
  process.cwd(),
  "src/components/PremiumCamera.tsx"
);

describe("PremiumCamera", () => {
  it("tries local images in order and retains a CSS fallback", () => {
    expect(fs.existsSync(cameraPath)).toBe(true);
    const source = fs.readFileSync(cameraPath, "utf8");

    expect(source).toContain('"/images/camera-hero.png"');
    expect(source).toContain('"/img/camera-hero.png"');
    expect(source).toContain('"/camera-hero.png"');
    expect(source).toContain("data-camera-fallback");
  });

  it("supports reduced motion and pointer tilt without canvas", () => {
    expect(fs.existsSync(cameraPath)).toBe(true);
    const source = fs.readFileSync(cameraPath, "utf8");

    expect(source).toContain("useReducedMotion");
    expect(source).toContain("onPointerMove");
    expect(source).not.toContain("<canvas");
  });
});
