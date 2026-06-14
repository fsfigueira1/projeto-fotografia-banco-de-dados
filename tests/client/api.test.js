import { resolveApiBaseUrl } from "../../src/lib/api";

describe("resolveApiBaseUrl", () => {
  it("normalizes an explicitly configured API URL", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "https://api.example.com/api/",
        development: false
      })
    ).toBe("https://api.example.com/api");
  });

  it("uses the local API only in development", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "",
        development: true
      })
    ).toBe("http://localhost:3000/api");
  });

  it("uses a relative API path in production", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "",
        development: false
      })
    ).toBe("/api");
  });
});
