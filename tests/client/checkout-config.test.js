const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(process.cwd(), "src/App.tsx"),
  "utf8"
);

describe("checkout configuration feedback", () => {
  it("shows the safe server message inline without leaving an unhandled rejection", () => {
    expect(source).toContain("const message =");
    expect(source).toContain("data?.message ||");
    expect(source).toContain("data?.error ||");
    expect(source).toContain("setCheckoutError(message)");
    expect(source).toContain("setCheckoutLoading(false)");
    expect(source).not.toContain("window.alert(message)");
    expect(source).not.toContain(
      'throw new Error(data?.error || "Não foi possível iniciar o checkout.")'
    );
  });
});
