const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("./db");
const User = require("../models/User");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public", {
  etag: true,
  maxAge: "1d"
}));

app.use("/auth", require("../routes/auth"));
app.use("/galerias", require("../routes/galerias"));
app.use("/media", require("../routes/media"));
app.use("/upload", require("../routes/upload"));
app.use("/fotos", require("../routes/fotos"));
app.use("/pagamento", require("../routes/pagamentos"));
app.use("/webhook", require("../routes/webhook"));

async function ensureTestUsers() {
  const users = [
    {
      email: "123",
      nome: "Login Teste",
      senhaTexto: "123456",
      role: "admin"
    }
  ];

  for (const item of users) {
    const senha = await bcrypt.hash(item.senhaTexto, 10);
    await User.updateOne(
      { email: item.email },
      {
        $set: {
          nome: item.nome,
          email: item.email,
          senha,
          role: item.role
        }
      },
      { upsert: true }
    );
  }

  console.log("Login do dono pronto: 123 / 123456");
}

mongoose.connection.once("connected", () => {
  ensureTestUsers().catch((error) => {
    console.error("Falha ao criar logins de teste:", error.message);
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
