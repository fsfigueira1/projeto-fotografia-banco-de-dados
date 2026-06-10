const readline = require("readline/promises");
const bcrypt = require("bcrypt");
const { z } = require("zod");

const User = require("../models/User");
const { connectDatabase, disconnectDatabase } = require("../server/config/database");
const { getEnv } = require("../server/config/env");

const adminSchema = z.object({
  nome: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um email válido."),
  senha: z.string().min(12, "A senha deve ter pelo menos 12 caracteres.").max(128)
});

async function createOrPromoteAdmin({ User: UserModel, nome, email, senha }) {
  const input = adminSchema.parse({ nome, email, senha });
  const passwordHash = await bcrypt.hash(input.senha, 12);
  const existing = await UserModel.findOne({ email: input.email });

  if (existing) {
    existing.nome = input.nome;
    existing.senha = passwordHash;
    existing.role = "admin";
    return existing.save();
  }

  return UserModel.create({
    nome: input.nome,
    email: input.email,
    senha: passwordHash,
    role: "admin"
  });
}

async function run() {
  const env = getEnv();
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const nome = await prompt.question("Nome do administrador: ");
    const email = await prompt.question("Email do administrador: ");
    const senha = await prompt.question("Senha (mínimo de 12 caracteres): ");
    const confirmacao = await prompt.question("Confirme a senha: ");

    if (senha !== confirmacao) {
      throw new Error("As senhas informadas não coincidem.");
    }

    await connectDatabase(env.MONGO_URI);
    const user = await createOrPromoteAdmin({
      User,
      nome,
      email,
      senha
    });

    console.log(`Administrador configurado: ${user.email}`);
  } finally {
    prompt.close();
    await disconnectDatabase().catch(() => {});
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  createOrPromoteAdmin,
  run
};
