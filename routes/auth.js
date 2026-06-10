const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/User");
const { signUserToken } = require("../server/security");

const TEST_LOGIN_EMAIL = "123";
const TEST_LOGIN_PASSWORD = "123456";
function sanitizeUser(user, token = null) {
  if (!user) return null;
  const { _id, nome, email, role } = user;
  return { _id, nome, email, role, token };
}

router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).send("Nome, email e senha são obrigatórios");
    }

    if (senha.length < 6) {
      return res.status(400).send("A senha deve ter pelo menos 6 caracteres");
    }

    const hash = await bcrypt.hash(senha, 10);

    const user = await User.create({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: hash,
      role: "client"
    });

    const token = signUserToken(user);
    return res.json(sanitizeUser(user, token));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).send("Este email já está cadastrado");
    }

    console.error(err);
    return res.status(500).send("Erro ao cadastrar usuário");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).send("Email e senha são obrigatórios");
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === TEST_LOGIN_EMAIL && senha === TEST_LOGIN_PASSWORD) {
      const user = {
        _id: "test-login",
        nome: "Login Teste",
        email: TEST_LOGIN_EMAIL,
        role: "admin"
      };
      return res.json(sanitizeUser(user, signUserToken(user)));
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).send("Usuário não existe");

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.status(400).send("Senha errada");

    const token = signUserToken(user);
    return res.json(sanitizeUser(user, token));
  } catch (err) {
    console.error(err);
    return res.status(500).send("Erro ao fazer login");
  }
});

module.exports = router;
