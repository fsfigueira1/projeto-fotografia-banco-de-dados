const bcrypt = require("bcrypt");

describe("administrator bootstrap", () => {
  it("creates an administrator with a hashed password", async () => {
    const created = [];
    const User = {
      async findOne() {
        return null;
      },
      async create(input) {
        created.push(input);
        return { _id: "admin-1", ...input };
      }
    };
    const { createOrPromoteAdmin } = require("../../scripts/create-admin");

    const user = await createOrPromoteAdmin({
      User,
      nome: "Felipe Silva",
      email: " FELIPE@EXAMPLE.COM ",
      senha: "a-strong-admin-password"
    });

    expect(user.role).toBe("admin");
    expect(created[0].email).toBe("felipe@example.com");
    expect(await bcrypt.compare("a-strong-admin-password", created[0].senha)).toBe(true);
  });

  it("rejects short passwords", async () => {
    const { createOrPromoteAdmin } = require("../../scripts/create-admin");

    await expect(
      createOrPromoteAdmin({
        User: {},
        nome: "Felipe Silva",
        email: "felipe@example.com",
        senha: "short"
      })
    ).rejects.toThrow(/12 caracteres/);
  });
});
